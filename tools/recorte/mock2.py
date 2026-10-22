import cv2, numpy as np
from PIL import Image
def cut(src, dst, white, thr, eps=0.0025):
    im = np.asarray(Image.open(src).convert('RGB'))
    g = cv2.cvtColor(im, cv2.COLOR_RGB2GRAY)
    gb = cv2.GaussianBlur(g, (5, 5), 0)
    m = ((gb > thr) if white else (gb < thr)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    m = (lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((31, 31), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    ap = cv2.approxPolyDP(c, eps * cv2.arcLength(c, True), True)
    S = 4; h, w = m.shape
    big = np.zeros((h * S, w * S), np.uint8)
    cv2.fillPoly(big, [(ap * S).astype(np.int32)], 255, lineType=cv2.LINE_AA)
    a = cv2.resize(big, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    # meter el borde unos píxeles para no arrastrar el brillo del fondo
    px = max(3, int(min(w, h) * 0.004))
    a = cv2.erode(a, np.ones((px, px), np.uint8))
    # en la franja del borde, lo que no sea del color de la camiseta se va
    inner = cv2.erode((a > 0.99).astype(np.uint8), np.ones((px * 3, px * 3), np.uint8))
    band = (a > 0) & (inner == 0)
    ok = (g > thr - 25) if white else (g < thr + 30)
    a = np.where(band & ~ok, 0, a)
    if white:
        # manchas de fondo pegadas al borde (cuello, puntas de manga): todo lo
        # que no es blanco y toca el borde se va; el estampado no toca el borde
        dk = ((g < 205) & (a > 0)).astype(np.uint8)
        n2, lab2 = cv2.connectedComponents(dk, connectivity=8)
        touch = np.unique(lab2[band & (dk > 0)])
        kill = np.isin(lab2, touch[touch > 0])
        kill = cv2.dilate(kill.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        a = np.where(kill, 0, a)
    a = cv2.GaussianBlur(a, (3, 3), 0)
    # color del borde: el de la camiseta
    rgb = im.astype(np.float32)
    if not white:
        rgb = np.where(band[..., None], np.minimum(rgb, 22), rgb)
    else:
        # franja ancha del borde pintada de blanco de camiseta (se van piquitos grises del cuello y la manga)
        wide = (a > 0) & (cv2.erode((a > 0.99).astype(np.uint8), np.ones((px * 6, px * 6), np.uint8)) == 0)
        # en la franja, lo oscuro (motas del fondo) se vuelve transparente y el borde se alisa
        dark = wide & (g < 215)
        dark = cv2.dilate(dark.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        a = np.where(dark & wide, 0, a)
        sm = cv2.morphologyEx((a > 0.5).astype(np.uint8), cv2.MORPH_OPEN, np.ones((px * 3, px * 3), np.uint8))
        sm = cv2.morphologyEx(sm, cv2.MORPH_CLOSE, np.ones((px * 3, px * 3), np.uint8))
        a = cv2.GaussianBlur(sm.astype(np.float32), (5, 5), 0)
        k = cv2.GaussianBlur(wide.astype(np.float32), (9, 9), 0)[..., None]
        rgb = rgb * (1 - k) + np.maximum(rgb, 244) * k
    x, y, bw, bh = cv2.boundingRect((a > 0.5).astype(np.uint8))
    rgba = np.dstack([rgb, a * 255])[max(0, y - 6):y + bh + 6, max(0, x - 6):x + bw + 6]
    out = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA'); out.thumbnail((1400, 1400), Image.LANCZOS)
    out.save(dst, 'WEBP', quality=88, alpha_quality=95, method=6)
for v in ['frente', 'espalda']:
    cut(f'src/blanco-{v}.png', f'cut4_blanco-{v}.webp', True, 226, 0.004)
    cut(f'src/negro-{v}.png', f'cut4_negro-{v}.webp', False, 24)
