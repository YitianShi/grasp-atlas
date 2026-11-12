"""Loopback-only Grasp Atlas server with a resumable download button."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import os
import socket
import subprocess
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent
DOWNLOADER = ROOT / 'Grasp_Atlas_Downloader' / 'Grasp_Atlas_Downloader'
OUT = ROOT / 'GraspAtlas_Library'
sys.path.insert(0, str(DOWNLOADER))
from library_sync import manifest, publish
from download_papers import seed, catalogue_rows, acquire_lock
from paper_purge import purge_paper, PurgeError


class AtlasServer(ThreadingHTTPServer):
    allow_reuse_address = False

    def server_bind(self):
        # Windows SO_REUSEADDR allows two listeners to claim the same port.
        # Exclusivity makes the second launcher reliably reopen this instance.
        if os.name == 'nt':
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def json_response(self, data, status=200):
        # Drain a small rejected POST too. Closing a Windows socket with an
        # unread request body can reset it before the browser receives the error.
        if self.command == 'POST' and status >= 400 and not getattr(self, '_body_read', False):
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if 0 < length <= 32768:
                    self.connection.settimeout(2)
                    self.rfile.read(length)
            except (ValueError, OSError):
                pass
        payload = json.dumps(data, ensure_ascii=False).encode('utf8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def allowed(self):
        expected = f'127.0.0.1:{self.server.server_port}'
        return self.headers.get('Host') == expected

    def do_GET(self):
        if not self.allowed():
            self.send_error(403)
            return
        if urllib.parse.urlsplit(self.path).path == '/api/library':
            with self.server.download_lock:
                path = OUT / 'download_state.json'
                catalogue = json.loads((DOWNLOADER / 'catalogue.json').read_text(encoding='utf8'))
                rows = json.loads(path.read_text(encoding='utf8')) if path.exists() else seed(catalogue)
                process = self.server.download_process
                running = downloader_running() or bool(process and process.poll() is None)
                self.json_response(dict(library=manifest(rows, OUT), running=running,
                                        catalogueIds=[p['catalogueId'] for p in catalogue_rows(catalogue)]))
            return
        # Keep dotfiles and paths outside the workspace out of the server.
        path = self.translate_path(self.path)
        resolved = Path(path).resolve()
        if not resolved.is_relative_to(ROOT) or any(p.startswith('.') for p in resolved.relative_to(ROOT).parts):
            self.send_error(403)
            return
        super().do_GET()

    def do_POST(self):
        origin = self.headers.get('Origin')
        expected = f'http://127.0.0.1:{self.server.server_port}'
        if not self.allowed() or self.headers.get('X-Grasp-Atlas') != '1' or origin not in (None, expected):
            self.json_response({'error': 'Same-origin requests only'}, 403)
            return
        if self.path == '/api/purge':
            if origin != expected:
                self.json_response({'error': 'same_origin_required'}, 403)
                return
            self.purge_request()
            return
        if self.path != '/api/download':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 <= length <= 32768:
                raise ValueError('Invalid request size')
            self._body_read = True
            payload = json.loads(self.rfile.read(length)) if length else {}
            if not isinstance(payload, dict) or set(payload) - {'ids'}:
                raise ValueError('Invalid download selection')
            ids = payload.get('ids')
            if ids is not None:
                catalogue = json.loads((DOWNLOADER / 'catalogue.json').read_text(encoding='utf8'))
                allowed_ids = {p['catalogueId'] for p in catalogue_rows(catalogue)}
                if not isinstance(ids, list) or not ids or any(type(i) is not int or i not in allowed_ids for i in ids):
                    raise ValueError('Invalid catalogue IDs')
        except (ValueError, TypeError, json.JSONDecodeError):
            self.json_response({'error': 'Invalid download selection'}, 400)
            return
        with self.server.download_lock:
            process = self.server.download_process
            if not downloader_running() and not (process and process.poll() is None):
                OUT.mkdir(exist_ok=True)
                with (OUT / 'download.log').open('ab') as log:
                    flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
                    command = [sys.executable, '-X', 'utf8', '-u', str(DOWNLOADER / 'start_download.py'), '--output', str(OUT), '--retry']
                    if ids is not None:
                        command += ['--ids', ','.join(str(i) for i in dict.fromkeys(ids))]
                    self.server.download_process = subprocess.Popen(
                        command,
                        cwd=ROOT, stdout=log, stderr=log, creationflags=flags)
            self.json_response({'running': True}, 202)

    def purge_request(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 1024 or self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                raise ValueError()
            self._body_read = True
            payload = json.loads(self.rfile.read(length))
            if (not isinstance(payload, dict) or set(payload) != {'id', 'confirm'} or payload['confirm'] is not True or
                    type(payload['id']) is not int or payload['id'] < 1):
                raise ValueError()
        except (ValueError, TypeError, json.JSONDecodeError):
            self.json_response({'error': 'invalid_id'}, 400)
            return
        with self.server.download_lock:
            process = self.server.download_process
            if downloader_running() or (process and process.poll() is None):
                self.json_response({'error': 'busy'}, 409)
                return
            OUT.mkdir(exist_ok=True)
            try:
                lock = acquire_lock(OUT)
            except RuntimeError:
                self.json_response({'error': 'busy'}, 409)
                return
            try:
                result = purge_paper(ROOT, payload['id'])
                self.json_response(result)
            except PurgeError as exc:
                self.json_response({'error': exc.code}, 404 if exc.code == 'not_found' else 400)
            except (OSError, ValueError, KeyError):
                self.json_response({'error': 'purge_failed'}, 500)
            finally:
                lock.close()

    def log_message(self, *args):
        pass


def downloader_running():
    lock = OUT / 'download.lock'
    if not lock.exists():
        return False
    try:
        with lock.open('r+b') as handle:
            if os.name == 'nt':
                import msvcrt
                try:
                    msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
                except OSError:
                    return True
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl
                try:
                    fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
                except BlockingIOError:
                    return True
        return False
    except OSError:
        return True


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--port', type=int, default=8765)
    ap.add_argument('--no-browser', action='store_true')
    args = ap.parse_args()
    try:
        server = AtlasServer(('127.0.0.1', args.port), Handler)
    except OSError:
        # A second launcher should reopen the existing Atlas window.
        url = f'http://127.0.0.1:{args.port}/'
        try:
            with urllib.request.urlopen(url + 'api/library', timeout=2) as response:
                data = json.load(response)
            if not isinstance(data.get('library', {}).get('rows'), dict):
                raise ValueError('The port is used by another application')
        except Exception:
            raise RuntimeError(f'Port {args.port} is unavailable; choose another with --port') from None
        print('Grasp Atlas is already running: ' + url, flush=True)
        if not args.no_browser:
            webbrowser.open(url)
        return
    server.download_lock = threading.Lock()
    server.download_process = None
    url = f'http://127.0.0.1:{server.server_port}/'
    print('Grasp Atlas: ' + url, flush=True)
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
