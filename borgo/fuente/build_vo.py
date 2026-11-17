"""Sincroniza la locución (ElevenLabs) con la animación y arma el MP4 final.
Uso: python3 build_vo.py <voz>   (voz = masculina | femenina)
"""
import json, math, os, subprocess, sys, wave
import numpy as np

VOZ = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
VO = os.path.join(HERE, '..', 'vo')
FPS, SR, MAXF = 12, 44100, 240          # 240 cuadros = 20 s máximo
LEAD0, LEAD, GAP, TAIL = 0.2, 0.12, 0.2, 0.9
MIN = [24, 44, 34, 30, 0, 24]            # largo mínimo de cada escena (cuadros)

al = [json.load(open(f'{VO}/{VOZ}_{i}_c.json')) for i in range(6)]
def end(a):
    ch, en = a['characters'], a['character_end_times_seconds']
    return en[max(k for k, c in enumerate(ch) if c.isalnum())]
def word_t(a, w):
    txt = ''.join(a['characters']); k = txt.find(w); assert k >= 0, w
    return a['character_start_times_seconds'][k]

def layout(tempo):
    d = [end(a) / tempo for a in al]
    k0 = {'m': word_t(al[0], 'Marketing'), 'p': word_t(al[0], 'publicidad'), 'v': word_t(al[0], 'ventas'),
          'q': word_t(al[0], 'son'), 'no': word_t(al[0], 'No')}
    K0 = {k: max(1, round((LEAD0 + v / tempo) * FPS)) for k, v in k0.items()}
    acc = LEAD + word_t(al[4], 'acción') / tempo
    s4 = max(-2, round(acc * FPS) - 19)
    MIN[4] = 19 + s4 + 10
    MIN[0] = max(24, K0['no'] + 6)
    SC, start, voff = [], 0, []
    for i in range(6):
        SC.append(start); lead = LEAD0 if i == 0 else LEAD
        voff.append(start / FPS + lead)
        need = (lead + d[i] + (TAIL if i == 5 else GAP)) * FPS
        start += max(MIN[i], math.ceil(need))
    return SC, start, K0, s4, voff, d

tempo = 1.0
while True:
    SC, TOTAL, K0, s4, voff, d = layout(tempo)
    if TOTAL <= MAXF or tempo >= 1.15: break
    tempo = round(tempo + 0.01, 2)
print(f'{VOZ}: tempo x{tempo}  duración {TOTAL/FPS:.2f}s  escenas {SC}  K0 {K0}  s4 {s4}')
tl = os.path.join(HERE, f'timeline_{VOZ}.json')
json.dump({'SC': SC, 'TOTAL': TOTAL, 'K0': K0, 'K4': s4}, open(tl, 'w'))

# ---------- render de cuadros ----------
frames = os.path.join(HERE, f'frames_{VOZ}')
subprocess.run(['rm', '-rf', frames]); subprocess.run(['node', 'render.js'], cwd=HERE, check=True,
               env={**os.environ, 'TL': tl, 'OUT': frames})

# ---------- pista de voz ----------
n = int(TOTAL / FPS * SR) + SR
vox = np.zeros(n)
for i in range(6):
    src = f'{VO}/{VOZ}_{i}_c.wav'; tmp = os.path.join(HERE, f'_v{i}.wav')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', f'atempo={tempo}', '-ar', str(SR), '-ac', '1', tmp], check=True)
    w = wave.open(tmp); x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0; w.close(); os.remove(tmp)
    x = x[:int((d[i] + 0.15) * SR)]; x[-int(0.04*SR):] *= np.linspace(1, 0, int(0.04*SR))
    j = int(voff[i] * SR); vox[j:j + len(x)] += x[:n - j]

# ---------- efectos (mismos que la versión sin voz, re-ubicados y más bajos) ----------
rng = np.random.default_rng(7); sfx = np.zeros(n)
def band(m, lo, hi):
    X = np.fft.rfft(rng.standard_normal(m)); f = np.fft.rfftfreq(m, 1 / SR); X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, m); return y / (np.abs(y).max() + 1e-9)
def add(t0, sig, g):
    i = max(0, int(t0 * SR)); j = min(n, i + len(sig)); sfx[i:j] += sig[:j - i] * g
def env(m, a, dd):
    t = np.arange(m) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / dd)
