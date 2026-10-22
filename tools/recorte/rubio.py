import numpy as np, cv2
from PIL import Image
a = np.asarray(Image.open('cut3/blanco-chico-espalda.webp').convert('RGBA')).astype(np.float32)
H, W = a.shape[:2]
rgb = a[..., :3]; mx = rgb.max(-1); sat = (mx - rgb.min(-1)) / np.maximum(mx, 1)
al = a[..., 3] / 255
x0, y0, x1, y1 = 270, 0, 545, 175  # cabeza (pelo, sin las orejas)
zone = np.zeros((H, W), np.float32); zone[y0:y1, x0:x1] = 1
zone = cv2.GaussianBlur(zone, (0, 0), 6)
# en el borde del pelo, lo que no es rubio (gris de la pared) se va
inner = cv2.erode((al > 0.6).astype(np.uint8), np.ones((22, 22), np.uint8))
band = (al > 0) & (inner == 0)
wall = band & (sat < 0.30)
w = cv2.GaussianBlur(cv2.dilate(wall.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32), (5, 5), 0)
al2 = al * (1 - np.clip(w * 1.5, 0, 1))
# meter el borde y difuminar suave
core = cv2.erode((al2 > 0.5).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
core = cv2.GaussianBlur(core, (0, 0), 2.6)
al2 = np.minimum(al2, np.clip(core * 1.15, 0, 1))
al = al * (1 - zone) + al2 * zone
a[..., 3] = al * 255
im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
im.save('cut5_blanco-chico-espalda.webp', 'WEBP', quality=90, alpha_quality=95, method=6)
for nm, bg in [('rubio_dark.png', (28, 28, 30, 255)), ('rubio_pink.png', (255, 63, 164, 255))]:
    b = Image.new('RGBA', im.size, bg); b.alpha_composite(im); b.crop((240, 0, 580, 330)).resize((510, 495)).convert('RGB').save(nm)
