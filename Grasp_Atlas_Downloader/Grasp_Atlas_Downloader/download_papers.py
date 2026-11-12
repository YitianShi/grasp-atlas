#!/usr/bin/env python3
"""Download the supplied Grasp Atlas catalogue. Python 3.10+ and pypdf."""
from __future__ import annotations
import argparse, csv, difflib, hashlib, html, http.client, json, logging, os, re, sys, time
import unicodedata, urllib.error, urllib.parse, urllib.request
import threading, copy, atexit
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor, as_completed
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
UA = 'GraspAtlasPersonalDownloader/1.0 (personal scholarly research)'
ATOM = {'a': 'http://www.w3.org/2005/Atom'}
MAX_PDF = 200 * 1024 * 1024
logging.getLogger('pypdf').setLevel(logging.ERROR)

def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')
    for attempt in range(8):
        try:
            tmp.replace(path)
            break
        except PermissionError:
            if attempt == 7:
                raise
            time.sleep(.05 * (attempt+1))

def norm(s):
    s = html.unescape(str(s))
    s = re.sub(r'\\(?:texttt|mathrm|text|mathbf|mathcal|mathbb|textrm|times)\b', '', s)
    return re.sub('[^a-z0-9]', '', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower())

def score(a, b):
    a, b = norm(a), norm(b)
    if not a or not b or min(len(a), len(b))/max(len(a), len(b)) < .70:
        return 0.0
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio()

def arxiv_id(url):
    m = re.search(r'(?:arxiv\.org/(?:abs|pdf|html)/|arxiv[.:/])([0-9]{4}\.[0-9]{4,5})(?:v\d+)?', str(url), re.I)
    return m.group(1) if m else None

def safe_name(s):
    s = unicodedata.normalize('NFKD', str(s)).encode('ascii', 'ignore').decode()
    return re.sub(r'[^A-Za-z0-9._-]+', '_', s).strip('._')[:125] or 'paper'

def add(r, url, kind='public', evidence='catalogue'):
    if not url or not isinstance(url, str):
        return
    url = html.unescape(url).strip()
    if urllib.parse.urlsplit(url).scheme not in ('http', 'https'):
        return
    if re.search(r'webtoc|supplement|poster|curriculum|privacy', url, re.I):
        return
    aid = arxiv_id(url)
    if aid:
        if aid == '2503.11163':
            aid = '2307.11622'
            evidence = 'arXiv:2503.11163 withdrawal notice redirects to arXiv:2307.11622'
        url, kind = 'https://arxiv.org/pdf/' + aid, 'arxiv'
    if not any(c['url'] == url for c in r['candidates']):
        r['candidates'].append(dict(url=url, kind=kind, evidence=evidence))

def has_arxiv(r):
    return any(c['kind'] == 'arxiv' for c in r['candidates'])

def catalogue_rows(catalogue):
    """Curated entries followed by recoverable review-bin entries, with stable IDs."""
    return catalogue['rows'] + catalogue.get('reviewBin', {}).get('rows', [])


def default_deleted_ids(catalogue):
    batches = [catalogue.get('reviewBin', {})] + catalogue.get('deletionBatches', [])
    return {paper_id for batch in batches for paper_id in batch.get('catalogueIds', [])}


def selected_rows(rows, catalogue, ids=None):
    if ids is not None:
        unknown = set(ids) - {r['id'] for r in rows}
        if unknown:
            raise ValueError('Unknown catalogue IDs')
        return [r for r in rows if r['id'] in ids]
    removed = default_deleted_ids(catalogue)
    return [r for r in rows if r['id'] not in removed]


