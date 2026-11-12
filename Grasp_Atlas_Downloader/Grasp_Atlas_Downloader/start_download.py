#!/usr/bin/env python3
"""Create a local Python environment and run the downloader. No admin access."""
import os, subprocess, sys, venv
from pathlib import Path

root = Path(__file__).resolve().parent
env = root / '.grasp_python'
python = env / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')

def main():
    if sys.version_info < (3, 10):
        print('Python 3.10 or newer is required: https://www.python.org/downloads/')
        return 2
    # Copied offline bundles can contain a venv pointing at another computer.
    try:
        usable = python.exists() and subprocess.run([str(python), '--version'], capture_output=True).returncode == 0
    except OSError:
        usable = False
    if not usable:
        print('Creating or repairing local Python environment...', flush=True)
        venv.EnvBuilder(with_pip=True).create(env)
    check = subprocess.run([str(python), '-c', 'import pypdf'], capture_output=True)
    if check.returncode:
        print('Installing pypdf for PDF title verification...', flush=True)
        subprocess.run([str(python), '-m', 'pip', 'install', '-r', str(root/'requirements.txt')], check=True)
    return subprocess.call([str(python), str(root/'download_papers.py')] + sys.argv[1:], cwd=root)

if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, subprocess.CalledProcessError) as exc:
        print('Could not start:', exc)
        print('Manual alternative: python -m pip install -r requirements.txt')
        print('Then: python download_papers.py')
        raise SystemExit(1)
