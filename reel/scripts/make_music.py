"""Música original para VARIABLES 01 — síntesis procedural (sin samples de terceros).

Re menor, 60 BPM. Pad de cuerdas cálido + drone grave + piano de fieltro + pulso sub muy suave.
El último acorde (La, dominante) resuelve en el primero (Re menor): el loop cierra armónicamente.
Loop sin costura: se genera N + cola y la cola se suma sobre el inicio, así el último sample
empalma con el primero (no hay fade out). Salida: public/audio/musica.wav (estéreo 48 kHz).
"""
import json
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
T = json.load(open("timings.json"))
N = int(round(T["durationInFrames"] / T["fps"] * SR))
TAIL = 6 * SR
L = N + TAIL
rng = np.random.default_rng(7)
t = np.arange(L) / SR


def hz(m):  # MIDI -> Hz
    return 440.0 * 2 ** ((m - 69) / 12)


# Acordes (MIDI), 8 s cada uno. Dm9 · Bbmaj7 · Gm9 · A(sus4) ... termina en La -> vuelve a Re m.
CH = {
    "Dm": [38, 45, 53, 57, 60, 64],
    "Bb": [34, 41, 50, 57, 60, 65],
    "Gm": [31, 38, 46, 53, 57, 62],
    "Asus": [33, 40, 50, 52, 57, 62],
    "A": [33, 40, 49, 52, 57, 61],
}
PROG = ["Dm", "Bb", "Gm", "Asus", "Dm", "Bb", "Gm", "Bb", "A", "Dm"]
SPAN = 8.0


def env_ar(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** 2
    e[-nr:] *= np.cos(np.linspace(0, np.pi / 2, nr)) ** 2
    return e


def pad_voice(f, n, det):
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for h in range(1, 7):
        amp = 1 / h ** 1.8
        ph = rng.uniform(0, 2 * np.pi)
        vib = 1 + 0.0015 * np.sin(2 * np.pi * 0.17 * tt + ph)
        out += amp * np.sin(2 * np.pi * f * det * h * vib * tt + ph)
    return out


pad = np.zeros((L, 2))
for i, name in enumerate(PROG):
    s0 = int(i * SPAN * SR)
    if s0 >= L:
        break
    n = min(int((SPAN + 3.0) * SR), L - s0)
    e = env_ar(n, 2.2, 3.0)
    for m in CH[name]:
        g = 0.55 if m < 45 else 0.32
        pad[s0:s0 + n, 0] += g * e * pad_voice(hz(m), n, 0.9985)
        pad[s0:s0 + n, 1] += g * e * pad_voice(hz(m), n, 1.0015)
# respiración lenta del pad
pad *= (0.8 + 0.2 * np.sin(2 * np.pi * t / 16.0))[:, None]

# Drone grave (Re) con swell lento — tensión "Kubrick"
drone = (np.sin(2 * np.pi * hz(26) * t) * 0.5 + np.sin(2 * np.pi * hz(38) * t) * 0.35
         + np.sin(2 * np.pi * hz(45) * t * 1.0007) * 0.12)
drone *= 0.55 + 0.45 * np.sin(2 * np.pi * t / 24.0 - np.pi / 2) ** 2
pad += 0.5 * drone[:, None]


# Piano de fieltro: notas espaciadas, tomadas del acorde vigente
def felt(f, dur=3.5):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    o = np.zeros(n)
    for h, a, d in [(1, 1.0, 1.6), (2, 0.35, 0.9), (3, 0.12, 0.6), (4, 0.05, 0.4)]:
        fh = f * h * (1 + 0.0004 * h * h)
        o += a * np.exp(-tt / d) * np.sin(2 * np.pi * fh * tt)
    o *= 1 - np.exp(-tt / 0.006)
    return o


piano = np.zeros((L, 2))
beat = 0.0
while beat * SR < L - SR:
    ci = min(int(beat // SPAN), len(PROG) - 1)
    tones = [m + 12 for m in CH[PROG[ci]][2:]]
    if rng.random() < 0.72:
        m = int(rng.choice(tones))
        x = felt(hz(m)) * rng.uniform(0.18, 0.3)
        s0 = int(beat * SR)
        n = min(len(x), L - s0)
        pan = rng.uniform(0.3, 0.7)
        piano[s0:s0 + n, 0] += x[:n] * (1 - pan)
        piano[s0:s0 + n, 1] += x[:n] * pan
    beat += float(rng.choice([1.0, 2.0, 2.0, 3.0]))

# Pulso sub muy suave (latido a 60 BPM)
pulse = np.zeros(L)
k = np.arange(int(0.35 * SR)) / SR
thump = np.sin(2 * np.pi * (48 + 30 * np.exp(-k / 0.04)) * k) * np.exp(-k / 0.09)
for b in np.arange(0, L / SR - 0.5, 1.0):
    s0 = int(b * SR)
    pulse[s0:s0 + len(thump)] += thump * (0.9 if int(b) % 2 == 0 else 0.55)
mix = pad * 0.55 + piano + 0.22 * pulse[:, None]

# Reverb de sala (IR sintética estéreo)
ir_n = int(3.2 * SR)
ir_t = np.arange(ir_n) / SR
lp = butter(2, 5000, "low", fs=SR, output="sos")
ir = np.stack([sosfilt(lp, rng.standard_normal(ir_n)) * np.exp(-ir_t / 0.9) for _ in range(2)], 1)
ir /= np.sqrt((ir ** 2).sum(0))
wet = np.stack([fftconvolve(mix[:, c], ir[:, c])[:L] for c in range(2)], 1)
mix = 0.7 * mix + 0.55 * wet

# Filtro general: cálido, sin agudos ásperos
mix = sosfilt(butter(2, [35, 9000], "band", fs=SR, output="sos"), mix, axis=0)

# Loop sin costura: la cola posterior a N se suma sobre el inicio
loop = mix[:N].copy()
loop[:TAIL] += mix[N:N + TAIL]

rms = np.sqrt(np.mean(loop ** 2))
loop *= 10 ** (-18 / 20) / rms
peak = np.abs(loop).max()
if peak > 0.89:
    loop *= 0.89 / peak
sf.write("public/audio/musica.wav", loop.astype(np.float32), SR, subtype="PCM_16")
print(f"musica.wav: {N / SR:.3f}s  rms {20 * np.log10(np.sqrt(np.mean(loop ** 2))):.1f} dBFS  peak {20 * np.log10(np.abs(loop).max()):.1f} dBFS")