def seed(catalogue):
    rows = []
    used_ids = set()
    for i, p in enumerate(catalogue_rows(catalogue), 1):
        paper_id = p.get('catalogueId', i)
        if type(paper_id) is not int or paper_id < 1 or paper_id in used_ids:
            raise ValueError('Catalogue IDs must be unique positive integers')
        used_ids.add(paper_id)
        r = dict(id=paper_id, title=p['title'], year=p['year'], venue=p['conference'],
                 catalogue_url=p.get('url', ''), candidates=[], attempts=[], status='pending')
        for u in [p.get('url'), p.get('abstractSource')] + p.get('resources', {}).get('sources', []):
            add(r, u)
        for u in p.get('resources', {}).get('code', []):
            add(r, u, 'project')
        m = re.search(r'openalex\.org/(W\d+)', p.get('abstractSource', ''))
        if m:
            r['openalex_id'] = m.group(1)
        if p['title'] == 'Scaling Up Multi-Task Robotic Reinforcement Learning':
            add(r, 'https://arxiv.org/abs/2104.08212', 'arxiv', 'Author page https://jvarley.github.io/ explicitly maps the CoRL title to MT-Opt')
            r['title_alias'] = 'MT-Opt: Continuous Multi-Task Robotic Reinforcement Learning at Scale'
        if 'A Benchmarking Study of Vision' in p['title']:
            r['title_alias'] = 'A Benchmarking Study of Vision-Based Robotic Grasping Algorithms: A Comparative Analysis'
        rows.append(r)
    by_id = {r['id']: r for r in rows}
    extra = HERE/'resolved_sources.json'
    if extra.exists():
        for sid, sources in json.loads(extra.read_text(encoding='utf-8')).items():
            if int(sid) not in by_id:
                continue  # Sources for deliberately excluded historical records.
            for c in sources:
                add(by_id[int(sid)], c['url'], c['kind'], c.get('evidence', 'verified metadata'))
    overrides = HERE/'paper_overrides.json'
    if overrides.exists():
        for sid, change in json.loads(overrides.read_text(encoding='utf-8')).items():
            if int(sid) not in by_id:
                continue
            r = by_id[int(sid)]
            if change['title'] != r['title']:
                raise ValueError('Source override title does not match catalogue')
            for key in ('title_alias', 'matched_paper_url', 'source_note'):
                if change.get(key):
                    r[key] = change[key]
            for c in change.get('candidates', []):
                add(r, c['url'], c.get('kind','public'), c['evidence'])
    return rows

def reconcile_catalogue(rows, fresh):
    """Keep historical IDs and results while allowing an append-only catalogue."""
    if len(rows) > len(fresh):
        raise ValueError('Catalogue shrank; refusing to discard existing download records')
    identity = ('id', 'title', 'year', 'venue')
    for r, source in zip(rows, fresh):
        if any(r.get(key) != source.get(key) for key in identity):
            raise ValueError('Catalogue changed order or identity; refusing to attach PDFs to different papers')
    # Validate the complete old prefix before touching any saved row.
    for r, source in zip(rows, fresh):
        for c in source['candidates']:
            add(r, c['url'], c['kind'], c['evidence'])
        for key in ('title_alias', 'matched_paper_url', 'source_note', 'catalogue_url'):
            if source.get(key):
                r[key] = source[key]
    rows.extend(copy.deepcopy(fresh[len(rows):]))
    return rows


def pdf_links(url):
    """Publisher-supported link transformations; do not derive supplement URLs."""
    if '/html/' in url and 'openaccess.thecvf.com' in url and url.endswith('.html'):
        yield url.replace('/html/', '/papers/').replace('.html', '.pdf')
    if '/forum?' in url and 'openreview.net' in url:
        yield url.replace('/forum?', '/pdf?')
    if 'proceedings.mlr.press/' in url and url.endswith('.html'):
        stem = url.rsplit('/', 1)[-1][:-5]
        yield url[:-5] + '/' + stem + '.pdf'
    if '/hash/' in url and ('-Abstract' in url or '-abstract' in url):
        out = re.sub(r'-[Aa]bstract(?:-Conference)?\.html$', '-Paper-Conference.pdf', url.replace('/hash/', '/file/'))
        yield out
        yield out.replace('-Paper-Conference.pdf', '-Paper.pdf')
    if 'ojs.aaai.org' in url and '/article/view/' in url and re.search(r'/\d+/\d+$', url):
        yield url.replace('/article/view/', '/article/download/')
    if 'github.com/' in url and '/blob/' in url:
        yield url.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/')
    if 'github.com/' in url and url.count('/') == 4:
        base = url.replace('github.com/', 'raw.githubusercontent.com/').rstrip('/')
        yield base + '/main/README.md'
        yield base + '/master/README.md'
    if re.match(r'https?://(?:[\w-]+\.)?hal\.science/hal-\d+(?:v\d+)?/?$', url):
        yield url.rstrip('/') + '/document'

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.meta = {}; self.words = []
        self.active = []; self.blocks = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('div', 'li', 'p', 'tr', 'article', 'section'):
            self.active.append([tag, [], []])
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
            for block in self.active:
                block[2].append(a['href'])
        if tag == 'meta':
            self.meta[a.get('name', a.get('property', '')).lower()] = a.get('content', '')
    def handle_data(self, data):
        self.words.append(data)
        for block in self.active:
            block[1].append(data)
    def handle_endtag(self, tag):
        for i in range(len(self.active)-1, -1, -1):
            if self.active[i][0] == tag:
                self.blocks.extend(self.active[i:])
                del self.active[i:]
                break

