"""Arma las tiras WebP de los juegos (assets/images/juegos/3d/) con los
cuadros que grabó capture_games.py.
Uso: python3 build_game_sheets.py <carpeta_frames> <carpeta_salida>

- Todas las animaciones de la misma vista ('front' o 'side') comparten
  encuadre, así Swaggy no cambia de tamaño ni salta al cambiar de animación.
- Los pies quedan siempre en el borde de abajo del cuadro."""
from PIL import Image
import json, os, sys

FRAMES, OUT = sys.argv[1], sys.argv[2]
TH = 220  # alto de cada cuadro
os.makedirs(OUT, exist_ok=True)
names = sorted(n for n in os.listdir(FRAMES) if os.path.isdir(os.path.join(FRAMES, n)))
view = {n: json.load(open(os.path.join(FRAMES, n, 'info.json')))['view'] for n in names}
pngs = {n: sorted(f for f in os.listdir(os.path.join(FRAMES, n)) if f.endswith('.png')) for n in names}

# encuadre común por vista
boxes = {}
for n in names:
    for f in pngs[n]:
        bb = Image.open(os.path.join(FRAMES, n, f)).getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
        if not bb:
            continue
        b = boxes.get(view[n])
        boxes[view[n]] = bb if b is None else (min(b[0], bb[0]), min(b[1], bb[1]), max(b[2], bb[2]), max(b[3], bb[3]))
for v, b in boxes.items():
    boxes[v] = (b[0] - 4, b[1] - 4, b[2] + 4, b[3] + 2)

man = {'fps': 12, 'anims': {}}
for n in names:
    box = boxes[view[n]]
    W, H = box[2] - box[0], box[3] - box[1]
    TW = round(W * TH / H)
    sheet = Image.new('RGBA', (TW * len(pngs[n]), TH), (0, 0, 0, 0))
    for i, f in enumerate(pngs[n]):
        im = Image.open(os.path.join(FRAMES, n, f)).convert('RGBA').crop(box).resize((TW, TH), Image.LANCZOS)
        sheet.paste(im, (i * TW, 0))
    sheet.save(os.path.join(OUT, f'{n}.webp'), 'WEBP', quality=80, alpha_quality=90, method=6)
    man['anims'][n] = {'frames': len(pngs[n]), 'w': TW, 'h': TH}
json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print(json.dumps(man['anims']))
