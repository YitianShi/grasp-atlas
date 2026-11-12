"""Supplement public repositories using title-checked Semantic Scholar metadata."""
import json
import time
import urllib.request
import urllib.error
from pathlib import Path
import download_papers as d

OUT = d.HERE.parents[1] / 'GraspAtlas_Library'


def main():
    cat = json.loads((d.HERE/'catalogue.json').read_text(encoding='utf8'))
    rows = json.loads((OUT/'download_state.json').read_text(encoding='utf8'))
    sources = json.loads((d.HERE/'resolved_sources.json').read_text(encoding='utf8'))
    audit_path = OUT/'semantic_source_audit.json'
    audit = json.loads(audit_path.read_text(encoding='utf8')) if audit_path.exists() else []
    checked = {x['id'] for x in audit}
    seeds = {r['id']: r for r in d.seed(cat)}
    selected = []
    for r, p in zip(rows, cat['rows']):
        if r['status'] == 'downloaded' or r['id'] in checked or d.has_arxiv(seeds[r['id']]):
            continue
        doi = p.get('doi') or r.get('doi')
        if not doi and 'doi.org/' in p.get('url', ''):
            doi = p['url'].split('doi.org/')[-1]
        if doi:
            selected.append((r, 'DOI:' + doi.replace('https://doi.org/', '')))
    for start in range(0, len(selected), 50):
        group = selected[start:start+50]
        url = 'https://api.semanticscholar.org/graph/v1/paper/batch?fields=title,year,openAccessPdf,externalIds,url'
        request = urllib.request.Request(url, data=json.dumps({'ids': [key for _, key in group]}).encode(), headers={'Content-Type': 'application/json', 'User-Agent': d.UA})
        try:
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(request, timeout=30) as response:
                        works = json.load(response)
                    break
                except urllib.error.HTTPError as exc:
                    if exc.code != 429 or attempt == 2:
                        raise
                    wait = max(60, int(exc.headers.get('Retry-After', '60')))
                    print(f'Rate limited; waiting {wait}s before retry', flush=True)
                    time.sleep(wait)
            for (r, key), work in zip(group, works):
                if not work or d.score(r['title'], work.get('title', '')) < .94:
                    continue
                result = dict(id=r['id'], query=key, metadata=work, candidates=[])
                target = {'candidates': sources.get(str(r['id']), [])}
                pdf = (work.get('openAccessPdf') or {}).get('url')
                aid = (work.get('externalIds') or {}).get('ArXiv')
                for candidate in [pdf, 'https://arxiv.org/abs/'+aid if aid else None]:
                    if candidate:
                        d.add(target, candidate, 'public', 'Semantic Scholar exact-title/DOI match ' + work['url'])
                        result['candidates'].append(candidate)
                sources[str(r['id'])] = target['candidates']
                audit.append(result)
            d.write_json(d.HERE/'resolved_sources.json', sources)
            d.write_json(OUT/'semantic_source_audit.json', audit)
            print(f'{min(start+50,len(selected))}/{len(selected)} checked; {sum(bool(x["candidates"]) for x in audit)} open locations', flush=True)
            time.sleep(5)
        except Exception as exc:
            print(type(exc).__name__, str(exc), flush=True)
            break


if __name__ == '__main__':
    main()
