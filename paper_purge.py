"""Permanently remove a selected paper from local Atlas data and files.

The caller must hold the library's download lock. All replacements are prepared
before any file is moved. A failed installation restores the original files;
the temporary originals are destroyed after a successful transaction.
"""
import csv
import io
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parent / 'editable-site'))
from build_offline import render


class PurgeError(Exception):
    def __init__(self, code):
        super().__init__(code)
        self.code = code


def normalized(value):
    return re.sub(r'[^\w]+', '', str(value).casefold())


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def inside(path, root):
    path = path.resolve()
    if not path.is_relative_to(root) or path == root:
        raise PurgeError('unsafe_path')
    return path


def install(root, writes, deletes):
    """Install a prepared plan, restoring every original if installation fails."""
    paths = sorted(set(writes) | set(deletes))
    for path in paths:
        inside(path, root)
    stash = Path(tempfile.mkdtemp(prefix='.atlas-purge-', dir=root)).resolve()
    originals, installed, cleanup = {}, [], True
    try:
        for index, path in enumerate(paths):
            if path.exists():
                destination = stash / str(index)
                os.replace(path, destination)
                originals[path] = destination
        for index, (path, content) in enumerate(writes.items()):
            staged = stash / f'new-{index}'
            staged.write_bytes(content)
            path.parent.mkdir(parents=True, exist_ok=True)
            os.replace(staged, path)
            installed.append(path)
    except BaseException:
        try:
            for path in reversed(installed):
                path.unlink()
            for path, original in originals.items():
                os.replace(original, path)
        except OSError:
            cleanup = False
            raise PurgeError('rollback_failed') from None
        raise
    finally:
        # The only recursively removed directory is this verified task directory.
        if stash.parent != root or not stash.name.startswith('.atlas-purge-'):
            raise PurgeError('unsafe_path')
        if cleanup:
            shutil.rmtree(stash)


