"""Quita el fondo de fotos (modelo con la prenda) y deja un PNG/WebP transparente.
Uso: python3 recortar.py foto1.jpg [foto2.jpg ...] --out carpeta [--max 1400]
Usa el modelo IS-Net (isnet-general-use.onnx) con onnxruntime; el modelo
se guarda en ~/.u2net/ (se descarga de los releases de rembg en GitHub)."""
import argparse, os, sys, urllib.request
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter, ImageOps

BASE = 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/'
# 'general' = IS-Net (cualquier objeto) · 'human' = U2Net de personas · 'persona' = los dos juntos (lo mejor para modelos)
MODELS = {'general': ('isnet-general-use.onnx', 1024, (0.5, 0.5, 0.5), (1.0, 1.0, 1.0)),
          'human': ('u2net_human_seg.onnx', 320, (0.485, 0.456, 0.406), (0.229, 0.224, 0.225))}


def session(kind='general'):
    name = MODELS[kind][0]
    path = os.path.expanduser('~/.u2net/' + name)
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        urllib.request.urlretrieve(BASE + name, path)
    sess = ort.InferenceSession(path, providers=['CPUExecutionProvider'])
    sess.kind = kind
    return sess


class Persona:
    """Borde fino de IS-Net, pero solo donde U2Net ve a la persona
    (así no se cuelan máquinas, sillas ni lámparas pegadas al modelo)."""
    kind = 'persona'

    def __init__(self):
        self.g, self.h = session('general'), session('human')


def mask_for(sess, im):
    if isinstance(sess, Persona):
        import cv2
        g = np.asarray(mask_for(sess.g, im), dtype=np.float32)
        h = np.asarray(mask_for(sess.h, im))
        k = max(9, int(min(im.size) * 0.02) | 1)
        gate = cv2.GaussianBlur(cv2.dilate((h > 90).astype(np.uint8) * 255, np.ones((k, k), np.uint8)), (k, k), 0) / 255.0
        return Image.fromarray(np.clip(g * gate, 0, 255).astype(np.uint8))
    _, size, mean, std = MODELS[getattr(sess, 'kind', 'general')]
    x = np.asarray(im.convert('RGB').resize((size, size), Image.BILINEAR), dtype=np.float32) / 255.0
    x = (x - np.array(mean, dtype=np.float32)) / np.array(std, dtype=np.float32)
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    out = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    out = (out - out.min()) / (out.max() - out.min() + 1e-8)
    m = Image.fromarray((out * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR)
    return m


def defringe(im, m):
    """Quita el halo del fondo en el borde: adelgaza un pelo la máscara y
    rellena el color del borde con el color de adentro de la figura."""
    import cv2
    a = np.asarray(m).astype(np.float32) / 255.0
    a = cv2.erode(a, np.ones((3, 3), np.uint8))
    a = np.clip((a - 0.12) / 0.88, 0, 1)
    img = np.asarray(im).astype(np.float32)
    inner = (a > 0.97).astype(np.float32)
    inner = cv2.erode(inner, np.ones((5, 5), np.uint8))
    k = max(15, int(min(im.size) * 0.02) | 1)
    num = cv2.GaussianBlur(img * inner[..., None], (k, k), 0)
    den = cv2.GaussianBlur(inner, (k, k), 0)[..., None]
    fg = np.where(den > 1e-3, num / np.maximum(den, 1e-3), img)
    band = ((a > 0.01) & (a < 0.97)).astype(np.float32)
    band = cv2.GaussianBlur(cv2.dilate(band, np.ones((5, 5), np.uint8)), (5, 5), 0)[..., None]
    out = img * (1 - band) + fg * band
    rgba = np.dstack([np.clip(out, 0, 255), a * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def keep_largest(m):
    """Deja solo la figura más grande (quita lámparas, objetos sueltos)."""
    import cv2
    a = np.asarray(m)
    n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 100).astype(np.uint8), 8)
    if n <= 2:
        return m
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    keep = cv2.dilate((lab == big).astype(np.uint8), np.ones((9, 9), np.uint8))
    return Image.fromarray((a * keep).astype(np.uint8))


def grabcut(im, m, band=None, iters=5):
    """Afina la máscara con GrabCut usando los colores de la foto: lo que la
    red marcó seguro se queda, lo dudoso del borde se decide por color
    (así salen los pedacitos de fondo pegados al pelo o entre las piernas)."""
    import cv2
    a = np.asarray(m)
    h, w = a.shape
    band = band or max(6, int(min(w, h) * 0.012))
    k = np.ones((band, band), np.uint8)
    gc = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    gc[a > 127] = cv2.GC_PR_FGD
    gc[cv2.erode((a > 200).astype(np.uint8), k) > 0] = cv2.GC_FGD
    gc[cv2.dilate((a > 30).astype(np.uint8), k) == 0] = cv2.GC_BGD
    img = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img, gc, None, bg, fg, iters, cv2.GC_INIT_WITH_MASK)
    hard = np.isin(gc, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)
    # quitar islas sueltas y rellenar huecos chiquitos
    n, lab, st, _ = cv2.connectedComponentsWithStats(hard, 8)
    if n > 2:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        hard = (lab == big).astype(np.uint8)
    hard = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    # borde suave: mezcla con la máscara original solo en la franja del borde
    soft = cv2.GaussianBlur(hard.astype(np.float32), (5, 5), 0)
    edge = cv2.dilate(hard, np.ones((7, 7), np.uint8)) - cv2.erode(hard, np.ones((7, 7), np.uint8))
    out = np.where(edge > 0, np.minimum(soft, a / 255.0 + 0.25), hard.astype(np.float32))
    return Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8))


def cut(sess, path, out_dir, max_side, largest=True, refine=True):
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    m = mask_for(sess, im)
    if largest:
        m = keep_largest(m)
    if refine:
        m = grabcut(im, m)
    # borde limpio: sube el contraste de la máscara y suaviza un pelo
    m = m.point(lambda v: 0 if v < 20 else 255 if v > 235 else int((v - 20) * 255 / 215)).filter(ImageFilter.GaussianBlur(0.6))
    rgba = defringe(im, m)
    bb = m.point(lambda v: 255 if v > 30 else 0).getbbox()
    if bb:
        pad = 12
        rgba = rgba.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))
    name = os.path.splitext(os.path.basename(path))[0]
    dst = os.path.join(out_dir, name + '.webp')
    rgba.save(dst, 'WEBP', quality=85, alpha_quality=95, method=6)
    return dst


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('fotos', nargs='+')
    ap.add_argument('--out', required=True)
    ap.add_argument('--max', type=int, default=1400)
    ap.add_argument('--modelo', choices=list(MODELS) + ['persona'], default='general')
    ap.add_argument('--todo', action='store_true', help='no quitar objetos sueltos (deja todo lo que detecte)')
    ap.add_argument('--sin-afinar', action='store_true', help='no pasar GrabCut por el borde')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    s = Persona() if a.modelo == 'persona' else session(a.modelo)
    for f in a.fotos:
        print(cut(s, f, a.out, a.max, not a.todo, not a.sin_afinar), flush=True)
