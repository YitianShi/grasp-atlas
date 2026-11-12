"""Publish verified local PDFs to the offline browser without a fetch/server requirement."""
from pathlib import Path
import json
import time
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]


def manifest(rows, out, root=ROOT):
    entries = {}
    for r in rows:
        item = {k: r.get(k, '') for k in ('title', 'year', 'venue', 'status')}
        item['paper_url'] = r.get('matched_paper_url') or r.get('catalogue_url', '')
        item['pdf_url'] = ''
        item['file'] = ''
        if r.get('status') == 'downloaded' and r.get('file'):
            path = (out / r['file']).resolve()
            try:
                relative = path.relative_to(root.resolve())
                path.relative_to((out / 'papers').resolve())
                if path.is_file() and path.stat().st_size == r.get('bytes'):
                    item['file'] = relative.as_posix()
                    item['pdf_url'] = r.get('download_url', '')
            except ValueError:
                pass
            if not item['file']:
                item['status'] = 'missing_file'
        if not item['paper_url']:
            for c in r.get('candidates', []):
                if c.get('kind') == 'arxiv':
                    item['paper_url'] = c['url'].replace('/pdf/', '/abs/')
                    break
        item['reason'] = r.get('diagnosis_zh', '')
        entries[str(r['id'])] = item
    counts = {key: sum(r['status'] == key for r in entries.values())
              for key in ('downloaded', 'pending', 'unavailable', 'needs_review', 'missing_file')}
    return dict(updated_at=datetime.now(timezone.utc).isoformat(), total=len(rows), counts=counts, rows=entries)


def publish(rows, out, root=ROOT):
    data = manifest(rows, out, root)
    # A script (rather than fetch) works in file:// browsers and keeps the bundle portable.
    payload = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')
    source = 'window.GRASP_LIBRARY = ' + payload + ';\n'
    source += 'window.GRASP_LIBRARY_BASE = new URL(".", document.currentScript.src).href;\n'
    path = root / 'library.js'
    temp = path.with_suffix('.js.tmp')
    temp.write_text(source, encoding='utf-8')
    for attempt in range(8):
        try:
            temp.replace(path)
            break
        except PermissionError:
            if attempt == 7:
                raise
            time.sleep(.05 * (attempt+1))
    return data


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'GraspAtlas_Library')
    args = parser.parse_args()
    rows = json.loads((args.output / 'download_state.json').read_text(encoding='utf-8'))
    data = publish(rows, args.output.resolve())
    print(json.dumps(data['counts']))
