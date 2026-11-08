"""Original music + stop-motion foley for the MAVE reel (14 s, 120 BPM).

All sounds are synthesized here (no samples), so there are no rights issues.
Beat = 0.5 s = 6 animation frames @12fps, so the music locks to the motion.
"""
import sys, wave
import numpy as np

SR = 48000
DUR = 13.0
N = int(SR * DUR)
rng = np.random.default_rng(3)
L = np.zeros(N); R = np.zeros(N)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


OFFSET = 1.0  # 1 s intro while the phrase appears


def add(sig, t, gain=1.0, pan=0.0):
    i = int((t + OFFSET) * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def pluck(f, dur=1.4, bright=0.5):
    """Karplus-Strong string (ukulele-ish)."""
    n = int(SR * dur); p = int(SR / f)
    buf = rng.uniform(-1, 1, p)
    buf = np.convolve(buf, np.ones(3) / 3, "same") * (0.6 + bright * 0.4)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out


def glock(f, dur=1.6):
    t = np.arange(int(SR * dur)) / SR
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2)
         + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9)
         + 0.12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 18))
    s *= np.minimum(1, t / 0.002)
    return s


def bass(f, dur=0.9):
    t = np.arange(int(SR * dur)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return s * np.minimum(1, t / 0.01) * np.exp(-t * 3.5)


def shaker(dur=0.07):
    n = int(SR * dur); t = np.arange(n) / SR
    s = rng.normal(0, 1, n)
    s = s - np.convolve(s, np.ones(8) / 8, "same")  # crude high-pass
    return s * np.exp(-t * 60) * np.minimum(1, t / 0.004)


def pop(f0=900, f1=260, dur=0.09):
    t = np.arange(int(SR * dur)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 45)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 38) * np.minimum(1, t / 0.001)


def thump(dur=0.18):
    t = np.arange(int(SR * dur)) / SR
    f = 70 + 120 * np.exp(-t * 40)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    nz = rng.normal(0, 1, len(t)) * np.exp(-t * 90) * 0.25
    return s + nz


def tick(dur=0.04):
    t = np.arange(int(SR * dur)) / SR
    return (np.sin(2 * np.pi * 1800 * t) * 0.6 + rng.normal(0, 0.3, len(t))) * np.exp(-t * 160)


def whoosh(dur=0.45):
    n = int(SR * dur); t = np.arange(n) / SR
    s = rng.normal(0, 1, n)
    k = 30
    s = np.convolve(s, np.ones(k) / k, "same")
    env = np.sin(np.pi * t / dur) ** 2
    return s * env * 3


# ---------------- music ----------------
BEAT = 0.5
# chords (midi notes) per bar of 4 beats (2 s)
F, Am, Bb, C, Dm = [53, 57, 60, 65], [57, 60, 64, 69], [58, 62, 65, 70], [55, 60, 64, 67], [57, 62, 65, 69]
bars = [F, Am, C, F, Bb]
roots = [41, 45, 48, 41, 46]

for b, (ch, rt) in enumerate(zip(bars, roots)):
    t0 = b * 2.0
    if b == 6:  # final bar: Bb -> resolve to F with a long strum
        pass
    # ukulele strum pattern: D . D U . U D U
    pattern = [(0, 1.0, 1), (1, 0.8, 1), (1.5, 0.5, -1), (2.5, 0.5, -1), (3, 0.75, 1), (3.5, 0.5, -1)]
    for beat, g, direction in pattern:
        notes = ch if direction > 0 else ch[::-1]
        for k, n in enumerate(notes):
            add(pluck(midi(n + 12), 1.2), t0 + beat * BEAT + k * 0.012, 0.16 * g, pan=-0.25)
    add(bass(midi(rt)), t0, 0.45)
    add(bass(midi(rt + 7)), t0 + 2 * BEAT, 0.35)
    for e in range(8):
        add(shaker(), t0 + e * BEAT / 2, 0.05 if e % 2 else 0.03, pan=0.4)

# glockenspiel melody (beat, midi, length-ignored) — original tune
mel = [
    (0, 77), (1, 76), (1.5, 77), (2, 81), (3, 79),          # F
    (4, 76), (5, 72), (5.5, 74), (6, 76), (7, 79),          # Am
    (8, 79), (9, 76), (9.5, 77), (10, 79), (11, 72),        # C
    (12, 77), (12.5, 79), (13, 81), (14, 84), (15, 81),     # F  (logo lands)
    (16, 82), (17, 81), (17.5, 79), (18, 77), (19, 74),     # Bb
    (20, 77),                                               # F  (end)
]
for beat, n in mel:
    add(glock(midi(n)), beat * BEAT, 0.20, pan=0.3)

# final ending chord: F major add9 strum + chime at 13.0 s
for k, n in enumerate([53, 57, 60, 65, 67, 69]):
    add(pluck(midi(n + 12), 2.5), 10.0 + k * 0.03, 0.17, pan=-0.2)
add(bass(midi(41), 2.0), 10.0, 0.45)
for k, n in enumerate([89, 93, 96]):
    add(glock(midi(n), 1.5), 10.0 + k * 0.08, 0.10, pan=0.5)

# ---------------- foley synced to animation (frames @12 fps) ----------------
fr = lambda f: f / 12.0
add(whoosh(0.3), fr(0), 0.08)
for f in (8, 12, 16):              # cake layers land
    add(thump(), fr(f), 0.55)
add(thump(), fr(21), 0.35)         # frosting
for f in (31, 34, 37):             # strawberries
    add(pop(700, 240), fr(f), 0.30)
add(pop(1100, 400), fr(41), 0.30)  # cherry
add(whoosh(), fr(59), 0.10)        # cake exits
for i in range(4):                 # MAVE letters land (logo start 69)
    add(thump(), fr(72 + i * 3), 0.50)
for i in range(10):                # PASTELERÍA typewriter
    add(tick(), fr(85 + i), 0.18, pan=-0.5 + i * 0.1)
add(pop(1300, 500), fr(97), 0.25)  # heart

# intro: soft pickup while "Algo dulce / se está horneando…" appears
add(glock(midi(84), 1.2), -1.0, 0.07, pan=0.4)
add(glock(midi(88), 1.2), -0.58, 0.07, pan=-0.3)
add(glock(midi(72)), -0.5, 0.16, pan=0.3)
add(glock(midi(74)), -0.25, 0.16, pan=0.3)

# ---------------- simple reverb ----------------
ir_n = int(SR * 1.2)
t = np.arange(ir_n) / SR
ir = rng.normal(0, 1, ir_n) * np.exp(-t * 4.5)
ir[: int(SR * 0.015)] = 0
ir /= np.sqrt((ir ** 2).sum())
from numpy.fft import rfft, irfft
def conv(x):
    m = len(x) + ir_n
    nfft = 1 << (m - 1).bit_length()
    return irfft(rfft(x, nfft) * rfft(ir, nfft), nfft)[: len(x)]
L = L + 0.22 * conv(L); R = R + 0.22 * conv(R)

# fade in/out
env = np.ones(N)
fi = int(SR * 0.02); env[:fi] = np.linspace(0, 1, fi)
fo = int(SR * 0.8); env[-fo:] = np.linspace(1, 0, fo) ** 1.5
L *= env; R *= env
peak = max(np.abs(L).max(), np.abs(R).max())
L = L / peak * 0.89; R = R / peak * 0.89
out = (np.stack([L, R], 1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(out.tobytes())
print("ok")