class Network:
    def __init__(self):
        self.last = {}; self.denied_urls = set()
        self.locks = {}; self.guard = threading.Lock()
        self.stop = threading.Event()
    @contextmanager
    def open(self, url, headers=None):
        host = urllib.parse.urlsplit(url).hostname or ''
        key = 'arxiv' if host.endswith('arxiv.org') else host
        with self.guard:
            lock = self.locks.setdefault(key, threading.Lock())
        # Hold the per-host lock through body consumption, including arXiv PDFs.
        with lock:
            if self.stop.is_set():
                raise InterruptedError('Download paused')
            if url in self.denied_urls:
                raise RuntimeError('This URL returned HTTP 403 earlier in this run')
            delay = 3.2 if key == 'arxiv' else .6
            if self.stop.wait(max(0, delay - (time.monotonic() - self.last.get(key, 0)))):
                raise InterruptedError('Download paused')
            self.last[key] = time.monotonic()
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, **(headers or {})}), timeout=30) as response:
                    yield response
            except urllib.error.HTTPError as e:
                if e.code == 403:
                    self.denied_urls.add(url)
                if e.code == 429:
                    self.last[key] = time.monotonic() + 60
                raise
    def cached(self, url, folder):
        f = folder / (hashlib.sha256(url.encode()).hexdigest() + '.bin')
        if f.exists():
            return f.read_bytes()
        with self.open(url) as resp:
            data = resp.read(15_000_001)
        if len(data) > 15_000_000:
            raise ValueError('Metadata response exceeds 15 MB')
        f.parent.mkdir(parents=True, exist_ok=True); f.write_bytes(data)
        return data

def resolve(rows, net, out):
    ids = {r['openalex_id']: r for r in rows if r.get('openalex_id') and not has_arxiv(r)}
    keys = list(ids)
    for start in range(0, len(keys), 40):
        group = keys[start:start+40]
        params = {'filter': 'openalex:' + '|'.join(group), 'per-page': '40'}
        if os.environ.get('OPENALEX_API_KEY'):
            params['api_key'] = os.environ['OPENALEX_API_KEY']
        url = 'https://api.openalex.org/works?' + urllib.parse.urlencode(params)
        try:
            body = json.loads(net.cached(url, out/'metadata'))
            for work in body.get('results', []):
                r = ids.get(work.get('id', '').rsplit('/', 1)[-1])
                if not r or score(r['title'], work.get('title', '')) < .85:
                    continue
                r['doi'] = work.get('doi')
                for loc in (work.get('locations') or []) + [work.get('best_oa_location'), work.get('primary_location')]:
                    if loc:
                        for k in ['pdf_url', 'landing_page_url']:
                            add(r, loc.get(k), 'public', 'OpenAlex title-matched work location')
            print(f'  Metadata: {min(start+40,len(keys))}/{len(keys)}', flush=True)
        except Exception as e:
            print('  OpenAlex unavailable; continuing with arXiv and source links:', type(e).__name__, flush=True)
            break
    missing = [r for r in rows if not has_arxiv(r)]
    for start in range(0, len(missing), 8):
        group = missing[start:start+8]
        query = ' OR '.join('ti:"' + re.sub(r'[^\w\s]', ' ', r['title']) + '"' for r in group)
        url = 'https://export.arxiv.org/api/query?' + urllib.parse.urlencode({'search_query': query, 'max_results': 80})
        try:
            xml = ET.fromstring(net.cached(url, out/'metadata'))
            for entry in xml.findall('a:entry', ATOM):
                title = entry.findtext('a:title', '', ATOM)
                r = max(group, key=lambda x: score(x['title'], title))
                if score(r['title'], title) >= .88:
                    add(r, entry.findtext('a:id', '', ATOM), 'arxiv', 'arXiv API title match: ' + title.strip())
            print(f'  arXiv title search: {min(start+8,len(missing))}/{len(missing)}', flush=True)
        except Exception as e:
            print('  arXiv metadata search unavailable; keeping known links:', type(e).__name__, flush=True)
            break
    print('  Entries with an arXiv candidate:', sum(has_arxiv(r) for r in rows), flush=True)