def purge_paper(root, paper_id):
    root = Path(root).resolve()
    if type(paper_id) is not int or paper_id < 1:
        raise PurgeError('invalid_id')
    out = inside(root / 'GraspAtlas_Library', root)
    catalogue_path = inside(root / 'Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/catalogue.json', root)
    catalogue = json.loads(catalogue_path.read_text(encoding='utf-8'))
    rows = catalogue['rows'] + catalogue.get('reviewBin', {}).get('rows', [])
    target = next((r for r in rows if r['catalogueId'] == paper_id), None)
    if target is None:
        raise PurgeError('not_found')
    titles = {normalized(target['title'])}
    state_path = out / 'download_state.json'
    state = json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else []
    for row in state:
        if row.get('id') == paper_id:
            for key in ('title', 'title_alias'):
                if row.get(key):
                    titles.add(normalized(row[key]))

    def identifiers(value):
        result = set()
        if isinstance(value, dict):
            for key, item in value.items():
                if key in ('url', 'doi', 'download_url', 'catalogue_url', 'matched_paper_url', 'paperUrl', 'abstractSource', 'openalex_id') and isinstance(item, str) and len(item) > 8:
                    result.add(item.casefold().rstrip('/'))
                elif isinstance(item, (dict, list)):
                    result.update(identifiers(item))
        elif isinstance(value, list):
            for item in value:
                result.update(identifiers(item))
        return result

    tokens = identifiers(target)
    others = set()
    for row in state + rows:
        if row.get('id', row.get('catalogueId')) == paper_id:
            tokens.update(identifiers(row))
        else:
            others.update(identifiers(row))
    tokens.difference_update(others)

    def mentions_title(value):
        value = normalized(value)
        return any(t == value or (len(t) >= 24 and t in value) for t in titles)

    def mentions(value):
        return mentions_title(value) or any(token in str(value).casefold() for token in tokens)

    def is_record(value):
        if not isinstance(value, dict):
            return False
        return (value.get('catalogueId') == paper_id or
                (value.get('id') == paper_id and 'title' in value and ('year' in value or 'venue' in value)) or
                any(normalized(value.get(k, '')) in titles for k in ('title', 'paperTitle', 'paper_title')))

    # Only the known application data trees are scanned; code, environments,
    # external directories and Git history are not opened or modified.
    files = set(root.glob('*.txt'))
    for folder in [root/'editable-site/curation', out, root/'reports']:
        if folder.exists():
            files.update(p for p in folder.rglob('*') if p.is_file())
    downloader = catalogue_path.parent
    files.update(downloader.glob('*.json'))
    files.update(downloader.glob('*.txt'))
    files = {inside(p, root) for p in files}
    json_files = {}
    for path in files:
        if path.suffix.lower() == '.json' and not path.name.endswith('.part.json'):
            try:
                json_files[path] = json.loads(path.read_text(encoding='utf-8-sig'))
            except (UnicodeError, json.JSONDecodeError):
                raise PurgeError('invalid_data') from None

    target_paths, shared_paths = set(), set()

    def file_reference(value):
        if not isinstance(value, str) or not value:
            return
        value = value.replace('\\', '/')
        path = Path(value)
        if not path.is_absolute():
            path = root / path if value.startswith(('GraspAtlas_Library/', 'reports/')) else out / path
        path = inside(path, root)
        if not path.is_relative_to(out.resolve()) and not path.is_relative_to((root/'reports').resolve()):
            raise PurgeError('unsafe_path')
        return path

    def references(value):
        paths = set()
        if isinstance(value, dict):
            for key, item in value.items():
                if key in ('file', 'candidate_file', 'cache', 'cachePath') and isinstance(item, str):
                    path = file_reference(item)
                    if path:
                        paths.add(path)
                else:
                    paths.update(references(item))
        elif isinstance(value, list):
            for item in value:
                paths.update(references(item))
        return paths

    def find_records(value):
        if is_record(value):
            target_paths.update(references(value))
        elif isinstance(value, dict):
            for item in value.values():
                find_records(item)
        elif isinstance(value, list):
            for item in value:
                find_records(item)

    for value in json_files.values():
        find_records(value)
    for row in state:
        if row.get('id') != paper_id:
            shared_paths.update(references(row))
    # Old snapshots may reference paths relative to their original library.
    # Locate copied PDFs and partial downloads by permanent-number filename too.
    numbered = re.compile(rf'^(?:0*{paper_id})(?:_|\.(?:pdf|txt|json|part)(?:\.|$))', re.I)
    target_names = {p.name for p in target_paths}
    target_names.difference_update(p.name for p in shared_paths)
    deletes = {p for p in files if (numbered.match(p.name) or p.name in target_names)
               and (p.is_relative_to(out.resolve()) or p.is_relative_to((root/'reports').resolve()))}
    deletes.update(p for p in target_paths if p.exists())
    deletes.difference_update(shared_paths)

    DROP = object()
    id_list = re.compile(r'(?:ids|catalogueids)$', re.I)

    def scrub(value, key=''):
        if is_record(value):
            return DROP
        if isinstance(value, dict):
            cleaned = {}
            for k, item in value.items():
                # Numeric-key dictionaries are used by source overrides/manifests.
                if k == str(paper_id) and (key.lower() in ('rows', 'papers', 'entries') or
                                          isinstance(item, (dict, list))):
                    continue
                if mentions(k) or any(p.name in k for p in target_paths):
                    continue
                result = scrub(item, k)
                if result is not DROP:
                    cleaned[k] = result
            return cleaned
        if isinstance(value, list):
            if (len(value) >= 4 and all(not isinstance(v, (dict, list)) for v in value) and
                    any(type(v) is int and 1900 <= v <= 2100 for v in value) and
                    any(isinstance(v, str) and normalized(v) in titles for v in value)):
                return DROP
            result = []
            for item in value:
                if id_list.search(key) and type(item) is int and item == paper_id:
                    continue
                item = scrub(item, key)
                if item is not DROP:
                    result.append(item)
            return result
        if isinstance(value, str) and (mentions(value) or any(p.name in value for p in target_paths)):
            return DROP
        return value

    writes = {}
    for path, value in json_files.items():
        if path in deletes:
            continue
        clean = scrub(value)
        if clean is DROP:
            deletes.add(path)
        elif clean != value:
            writes[path] = json_bytes(clean)
    # Stable IDs are never reused, even if the highest numbered paper is purged.
    catalogue = json.loads(writes.get(catalogue_path, json_bytes(catalogue)))
    catalogue['nextCatalogueId'] = max(catalogue.get('nextCatalogueId', 780), max(r['catalogueId'] for r in rows)+1)
    current = catalogue['rows'] + catalogue.get('reviewBin', {}).get('rows', [])
    batches = [catalogue.get('reviewBin', {})] + catalogue.get('deletionBatches', [])
    default_deleted = {i for b in batches for i in b.get('catalogueIds', [])}
    visible = [r for r in current if r['catalogueId'] not in default_deleted]
    counts = dict(total=len(current), visible=len(visible), deleted=len(current)-len(visible),
                  direct=sum(r['tier']=='直接' for r in visible), related=sum(r['tier']=='相关' for r in visible))
    catalogue['collectionCoverage'] = counts
    writes[catalogue_path] = json_bytes(catalogue)
    dist = root / 'editable-site/dist'
    data_js = 'window.GRASP_DATA = '+json.dumps(catalogue, ensure_ascii=False, indent=2)+';\n'
    writes[dist/'data.js'] = data_js.encode('utf-8')
    html = (dist/'index.html').read_text(encoding='utf-8')
    for attr, number in [('data-collection-count="total"', counts['visible']), ('data-collection-count="direct"', counts['direct']),
                         ('data-collection-count="related"', counts['related']), ('data-deleted-count', counts['deleted']),
                         ('id="result-count"', counts['visible']), ('id="stats-count"', counts['visible']), ('id="removed-count"', counts['deleted'])]:
        html = re.sub(r'('+re.escape(attr)+r'>)\d+', lambda m:m[1]+str(number), html)
    writes[dist/'index.html'] = html.encode('utf-8')
    writes[root/'index.html'] = render(dist, {'data.js':data_js, 'index.html':html}).encode('utf-8')

    for path in files - deletes - json_files.keys():
        if path.suffix.lower() in ('.js', '.html'):
            # Backups can contain bundled catalogues and full-text manifests,
            # not just JSON files. Decode data assignments without executing JS.
            text = path.read_text(encoding='utf-8')
            replacements = []
            for match in re.finditer(r'window\.GRASP_(?:DATA|LIBRARY)\s*=\s*', text):
                try:
                    value, end = json.JSONDecoder().raw_decode(text, match.end())
                except json.JSONDecodeError:
                    continue
                clean = scrub(value)
                if clean != value:
                    replacements.append((match.end(), end, json.dumps(None if clean is DROP else clean, ensure_ascii=False, indent=2).replace('</script', '<\\/script')))
            for start, end, replacement in reversed(replacements):
                text = text[:start]+replacement+text[end:]
            if replacements:
                writes[path] = text.encode('utf-8')
        elif path.suffix.lower() == '.csv':
            text = path.read_text(encoding='utf-8-sig')
            reader = csv.DictReader(io.StringIO(text))
            if not reader.fieldnames:
                continue
            items = list(reader)
            kept = [r for r in items if not (str(r.get('id', r.get('catalogueId', ''))) == str(paper_id) or is_record(r) or mentions(str(r)))]
            if kept != items:
                result = io.StringIO(newline='')
                writer = csv.DictWriter(result, fieldnames=reader.fieldnames)
                writer.writeheader(); writer.writerows(kept)
                writes[path] = result.getvalue().encode('utf-8-sig')
        elif path.suffix.lower() in ('.txt', '.log'):
            try:
                text = path.read_text(encoding='utf-8')
            except UnicodeError:
                continue
            blocks = re.split(r'(\n\s*\n)', text)
            clean = ''.join(block for block in blocks if not mentions(block) and not any(p.name in block for p in target_paths))
            if clean != text:
                writes[path] = clean.encode('utf-8')

    # Rebuild the full-text manifest from the remaining state, without downloads.
    from library_sync import manifest
    remaining_state = [r for r in state if r['id'] != paper_id]
    if state_path.exists():
        writes[state_path] = json_bytes(remaining_state)
    library = manifest(remaining_state, out, root)
    payload = json.dumps(library, ensure_ascii=False).replace('<', '\\u003c')
    writes[root/'library.js'] = ('window.GRASP_LIBRARY = '+payload+';\nwindow.GRASP_LIBRARY_BASE = new URL(".", document.currentScript.src).href;\n').encode('utf-8')
    writes = {p:b for p,b in writes.items() if p not in deletes}
    install(root, writes, deletes)
    return dict(deleted=True, removedFiles=len(deletes), counts=counts, library=library)
