"""Build the offline page and run repository checks without downloaded papers."""
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADER = ROOT / 'Grasp_Atlas_Downloader' / 'Grasp_Atlas_Downloader'


def main():
    node = shutil.which('node')
    if not node:
        print('Node.js is required for the frontend checks.', file=sys.stderr)
        return 2
    try:
        import pypdf  # noqa: F401 - check the PDF test dependency before running.
    except ImportError:
        print('Install the downloader requirements before running checks:', file=sys.stderr)
        print('python -m pip install -r Grasp_Atlas_Downloader/Grasp_Atlas_Downloader/requirements.txt', file=sys.stderr)
        return 2

    commands = [
        [sys.executable, '-B', '-X', 'utf8', str(ROOT / 'editable-site' / 'build_offline.py')],
        *[[node, str(test)] for test in sorted((ROOT / 'editable-site' / 'tests').glob('*.test.cjs'))],
        [sys.executable, '-B', '-X', 'utf8', '-m', 'unittest', 'discover',
         '-s', str(DOWNLOADER), '-p', 'test_*.py'],
    ]
    for command in commands:
        result = subprocess.run(command, cwd=ROOT)
        if result.returncode:
            return result.returncode
    print('All repository checks passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