def verify_pdf(path, r):
    from pypdf import PdfReader
    with path.open('rb') as f:
        head = f.read(1024); f.seek(max(0, path.stat().st_size-4096)); tail = f.read()
    if b'%PDF-' not in head or b'%%EOF' not in tail:
        raise ValueError('Not a complete PDF')
    reader = PdfReader(str(path), strict=False)
    pages = len(reader.pages)
    if pages < 2:
        raise ValueError('Fewer than two pages: poster/abstract or incomplete paper')
    txt = '\n'.join(p.extract_text() or '' for p in reader.pages[:2])
    flat = norm(txt[:3500]); target = norm(r.get('title_alias') or r['title'])
    idx = flat.find(target)
    exact = 0 <= idx <= 900
    # Some PDFs store the title after the body in their internal object order.
    # Layout extraction restores its actual top-of-first-page position.
    if not exact:
        layout = reader.pages[0].extract_text(extraction_mode='layout') or ''
        layout_flat = norm(layout[:7000])
        layout_idx = layout_flat.find(target)
        if 0 <= layout_idx <= 900:
            flat, exact = layout_flat, True
    if not exact:
        # Word-generated PDFs can have an empty layout extraction despite valid
        # positioned text. Reconstruct only the upper part of the first page.
        positioned = []
        page = reader.pages[0]
        bottom, top = float(page.mediabox.bottom), float(page.mediabox.top)
        def collect(text, cm, tm, font, size):
            x = tm[4]*cm[0] + tm[5]*cm[2] + cm[4]
            y = tm[4]*cm[1] + tm[5]*cm[3] + cm[5]
            if text.strip() and len(text) < 500 and bottom + (top-bottom)*.6 <= y <= top:
                positioned.append((-round(y, 1), x, text))
        page.extract_text(visitor_text=collect)
        top_text = norm(' '.join(t for _, _, t in sorted(positioned)))
        top_idx = top_text.find(target)
        if 0 <= top_idx <= 900:
            flat, exact = top_text, True
    best = 0.0
    if not exact:
        m = difflib.SequenceMatcher(None, target, flat[:1600], autojunk=False).find_longest_match()
        start = max(0, m.b-m.a)
        for delta in [-20, -5, 0, 5, 20]:
            i = max(0, start+delta)
            for extra in [-10, 0, 10]:
                best = max(best, score(target, flat[i:i+len(target)+extra]))
    article = bool(re.search(r'(?<![a-z])a\s*b\s*s\s*t\s*r\s*a\s*c\s*t(?![a-z])|摘要', txt[:20000], re.I))
    invalid = bool(re.search(r'^\s*(supplementary|supplemental|curriculum vitae|master/bachelor thesis)', txt[:250], re.I))
    return dict(verified=(exact or best >= .87) and article and not invalid,
                pages=pages, title_exact=exact, title_similarity=round(best, 3))

def inspect_existing(path, r):
    if not path.is_file():
        return False
    return bool(r.get('sha256')) and hashlib.sha256(path.read_bytes()).hexdigest() == r['sha256']

def retrieve_pdf(net, url, part):
    try:
        return _retrieve_pdf(net, url, part)
    except urllib.error.HTTPError as exc:
        # A complete partial file can legitimately receive 416 on resumption.
        if exc.code == 416 and part.exists() and b'%%EOF' in part.read_bytes()[-4096:]:
            return True, url, ''
        raise


