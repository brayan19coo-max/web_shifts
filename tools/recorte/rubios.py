import numpy as np, cv2, sys
from PIL import Image
def run(name, off, hair_box, arm_boxes, erode_px=5, hair_sigma=2.0, hair_gamma=1.0, arm_fix=None, arm_poly=None, hair_matte=False):
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
    # brazo: rellenar huecos internos y borde liso (sin picos)
    if arm_fix:
        x0, y0, x1, y1 = arm_fix
        reg = (al[y0:y1, x0:x1] > 0.5).astype(np.uint8)
        ff = reg.copy(); m2 = np.zeros((reg.shape[0] + 2, reg.shape[1] + 2), np.uint8)
        for sx in (reg.shape[1] - 1,):
            for sy in range(0, reg.shape[0], 20):
                if ff[sy, sx] == 0: cv2.floodFill(ff, m2, (sx, sy), 2)
        reg = np.where(ff == 2, 0, 1).astype(np.uint8)  # todo lo que no conecta con el fondo de la derecha es cuerpo
        reg = cv2.morphologyEx(reg, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        sm = cv2.GaussianBlur(reg.astype(np.float32), (0, 0), 2.2)
        al[y0:y1, x0:x1] = np.clip((sm - 0.5) * 2.4 + 0.5, 0, 1)
    # brazo trazado a mano sobre la foto original (borde liso, sin huecos)
    if arm_poly is not None:
        x0, y0, x1, y1 = arm_poly[0]
        pm = np.zeros((H, W), np.uint8)
        cv2.fillPoly(pm, [np.array(arm_poly[1], np.int32) * 4], 255, lineType=cv2.LINE_AA, shift=2)
        pm = cv2.GaussianBlur(pm.astype(np.float32) / 255, (3, 3), 0)
        z = np.zeros((H, W), bool); z[y0:y1, x0:x1] = True
        al = np.where(z, np.maximum(pm, np.where(np.arange(W)[None, :] < arm_poly[2], al, 0)), al)
    # pelo: misma forma del recorte, borde apenas metido y difuminado; el color del borde
    # se limpia restando el color de la pared que se mezcla (descontaminación)
    x0, y0, x1, y1 = hair_box
    zone = np.zeros((H, W), np.float32); zone[y0:y1, x0:x1] = 1; zone = cv2.GaussianBlur(zone, (0, 0), 6)
    hard = (al > 0.5).astype(np.uint8)
    hard = cv2.morphologyEx(hard, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))  # quita los picos sueltos
    core = cv2.erode(hard, np.ones((erode_px, erode_px), np.uint8)).astype(np.float32)
    hair = np.clip(cv2.GaussianBlur(core, (0, 0), hair_sigma) * 1.1, 0, 1)
    hair = np.minimum(hair, al + 0.15) ** hair_gamma  # gamma > 1: la orilla clarita se vuelve más transparente
    # color de la pared alrededor
    outside = (al < 0.05).astype(np.float32)
    k = 41
    bg = cv2.GaussianBlur(O * outside[..., None], (k, k), 0) / np.maximum(cv2.GaussianBlur(outside, (k, k), 0), 1e-3)[..., None]
    am = np.clip(hair, 0.25, 1)[..., None]
    F = np.clip((O - (1 - am) * bg) / am, 0, 255)
    edge = ((hair > 0.01) & (hair < 0.98)).astype(np.float32)
    edge = cv2.GaussianBlur(cv2.dilate(edge, np.ones((5, 5), np.uint8)), (5, 5), 0)[..., None] * zone[..., None]
    a[..., :3] = O * (1 - edge) + F * edge
    al = al * (1 - zone) + hair * zone
    a[..., 3] = np.clip(al, 0, 1) * 255
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    im.save(f'cut6_{name}.webp', 'WEBP', quality=90, alpha_quality=95, method=6)
    return im
f = run('blanco-chico-frente', (211, 272), (330, 0, 570, 150), [(585, 895, 690, 1350), (80, 880, 230, 1300)], 
        arm_poly=((585, 880, 706, 1360), [(593, 884), (632, 884), (633, 950), (634, 1000), (636, 1050), (641, 1100), (646, 1150), (655, 1200), (657, 1250), (652, 1282), (642, 1302), (622, 1322), (600, 1325), (592, 1310), (597, 1250), (596, 1180), (593, 1050)], 593), erode_px=11, hair_sigma=3.0, hair_gamma=1.8)
b = run('blanco-chico-espalda', (184, 335), (285, 0, 535, 175), [(590, 905, 700, 1310), (80, 880, 160, 1300)], erode_px=5, hair_sigma=1.8)
ims = []
for im in (f, b):
    for bg in [(28, 28, 30, 255), (255, 63, 164, 255)]:
        c = Image.new('RGBA', im.size, bg); c.alpha_composite(im); c.thumbnail((380, 820)); ims.append(c)
s = Image.new('RGB', (sum(i.width + 8 for i in ims), 820), 'white'); x = 0
for i in ims: s.paste(i.convert('RGB'), (x, 0)); x += i.width + 8
s.save('rubios.png')
for nm, im, box in [('h1', f, (300, 0, 620, 260)), ('h2', b, (260, 0, 560, 260)), ('a1', f, (520, 850, 706, 1360)), ('a2', b, (520, 850, 775, 1330))]:
    c = Image.new('RGBA', im.size, (255, 63, 164, 255)); c.alpha_composite(im); c.crop(box).convert('RGB').save(f'z_{nm}.png')