F = lambda sc, t: (SC[sc] + t) / FPS
def pencil(sc, t0, t1, g=0.10):
    m = int((t1 - t0) / FPS * SR); t = np.arange(m) / SR
    am = np.abs(np.sin(2 * np.pi * 8 * t)) ** 0.6; fade = np.minimum(1, np.minimum(t / 0.03, (t[-1] - t) / 0.05 + 1e-3))
    add(F(sc, t0), band(m, 1800, 7000) * am * fade, g)
def tick(sc, t, g=0.2):
    m = int(0.05 * SR); tt = np.arange(m) / SR
    add(F(sc, t), band(m, 1500, 6000) * np.exp(-tt / 0.008) + 0.5 * np.sin(2 * np.pi * 1700 * tt) * np.exp(-tt / 0.012), g)
def paper(sc, t, g=0.22):
    m = int(0.32 * SR); tt = np.arange(m) / SR; add(F(sc, t) - 0.05, band(m, 250, 5000) * np.sin(np.pi * tt / tt[-1]) ** 2, g)
def thump(sc, t, g=0.5):
    m = int(0.35 * SR); tt = np.arange(m) / SR; ph = 2 * np.pi * np.cumsum(90 * np.exp(-tt / 0.12) + 45) / SR
    add(F(sc, t), np.sin(ph) * np.exp(-tt / 0.09) + 0.3 * band(m, 80, 600) * np.exp(-tt / 0.03), g)
def whoosh(sc, t, g=0.09):
    m = int(0.4 * SR); tt = np.arange(m) / SR; add(F(sc, t), band(m, 400, 1800) * np.sin(np.pi * tt / tt[-1]) ** 2, g)
def pling(sc, t, g=0.1):
    m = int(0.6 * SR); tt = np.arange(m) / SR
    add(F(sc, t), (np.sin(2 * np.pi * 1318.5 * tt) + 0.5 * np.sin(2 * np.pi * 1975.5 * tt)) * env(m, 0.004, 0.18), g)
def boom(sc, t, g=0.7):
    m = int(0.9 * SR); tt = np.arange(m) / SR; ph = 2 * np.pi * np.cumsum(55 + 60 * np.exp(-tt / 0.05)) / SR
    add(F(sc, t), np.sin(ph) * env(m, 0.003, 0.28) + 0.4 * band(m, 1000, 6000) * np.exp(-tt / 0.006), g)
def chime(sc, t, g=0.12):
    m = int(2.6 * SR); tt = np.arange(m) / SR
    for k, (hz, dl) in enumerate([(523.25, 0), (659.25, .09), (783.99, .18), (1046.5, .27)]):
        add(F(sc, t) + dl, (np.sin(2 * np.pi * hz * tt) + .25 * np.sin(4 * np.pi * hz * tt)) * env(m, .01, .75), g * (1 - .15 * k))
for k in ('m', 'p', 'v'): tick(0, K0[k], 0.15)
pencil(0, K0['no'], K0['no'] + 3); tick(0, K0['q'], 0.12)
for sc in (1, 2, 3, 4): paper(sc, 0)
pencil(1, 5, 16); [tick(1, t, 0.05) for t in range(16, 29, 2)]; pencil(1, 33, 39, 0.12); tick(1, 39, 0.22)
pencil(2, 8, 17); thump(2, 17); [whoosh(2, 18 + 4 * k) for k in range(4)]; pling(2, 30)
pencil(3, 6, 14); tick(3, 14, 0.22); pencil(3, 23, 28, 0.13); tick(3, 28, 0.28)
for t in (5, 6, 7): tick(4, t, 0.12)
pencil(4, 11 + s4, 18 + s4, 0.1); boom(4, 19 + s4)
L4 = SC[5] - SC[4]; whoosh(4, L4 - 5, 0.15); paper(4, L4 - 2, 0.16); chime(5, 2)

vox /= np.abs(vox).max(); sfx /= np.abs(sfx).max()
# ducking: los efectos bajan mientras habla la voz
envv = np.convolve(np.abs(vox), np.ones(2205) / 2205, 'same'); duck = 1 - 0.55 * np.clip(envv / 0.05, 0, 1)
mix = vox * 0.9 + sfx * 0.32 * duck
mix = mix[:int(TOTAL / FPS * SR)]
raw = os.path.join(HERE, f'_mix_{VOZ}.wav')
w = wave.open(raw, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(mix / np.abs(mix).max() * 0.9, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()

out = os.path.join(HERE, f'Borgo_Marketing-Publicidad-Ventas_voz-{VOZ}.mp4')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{frames}/f%04d.png', '-i', raw,
                '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow',
                '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-shortest', '-movflags', '+faststart', out], check=True)
print('OK', out)