def _retrieve_pdf(net, url, part):
    """Range + If-Range resume; restart if the server ignores ranges or source changes."""
    meta = part.with_suffix('.part.json')
    old = json.loads(meta.read_text(encoding='utf-8')) if meta.exists() else {}
    if old.get('url') != url:
        part.unlink(missing_ok=True); old = {}
    size = part.stat().st_size if part.exists() else 0
    headers = {'Range': 'bytes=%d-' % size} if size else {}
    if size and old.get('etag'):
        headers['If-Range'] = old['etag']
    with net.open(url, headers) as resp:
        started = time.monotonic()
        final = resp.url
        append = size > 0 and getattr(resp, 'status', 200) == 206
        if append and not resp.headers.get('Content-Range', '').startswith('bytes %d-' % size):
            raise ValueError('Invalid server range response')
        first = resp.read(4096)
        if not append and b'%PDF-' not in first[:1024]:
            body = first + resp.read(2_000_000)
            return False, final, body.decode('utf-8', errors='replace')
        write_json(meta, {'url': url, 'etag': resp.headers.get('ETag', '')})
        total = size if append else 0
        with part.open('ab' if append else 'wb') as f:
            f.write(first); total += len(first)
            while True:
                if net.stop.is_set():
                    raise InterruptedError('Download paused')
                if time.monotonic() - started > 180:
                    raise TimeoutError('Transfer paused after 180 seconds; resume data retained')
                # read1 returns available bytes instead of waiting to fill a
                # large buffer, so slow trickle responses honor the deadline.
                b = resp.read1(64*1024)
                if not b:
                    break
                total += len(b)
                if total > MAX_PDF:
                    raise ValueError('PDF exceeds the 200 MB per-file limit')
                f.write(b)
        return True, final, ''

def harvest(body, base, r):
    parser = Links(); parser.feed(body)
    urls = list(parser.links) + re.findall(r'https?://[^\s<>\)\]"\x27]+', body)
    if parser.meta.get('citation_pdf_url'):
        urls.insert(0, parser.meta['citation_pdf_url'])
    scoped = []
    for _, words, links in parser.blocks:
        text = norm(' '.join(words))
        if norm(r['title']) in text and len(text) < len(norm(r['title'])) * 10 + 2000:
            if any(arxiv_id(u) or '.pdf' in u.lower() for u in links):
                scoped.append((len(text), links))
    if scoped:
        urls = min(scoped, key=lambda x: x[0])[1]
    pdfs = []
    citation_pdf = parser.meta.get('citation_pdf_url')
    if citation_pdf and score(r['title'], parser.meta.get('citation_title', '')) >= .85:
        pdfs.append(urllib.parse.urljoin(base, citation_pdf))
    for u in urls:
        u = urllib.parse.urljoin(base, u)
        if arxiv_id(u) or re.search(r'\.pdf(?:$|[?#])|openreview\.net/pdf\?|/article/(view|download)/\d+/\d+', u, re.I):
            if not re.search(r'poster|supplement|webtoc|curriculum|privacy|(?:^|[/_-])cv[._/-]|thesis', u, re.I):
                pdfs.append(u)
    title_ok = score(r['title'], parser.meta.get('citation_title', '')) >= .85
    body_ok = norm(r['title']) in norm(' '.join(parser.words)[:9000] or body[:9000])
    # A large publication list is not evidence that every PDF belongs to this paper.
    return [u for u in dict.fromkeys(pdfs) if urllib.parse.urlsplit(u).scheme in ('http','https')][:10] if scoped or title_ok or (body_ok and len(set(pdfs)) <= 3) else []

