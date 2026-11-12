"""Find additional public locations by DOI and conservative title matching."""
import argparse
import json
import urllib.parse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import download_papers as d


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=d.HERE.parents[1] / 'GraspAtlas_Library')
    parser.add_argument('--ids')
    args = parser.parse_args()
    cat = json.loads((d.HERE / 'catalogue.json').read_text(encoding='utf8'))
    seeds = d.seed(cat)
    papers_by_id = {p.get('catalogueId', i): p for i, p in enumerate(cat['rows'], 1)}
    current = {r['id']: r for r in json.loads((args.output / 'download_state.json').read_text(encoding='utf8'))}
    ids = {int(x) for x in args.ids.split(',')} if args.ids else None
    selected = [r for r in seeds if (r['id'] in ids if ids else not d.has_arxiv(current[r['id']]) and current[r['id']]['status'] != 'downloaded')]
    net = d.Network()
    sources = json.loads((d.HERE / 'resolved_sources.json').read_text(encoding='utf8'))
    audit = []

    def run(r):
        p = papers_by_id[r['id']]
        result = dict(id=r['id'], title=r['title'], matches=[], errors=[])
        doi = p.get('doi') or current[r['id']].get('doi')
        urls = []
        if doi:
            urls.append('https://api.openalex.org/works/' + urllib.parse.quote(doi if doi.startswith('http') else 'https://doi.org/' + doi, safe=':/'))
        if not r.get('openalex_id'):
            urls.append('https://api.openalex.org/works?' + urllib.parse.urlencode({'search': r['title'], 'per-page': 4}))
        for url in urls:
            try:
                data = json.loads(net.cached(url, args.output / 'metadata'))
                works = data.get('results', [data] if data.get('id') else [])
                for w in works:
                    match = d.score(r['title'], w.get('title', ''))
                    if match < .94 or abs(w.get('publication_year', 0) - r['year']) > 2:
                        continue
                    links = []
                    for loc in w.get('locations') or []:
                        for key in ('pdf_url', 'landing_page_url'):
                            if loc.get(key):
                                links.append(loc[key])
                    result['matches'].append(dict(title=w['title'], score=match, source=w['id'], doi=w.get('doi'), links=links))
                    for u in links:
                        d.add(r, u, 'public', 'OpenAlex title match ' + w['id'] + ': ' + w['title'])
            except Exception as exc:
                result['errors'].append(type(exc).__name__)
        return r, result

    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = [pool.submit(run, r) for r in selected]
        for i, job in enumerate(as_completed(jobs), 1):
            r, result = job.result()
            sources[str(r['id'])] = r['candidates']
            audit.append(result)
            d.write_json(d.HERE / 'resolved_sources.json', sources)
            d.write_json(args.output / 'additional_source_audit.json', audit)
            print(f"[{i}/{len(selected)}] {r['id']} matches={len(result['matches'])} arxiv={d.has_arxiv(r)}", flush=True)


if __name__ == '__main__':
    main()
