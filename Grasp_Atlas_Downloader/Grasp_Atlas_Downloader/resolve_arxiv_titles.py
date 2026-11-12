"""Recover title-format variants using distinctive title words, then verify matches."""
import collections
import json
import re
import urllib.parse
import xml.etree.ElementTree as ET
import download_papers as d


def main():
    out = d.HERE.parents[1]/'GraspAtlas_Library'
    rows = json.loads((out/'download_state.json').read_text(encoding='utf8'))
    selected = [r for r in rows if r['status'] != 'downloaded']
    words = lambda title: re.findall(r'[a-zA-Z][a-zA-Z0-9-]{2,}', title.lower())
    counts = collections.Counter(w for r in rows for w in set(words(r['title'])))
    sources = json.loads((d.HERE/'resolved_sources.json').read_text(encoding='utf8'))
    net = d.Network(); audit = []
    for start in range(0, len(selected), 8):
        group = selected[start:start+8]
        clauses = []
        for r in group:
            prefix = r['title'].split(':')[0]
            if ':' in r['title'] and len(prefix.split()) == 1:
                terms = words(prefix) or sorted(set(words(r['title'])), key=lambda w: (counts[w], -len(w)))[:3]
            else:
                terms = sorted(set(words(r['title'])), key=lambda w: (counts[w], -len(w)))[:3]
            clauses.append('(' + ' AND '.join('ti:"'+w+'"' for w in terms) + ')')
        url = 'https://export.arxiv.org/api/query?' + urllib.parse.urlencode({'search_query':' OR '.join(clauses), 'max_results':100})
        try:
            xml = ET.fromstring(net.cached(url, out/'metadata'))
            for entry in xml.findall('a:entry', d.ATOM):
                title = entry.findtext('a:title', '', d.ATOM)
                r = max(group, key=lambda r: d.score(r['title'], title))
                match = d.score(r['title'], title)
                if match < .91:
                    continue
                link = entry.findtext('a:id', '', d.ATOM)
                target = {'candidates': sources.get(str(r['id']), [])}
                d.add(target, link, 'arxiv', 'arXiv title-word search; title match: '+title.strip())
                sources[str(r['id'])] = target['candidates']
                audit.append(dict(id=r['id'], catalogue_title=r['title'], title=title.strip(), score=match, url=link))
            d.write_json(d.HERE/'resolved_sources.json', sources)
            d.write_json(out/'arxiv_title_variant_audit.json', audit)
            print(f'{min(start+8,len(selected))}/{len(selected)} searched; {len(audit)} matches', flush=True)
        except Exception as exc:
            print(type(exc).__name__, str(exc), flush=True)
            break


if __name__ == '__main__':
    main()
