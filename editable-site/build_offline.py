"""Rebuild the root offline entry point from editable-site/dist (no npm required)."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'editable-site' / 'dist'


def render(dist=DIST, overrides=None):
    """Render from source, optionally staging replacements without touching disk."""
    overrides = overrides or {}
    def source(name):
        return overrides[name] if name in overrides else (dist / name).read_text(encoding='utf-8')
    page = source('index.html')
    page = page.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + source('style.css') + '\n</style>')
    scripts = []
    for name in re.findall(r'<script src="([^"]+)" defer></script>', page):
        page = page.replace(f'<script src="{name}" defer></script>', '')
        if name == '../../library.js':
            scripts.append('<script src="library.js"></script>')
        else:
            body = source(name).replace('</script', '<\\/script')
            scripts.append(f'<script data-bundle="{name}">\n{body}\n</script>')
    page = page.replace('</body>', '\n'.join(scripts) + '\n</body>')
    return re.sub(r'(?m)^[ \t]+$', '', page)


def build():
    (ROOT / 'index.html').write_text(render(), encoding='utf-8')


if __name__ == '__main__':
    build()
