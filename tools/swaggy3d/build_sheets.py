"""Arma las tiras WebP de assets/images/swaggy/3d/ con los cuadros grabados.
Uso: python3 build_sheets.py <carpeta_frames> <carpeta_salida>"""
from PIL import Image
import os, json, sys

FRAMES, OUT = sys.argv[1], sys.argv[2]
names = sorted(os.listdir(FRAMES))
# encuadre común (unión de todos los cuadros + margen) para que no salte al cambiar de acción
box = None
for n in names:
    for f in os.listdir(f'{FRAMES}/{n}'):
        bb = Image.open(f'{FRAMES}/{n}/{f}').getchannel('A').point(lambda a: 255 if a > 10 else 0).getbbox()
        if bb:
            box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3]))
box = (box[0] - 6, box[1] - 6, box[2] + 6, box[3] + 6)
W, H = box[2] - box[0], box[3] - box[1]
TH = 260
TW = round(W * TH / H)
man = {'frame': [TW, TH], 'fps': 12, 'anims': {}}
for n in names:
    fs = sorted(os.listdir(f'{FRAMES}/{n}'))
    if n == 'quieto':
        fs = fs[:24]
    sheet = Image.new('RGBA', (TW * len(fs), TH), (0, 0, 0, 0))
    for i, f in enumerate(fs):
        sheet.paste(Image.open(f'{FRAMES}/{n}/{f}').convert('RGBA').crop(box).resize((TW, TH), Image.LANCZOS), (i * TW, 0))
    sheet.save(f'{OUT}/{n}.webp', 'WEBP', quality=70, alpha_quality=80, method=6)
    man['anims'][n] = len(fs)
json.dump(man, open(f'{OUT}/manifest.json', 'w'), indent=1)
print(man)
