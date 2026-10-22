import numpy as np, cv2
from PIL import Image
a = np.asarray(Image.open('cut4_blanco-chica-frente.webp').convert('RGBA')).astype(np.float32)
rgb = a[..., :3]; mx = rgb.max(-1); mn = rgb.min(-1); sat = (mx - mn) / np.maximum(mx, 1)
lum = rgb @ np.array([0.299, 0.587, 0.114]); R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
def kill(box, m):
    x0, y0, x1, y1 = box; z = np.zeros(m.shape, bool); z[y0:y1, x0:x1] = True
    k = cv2.dilate((m & z).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
    a[..., 3] *= 1 - cv2.GaussianBlur(k, (3, 3), 0)
# banquito negro junto a la pierna y detrás de la mano
neutral_dark = (mx < 70) & ((B - R) < 18)
kill((50, 1085, 200, 1350), neutral_dark)
# pared beige entre las piernas
kill((515, 1270, 605, 1384), (lum > 80) & (sat < 0.36))
kill((535, 1295, 592, 1384), (B < R) & (lum < 110))  # pared en sombra (malva oscuro)
# borde liso: hombro izquierdo y lado de la pierna (sin picos)
def smooth(box, sig):
    x0, y0, x1, y1 = box
    reg = a[y0:y1, x0:x1, 3] / 255
    sm = cv2.GaussianBlur(reg, (0, 0), sig); sm = np.clip((sm - 0.5) * 2.4 + 0.5, 0, 1)
    a[y0:y1, x0:x1, 3] = np.minimum(reg, sm) * 255
smooth((0, 320, 160, 900), 3.5)
smooth((90, 1080, 210, 1360), 3.0)
smooth((480, 1220, 620, 1386), 2.5)
# halo de pared del hombro: meter el borde 2 px
z = a[320:900, 0:160, 3] / 255
a[320:900, 0:160, 3] = np.minimum(z, cv2.erode(z, np.ones((5, 5), np.uint8))) * 255
im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
im.save('cut5_blanco-chica-frente.webp', 'WEBP', quality=90, alpha_quality=95, method=6)
b = Image.new('RGBA', im.size, (28, 28, 30, 255)); b.alpha_composite(im)
crops = [b.crop((0, 300, 300, 700)), b.crop((0, 1050, 300, 1400)), b.crop((420, 1180, 700, 1460))]
W = sum(c.width + 10 for c in crops); s = Image.new('RGB', (W, 400), 'white'); x = 0
for c in crops: s.paste(c.convert('RGB'), (x, 0)); x += c.width + 10
s.save('chica_fix.png')
