"""Efectos de sonido sutiles, sintetizados (sin librerías de stock). Salida: public/sfx/*.wav (mono 48 kHz)."""
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
rng = np.random.default_rng(11)


def save(name, x, peak_db=-6.0):
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    sf.write(f"public/sfx/{name}.wav", x.astype(np.float32), SR, subtype="PCM_16")


def tt(d):
    return np.arange(int(d * SR)) / SR


def room(x, dur=1.6, decay=0.45, mix=0.35):
    n = int(dur * SR)
    ir = sosfilt(butter(2, 4000, "low", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-np.arange(n) / SR / decay)
    ir /= np.sqrt((ir ** 2).sum())
    wet = fftconvolve(x, ir)
    out = np.zeros(len(wet))
    out[: len(x)] += x
    return (1 - mix) * out + mix * wet


def swept_noise(d, f0, f1, shape):
    """Ruido filtrado por un pasabanda que barre de f0 a f1 (por bloques)."""
    n = int(d * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    blk = 1024
    for i in range(0, n, blk):
        p = i / n
        fc = f0 * (f1 / f0) ** p
        sos = butter(2, [fc * 0.6, min(fc * 1.6, 20000)], "band", fs=SR, output="sos")
        seg = noise[max(0, i - 2048): i + blk]
        out[i: i + blk] = sosfilt(sos, seg)[-len(out[i: i + blk]):]
    return out * shape


# 1 · whoosh de apertura (zoom out): aire que se abre y se aleja
d = 2.2
x = tt(d)
shape = np.sin(np.pi * np.clip(x / 0.7, 0, 1) / 2) ** 2 * np.exp(-np.clip(x - 0.7, 0, None) / 0.55)
save("whoosh_out", room(swept_noise(d, 2400, 300, shape), 1.2, 0.5, 0.3))

# 2 · whoosh de cierre (zoom in): sube y se sostiene, empalma con el inicio
d = 2.4
x = tt(d)
shape = (x / d) ** 2.2
save("whoosh_in", swept_noise(d, 250, 1800, shape))

# 3 · transición suave entre escenas
d = 1.4
x = tt(d)
shape = np.sin(np.pi * x / d) ** 3
save("air", room(swept_noise(d, 900, 500, shape), 1.0, 0.4, 0.3))

# 4 · trazo (pluma sobre papel) para tachados y separadores
d = 0.7
x = tt(d)
grain = sosfilt(butter(2, [2500, 9000], "band", fs=SR, output="sos"), rng.standard_normal(len(x)))
flut = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * x + rng.uniform(0, 6)))
shape = np.sin(np.pi * x / d) ** 1.5
save("stroke", grain * flut * shape, -10)

# 5 · tic de reloj (madera + resonancia)
x = tt(0.12)
click = sosfilt(butter(2, [1800, 6000], "band", fs=SR, output="sos"), rng.standard_normal(len(x))) * np.exp(-x / 0.004)
res = np.sin(2 * np.pi * 2350 * x) * np.exp(-x / 0.018) * 0.4
save("tick", click + res, -8)

# 6 · campana suave (acentos dorados)
x = tt(3.5)
f = 587.33  # Re5
bell = sum(a * np.exp(-x / dcy) * np.sin(2 * np.pi * f * r * x)
           for r, a, dcy in [(1, 1.0, 1.4), (2.0, 0.25, 0.9), (2.76, 0.22, 0.6), (5.4, 0.06, 0.3)])
bell *= 1 - np.exp(-x / 0.004)
save("chime", room(bell, 2.0, 0.8, 0.4), -9)

# 7 · notas de fieltro (Re menor pentatónica ascendente) para las 11 figuras
def felt(f, d=2.6):
    x = tt(d)
    o = sum(a * np.exp(-x / dc) * np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * x)
            for h, a, dc in [(1, 1.0, 1.1), (2, 0.35, 0.7), (3, 0.1, 0.4)])
    return room(o * (1 - np.exp(-x / 0.005)), 1.4, 0.6, 0.35)


scale = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84, 86]
for i, m in enumerate(scale):
    save(f"note_{i + 1:02d}", felt(440 * 2 ** ((m - 69) / 12)), -10)

# 8 · golpe grave (división del embudo / aparición de estructura)
x = tt(2.0)
f = 55 * np.exp(-x / 0.8) + 38
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.6) * (1 - np.exp(-x / 0.01))
save("boom", room(boom, 1.5, 0.6, 0.25), -6)

# 9 · partículas (puntos que entran): granos breves y dispersos
d = 3.0
out = np.zeros(int(d * SR))
g = tt(0.02)
for _ in range(90):
    s = int(rng.uniform(0, d - 0.05) * SR)
    fr = rng.uniform(3000, 7000)
    out[s: s + len(g)] += np.sin(2 * np.pi * fr * g) * np.exp(-g / 0.004) * rng.uniform(0.2, 1)
out *= np.sin(np.pi * np.arange(len(out)) / len(out)) ** 2
save("dots", room(out, 1.0, 0.3, 0.3), -14)

# 10 · aparición de texto: soplo tonal muy breve
x = tt(0.9)
tone = sosfilt(butter(2, [300, 1400], "band", fs=SR, output="sos"), rng.standard_normal(len(x)))
save("text_in", tone * np.sin(np.pi * np.clip(x / 0.9, 0, 1)) ** 2, -12)
print("sfx ok")
