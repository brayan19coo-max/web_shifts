"""Arma el sticker de SOLD OUT (assets/images/sold-out-sticker.svg) con la letra
graffiti Sedgwick Ave Display (Google Fonts, licencia OFL), convertida a trazos.
Uso: python3 sold_out_sticker.py SedgwickAveDisplay-Regular.ttf salida.svg"""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
import sys
F = TTFont(sys.argv[1]); gs = F.getGlyphSet(); cmap = F.getBestCmap(); upm = F['head'].unitsPerEm
def glyph(ch):
    n = cmap[ord(ch)]; p = SVGPathPen(gs); gs[n].draw(p); b = BoundsPen(gs); gs[n].draw(b)
    return p.getCommands(), gs[n].width, b.bounds
# letra, rotación, escala, subir/bajar (en em), espacio extra
SOLD = [('S', -9, 1.08, 0.02, -0.06), ('O', 6, 0.96, -0.06, -0.10), ('L', -5, 1.04, 0.04, -0.08), ('D', 9, 1.1, -0.04, 0)]
OUT = [('O', -7, 1.0, 0.0, -0.10), ('U', 5, 0.94, 0.07, -0.08), ('T', -10, 1.12, -0.05, 0)]
def line(spec, x0, y0, size):
    out = []; x = x0
    for ch, rot, sc, dy, sp in spec:
        d, adv, (xmin, ymin, xmax, ymax) = glyph(ch)
        s = size * sc / upm
        cx, cy = (xmin + xmax) / 2, (ymin + ymax) / 2
        tx = x - xmin * s; ty = y0 - dy * size
        out.append(f'<path transform="translate({tx:.1f} {ty:.1f}) rotate({rot} {cx*s:.1f} {-cy*s:.1f}) scale({s:.5f} {-s:.5f})" d="{d}"/>')
        x += (xmax - xmin) * s + sp * size
    return out, x
size = 200
a, xa = line(SOLD, 80, 270, size)
b, xb = line(OUT, 210, 445, size)
W = int(max(xa, xb) + 90); H = 540
letters = '\n'.join(a + b)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<title>Sold out</title>
<defs>
  <g id="t">{letters}</g>
  <filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000" flood-opacity="0.45"/></filter>
</defs>
<!-- papel del sticker (borde blanco recortado) -->
<g filter="url(#sh)"><use href="#t" fill="#fff" stroke="#fff" stroke-width="225" stroke-linejoin="round"/></g>
<!-- contorno negro grueso -->
<use href="#t" fill="#0a0a0a" stroke="#0a0a0a" stroke-width="140" stroke-linejoin="round"/>
<!-- sombra 3D de las letras -->
<use href="#t" transform="translate(8 10)" fill="#e3151a" stroke="#e3151a" stroke-width="22" stroke-linejoin="round"/>
<!-- letras -->
<use href="#t" fill="#fff" stroke="#0a0a0a" stroke-width="12" stroke-linejoin="round"/>
</svg>'''
open(sys.argv[2], 'w').write(svg); print(W, H, len(svg))
