import numpy as np, cv2, sys
from PIL import Image
def run(name, off, hair_box, arm_boxes, erode_px=15):
    src = Image.open(f'src/{name}.png').convert('RGB'); src.thumbnail((1800, 1800), Image.LANCZOS)
    a = np.asarray(Image.open(f'cut3/{name}.webp').convert('RGBA')).astype(np.float32)
    H, W = a.shape[:2]; ox, oy = off
    O = np.asarray(src).astype(np.float32)[oy:oy + H, ox:ox + W]
    a[..., :3] = O
    R, G, B = O[..., 0], O[..., 1], O[..., 2]
    mx = O.max(-1); sat = (mx - O.min(-1)) / np.maximum(mx, 1)
    al = a[..., 3] / 255
    # brazos/manos: recuperar la piel que el recorte se comió
    for (x0, y0, x1, y1) in arm_boxes:
        z = np.zeros((H, W), np.float32); z[y0:y1, x0:x1] = 1
        skin = ((R - B) > 38) & (sat > 0.28) & (mx > 95)
        skin = cv2.morphologyEx(skin.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        skin = cv2.morphologyEx(skin, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8)).astype(np.float32)
        # solo la piel pegada al cuerpo
        n, lab = cv2.connectedComponents(((skin > 0) | (al > 0.5)).astype(np.uint8), 8)
        main = lab == lab[H // 2, W // 2]
        skin = skin * main
        skin = cv2.GaussianBlur(skin, (3, 3), 0)
        al = np.maximum(al, skin * z)
    # pelo: borde metido y difuminado (sale el halo de la pared)
    x0, y0, x1, y1 = hair_box
    zone = np.zeros((H, W), np.float32); zone[y0:y1, x0:x1] = 1; zone = cv2.GaussianBlur(zone, (0, 0), 6)
    core = cv2.erode((al > 0.5).astype(np.uint8), np.ones((erode_px, erode_px), np.uint8)).astype(np.float32)
    core = cv2.GaussianBlur(core, (0, 0), 2.4)
    hair = np.minimum(al, np.clip(core * 1.2, 0, 1))
    al = al * (1 - zone) + hair * zone
    a[..., 3] = np.clip(al, 0, 1) * 255
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    im.save(f'cut6_{name}.webp', 'WEBP', quality=90, alpha_quality=95, method=6)
    return im
f = run('blanco-chico-frente', (211, 272), (330, 0, 570, 150), [(585, 895, 690, 1350), (80, 880, 230, 1300)])
b = run('blanco-chico-espalda', (184, 335), (285, 0, 535, 175), [(590, 905, 700, 1310), (80, 880, 160, 1300)])
ims = []
for im in (f, b):
    for bg in [(28, 28, 30, 255), (255, 63, 164, 255)]:
        c = Image.new('RGBA', im.size, bg); c.alpha_composite(im); c.thumbnail((380, 820)); ims.append(c)
s = Image.new('RGB', (sum(i.width + 8 for i in ims), 820), 'white'); x = 0
for i in ims: s.paste(i.convert('RGB'), (x, 0)); x += i.width + 8
s.save('rubios.png')
for nm, im, box in [('h1', f, (300, 0, 620, 260)), ('h2', b, (260, 0, 560, 260)), ('a1', f, (520, 850, 706, 1360)), ('a2', b, (520, 850, 775, 1330))]:
    c = Image.new('RGBA', im.size, (255, 63, 164, 255)); c.alpha_composite(im); c.crop(box).convert('RGB').save(f'z_{nm}.png')