def download_one(r, net, out):
    existing = r['status'] == 'downloaded' and inspect_existing(out/r.get('file', ''), r)
    upgrading = False
    if existing:
        return 'already_downloaded'
    # Recover a completed transfer saved before a process interruption, or a PDF
    # rejected only because of text extraction order in an older downloader.
    relative = Path('papers')/str(r['year'])/safe_name(r['venue'])/(f"{r['id']:04d}_"+safe_name(r['title'])+'.pdf')
    recovered = [(relative, r.get('download_url', ''))] + [(Path(a['candidate_file']), a['url']) for a in r['attempts'] if a.get('candidate_file') and not re.search(r'webtoc|supplement', a['url'], re.I)]
    for candidate, url in recovered:
        path = out/candidate
        if not path.is_file():
            continue
        try:
            info = verify_pdf(path, r)
            if info['verified']:
                dest = out/relative; dest.parent.mkdir(parents=True, exist_ok=True)
                if path != dest:
                    # Keep the review artifact as evidence; promote a verified copy.
                    import shutil
                    shutil.copy2(path, dest)
                r.update(status='downloaded', file=str(relative), download_url=url, source_kind='arxiv' if arxiv_id(url) else 'public', verification=info, sha256=hashlib.sha256(dest.read_bytes()).hexdigest(), bytes=dest.stat().st_size)
                return 'recovered_verified_pdf'
        except Exception:
            pass
    r['status'] = 'pending'
    fallback = {k:r[k] for k in ['status','file','download_url','source_kind','verification','sha256','bytes'] if k in r} if upgrading else None
    queue = []
    attempted = {a['url'] for a in r['attempts']}
    rejected = {a['url'] for a in r['attempts'] if a.get('result') == 'wrong_document'}
    for c in sorted(r['candidates'], key=lambda c: (c['url'] in attempted, c['kind'] != 'arxiv', not bool(re.search(r'\.pdf(?:$|[?#])', c['url'])))):
        if c['url'] in rejected:
            continue
        if re.search(r'webtoc|supplement|poster|curriculum|privacy', c['url'], re.I):
            continue
        if upgrading and c['kind'] != 'arxiv':
            continue
        for u in pdf_links(c['url']):
            queue.append((u, 0))
        queue.append((c['url'], 0))
    seen = set(); checks = 0; interrupted_transfer = False
    partial_dir = out/'partial'
    partial_dir.mkdir(exist_ok=True)
    def partial_path(url):
        return partial_dir/f"{r['id']:04d}_{hashlib.sha256(url.encode()).hexdigest()[:16]}.part"
    # Keep each source's resume data independent so a slow source cannot prevent
    # trying an available publisher or author copy. Migrate older resume files.
    legacy = partial_dir/f"{r['id']:04d}.part"
    legacy_meta = legacy.with_suffix('.part.json')
    if legacy.exists() and legacy_meta.exists():
        old_url = json.loads(legacy_meta.read_text(encoding='utf-8')).get('url')
        if old_url:
            target = partial_path(old_url)
            if not target.exists():
                legacy.replace(target)
                legacy_meta.replace(target.with_suffix('.part.json'))
    while queue and checks < 18:
        if net.stop.is_set():
            r['status'] = 'pending'
            return 'paused'
        url, depth = queue.pop(0)
        if url in seen:
            continue
        seen.add(url); checks += 1
        part = partial_path(url)
        part_meta = part.with_suffix('.part.json')
        try:
            ispdf, final, body = retrieve_pdf(net, url, part)
            if not ispdf:
                r['attempts'].append(dict(url=url, result='landing_page'))
                if depth < 2:
                    found = harvest(body, final, r)
                    for u in found:
                        add(r, u, 'arxiv' if arxiv_id(u) else 'public', 'Link on ' + final)
                    # Prefer arXiv even when a page exposes both publisher and preprint PDFs.
                    found = sorted(found, key=lambda u: not bool(arxiv_id(u)))
                    queue[0:0] = [('https://arxiv.org/pdf/'+arxiv_id(u) if arxiv_id(u) else u, depth+1) for u in found]
                continue
            info = verify_pdf(part, r)
            if not info['verified']:
                review = out/'needs_review'/f"{r['id']:04d}_{hashlib.sha256(url.encode()).hexdigest()[:8]}.pdf"
                review.parent.mkdir(exist_ok=True); part.replace(review)
                plausible = info['title_exact'] or info['title_similarity'] >= .65
                r['attempts'].append(dict(url=url, result='title_not_verified' if plausible else 'wrong_document', candidate_file=str(review.relative_to(out)), verification=info))
                if plausible:
                    r['status'] = 'needs_review'
                continue
            relative = Path('papers')/str(r['year'])/safe_name(r['venue'])/(f"{r['id']:04d}_"+safe_name(r['title'])+'.pdf')
            dest = out/relative; dest.parent.mkdir(parents=True, exist_ok=True); part.replace(dest)
            part.with_suffix('.part.json').unlink(missing_ok=True)
            r.update(status='downloaded', file=str(relative), download_url=final,
                     source_kind='arxiv' if arxiv_id(final) else 'public', verification=info,
                     sha256=hashlib.sha256(dest.read_bytes()).hexdigest(), bytes=dest.stat().st_size)
            r['attempts'].append(dict(url=url, result='downloaded'))
            return 'downloaded'
        except Exception as e:
            if net.stop.is_set():
                r['status'] = 'pending'
                return 'paused'
            # URLs in the catalogue contain no API credentials. Keep metadata key failures out of this log.
            r['attempts'].append(dict(url=url, result='error', error=str(e)[:250]))
            interrupted = isinstance(e, (TimeoutError, ConnectionError, http.client.IncompleteRead, urllib.error.URLError)) and not isinstance(e, urllib.error.HTTPError)
            interrupted = interrupted or str(e) == 'Not a complete PDF'
            if interrupted and part.exists() and part_meta.exists():
                saved_url = json.loads(part_meta.read_text(encoding='utf-8')).get('url')
                if saved_url == url and part.stat().st_size > 0:
                    interrupted_transfer = True
    if fallback:
        r.update(fallback)
        return 'kept_verified_public_version'
    if r['status'] != 'needs_review':
        r['status'] = 'pending' if interrupted_transfer else 'unavailable'
    return r['status']

