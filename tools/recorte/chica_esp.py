import numpy as np, cv2
from PIL import Image
src = Image.open('src/blanco-chica-espalda.png').convert('RGB'); src.thumbnail((1800, 1800), Image.LANCZOS)
OX, OY = 69, 433
a = np.asarray(Image.open('cut4_blanco-chica-espalda.webp').convert('RGBA')).astype(np.float32)
H, W = a.shape[:2]
O = np.asarray(src).astype(np.float32)[OY:OY + H, OX:OX + W]
a[..., :3] = O  # color original (sin retoques de borde)
R, G, B = O[..., 0], O[..., 1], O[..., 2]
mx = O.max(-1); mn = O.min(-1); sat = (mx - mn) / np.maximum(mx, 1); lum = O @ np.array([0.299, 0.587, 0.114])
al = a[..., 3] / 255
def region(box):
    z = np.zeros((H, W), bool); x0, y0, x1, y1 = box; z[y0:y1, x0:x1] = True; return z
def smooth_in(box, sig, m):
    x0, y0, x1, y1 = box
    reg = m[y0:y1, x0:x1]
    sm = cv2.GaussianBlur(reg, (0, 0), sig); sm = np.clip((sm - 0.5) * 2.4 + 0.5, 0, 1)
    m[y0:y1, x0:x1] = sm
# 1) cara: recuperar pestañas, nariz y labios (perfil marcado a mano)
face = np.array([(380, 160), (466, 160), (468, 196), (462, 207), (460, 217), (452, 223), (461, 236), (468, 250), (466, 260), (459, 267), (448, 271), (440, 274), (438, 283), (433, 293), (428, 306), (418, 322), (380, 322)], np.int32)
fm = np.zeros((H, W), np.uint8); cv2.fillPoly(fm, [face], 1)
fm = cv2.GaussianBlur(fm.astype(np.float32), (3, 3), 0)
al = np.maximum(al, fm)
# 2) lado izquierdo de la camiseta: borde por brillo (tela clara vs pared/máquina)
bx = (0, 360, 125, 880); z = region(bx)
shirt = np.clip((lum - 130) / 25, 0, 1)
inner = cv2.erode((al > 0.5).astype(np.uint8), np.ones((25, 25), np.uint8)).astype(np.float32)  # estampado y tela de adentro se quedan
al = np.where(z, np.maximum(shirt * (al > 0.02) + shirt * (lum > 150), inner).clip(0, 1), al)
smooth_in(bx, 2.0, al)
# 3) pierna izquierda: todo lo que no es pared gris se queda (jean y flores)
bx = (25, 985, 125, 1367); z = region(bx)
wall = (lum > 70) & (lum < 135) & (sat < 0.14)
keep = (~wall).astype(np.float32)
keep = cv2.morphologyEx(keep, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
al = np.where(z, keep, al)
smooth_in(bx, 2.0, al)
# 4) pierna derecha: fuera la máquina de arcade, solo queda el jean
bx = (492, 1045, W, H); z = region(bx)
denim = ((B - R) > 20) & (lum < 120)
denim = cv2.morphologyEx(denim.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
# solo lo pegado al cuerpo (el jean de la izquierda continúa)
n, lab = cv2.connectedComponents(denim, 8)
body = lab == lab[1200, 494] if lab[1200, 494] else denim > 0
al = np.where(z, np.minimum(al, body.astype(np.float32)), al)
smooth_in(bx, 2.5, al)
# quitar puntitos sueltos
n, lab, st, _ = cv2.connectedComponentsWithStats((al > 0.3).astype(np.uint8), 8)
big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
al = al * cv2.dilate((lab == big).astype(np.uint8), np.ones((5, 5), np.uint8))
a[..., 3] = np.clip(al, 0, 1) * 255
im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
im.save('cut5_blanco-chica-espalda.webp', 'WEBP', quality=90, alpha_quality=95, method=6)
b = Image.new('RGBA', im.size, (255, 63, 164, 255)); b.alpha_composite(im)
crops = [b.crop((360, 160, 500, 330)).resize((280, 340)), b.crop((0, 360, 160, 880)).resize((160, 520)), b.crop((0, 960, 160, 1367)).resize((160, 407)), b.crop((420, 960, 594, 1367))]
s = Image.new('RGB', (sum(c.width + 10 for c in crops), 520), 'white'); x = 0
for c in crops: s.paste(c.convert('RGB'), (x, 0)); x += c.width + 10
s.save('esp_fix.png')
