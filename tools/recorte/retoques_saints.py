# Retoques a mano de las fotos de la Tee Saints Mode (modelo de rizos, camiseta negra):
# zonas marcadas sobre la foto recortada por recortar.py. Se corre desde la carpeta de trabajo.
import numpy as np, cv2
from PIL import Image
def hair_clean(a, y_max, band_px=14, strength=1.0, lum_min=70, sat_max=0.38, x_range=None):
    """En la franja del borde del pelo, quita lo que tiene color de pared
    (gris o beige apagado, más claro que el pelo) y suaviza el borde."""
    rgb = a[..., :3]; al = a[..., 3] / 255.0
    H = a.shape[0]
    mx = rgb.max(-1); mn = rgb.min(-1); sat = (mx - mn) / np.maximum(mx, 1)
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    solid = (al > 0.6).astype(np.uint8)
    inner = cv2.erode(solid, np.ones((band_px, band_px), np.uint8))
    band = (al > 0) & (inner == 0)
    band[y_max:] = False
    if x_range:
        band[:, :x_range[0]] = False; band[:, x_range[1]:] = False
    wall = band & (lum > lum_min) & (sat < sat_max)
    w = cv2.GaussianBlur(wall.astype(np.float32), (5, 5), 0)
    al = al * (1 - np.clip(w * 1.6 * strength, 0, 1))
    # borde de pelo un poco más suave (difuminado)
    soft = cv2.GaussianBlur(al, (0, 0), 1.6)
    edge = band & (al > 0)
    al = np.where(np.arange(H)[:, None] < y_max, np.where(edge, np.minimum(al, soft * 1.05), al), al)
    a[..., 3] = np.clip(al * 255, 0, 255)
    return a
def hair_shrink(a, y_max, px=9, x_range=None):
    """Mete el borde del pelo unos píxeles y lo difumina (se va el halo de pared)."""
    al = a[..., 3] / 255.0
    core = cv2.erode((al > 0.5).astype(np.uint8), np.ones((px, px), np.uint8)).astype(np.float32)
    core = cv2.GaussianBlur(core, (0, 0), max(2.0, px * 0.18))
    lim = np.ones_like(al); lim[:y_max] = core[:y_max]
    ramp = np.clip((np.arange(al.shape[0])[:, None] - (y_max - 40)) / 40, 0, 1)  # transición suave hacia abajo
    lim = lim * (1 - ramp) + ramp
    if x_range:
        xs = np.arange(al.shape[1])[None, :].astype(np.float32)
        m = np.clip((xs - x_range[0]) / 18, 0, 1) * np.clip((x_range[1] - xs) / 18, 0, 1)  # transición suave a los lados
        lim = lim * m + (1 - m)
    a[..., 3] = np.minimum(al, lim) * 255
    return a
def load(p): return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32)
def fade(a, f0, f1):
    H = a.shape[0]; y = np.arange(H) / H; k = np.clip((f1 - y) / (f1 - f0), 0, 1); k = k * k * (3 - 2 * k)
    a[..., 3] *= k[:, None]; return a
def done(a, out):
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())
    im.save(out, 'WEBP', quality=90, alpha_quality=95, method=6)
# frente: franja de pared entre la camiseta y el borde derecho
a = load('cut3/negro-chico-frente.webp')
# pared beige debajo de la barbilla (polígono marcado a mano sobre la foto)
poly = np.array([(611, 319), (652, 319), (662, 327), (680, 324), (693, 312), (834, 312), (834, 640), (611, 640)], np.int32)
pm = np.zeros(a.shape[:2], np.uint8); cv2.fillPoly(pm, [poly * 4], 255, lineType=cv2.LINE_AA, shift=2)
pm = cv2.GaussianBlur(pm.astype(np.float32) / 255, (3, 3), 0)
a[..., 3] *= (1 - pm)
# más abajo está su brazo con luz roja: solo se borra lo beige de la pared
low = a[500:, 596:, :3]
beige = (low.max(-1) > 72) & ((low[..., 0] - low[..., 1]) < 50)
beige = cv2.dilate(beige.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
a[500:, 596:, 3] *= (1 - cv2.GaussianBlur(beige, (3, 3), 0))
reg = a[480:1000, 570:700, 3] / 255.0
sm = cv2.GaussianBlur(reg, (0, 0), 3.0)
sm = np.clip((sm - 0.5) * 2.2 + 0.5, 0, 1)  # borde liso, sin picos
a[480:1000, 570:700, 3] = np.minimum(reg, sm) * 255
a = hair_clean(a, 330)
a = hair_shrink(a, 300, 9, (430, 834))
done(fade(a, 0.80, 0.93), 'cut5_negro-chico-frente.webp')
a = load('cut3/negro-chico-espalda.webp')
# hueco entre la mano derecha y la camiseta: se ve la pared → transparente (marcado a mano)
poly = np.array([(642.5, 245.5), (660, 231), (675, 233), (700, 239), (725, 245.5), (750, 253), (775, 263), (798, 273),
                 (798, 280), (775, 270.5), (750, 260), (720, 253), (700, 250), (675, 251), (671, 259), (663, 258.5), (659, 249)])
pm = np.zeros(a.shape[:2], np.uint8); cv2.fillPoly(pm, [np.round(poly * 4).astype(np.int32)], 255, lineType=cv2.LINE_AA, shift=2)
a[..., 3] *= (1 - cv2.GaussianBlur(pm.astype(np.float32) / 255, (3, 3), 0))
# pelo: solo la zona del pelo (no las manos), recorte más adentro
a = hair_clean(a, 165, band_px=28, lum_min=38, sat_max=0.26, x_range=(380, 712))
a = hair_shrink(a, 160, 23, (380, 712))
done(fade(a, 0.84, 0.97), 'cut5_negro-chico-espalda.webp')