def diagnose(r):
    status = r['status']
    if status == 'downloaded':
        return '已下载并通过核验'
    if status == 'needs_review':
        return 'PDF 已下载，但自动标题/摘要检查未通过；请查看 needs_review 文件夹'
    attempts = r.get('attempts', [])
    if status == 'pending':
        return '下载中断，重新运行可继续' if attempts else '尚未尝试下载，不代表失败'
    errors = ' '.join(a.get('error','') for a in attempts)
    reasons = []
    if 'Host unavailable in this run after a 403 response' in errors:
        reasons.append('旧版脚本因同站其他链接返回 403 而跳过本链接；可用新版 --retry 重试')
    if '403' in errors:
        reasons.append('来源拒绝访问（HTTP 403）；具体是否因登录、权限或反自动下载，需查看来源页面')
    if '401' in errors:
        reasons.append('来源要求认证（HTTP 401）')
    if '429' in errors:
        reasons.append('请求受到限流（HTTP 429），稍后重试')
    if '404' in errors or '410' in errors:
        reasons.append('候选链接不存在或已移除（HTTP 404/410）')
    if re.search('timeout|timed out|connection|ssl|certificate|urlopen', errors, re.I):
        reasons.append('网络连接、超时或 TLS 证书错误')
    if '200 MB' in errors:
        reasons.append('文件超过下载器设置的单篇 200 MB 上限')
    if not reasons and any(a.get('result')=='landing_page' for a in attempts):
        reasons.append('获取到了网页，但没有找到可核验的正文 PDF')
    return '；'.join(reasons) or '本轮候选来源未取得可核验正文，请查看 reason 中的原始记录'

def export_index(rows, out):
    fields = ['id','year','venue','title','status','diagnosis_zh','source_kind','file','candidate_files','download_url','catalogue_url','bytes','sha256','reason']
    reports = [('download_index.csv', rows),
               ('not_downloaded.csv', [r for r in rows if r['status'] != 'downloaded']),
               ('failed_downloads.csv', [r for r in rows if r['status'] == 'unavailable'])]
    for name, selected in reports:
        with (out/name).open('w', encoding='utf-8-sig', newline='') as f:
            w = csv.DictWriter(f, fieldnames=fields); w.writeheader()
            for r in selected:
                item = {k:r.get(k, '') for k in fields}
                item['diagnosis_zh'] = diagnose(r)
                item['candidate_files'] = '; '.join(dict.fromkeys(a['candidate_file'] for a in r['attempts'] if a.get('candidate_file')))
                item['reason'] = '' if r['status']=='downloaded' else '; '.join(dict.fromkeys(a.get('error', a.get('result','')) for a in r['attempts'][-5:]))
                w.writerow(item)
    from library_sync import publish, ROOT
    if out.resolve().is_relative_to(ROOT):
        publish(rows, out)


