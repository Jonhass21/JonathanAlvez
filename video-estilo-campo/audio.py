"""Genera la banda sonora del video (música + efectos) sincronizada con index.html.

Todo es sintetizado (sin samples con derechos), 120 BPM en La menor.
Uso: python3 audio.py audio.wav
"""
import sys
import wave
import numpy as np

SR = 44100
DUR = 36.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

# ---- tiempos (mismos que window.TIMELINE en index.html) ----
QUERY = 'la mejor carne de Posadas'
TYPE_START, TYPE_STEP = 0.3, 0.092
TAP1, RES, TAP2 = 3.10, 3.60, 6.05
S2, S3, S4, S5, S6, S7, S8 = 6.5, 10.0, 14.0, 18.0, 24.0, 27.5, 31.5
BEAT = 0.5  # 120 BPM

L = np.zeros(N)
R = np.zeros(N)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - max(pan, 0))
    R[i:i + len(sig)] += sig * (1 + min(pan, 0))


def env(n, a=0.005, d=0.2, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * t / d)
    return e


def tt(d):
    return np.arange(int(d * SR)) / SR


def lowpass(x, cutoff):
    # filtro de un polo, suficiente para suavizar
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------- instrumentos ----------------
def kick():
    t = tt(0.45)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) * 1.0 + rng.normal(0, 1, len(t)) * np.exp(-t * 300) * 0.15


def clap():
    t = tt(0.3)
    n = rng.normal(0, 1, len(t))
    n = n - lowpass(n, 900)  # quita graves
    e = np.exp(-t * 18) + 0.6 * np.exp(-((t - 0.012) ** 2) / 1e-5) + 0.5 * np.exp(-((t - 0.024) ** 2) / 1e-5)
    return n * e * 0.55


def hat(open_=False):
    t = tt(0.25 if open_ else 0.06)
    n = rng.normal(0, 1, len(t))
    n = n - lowpass(n, 6000)
    return n * np.exp(-t * (14 if open_ else 70)) * 0.35


def bass(m, d):
    t = tt(d)
    f = note(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sign(np.sin(2 * np.pi * f * t))
    e = np.minimum(1, t / 0.005) * np.exp(-t * 3.5)
    e[-200:] *= np.linspace(1, 0, 200)
    return s * e * 0.42


def pluck(m, d=0.22):
    t = tt(d)
    f = note(m)
    s = sum((0.6 ** k) * np.sin(2 * np.pi * f * (k + 1) * t) for k in range(5))
    return s * np.minimum(1, t / 0.002) * np.exp(-t * 16) * 0.2


def pad(ms, d, bright=1.0):
    t = tt(d)
    s = np.zeros(len(t))
    for m in ms:
        for det in (-0.12, 0.0, 0.12):
            f = note(m) * 2 ** (det / 12)
            s += np.sin(2 * np.pi * f * t) + 0.25 * bright * np.sin(2 * np.pi * 2 * f * t)
    e = np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.3)
    return s * e * 0.035


def keyclick():
    t = tt(0.04)
    n = rng.normal(0, 1, len(t))
    return (n - lowpass(n, 2500)) * np.exp(-t * 160) * 0.5 + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 250) * 0.15


def tap():
    t = tt(0.08)
    return np.sin(2 * np.pi * (900 - 4000 * t) * t) * np.exp(-t * 60) * 0.5


def whoosh(d=0.45, up=True):
    t = tt(d)
    n = rng.normal(0, 1, len(t))
    shape = np.sin(np.pi * t / d) ** 2
    cut = (500 + 5000 * (t / d)) if up else (5000 - 4500 * (t / d))
    # filtro variable aproximado con dos pasadas
    y = np.zeros_like(n)
    acc = 0.0
    for i in range(len(n)):
        a = np.exp(-2 * np.pi * cut[i] / SR)
        acc = (1 - a) * n[i] + a * acc
        y[i] = acc
    return y * shape * 1.2


def impact():
    t = tt(1.2)
    f = 38 + 70 * np.exp(-t * 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    n = rng.normal(0, 1, len(t))
    return np.sin(ph) * np.exp(-t * 3.2) * 0.9 + lowpass(n, 1500) * np.exp(-t * 9) * 0.8


def ding(m=88):
    t = tt(0.9)
    f = note(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 5) * 0.22


def riser(d):
    t = tt(d)
    n = rng.normal(0, 1, len(t))
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / d) ** 2) / SR)
    return (n * 0.25 + tone * 0.35) * (t / d) ** 2.2


def tick():
    t = tt(0.03)
    return np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 200) * 0.25


