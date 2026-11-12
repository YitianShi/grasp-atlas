import copy
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
import urllib.error
import download_papers as d
from library_sync import manifest


BODY = b'%PDF-1.4\n' + b'x' * 100000 + b'\n%%EOF\n'


class ResponseHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/denied':
            self.send_error(403); return
        start = int(self.headers.get('Range', 'bytes=0-').split('=')[1].split('-')[0])
        if start >= len(BODY):
            self.send_error(416); return
        self.send_response(206 if start else 200)
        self.send_header('Content-Range', f'bytes {start}-{len(BODY)-1}/{len(BODY)}')
        self.send_header('Content-Length', str(len(BODY) - start))
        self.send_header('ETag', 'test-etag')
        self.end_headers(); self.wfile.write(BODY[start:])
    def log_message(self, *args):
        pass


class DownloadTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), ResponseHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close()

    def test_range_resume_and_completed_416(self):
        with tempfile.TemporaryDirectory() as folder:
            part = Path(folder) / 'paper.part'; part.write_bytes(BODY[:65536])
            d.write_json(part.with_suffix('.part.json'), {'url': self.base + '/pdf', 'etag': 'test-etag'})
            self.assertTrue(d.retrieve_pdf(d.Network(), self.base + '/pdf', part)[0])
            self.assertEqual(part.read_bytes(), BODY)
            self.assertTrue(d.retrieve_pdf(d.Network(), self.base + '/pdf', part)[0])
            self.assertEqual(part.read_bytes(), BODY)

    def test_catalogue_append_preserves_downloaded_files_and_history(self):
        old = dict(id=1, title='Old paper', year=2025, venue='CoRL',
                   status='downloaded', file='papers/old.pdf', sha256='saved-hash',
                   attempts=[{'result': 'verified'}], candidates=[])
        fresh = [dict(id=1, title='Old paper', year=2025, venue='CoRL',
                      status='pending', candidates=[{'url': self.base+'/pdf',
                      'kind': 'public', 'evidence': 'author'}]),
                 dict(id=2, title='New paper', year=2026, venue='CoRL',
                      status='pending', attempts=[], candidates=[])]
        rows = [copy.deepcopy(old)]
        d.reconcile_catalogue(rows, fresh)
        self.assertEqual(len(rows), 2)
        for key in ('id', 'title', 'year', 'venue', 'status', 'file', 'sha256', 'attempts'):
            self.assertEqual(rows[0][key], old[key])
        self.assertEqual(rows[0]['candidates'], fresh[0]['candidates'])
        self.assertEqual(rows[1], fresh[1])
        self.assertIsNot(rows[1], fresh[1])
        d.reconcile_catalogue(rows, fresh)
        self.assertEqual(len(rows), 2)

    def test_sparse_ids_match_sources_without_reusing_excluded_ids(self):
        with tempfile.TemporaryDirectory() as folder:
            here = Path(folder)
            d.write_json(here/'resolved_sources.json', {
                '2': [{'url': self.base+'/excluded.pdf', 'kind': 'public'}],
                '3': [{'url': self.base+'/third.pdf', 'kind': 'public'}]})
            d.write_json(here/'paper_overrides.json', {
                '2': {'title': 'Excluded paper', 'title_alias': 'Not active'},
                '3': {'title': 'Third paper', 'title_alias': 'Third preprint'}})
            catalogue = {'rows': [dict(catalogueId=i, title=title, year=2026, conference='CoRL')
                                  for i, title in [(1, 'First paper'), (3, 'Third paper')]]}
            with patch.object(d, 'HERE', here):
                seeded = d.seed(catalogue)
            self.assertEqual([r['id'] for r in seeded], [1, 3])
            self.assertEqual(seeded[0]['candidates'], [])
            self.assertEqual([c['url'] for c in seeded[1]['candidates']], [self.base+'/third.pdf'])
            self.assertEqual(seeded[1]['title_alias'], 'Third preprint')

    def test_duplicate_or_invalid_catalogue_ids_are_rejected(self):
        for ids in [(1, 1), (0, 2), ('1', 2)]:
            catalogue = {'rows': [dict(catalogueId=i, title='Paper', year=2026, conference='CoRL') for i in ids]}
            with self.assertRaises(ValueError):
                d.seed(catalogue)

    def test_review_bin_seed_keeps_curated_prefix_and_validates_ids(self):
        catalogue = {'rows': [dict(catalogueId=1, title='First', year=2026, conference='CoRL')],
                     'reviewBin': {'catalogueIds': [3], 'rows': [dict(catalogueId=3, title='Review', year=2026, conference='ICRA')]}}
        with tempfile.TemporaryDirectory() as folder, patch.object(d, 'HERE', Path(folder)):
            rows = d.seed(catalogue)
            self.assertEqual([r['id'] for r in rows], [1, 3])
            catalogue['reviewBin']['rows'][0]['catalogueId'] = 1
            with self.assertRaises(ValueError):
                d.seed(catalogue)

    def test_default_download_selection_excludes_review_bin(self):
        catalogue = json.loads((d.HERE/'catalogue.json').read_text(encoding='utf8'))
        rows = d.seed(catalogue)
        self.assertEqual(len(rows), 710)
        selected = d.selected_rows(rows, catalogue)
        self.assertEqual(len(selected), 523)
        removed = set(catalogue['reviewBin']['catalogueIds']) | set(catalogue['deletionBatches'][0]['catalogueIds'])
        self.assertEqual(d.default_deleted_ids(catalogue), removed)
        self.assertEqual(len(removed), 187)
        self.assertTrue(all(r['id'] not in removed for r in selected))
        self.assertEqual({r['id'] for r in d.selected_rows(rows, catalogue, {159, 339})}, {159, 339})
        self.assertEqual(d.selected_rows(rows, catalogue, set()), [])
        with self.assertRaises(ValueError):
            d.selected_rows(rows, catalogue, {100000})

    def test_catalogue_replacement_and_shrink_are_rejected_before_mutation(self):
        rows = [dict(id=i, title=f'Paper {i}', year=2025, venue='CoRL',
                     candidates=[], attempts=[], status='downloaded') for i in (1, 2)]
        for key in ('id', 'title', 'year', 'venue'):
            fresh = copy.deepcopy(rows)
            fresh[0]['candidates'].append({'url': self.base+'/pdf', 'kind': 'public', 'evidence': 'new'})
            fresh[1][key] = 'changed'
            saved = copy.deepcopy(rows)
            with self.assertRaises(ValueError):
                d.reconcile_catalogue(rows, fresh)
            self.assertEqual(rows, saved)
        with self.assertRaises(ValueError):
            d.reconcile_catalogue(rows, rows[:1])

    def test_403_does_not_disable_host(self):
        net = d.Network()
        with self.assertRaises(urllib.error.HTTPError):
            with net.open(self.base + '/denied'):
                pass
        with net.open(self.base + '/pdf') as response:
            self.assertEqual(response.read(), BODY)

    def test_report_only_persists_appended_pending_records_without_network(self):
        catalogue = json.loads((d.HERE/'catalogue.json').read_text(encoding='utf8'))
        original = d.seed(catalogue)[0]
        original['attempts'] = [{'result': 'historical attempt'}]
        with tempfile.TemporaryDirectory() as folder:
            out = Path(folder)
            d.write_json(out/'download_state.json', [original])
            with d.acquire_lock(out) as handle, \
                    patch.object(d, 'acquire_lock', return_value=handle), \
                    patch('sys.argv', ['download_papers.py', '--output', str(out), '--report-only']), \
                    patch.object(d.Network, 'open', side_effect=AssertionError('report-only must not use the network')):
                self.assertEqual(d.main(), 0)
            saved = json.loads((out/'download_state.json').read_text(encoding='utf8'))
            self.assertEqual(len(saved), len(d.catalogue_rows(catalogue)))
            self.assertEqual(saved[0]['attempts'], original['attempts'])
            self.assertTrue(all(r['status'] == 'pending' for r in saved[1:]))

    def test_missing_and_review_are_never_local_links(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); out = root / 'library'; out.mkdir()
            r = dict(id=1,title='Paper',year=2025,venue='ICRA',status='downloaded',file='papers/missing.pdf',bytes=20)
            data = manifest([r], out, root)
            self.assertEqual(data['rows']['1']['status'], 'missing_file')
            self.assertEqual(data['rows']['1']['file'], '')
            r['status'] = 'needs_review'
            self.assertEqual(manifest([r], out, root)['rows']['1']['file'], '')

    def test_author_list_links_are_scoped_to_the_paper(self):
        body = '<div><article><p>Correct paper</p><a href="/correct.pdf">PDF</a></article><article><p>Wrong paper</p><a href="/wrong.pdf">PDF</a></article></div>'
        self.assertEqual(d.harvest(body, self.base, {'title': 'Correct paper'}), [self.base+'/correct.pdf'])
        self.assertEqual(d.harvest(body, self.base, {'title': 'Absent paper'}), [])
        body = '<meta name="citation_title" content="Correct paper"><meta name="citation_pdf_url" content="/retrieve/123">'
        self.assertEqual(d.harvest(body, self.base, {'title': 'Correct paper'}), [self.base+'/retrieve/123'])

    def test_actual_pdf_title_validation(self):
        out = d.HERE.parents[1] / 'GraspAtlas_Library'
        state = out / 'download_state.json'
        if not state.exists():
            self.skipTest('No downloaded library fixture')
        r = next((x for x in json.loads(state.read_text(encoding='utf8')) if x['status'] == 'downloaded'), None)
        if r is None:
            self.skipTest('No verified PDF fixture')
        path = out / r['file']
        self.assertTrue(d.verify_pdf(path, r)['verified'])
        wrong = copy.deepcopy(r); wrong['title'] = 'Unrelated Research on Stellar Evolution and Galactic Supernovae'; wrong.pop('title_alias', None)
        self.assertFalse(d.verify_pdf(path, wrong)['verified'])

    def test_interrupted_source_does_not_block_verified_alternative(self):
        with tempfile.TemporaryDirectory() as folder:
            out = Path(folder); paths = []
            row = dict(id=1,title='Correct paper',year=2025,venue='ICRA',status='pending',attempts=[],
                       candidates=[{'url':self.base+'/slow.pdf','kind':'public'}, {'url':self.base+'/good.pdf','kind':'public'}])
            def transfer(net, url, part):
                paths.append(part)
                part.write_bytes(BODY)
                d.write_json(part.with_suffix('.part.json'), {'url':url})
                if url.endswith('slow.pdf'):
                    raise TimeoutError('interrupted source')
                return True, url, ''
            with patch.object(d, 'retrieve_pdf', side_effect=transfer), patch.object(d, 'verify_pdf', return_value={'verified':True}):
                self.assertEqual(d.download_one(row, d.Network(), out), 'downloaded')
            self.assertNotEqual(paths[0], paths[1])
            self.assertTrue(paths[0].exists())
            self.assertEqual((out/row['file']).read_bytes(), BODY)

    def test_title_stored_after_body_in_word_pdf(self):
        out = d.HERE.parents[1] / 'GraspAtlas_Library'
        path = out/'needs_review'/'0562_1f482dab.pdf'
        if not path.exists():
            self.skipTest('No Word-generated PDF fixture')
        row = next(r for r in json.loads((out/'download_state.json').read_text(encoding='utf8')) if r['id'] == 562)
        self.assertTrue(d.verify_pdf(path, row)['verified'])
        self.assertFalse(d.verify_pdf(path, dict(title='Unrelated Research on Stellar Evolution and Galactic Supernovae'))['verified'])


if __name__ == '__main__':
    unittest.main()
