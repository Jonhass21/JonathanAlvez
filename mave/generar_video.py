"""MAVE Pastelería — stop-motion (paper cut-out) reel, 1080x1920.

Renders unique frames at 12 fps (stop-motion cadence), each held so the
final file plays at 30 fps (Instagram-friendly).
"""
import math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

W, H = 1080, 1920
FPS_ANIM = 12
OUT = sys.argv[1]
LOGO = sys.argv[2]
FONTS = sys.argv[3]
os.makedirs(OUT, exist_ok=True)

# ---------- palette (from the logo) ----------
CREAM = (250, 244, 235)
BURG = (108, 7, 31)
BURG2 = (138, 28, 52)
PINK = (236, 182, 186)
PINK_D = (214, 140, 150)
BLUSH = (246, 216, 214)
SPONGE = (243, 218, 176)
SPONGE_D = (226, 192, 142)
WHITE = (255, 250, 244)
STRAW = (200, 40, 58)
STRAW_D = (160, 24, 44)
LEAF = (98, 140, 86)
GOLD = (201, 164, 106)
CHOC = (92, 50, 40)
TAN = (214, 166, 104)
TAN_D = (184, 132, 74)

SS = 2  # supersampling for sprites


# ---------- helpers ----------
def canvas(w, h):
    return Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))


