"""Local download selection requests never start a real downloader in these tests."""
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import Mock, patch
import urllib.error
import urllib.request

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import atlas_server as atlas


class SelectionTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.out_patch = patch.object(atlas, 'OUT', Path(self.folder.name))
        self.running_patch = patch.object(atlas, 'downloader_running', return_value=False)
        self.popen_patch = patch.object(atlas.subprocess, 'Popen', return_value=Mock(poll=lambda: None))
        self.out_patch.start(); self.running_patch.start(); self.popen = self.popen_patch.start()
        self.server = atlas.AtlasServer(('127.0.0.1', 0), atlas.Handler)
        self.server.download_lock = threading.Lock(); self.server.download_process = None
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f'http://127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join(timeout=5)
        self.popen_patch.stop(); self.running_patch.stop(); self.out_patch.stop(); self.folder.cleanup()

    def post(self, payload, origin=None, path='/api/download'):
        body = payload if isinstance(payload, bytes) else json.dumps(payload).encode('utf8')
        headers = {'X-Grasp-Atlas': '1', 'Content-Type': 'application/json'}
        if origin is not None:
            headers['Origin'] = origin
        request = urllib.request.Request(self.url+path, data=body, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as response:
            return response.code, json.load(response)

    def test_explicit_browser_selection_includes_restored_paper_only_once(self):
        self.assertEqual(self.post({'ids': [339, 1, 339]}, self.url)[0], 202)
        command = self.popen.call_args.args[0]
        self.assertEqual(command[command.index('--ids')+1], '339,1')

    def test_default_launcher_preserves_cli_default_selection(self):
        self.assertEqual(self.post({})[0], 202)
        self.assertNotIn('--ids', self.popen.call_args.args[0])

    def test_invalid_selection_never_starts_downloader(self):
        for payload in [{'ids': []}, {'ids': [99999]}, {'ids': [True]}, {'ids': ['339']}, {'ids': [3]}, {'unknown': 1}, [], b'{']:
            with self.subTest(payload=payload):
                self.assertEqual(self.post(payload)[0], 400)
        self.popen.assert_not_called()

    def test_external_origin_never_starts_downloader(self):
        self.assertEqual(self.post({'ids': [339]}, 'https://example.org')[0], 403)
        self.popen.assert_not_called()

    def test_permanent_delete_requires_same_origin_and_explicit_confirmation(self):
        with patch.object(atlas,'purge_paper') as erase:
            self.assertEqual(self.post({'id':339,'confirm':True},path='/api/purge')[0],403)
            self.assertEqual(self.post({'id':339,'confirm':True},'https://example.org','/api/purge')[0],403)
            for payload in [{'id':339}, {'id':True,'confirm':True}, {'id':339,'confirm':False}, {'id':'339','confirm':True}, {'id':339,'confirm':True,'extra':1}, [], b'{']:
                with self.subTest(payload=payload):
                    self.assertEqual(self.post(payload,self.url,'/api/purge')[0],400)
            erase.assert_not_called()

    def test_permanent_delete_locks_and_calls_backend_only_after_confirmation(self):
        lock=Mock()
        with patch.object(atlas,'purge_paper',return_value={'deleted':True}) as erase, patch.object(atlas,'acquire_lock',return_value=lock):
            self.assertEqual(self.post({'id':339,'confirm':True},self.url,'/api/purge'),(200,{'deleted':True}))
            erase.assert_called_once_with(atlas.ROOT,339)
            lock.close.assert_called_once()
        self.popen.assert_not_called()

    def test_permanent_delete_is_blocked_by_download_and_external_process_lock(self):
        with patch.object(atlas,'purge_paper') as erase:
            self.server.download_process=Mock(poll=lambda:None)
            self.assertEqual(self.post({'id':339,'confirm':True},self.url,'/api/purge')[0],409)
            self.server.download_process=None
            with patch.object(atlas,'acquire_lock',side_effect=RuntimeError('locked')):
                self.assertEqual(self.post({'id':339,'confirm':True},self.url,'/api/purge')[0],409)
            erase.assert_not_called()

    def test_permanent_delete_failure_is_not_reported_as_success_and_releases_lock(self):
        for error,status in [(atlas.PurgeError('not_found'),404),(atlas.PurgeError('unsafe_path'),400),(OSError('locked'),500)]:
            lock=Mock()
            with patch.object(atlas,'purge_paper',side_effect=error),patch.object(atlas,'acquire_lock',return_value=lock):
                code,body=self.post({'id':339,'confirm':True},self.url,'/api/purge')
                self.assertEqual(code,status)
                self.assertIn('error',body)
                self.assertNotIn('deleted',body)
                lock.close.assert_called_once()