def acquire_lock(out):
    """OS-held lock releases on crashes; a stale file does not block a restart."""
    handle = (out/'download.lock').open('a+b')
    if handle.tell() == 0:
        handle.write(b'0'); handle.flush()
    handle.seek(0)
    try:
        if os.name == 'nt':
            import msvcrt
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        handle.close()
        raise RuntimeError('A downloader is already running for this library')
    atexit.register(handle.close)
    return handle


def download_copy(r, net, out):
    updated = copy.deepcopy(r)
    result = download_one(updated, net, out)
    return result, updated

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--output', type=Path, default=HERE.parents[1]/'GraspAtlas_Library')
    ap.add_argument('--limit', type=int, help='Process only the first N selected papers (smoke test)')
    ap.add_argument('--ids', help='Comma-separated catalogue IDs')
    ap.add_argument('--skip-resolve', action='store_true', help='Use cached/embedded links only')
    ap.add_argument('--resolve-only', action='store_true')
    ap.add_argument('--retry', action='store_true', help='Reattempt previous unavailable/review entries')
    ap.add_argument('--report-only', action='store_true', help='Regenerate reports from existing state without network access')
    ap.add_argument('--workers', type=int, default=6, help='Concurrent papers; each source host is accessed serially')
    args = ap.parse_args()
    try:
        import pypdf  # noqa
    except ImportError:
        print('Missing pypdf. Run: python -m pip install -r requirements.txt'); return 2
    out = args.output.resolve(); out.mkdir(parents=True, exist_ok=True)
    lock_handle = acquire_lock(out)
    state = out/'download_state.json'
    catalogue = json.loads((HERE/'catalogue.json').read_text(encoding='utf-8'))
    rows = json.loads(state.read_text(encoding='utf-8')) if state.exists() else seed(catalogue)
    # New curated sources must also reach resumed downloads.
    fresh = seed(catalogue)
    reconcile_catalogue(rows, fresh)
    ids = {int(s) for s in args.ids.split(',')} if args.ids else None
    chosen = selected_rows(rows, catalogue, ids)
    if args.limit is not None:
        chosen = chosen[:args.limit]
    net = Network()
    print(f'Grasp Atlas: {len(rows)} catalogue records; {len(chosen)} selected.\nOutput: {out}', flush=True)
    if args.report_only:
        write_json(state, rows)
        export_index(rows, out)
        print('Reports regenerated from local state; no network requests.', flush=True)
        return 0
    try:
        if not args.skip_resolve:
            print('Resolving public sources (arXiv first)...', flush=True)
            resolve(chosen, net, out); write_json(state, rows)
        if args.resolve_only:
            export_index(rows, out); return 0
        selected = [r for r in chosen if args.retry or r['status'] not in ('unavailable', 'needs_review')]
        pool = ThreadPoolExecutor(max_workers=max(1, min(args.workers, 12)))
        jobs = {pool.submit(download_copy, r, net, out): r for r in selected}
        try:
            for i, job in enumerate(as_completed(jobs), 1):
                r = jobs[job]
                result, updated = job.result()
                r.clear(); r.update(updated)
                write_json(state, rows); export_index(rows, out)
                print(f"[{i}/{len(selected)}] {r['id']:04d} {result}: {r['title']}", flush=True)
        except KeyboardInterrupt:
            net.stop.set()
            for job in jobs:
                job.cancel()
            print('Finishing active transfers and saving progress...', flush=True)
            pool.shutdown(wait=True, cancel_futures=True)
            for job, r in jobs.items():
                if not job.cancelled() and job.exception() is None:
                    _, updated = job.result(); r.clear(); r.update(updated)
            raise
        finally:
            pool.shutdown(wait=True)
    except KeyboardInterrupt:
        print('\nPaused. Run the same command to resume.', flush=True)
    finally:
        write_json(state, rows); export_index(rows, out)
    ok = sum(r['status']=='downloaded' for r in rows)
    print(f'Finished/paused: {ok}/{len(rows)} verified PDFs. See download_index.csv and not_downloaded.csv.', flush=True)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