# ---------------- música ----------------
# progresión Am - F - C - G (un compás = 2 s)
CHORDS = [(57, [69, 72, 76]), (53, [65, 69, 72]), (48, [64, 67, 72]), (55, [62, 67, 71])]

# intro (buscador): pad suave + pulso tenue
for bar in range(4):
    root, tones = CHORDS[bar % 4]
    t0 = bar * 2.0 - 0.0
    if t0 < S2:
        add(pad(tones, min(2.2, S2 - t0 + 0.2), bright=0.4), t0, 0.9)
for b in np.arange(0, S2 - 0.5, BEAT):
    add(hat(), b + 0.25, 0.25)
add(riser(S2 - 4.9), 4.9, 0.55)

# cuerpo (desde el drop en S2)
END = DUR - 0.6
step = 0
b = S2
while b < END:
    beat_i = int(round((b - S2) / BEAT))
    bar = beat_i // 4
    root, tones = CHORDS[bar % 4]
    breakdown = S7 <= b < S7 + 2.0  # respiro en ubicación
    if not breakdown:
        add(kick(), b, 0.9)
    if beat_i % 2 == 1:
        add(clap(), b, 0.75 if not breakdown else 0.4, pan=0.05)
    add(hat(open_=(beat_i % 4 == 3)), b + 0.25, 0.55, pan=-0.2)
    add(hat(), b + 0.125, 0.25, pan=0.25)
    add(hat(), b + 0.375, 0.25, pan=0.25)
    # bajo en corcheas a contratiempo
    add(bass(root - 12, 0.22), b + 0.25, 1.0)
    if beat_i % 4 == 0:
        add(bass(root - 12, 0.2), b, 0.6)
        add(pad(tones, 2.05), b, 1.0 if not breakdown else 1.6)
    # arpegio en semicorcheas
    arp = tones + [tones[1] + 12]
    for k in range(4):
        add(pluck(arp[(beat_i * 4 + k) % 4] + (12 if bar % 2 else 0)), b + k * 0.125, 0.8, pan=(0.35 if k % 2 else -0.35))
    b += BEAT
# acorde final
add(pad([57, 64, 69, 72], 2.5, bright=1.2), END - 1.5, 2.0)
add(impact(), S8, 0.6)

# ---------------- efectos ----------------
for i, ch in enumerate(QUERY):
    add(keyclick(), TYPE_START + i * TYPE_STEP, 0.55 if ch != ' ' else 0.4, pan=rng.uniform(-0.3, 0.3))
add(tap(), TAP1, 0.8)
add(whoosh(0.4), TAP1 + 0.08, 0.35)
add(ding(84), RES + 0.05, 0.9)
add(ding(91), RES + 0.2, 0.6)
add(tap(), TAP2, 0.8)
add(whoosh(0.55), S2 - 0.1, 0.8)
add(impact(), S2 + 0.12, 0.85)
add(ding(96), S2 + 1.3, 0.4)          # pill Posadas
add(whoosh(0.45), S3 - 0.1, 0.8)
add(whoosh(0.35), S3 + 0.4, 0.45)
add(whoosh(0.35, up=False), S3 + 0.6, 0.45)
add(impact(), S3 + 1.1, 0.45)          # etiqueta efectivo
add(whoosh(0.45), S4 - 0.1, 0.8)
for k in range(8):
    add(tick(), S4 + 0.45 + k * 0.07, 0.8)
add(impact(), S4 + 1.0, 0.5)           # "2 KG"
add(impact(), S4 + 1.75, 1.0)          # sello descuentos
add(whoosh(0.45), S5 - 0.1, 0.8)
for i in range(1, 4):
    add(whoosh(0.35), S5 + 0.3 + i * 1.45 - 0.05, 0.6)
add(whoosh(0.4, up=False), S6 - 0.1, 0.7)
for i in range(5):
    add(tap(), S6 + 0.7 + i * 0.1, 0.35)
add(impact(), S6 + 1.9, 0.45)          # ASADO
add(whoosh(0.5), S7 - 0.1, 0.8)
add(impact(), S7 + 1.55, 0.8)          # cae el pin
add(ding(88), S7 + 1.6, 0.6)
add(whoosh(0.5), S8 - 0.1, 0.9)
add(impact(), S8 + 0.6, 0.6)           # TE ESPERAMOS
add(tap(), S8 + 3.2, 0.9)
add(ding(93), S8 + 3.25, 0.7)

# ---------------- mezcla ----------------
mix = np.stack([L, R], axis=1)
fade = np.ones(N)
fi = int((DUR - 0.8) * SR)
fade[fi:] = np.linspace(1, 0, N - fi)
mix *= fade[:, None]
mix = np.tanh(mix * 1.1) * 0.89  # limitador suave
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'audio.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('peak', float(np.abs(mix).max()))
