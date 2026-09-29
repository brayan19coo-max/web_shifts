#!/usr/bin/env python3
"""
Anti-caché: le pone a cada archivo JS, CSS y de sonido una "huella"
(hash de su contenido). Así, cuando un archivo cambia, el navegador
descarga la versión nueva en vez de mezclarla con copias viejas.

Uso (desde la raíz del proyecto), después de cambiar código:
    python3 tools/version.py
"""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / 'index.html'


def fingerprint(path: pathlib.Path) -> str:
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]


def version_sounds() -> int:
    """Pone huella a las rutas de sonido en js/config.js (assets/sounds/x.mp3?v=...)."""
    config = ROOT / 'js' / 'config.js'
    text = config.read_text(encoding='utf-8')
    count = 0

    def stamp(match: re.Match) -> str:
        nonlocal count
        path = ROOT / match.group(1)
        if not path.exists():
            return match.group(0)
        count += 1
        return f"'{match.group(1)}?v={fingerprint(path)}'"

    # Solo en líneas de código (no en los comentarios de ejemplo)
    text = re.sub(r"^(?!\s*\*)(.*)$", lambda line: re.sub(
        r"'(assets/sounds/[\w.-]+\.(?:mp3|ogg|wav))(?:\?v=\w+)?'", stamp, line.group(0)), text, flags=re.M)
    config.write_text(text, encoding='utf-8')
    return count


def main() -> None:
    sounds = version_sounds()  # primero: cambia config.js, que luego recibe su propia huella
    html = INDEX.read_text(encoding='utf-8')

    # 1) Mapa de importación: cada módulo JS con su huella
    modules = sorted(p for p in (ROOT / 'js').rglob('*.js'))
    imports = {
        f'./{p.relative_to(ROOT).as_posix()}': f'./{p.relative_to(ROOT).as_posix()}?v={fingerprint(p)}'
        for p in modules
    }
    block = (
        '<!-- importmap:start (generado por tools/version.py, no editar a mano) -->\n'
        '  <script type="importmap">\n'
        + json.dumps({'imports': imports}, indent=2, ensure_ascii=False)
        .replace('\n', '\n  ')
        .join(['  ', '\n'])
        + '  </script>\n'
        '  <!-- importmap:end -->'
    )
    if '<!-- importmap:start' in html:
        html = re.sub(r'<!-- importmap:start.*?<!-- importmap:end -->', block, html, flags=re.S)
    else:
        html = html.replace('<script type="module"', block + '\n  <script type="module"', 1)

    # 2) Punto de entrada y hojas de estilo
    main_js = ROOT / 'js' / 'main.js'
    html = re.sub(r'src="js/main\.js(\?v=\w+)?"', f'src="js/main.js?v={fingerprint(main_js)}"', html)
    html = re.sub(
        r'href="(css/[\w-]+\.css)(\?v=\w+)?"',
        lambda m: f'href="{m.group(1)}?v={fingerprint(ROOT / m.group(1))}"',
        html,
    )

    INDEX.write_text(html, encoding='utf-8')
    css_count = len(re.findall(r'css/[\w-]+\.css', html))
    print(f'OK: {len(imports)} módulos JS, {css_count} CSS y {sounds} sonidos con huella.')


if __name__ == '__main__':
    main()