def finish(img):
    w, h = img.size
    return img.resize((w // SS, h // SS), Image.LANCZOS)


def S(v):
    return int(round(v * SS))


def wobble_poly(pts, amt=1.5, seed=0):
    """hand-cut edge: tiny random offsets on each vertex."""
    r = random.Random(seed)
    return [(x + r.uniform(-amt, amt) * SS, y + r.uniform(-amt, amt) * SS) for x, y in pts]


def ellipse_pts(cx, cy, rx, ry, n=48, a0=0, a1=2 * math.pi):
    return [(cx + rx * math.cos(a0 + (a1 - a0) * i / (n - 1)), cy + ry * math.sin(a0 + (a1 - a0) * i / (n - 1))) for i in range(n)]


def rrect_pts(x0, y0, x1, y1, r, n=8):
    pts = []
    for cx, cy, a in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
        for i in range(n + 1):
            t = math.radians(a + 90 * i / n)
            pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    return pts


def poly(d, pts, fill, seed=0, amt=1.2):
    d.polygon(wobble_poly([(x * SS, y * SS) for x, y in pts], amt, seed), fill=fill)


# paper grain applied to sprites
_rng = np.random.default_rng(7)


def paper_grain(img, strength=10):
    a = np.asarray(img).astype(np.float32)
    n = _rng.normal(0, 1, a.shape[:2]).astype(np.float32)
    n = np.asarray(Image.fromarray(((n * 40) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) - 128
    for c in range(3):
        a[..., c] = (a[..., c] + n / 40 * strength).clip(0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def sprite(img):
    return paper_grain(finish(img))


# ---------- sprite library ----------
def make_stand():
    w, h = 640, 230
    im = canvas(w, h); d = ImageDraw.Draw(im)
    poly(d, [(250, 60), (390, 60), (370, 180), (270, 180)], GOLD, 1)          # stem
    poly(d, ellipse_pts(320, 200, 150, 24), GOLD, 2)                         # foot
    poly(d, ellipse_pts(320, 205, 120, 12), (184, 146, 90), 3)
    poly(d, ellipse_pts(320, 44, 310, 40), (232, 212, 178), 4)               # plate
    poly(d, ellipse_pts(320, 36, 300, 32), WHITE, 5)
    return sprite(im)


def make_layer(seed, top_cream=True):
    w, h = 520, 120
    im = canvas(w, h); d = ImageDraw.Draw(im)
    poly(d, rrect_pts(4, 6, w - 4, h - 4, 18), SPONGE, seed)
    poly(d, rrect_pts(4, h - 34, w - 4, h - 4, 14), SPONGE_D, seed + 1)
    if top_cream:
        poly(d, rrect_pts(0, 0, w, 30, 15), PINK, seed + 2)
    r = random.Random(seed)
    for _ in range(26):  # crumb dots
        x, y = r.uniform(30, w - 30), r.uniform(40, h - 40)
        d.ellipse([S(x - 3), S(y - 3), S(x + 3), S(y + 3)], fill=SPONGE_D)
    return sprite(im)


def make_frosting(drip):
    """cream top with drips; drip in [0,1] grows the drips."""
    w, h = 560, 200
    im = canvas(w, h); d = ImageDraw.Draw(im)
    poly(d, rrect_pts(10, 10, w - 10, 64, 26), WHITE, 11, 0.8)
    r = random.Random(3)
    x = 40
    while x < w - 40:
        L = r.uniform(30, 120) * drip
        rw = r.uniform(14, 22)
        if L > 4:
            d.rounded_rectangle([S(x - rw), S(40), S(x + rw), S(50 + L)], radius=S(rw), fill=WHITE)
        x += r.uniform(46, 64)
    # little heart sprinkles
    for i in range(10):
        xx, yy = r.uniform(40, w - 40), r.uniform(20, 46)
        d.ellipse([S(xx - 4), S(yy - 2), S(xx + 4), S(yy + 2)], fill=[BURG2, PINK_D, GOLD][i % 3])
    return sprite(im)


def make_strawberry(seed=0):
    w, h = 130, 150
    im = canvas(w, h); d = ImageDraw.Draw(im)
    body = []
    for i in range(60):
        t = 2 * math.pi * i / 60
        x = 65 + 52 * math.sin(t) * (1 - 0.35 * max(0, math.cos(t)))
        y = 82 - 58 * math.cos(t) * (1.05 if math.cos(t) < 0 else 0.75)
        body.append((x, y))
    poly(d, body, STRAW, seed)
    poly(d, [(x + 6, y + 4) for x, y in body[18:42]], STRAW_D, seed + 1, 0.5)
    r = random.Random(seed)
    for _ in range(14):
        x, y = r.uniform(32, 98), r.uniform(50, 120)
        d.ellipse([S(x - 2.5), S(y - 4), S(x + 2.5), S(y + 4)], fill=(250, 214, 140))
    for a in (-60, -20, 20, 60):  # leaves
        t = math.radians(a)
        tip = (65 + 42 * math.sin(t), 40 - 16 * math.cos(t))
        poly(d, [(55, 40), tip, (75, 40)], LEAF, seed + 3, 0.5)
    poly(d, [(61, 40), (63, 10), (69, 10), (69, 40)], LEAF, seed + 4, 0.3)
    return sprite(im)


def make_cherry():
    w, h = 120, 170
    im = canvas(w, h); d = ImageDraw.Draw(im)
    d.line([S(60), S(80), S(70), S(30), S(92), S(8)], fill=LEAF, width=S(7), joint="curve")
    poly(d, ellipse_pts(58, 115, 46, 44), BURG2, 21)
    poly(d, ellipse_pts(44, 100, 12, 9), (190, 80, 100), 22, 0.3)
    return sprite(im)


def make_spark(col=GOLD, size=60):
    im = canvas(size, size); d = ImageDraw.Draw(im)
    c = size / 2; r = size / 2 - 2; q = r * 0.22
    pts = [(c, c - r), (c + q, c - q), (c + r, c), (c + q, c + q), (c, c + r), (c - q, c + q), (c - r, c), (c - q, c - q)]
    poly(d, pts, col, 31, 0.4)
    return sprite(im)


def make_heart(col=BURG, size=70, seed=41):
    im = canvas(size, size); d = ImageDraw.Draw(im)
    pts = []
    for i in range(60):
        t = 2 * math.pi * i / 60
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((size / 2 + x * size / 36, size / 2 + 2 + y * size / 36))
    poly(d, pts, col, seed, 0.4)
    return sprite(im)


def make_macaron(col, col_d, seed):
    w, h = 300, 220
    im = canvas(w, h); d = ImageDraw.Draw(im)
    poly(d, ellipse_pts(150, 150, 130, 50, a0=0, a1=math.pi) + [(20, 150), (280, 150)], col, seed)  # bottom shell
    poly(d, rrect_pts(26, 136, 274, 154, 8), col_d, seed + 1)  # bottom foot
    poly(d, rrect_pts(24, 108, 276, 136, 13), WHITE, seed + 2)  # filling
    poly(d, rrect_pts(26, 92, 274, 112, 8), col_d, seed + 3)  # top foot
    poly(d, ellipse_pts(150, 96, 132, 80, a0=math.pi, a1=2 * math.pi), col, seed + 4)  # top dome
    poly(d, ellipse_pts(110, 50, 34, 10), (255, 255, 255, 90), seed + 5, 0.3)
    return sprite(im)


def make_cupcake():
    w, h = 300, 380
    im = canvas(w, h); d = ImageDraw.Draw(im)
    poly(d, [(50, 220), (250, 220), (226, 370), (74, 370)], BURG2, 51)  # wrapper
    for i in range(1, 8):
        xt = 50 + 200 * i / 8; xb = 74 + 152 * i / 8
        d.line([S(xt), S(222), S(xb), S(368)], fill=BURG, width=S(5))
    for k, (cy, rx, ry) in enumerate(((210, 128, 40), (172, 108, 38), (138, 84, 34), (108, 56, 30))):
        poly(d, ellipse_pts(150, cy, rx, ry), PINK if k % 2 == 0 else BLUSH, 52 + k)
    poly(d, [(150, 50), (186, 104), (114, 104)], PINK, 57, 0.6)
    poly(d, ellipse_pts(150, 52, 26, 25), STRAW, 58)
    d.line([S(150), S(30), S(160), S(6)], fill=LEAF, width=S(5))
    r = random.Random(5)
    for _ in range(14):
        x, y = r.uniform(70, 230), r.uniform(120, 220)
        d.rounded_rectangle([S(x - 6), S(y - 2), S(x + 6), S(y + 2)], radius=S(2), fill=[GOLD, WHITE, BURG2][_ % 3])
    return sprite(im)


def make_tart():
    w, h = 340, 240
    im = canvas(w, h); d = ImageDraw.Draw(im)
    scal = []
    for i in range(23):
        x = 20 + 300 * i / 22
        scal.append((x, 120 + (10 if i % 2 else 0)))
    poly(d, scal + [(296, 220), (44, 220)], TAN, 61)  # shell
    for i in range(12):
        x = 40 + 260 * i / 11
        d.line([S(x), S(140), S(x + (x - 170) * 0.05), S(214)], fill=TAN_D, width=S(4))
    poly(d, ellipse_pts(170, 118, 150, 26), (252, 236, 200), 62)  # custard
    st = make_strawberry(9).resize((86, 100), Image.LANCZOS).rotate(180)
    st2 = st.rotate(15, expand=True)
    small = finish(im)
    for x, y, s in ((60, 50, st), (128, 32, st2), (196, 38, st), (250, 56, st2)):
        small.alpha_composite(s, (x - 30, y))
    d2 = ImageDraw.Draw(small)
    for x in (90, 160, 230):  # blueberries
        d2.ellipse([x, 100, x + 30, 128], fill=(70, 60, 110))
    return paper_grain(small, 6)


def make_cookie():
    w, h = 280, 280
    im = canvas(w, h); d = ImageDraw.Draw(im)
    poly(d, ellipse_pts(140, 140, 128, 126, n=40), TAN, 71, 2.5)
    poly(d, ellipse_pts(140, 140, 112, 110, n=40), (226, 182, 120), 72, 2)
    r = random.Random(4)
    for _ in range(11):
        a = r.uniform(0, 6.28); rr = r.uniform(0, 90)
        x, y = 140 + rr * math.cos(a), 140 + rr * math.sin(a)
        poly(d, ellipse_pts(x, y, 14, 11, n=10), CHOC, _ + 80, 1.5)
    return sprite(im)


def make_text(txt, font, size, col, spacing=0):
    f = ImageFont.truetype(font, size * SS)
    if spacing:
        widths = [f.getbbox(ch)[2] for ch in txt]
        tw = sum(widths) + spacing * SS * (len(txt) - 1)
    else:
        tw = f.getbbox(txt)[2]
    th = int(size * 1.5) * SS
    im = Image.new("RGBA", (int(tw) + 20 * SS, th), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if spacing:
        x = 10 * SS
        for ch, cw in zip(txt, widths):
            d.text((x, size * 0.2 * SS), ch, font=f, fill=col)
            x += cw + spacing * SS
    else:
        d.text((10 * SS, size * 0.2 * SS), txt, font=f, fill=col)
    return finish(im)


# ---------- logo letters from the real logo ----------
def logo_letters():
    src = np.asarray(Image.open(LOGO).convert("RGB")).astype(np.float32)
    lum = src.mean(2)
    bg, ink = 243.0, 52.0
    alpha = ((bg - lum) / (bg - ink)).clip(0, 1)
    alpha[alpha < 0.04] = 0
    yy, xx = np.mgrid[0:src.shape[0], 0:src.shape[1]]

    def cut(x0, x1, y0, y1, mask=None):
        a = alpha.copy()
        if mask is not None:
            a = a * mask
        a = a[y0:y1, x0:x1]
        img = np.zeros(a.shape + (4,), np.uint8)
        img[..., 0], img[..., 1], img[..., 2] = BURG
        img[..., 3] = (a * 255).astype(np.uint8)
        return Image.fromarray(img, "RGBA"), x0, y0

    split = 775 + 79 * (yy - 372) / 166.0
    big = []
    big.append(cut(415, 616, 366, 544))
    big.append(cut(650, 822, 366, 544, (xx < split).astype(np.float32)))
    big.append(cut(808, 978, 366, 544, (xx >= split).astype(np.float32)))
    big.append(cut(1005, 1125, 366, 544))
    small = []
    for x0, x1 in [(564, 585), (606, 634), (656, 678), (700, 724), (748, 768), (792, 811), (835, 855), (880, 902), (926, 933), (953, 981)]:
        small.append(cut(x0 - 4, x1 + 4, 592, 640))
    return big, small


# ---------- frame compositing ----------
def make_bg(seed):
    r = np.random.default_rng(seed)
    base = np.zeros((H, W, 3), np.float32); base[:] = CREAM
    n = r.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    n = np.asarray(Image.fromarray(((n * 30) + 128).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) - 128
    fib = r.normal(0, 1, (H, W)).astype(np.float32)
    fib = np.asarray(Image.fromarray(((fib * 30) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(1))).astype(np.float32) - 128
    # soft vignette
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    v = 1 - 0.07 * (((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2)
    out = (base + (n * 0.12 + fib * 0.06)[..., None]) * v[..., None]
    return Image.fromarray(out.clip(0, 255).astype(np.uint8)).convert("RGBA")


BGS = [make_bg(s) for s in range(3)]


class Shot:
    def __init__(self, frame_idx):
        self.f = frame_idx
        self.rng = random.Random(frame_idx * 7919)
        self.layers = []

    def put(self, spr, cx, cy, rot=0.0, scale=1.0, jitter=True, shadow=True, alpha=1.0):
        """place a sprite by its center; jitter = stop-motion boil."""
        if spr is None or scale <= 0.01 or alpha <= 0:
            return
        if jitter:
            cx += self.rng.uniform(-2.2, 2.2)
            cy += self.rng.uniform(-2.2, 2.2)
            rot += self.rng.uniform(-0.9, 0.9)
        s = spr
        if abs(scale - 1) > 1e-3:
            s = s.resize((max(1, int(s.width * scale)), max(1, int(s.height * scale))), Image.LANCZOS)
        if abs(rot) > 0.05:
            s = s.rotate(rot, resample=Image.BICUBIC, expand=True)
        if alpha < 1:
            a = s.getchannel("A").point(lambda p: int(p * alpha)); s = s.copy(); s.putalpha(a)
        self.layers.append((s, cx, cy, shadow))

    def render(self):
        frame = BGS[self.f % 3].copy()
        # light flicker like a real stop-motion set
        fl = 1 + self.rng.uniform(-0.012, 0.012)
        for s, cx, cy, shadow in self.layers:
            x, y = int(cx - s.width / 2), int(cy - s.height / 2)
            if shadow:
                a = s.getchannel("A").filter(ImageFilter.GaussianBlur(5))
                sh = Image.new("RGBA", s.size, (70, 30, 30, 0)); sh.putalpha(a.point(lambda p: int(p * 0.28)))
                frame.alpha_composite(sh, (x + 6, y + 9)) if 0 <= x + 6 and 0 <= y + 9 else _comp(frame, sh, x + 6, y + 9)
            _comp(frame, s, x, y)
        out = frame.convert("RGB")
        if abs(fl - 1) > 1e-4:
            out = Image.eval(out, lambda p: min(255, int(p * fl)))
        return out


def _comp(frame, s, x, y):
    # alpha_composite that tolerates off-canvas positions
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + s.width), min(H, y + s.height)
    if x1 <= x0 or y1 <= y0:
        return
    frame.alpha_composite(s.crop((x0 - x, y0 - y, x1 - x, y1 - y)), (x0, y0))


# ---------- motion helpers (all in animation frames @12fps) ----------
def stepped(f, start, keys):
    """keys: list of values per frame after start; returns None before start."""
    i = f - start
    if i < 0:
        return None
    return keys[min(i, len(keys) - 1)]


DROP = [-520, -260, -60, 18, -6, 0]          # y offset: falls, squashes, settles
POP = [0.35, 0.85, 1.15, 0.94, 1.03, 1.0]    # scale pop


def drop_y(f, start, y):
    v = stepped(f, start, DROP)
    return None if v is None else y + v


def pop_s(f, start):
    return stepped(f, start, POP)


# ---------- build assets ----------
print("building sprites...")
stand = make_stand()
layers = [make_layer(100), make_layer(200), make_layer(300, top_cream=False)]
frost = [make_frosting(t) for t in (0.15, 0.4, 0.7, 1.0)]
straws = [make_strawberry(s) for s in (1, 2, 3)]
cherry = make_cherry()
spark = make_spark()
spark_p = make_spark(PINK_D, 46)
heart = make_heart()
heart_p = make_heart(PINK_D, 50, 43)
mac_p = make_macaron(PINK, PINK_D, 90)
mac_b = make_macaron(BURG2, BURG, 95)
cupcake = make_cupcake()
tart = make_tart()
cookie = make_cookie()
big, small = logo_letters()
ital = os.path.join(FONTS, "CormorantItalic.ttf")
t_hecho = make_text("hecho a mano", ital, 96, BURG)
t_amor = make_text("con mucho amor", ital, 96, BURG)
t_tag = make_text("bienvenidos a nuestro mundo dulce", ital, 64, BURG)

# ---------- timeline ----------
TOTAL = 12 * 14  # 14 s
CX = W // 2


def scene_cake(sh, f, exit_f=None):
    """f: frame. exit: cake slides off to the left in steps."""
    dx = 0
    if exit_f is not None and f >= exit_f:
        dx = [-40, -160, -420, -800, -1300][min(f - exit_f, 4)]
        if f - exit_f > 4:
            return
    base_y = 1300
    K = 1.28
    P = lambda yy: base_y + (yy - base_y) * K
    _put = sh.put
    def put(spr, x, y, rot=0.0, scale=1.0):
        _put(spr, CX + (x - CX) * K, P(y) if y is not None else None, rot=rot, scale=scale * K)
    sy = stepped(f, 0, [600, 300, 80, -10, 0])
    if sy is not None:
        put(stand, CX + dx, base_y + 70 + sy)
    tops = [base_y - 60, base_y - 165, base_y - 270]
    for i, st in enumerate((5, 9, 13)):
        y = drop_y(f, st, tops[i])
        if y is not None:
            put(layers[i], CX + dx, y)
    fi = f - 18
    if fi >= 0:
        fy = tops[2] + 22
        if fi < 6:
            put(frost[0], CX + dx, drop_y(f, 18, fy))
        else:
            put(frost[min((fi - 6) // 2 + 1, 3)], CX + dx, fy)
    for i, (st, x, rot) in enumerate(((28, -150, -14), (31, 150, 12), (34, -40, -4))):
        y = drop_y(f, st, tops[2] - 110)
        if y is not None:
            put(straws[i], CX + x + dx, y, rot=rot)
    y = drop_y(f, 38, tops[2] - 175)
    if y is not None:
        put(cherry, CX + 70 + dx, y, rot=8)
    # sparkles blink around the finished cake
    if 42 <= f and (exit_f is None or f < exit_f):
        for j, (x, yy) in enumerate(((-430, 880), (430, 800), (-420, 1520), (440, 1420), (-440, 1150))):
            if (f + j) % 4 < 2:
                sh.put(spark if j % 2 == 0 else spark_p, CX + x, yy, rot=(f * 13 + j * 40) % 90, scale=1.0 if (f + j) % 4 == 0 else 0.7)


def text_line(sh, f, start, spr, y):
    v = stepped(f, start, [0.0, 0.5, 1.0])
    if v is not None:
        sh.put(spr, CX, y + (1 - v) * 30, alpha=v, shadow=False)


def scene_treats(sh, f, start, exit_f):
    items = [(mac_p, -255, 700), (cupcake, 255, 690), (tart, -255, 1220), (cookie, 255, 1210), (mac_b, 0, 960)]
    for i, (spr, x, y) in enumerate(items):
        s = pop_s(f, start + i * 3)
        if s is None:
            continue
        rot = 0
        # little hops once on stage
        k = f - (start + i * 3)
        hop = 0
        if k > 6 and f < exit_f:
            hop = [-0, -24, -10, 0, 0, 0, 0, 0][(k + i * 2) % 8]
            rot = [0, -4, 3, 0, 0, 0, 0, 0][(k + i * 2) % 8]
        if f >= exit_f:
            e = f - exit_f - i
            if e >= 0:
                if e > 4:
                    continue
                ang = math.atan2(y - 960, x if x else 1)
                dist = [30, 160, 480, 900, 1400][e]
                x += math.cos(ang) * dist; y += math.sin(ang) * dist
                rot += e * 25
        sh.put(spr, CX + x, y + hop, rot=rot, scale=s * (1.15 if spr is mac_b else 1.3))


def scene_logo(sh, f, start):
    # MAVE: letter positions as in the logo, scaled
    sc = 1.2
    lx0 = 415 + (1125 - 415) / 2  # logo center x in source
    ly0 = 455
    for i, (img, x0, y0) in enumerate(big):
        st = start + i * 3
        cx = CX + (x0 + img.width / 2 - lx0) * sc
        cy = 860 + (y0 + img.height / 2 - ly0) * sc
        y = drop_y(f, st, cy)
        if y is None:
            continue
        spr = img.resize((int(img.width * sc), int(img.height * sc)), Image.LANCZOS)
        rot = stepped(f, st, [-20, -10, 6, -2, 0]) or 0
        sh.put(spr, cx, y, rot=rot)
    s0 = start + 14
    for i, (img, x0, y0) in enumerate(small):
        s = pop_s(f, s0 + i)
        if s is None:
            continue
        cx = CX + (x0 + img.width / 2 - lx0) * sc
        cy = 860 + (y0 + img.height / 2 - ly0) * sc
        spr = img.resize((int(img.width * sc), int(img.height * sc)), Image.LANCZOS)
        sh.put(spr, cx, cy, scale=s, shadow=False)
    # heart + tagline
    s = pop_s(f, s0 + 12)
    if s is not None:
        sh.put(heart, CX, 1170, scale=s, rot=-6 if (f // 3) % 2 else 6)
    text_line(sh, f, s0 + 15, t_tag, 1290)
    # little treats around the logo, peeking in
    for j, (spr, x, y, sc2, st) in enumerate(((straws[0], -360, 520, 0.9, s0 + 4), (mac_p, 330, 560, 0.6, s0 + 6),
                                             (cherry, 370, 1500, 0.9, s0 + 8), (mac_b, -340, 1510, 0.58, s0 + 10))):
        p = pop_s(f, st)
        if p is not None:
            wig = [-5, 5][(f // 3 + j) % 2]
            sh.put(spr, CX + x, y, scale=p * sc2, rot=wig)


def build(f):
    sh = Shot(f)
    # 0.0–5.0 s : the cake is built piece by piece
    if f < 66:
        scene_cake(sh, f, exit_f=60)
    # captions over the cake
    if 44 <= f < 60:
        text_line(sh, f, 44, t_hecho, 380)
        text_line(sh, f, 50, t_amor, 490)
    # 5.0–9.0 s : treats pop in, hop, then fly out
    if 60 <= f < 112:
        scene_treats(sh, f, 62, 100)
    # 9.0–14 s : logo
    if f >= 108:
        scene_logo(sh, f, 108)
    return sh.render()


frames = range(TOTAL)
only = os.environ.get("ONLY")
if only:
    frames = [int(x) for x in only.split(",")]
for f in frames:
    build(f).save(os.path.join(OUT, f"f{f:04d}.png"))
    if f % 24 == 0:
        print("frame", f)
print("done")
