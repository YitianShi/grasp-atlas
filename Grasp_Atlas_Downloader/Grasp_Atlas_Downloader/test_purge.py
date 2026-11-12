"""Permanent deletion is exercised only in disposable temporary workspaces."""
import copy
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import paper_purge as purge


class PurgeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.out = self.root/'GraspAtlas_Library'
        self.down = self.root/'Grasp_Atlas_Downloader/Grasp_Atlas_Downloader'
        self.dist = self.root/'editable-site/dist'
        self.target = dict(catalogueId=801, title='Unique Flexible Widget Grasping Research', conference='ICRA', year=2026,
                           tier='直接', abstract='SENSITIVE ABSTRACT', url='https://example.org/paper801')
        self.keep = dict(catalogueId=802, title='Other Rigid Widget Grasping Research', conference='CoRL', year=2026,
                         tier='直接', abstract='KEEP ABSTRACT', url='https://example.org/paper802')
        self.data = dict(rows=[self.keep], reviewBin=dict(batchId='first', catalogueIds=[801], rows=[self.target]),
                         deletionBatches=[dict(batchId='second', catalogueIds=[801,802])],
                         screening=[['排除','ICRA',2026,self.target['title'],'SENSITIVE REASON',self.target['url']]])
        self.state = [dict(id=i, title=r['title'], year=2026, venue=r['conference'], status='downloaded',
                           file=f'papers/2026/{r["conference"]}/{i:04d}_paper.pdf', bytes=3, candidates=[], attempts=[])
                      for i,r in [(802,self.keep),(801,self.target)]]
        self.put_json(self.down/'catalogue.json', self.data)
        self.put_json(self.out/'download_state.json', self.state)
        for r in self.state:
            self.put(self.out/r['file'], b'PDF')
        self.put_json(self.root/'editable-site/curation/history.json', {'rows':[self.target,self.keep], 'restoredCatalogueIds':[801,802]})
        self.put_json(self.down/'resolved_sources.json', {'801':[{'url':self.target['url']}], '802':[{'url':self.keep['url']}]})
        self.put_json(self.out/'backups/old/catalogue.json', self.data)
        self.put(self.out/'backups/old/data.js', ('window.GRASP_DATA = '+json.dumps(self.data)+';\n').encode())
        self.put(self.out/'backups/old/library.js', ('window.GRASP_LIBRARY = '+json.dumps({'rows':{'801':self.state[1],'802':self.state[0]}})+';\n').encode())
        self.put(self.out/'backups/old/index.html', ('<html><script>window.GRASP_DATA = '+json.dumps(self.data)+';</script></html>').encode())
        self.put(self.out/'backups/old/papers/0801_paper.pdf', b'PDF')
        self.put(self.out/'needs_review/0801_candidate.pdf', b'PDF')
        self.put(self.out/'partial/0801_paper.pdf.part', b'PART')
        self.put(self.root/'reports/pdf-scope-text/801.txt', b'SENSITIVE FULL TEXT')
        self.put_json(self.root/'reports/urls.json', {self.target['url']:'SENSITIVE URL CACHE',self.keep['url']:'KEEP'})
        self.put(self.root/'PURGE_REPORT.txt', (self.target['title']+'\nSENSITIVE REASON\n\n'+self.keep['title']+'\nKEEP').encode())
        self.put(self.out/'download_index.csv', ('id,title\n801,'+self.target['title']+'\n802,'+self.keep['title']+'\n').encode())
        self.put(self.dist/'index.html', b'<html><head><link rel="stylesheet" href="style.css"></head><body><span data-deleted-count>1</span><script src="data.js" defer></script></body></html>')
        self.put(self.dist/'style.css', b'body{}')
        self.put(self.dist/'data.js', b'OLD')
        self.put(self.root/'index.html', b'OLD BUNDLE')
        self.put(self.root/'library.js', b'OLD MANIFEST')

    def put(self, path, data):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def put_json(self, path, data):
        self.put(path, json.dumps(data, ensure_ascii=False).encode())

    def snapshot(self):
        return {p.relative_to(self.root).as_posix():p.read_bytes() for p in self.root.rglob('*') if p.is_file()}

    def test_removes_metadata_pdfs_candidates_caches_and_history_preserving_other_paper(self):
        result = purge.purge_paper(self.root,801)
        self.assertTrue(result['deleted'])
        remaining = json.loads((self.down/'catalogue.json').read_text(encoding='utf-8'))
        self.assertEqual(remaining['rows'], [self.keep])
        self.assertEqual(remaining['reviewBin']['rows'], [])
        self.assertEqual(remaining['screening'], [])
        self.assertEqual(remaining['reviewBin']['catalogueIds'], [])
        self.assertEqual(remaining['deletionBatches'][0]['catalogueIds'], [802])
        self.assertEqual(remaining['nextCatalogueId'],803)
        self.assertEqual(json.loads((self.out/'download_state.json').read_text()), [self.state[0]])
        self.assertEqual((self.out/self.state[0]['file']).read_bytes(),b'PDF')
        self.assertEqual(result['library']['total'],1)
        for name, body in self.snapshot().items():
            self.assertNotIn(self.target['title'].encode(),body,name)
            self.assertNotIn(b'SENSITIVE',body,name)
            self.assertNotIn(b'https://example.org/paper801',body,name)
            self.assertNotIn('0801_',name)
        self.assertFalse(list(self.root.glob('.atlas-purge-*')))
        with self.assertRaisesRegex(purge.PurgeError,'not_found'):
            purge.purge_paper(self.root,801)

    def test_keeps_shared_pdf_used_by_another_paper(self):
        self.state[0]['file'] = self.state[1]['file']
        self.put_json(self.out/'download_state.json',self.state)
        purge.purge_paper(self.root,801)
        self.assertEqual((self.out/self.state[0]['file']).read_bytes(), b'PDF')

    def test_unknown_and_invalid_ids_make_no_changes(self):
        before = self.snapshot()
        for value in [True,'801',0,-1,99999]:
            with self.assertRaises(purge.PurgeError):
                purge.purge_paper(self.root,value)
        self.assertEqual(before,self.snapshot())

    def test_traversal_reference_is_rejected_before_any_changes(self):
        self.state[1]['file'] = '../../outside.pdf'
        self.put_json(self.out/'download_state.json',self.state)
        before = self.snapshot()
        with self.assertRaisesRegex(purge.PurgeError,'unsafe_path'):
            purge.purge_paper(self.root,801)
        self.assertEqual(before,self.snapshot())

    def test_invalid_history_json_is_rejected_before_any_changes(self):
        self.put(self.root/'reports/broken.json',b'{')
        before = self.snapshot()
        with self.assertRaisesRegex(purge.PurgeError,'invalid_data'):
            purge.purge_paper(self.root,801)
        self.assertEqual(before,self.snapshot())

    def test_failed_replacement_rolls_back_every_original(self):
        before = self.snapshot()
        replace = os.replace
        failed = False
        def fail_once(source,destination):
            nonlocal failed
            if Path(source).name.startswith('new-') and not failed:
                failed=True
                raise PermissionError('simulated locked file')
            return replace(source,destination)
        with patch.object(purge.os,'replace',side_effect=fail_once):
            with self.assertRaises(PermissionError):
                purge.purge_paper(self.root,801)
        self.assertEqual(before,self.snapshot())
        self.assertFalse(list(self.root.glob('.atlas-purge-*')))
