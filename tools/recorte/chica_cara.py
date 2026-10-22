import numpy as np, cv2
from PIL import Image
src = Image.open('src/blanco-chica-espalda.png').convert('RGB'); src.thumbnail((1800, 1800), Image.LANCZOS)
OX, OY = 69, 433
a = np.asarray(Image.open('cut5_blanco-chica-espalda.webp').convert('RGBA')).astype(np.float32); H, W = a.shape[:2]
O = np.asarray(src).astype(np.float32)[OY:OY + H, OX:OX + W]
# perfil trazado a mano sobre la foto original: pelo, frente, pestañas, nariz, labios y barbilla
prof = [(395, 40), (410, 44), (425, 50), (440, 60), (455, 70), (468, 80), (480, 90), (489, 101), (493, 115), (494, 135), (491, 155),
        (486, 170), (475, 182), (465, 192), (457, 200), (456, 212), (453, 225), (449, 235), (450, 245), (455, 252), (459, 262),
        (456, 270), (448, 275), (438, 280), (432, 288), (430, 298), (426, 310), (418, 318), (405, 326), (395, 332)]
poly = np.array(prof + [(380, 332), (380, 40)], np.float32)
pm = np.zeros((H, W), np.uint8); cv2.fillPoly(pm, [np.round(poly * 4).astype(np.int32)], 255, lineType=cv2.LINE_AA, shift=2)
pm = cv2.GaussianBlur(pm.astype(np.float32) / 255, (0, 0), 1.1)
zone = np.zeros((H, W), np.float32); zone[30:335, 392:W] = 1
zone = cv2.GaussianBlur(zone, (0, 0), 2)
al = a[..., 3] / 255
al = al * (1 - zone) + pm * zone
# color del borde sin el tono de la pared
inner = cv2.erode((al > 0.95).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(np.float32)
num = cv2.GaussianBlur(O * inner[..., None], (15, 15), 0); den = cv2.GaussianBlur(inner, (15, 15), 0)[..., None]
Fin = np.where(den > 1e-3, num / np.maximum(den, 1e-3), O)
edge = ((al > 0.01) & (al < 0.97)).astype(np.float32)
edge = cv2.GaussianBlur(cv2.dilate(edge, np.ones((3, 3), np.uint8)), (3, 3), 0)[..., None] * zone[..., None]
a[..., :3] = O * (1 - edge) + Fin * edge
a[..., 3] = np.clip(al, 0, 1) * 255
im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
im.save('cut6_blanco-chica-espalda.webp', 'WEBP', quality=90, alpha_quality=95, method=6)
out = []
for bg in [(28, 28, 30, 255), (255, 63, 164, 255)]:
    b = Image.new('RGBA', im.size, bg); b.alpha_composite(im); out.append(b.crop((300, 20, 540, 360)).resize((360, 510)))
s = Image.new('RGB', (730, 510), 'white'); s.paste(out[0].convert('RGB'), (0, 0)); s.paste(out[1].convert('RGB'), (370, 0)); s.save('cara.png')
