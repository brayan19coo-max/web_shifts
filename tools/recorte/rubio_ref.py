import numpy as np, cv2
from PIL import Image
# recorte de referencia que mandó Brayan (sobre fondo blanco) → máscara suave de la cabeza
ref = np.asarray(Image.open('/root/.claude/uploads/ac68cbb4-450e-549c-a256-eaef9aac43a9/e34175da-image.png').convert('RGB')).astype(np.float32)
ref = cv2.resize(ref, None, fx=1.05, fy=1.05, interpolation=cv2.INTER_CUBIC)
base = Image.open('cut7_blanco-chico-espalda.webp')
a = np.asarray(base.convert('RGBA')).astype(np.float32); H, W = a.shape[:2]
src = Image.open('src/blanco-chico-espalda.png').convert('RGB'); src.thumbnail((1800, 1800), Image.LANCZOS)
O = np.asarray(src).astype(np.float32)[335:335 + H, 184:184 + W]
# poner la referencia en coordenadas del recorte
RX, RY = 408 - 184, 332 - 335
Rf = np.full((H, W, 3), 255, np.float32)
rh, rw = ref.shape[:2]
y0, x0 = max(0, RY), max(0, RX); y1, x1 = min(H, RY + rh), min(W, RX + rw)
Rf[y0:y1, x0:x1] = ref[y0 - RY:y1 - RY, x0 - RX:x1 - RX]
# color de la persona (F) = color de la foto, extendido desde lo opaco hacia el borde
dist = (255 - Rf).max(-1)
opaque = (dist > 70).astype(np.float32)
opaque = cv2.erode(opaque, np.ones((5, 5), np.uint8))
F = O.copy()
for k in (9, 21, 41, 81):
    num = cv2.GaussianBlur(O * opaque[..., None], (k, k), 0); den = cv2.GaussianBlur(opaque, (k, k), 0)[..., None]
    est = num / np.maximum(den, 1e-3)
    F = np.where((opaque[..., None] < 0.5) & (den > 0.02), est, F) if k == 9 else np.where((F == O) & (opaque[..., None] < 0.5) & (den > 0.002), est, F)
# alfa: ref = a*F + (1-a)*255  →  a = (255 - ref) / (255 - F)
den = np.maximum(255 - F, 25)
al_ref = np.clip(((255 - Rf) / den).mean(-1), 0, 1)
al_ref[dist < 8] = 0  # cuadritos del fondo de la captura
al_ref = cv2.GaussianBlur(al_ref, (3, 3), 0)
# zona: cabeza y cuello (arriba de la camiseta)
zone = np.zeros((H, W), np.float32); zone[0:255, 250:580] = 1; zone = cv2.GaussianBlur(zone, (0, 0), 6)
al = a[..., 3] / 255
al_new = al * (1 - zone) + al_ref * zone
# color: en lo semitransparente se usa F (sin pared)
mix = (np.clip(1 - al_ref, 0, 1) * 1.5).clip(0, 1)[..., None] * zone[..., None]
a[..., :3] = O * (1 - mix) + F * mix
a[..., 3] = np.clip(al_new, 0, 1) * 255
im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
im.save('cut8_blanco-chico-espalda.webp', 'WEBP', quality=90, alpha_quality=95, method=6)
out = []
for bg in [(255, 255, 255, 255), (28, 28, 30, 255), (255, 63, 164, 255)]:
    b = Image.new('RGBA', im.size, bg); b.alpha_composite(im); out.append(b.crop((220, 0, 580, 360)).resize((420, 420)))
s = Image.new('RGB', (1280, 420), 'white')
for k, o in enumerate(out): s.paste(o.convert('RGB'), (k * 430, 0))
s.save('back8.png')
