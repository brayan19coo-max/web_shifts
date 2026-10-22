import numpy as np, cv2
from PIL import Image
src = Image.open('src/blanco-chico-espalda.png').convert('RGB'); src.thumbnail((1800, 1800), Image.LANCZOS)
base = Image.open('cut6_blanco-chico-espalda.webp')  # brazos ya arreglados
a = np.asarray(base.convert('RGBA')).astype(np.float32); H, W = a.shape[:2]
O = np.asarray(src).astype(np.float32)[335:335 + H, 184:184 + W]
a[..., :3] = O
# el pelo tiene textura (mechones) y la pared es lisa: máscara por textura
L = cv2.cvtColor(O.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
m = cv2.blur(L, (5, 5)); v = np.sqrt(np.maximum(cv2.blur(L * L, (5, 5)) - m * m, 0))
t = (v > 6).astype(np.uint8)
t = cv2.morphologyEx(t, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
t = cv2.morphologyEx(t, cv2.MORPH_OPEN, np.ones((11, 11), np.uint8))
ff = t.copy(); mm = np.zeros((H + 2, W + 2), np.uint8); cv2.floodFill(ff, mm, (0, 0), 2)
t = np.where(ff == 2, 0, 1).astype(np.float32)
t = (cv2.GaussianBlur(t, (0, 0), 6) > 0.55).astype(np.float32)  # contorno redondeado, sin escalones
t = cv2.erode(t, np.ones((5, 5), np.uint8))
hair = cv2.GaussianBlur(t, (0, 0), 2.2); hair = np.clip((hair - 0.5) * 1.6 + 0.5, 0, 1)
# zona del pelo: arriba de las orejas, entre x 290 y 540
zone = np.zeros((H, W), np.float32); zone[0:170, 290:540] = 1; zone = cv2.GaussianBlur(zone, (0, 0), 7)
al = a[..., 3] / 255
al = al * (1 - zone) + hair * zone
# color del borde: quitar el tono de la pared que se mezcla
outside = (al < 0.05).astype(np.float32); k = 41
bg = cv2.GaussianBlur(O * outside[..., None], (k, k), 0) / np.maximum(cv2.GaussianBlur(outside, (k, k), 0), 1e-3)[..., None]
am = np.clip(al, 0.3, 1)[..., None]
F = np.clip((O - (1 - am) * bg) / am, 0, 255)
inner = cv2.erode((al > 0.95).astype(np.uint8), np.ones((15, 15), np.uint8)).astype(np.float32)
num = cv2.GaussianBlur(O * inner[..., None], (31, 31), 0); den = cv2.GaussianBlur(inner, (31, 31), 0)[..., None]
Fin = np.where(den > 1e-3, num / np.maximum(den, 1e-3), F)
edge = ((al > 0.01) & (inner < 0.5)).astype(np.float32)
edge = cv2.GaussianBlur(edge, (7, 7), 0)[..., None] * zone[..., None]
a[..., :3] = O * (1 - edge) + (0.5 * F + 0.5 * Fin) * edge
a[..., 3] = np.clip(al, 0, 1) * 255
im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
im.save('cut7_blanco-chico-espalda.webp', 'WEBP', quality=90, alpha_quality=95, method=6)
out = []
for bg_ in [(28, 28, 30, 255), (255, 63, 164, 255)]:
    b = Image.new('RGBA', im.size, bg_); b.alpha_composite(im); out.append(b.crop((240, 0, 580, 300)).resize((510, 450)))
s = Image.new('RGB', (1030, 450), 'white'); s.paste(out[0].convert('RGB'), (0, 0)); s.paste(out[1].convert('RGB'), (520, 0)); s.save('back7.png')
