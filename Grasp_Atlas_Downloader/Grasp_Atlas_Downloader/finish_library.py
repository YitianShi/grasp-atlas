"""Finish a running collection, resolve title variants, then try newly found sources."""
import json
import subprocess
import sys
import time
import download_papers as d

ROOT = d.HERE.parents[1]
sys.path.insert(0, str(ROOT))
from atlas_server import downloader_running


def main():
    out = ROOT/'GraspAtlas_Library'
    print('Waiting for the current download batch...', flush=True)
    while downloader_running():
        time.sleep(5)
    subprocess.run([sys.executable, '-X', 'utf8', '-u', str(d.HERE/'resolve_arxiv_titles.py')], check=True)
    rows = json.loads((out/'download_state.json').read_text(encoding='utf8'))
    catalogue = json.loads((d.HERE/'catalogue.json').read_text(encoding='utf8'))
    fresh = d.seed(catalogue)
    eligible = {r['id'] for r in d.selected_rows(rows, catalogue)}
    ids = []
    for r, source in zip(rows, fresh):
        if r['id'] not in eligible or r['status'] == 'downloaded':
            continue
        attempted = {a['url'] for a in r['attempts']}
        if r['status'] in ('pending', 'needs_review') or any(c['url'] not in attempted for c in source['candidates']):
            ids.append(str(r['id']))
    print('Papers with new sources or pending verification: '+','.join(ids), flush=True)
    if ids:
        subprocess.run([sys.executable, '-X', 'utf8', '-u', str(d.HERE/'download_papers.py'), '--output', str(out), '--ids', ','.join(ids), '--skip-resolve', '--retry', '--workers', '8'], check=True)


if __name__ == '__main__':
    main()
