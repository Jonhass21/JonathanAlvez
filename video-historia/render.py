"""Renderiza historia.html a MP4 1080x1920 (30 fps) cuadro por cuadro, con efectos de sonido.
Uso: python3 render.py                      -> video completo con audio
     python3 render.py --stills 2,6,12      -> capturas en esos segundos (tiempo real del video)"""
import math, subprocess, sys, pathlib, wave
import numpy as np
import imageio_ffmpeg
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
FPS = 30
SR = 44100
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
stills = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[1] == '--stills' else None

# Lee de la animación cuándo aparece cada elemento y de qué tipo es
EVENTS_JS = """() => {
  const ev = [];
  document.querySelectorAll('.scene').forEach((s, i) => { if (i) ev.push({t: +s.dataset.in, kind: 'scene'}); });
  document.querySelectorAll('.fx').forEach(el => {
    const c = el.classList;
    let kind = null;
    if (c.contains('cta')) kind = 'cta';
    else if (c.contains('vrow')) kind = c.contains('bad') ? 'bad' : 'good';
    else if (['svc', 'stat', 'badge', 'step'].some(k => c.contains(k))) kind = 'card';
    else if (c.contains('h1') || c.contains('h2')) kind = 'title';
    else if (c.contains('chart')) kind = null;
    else if (c.contains('kicker')) kind = 'kicker';
    if (kind) ev.push({t: +el.dataset.in, kind});
  });
  document.querySelectorAll('[data-count]').forEach(c => ev.push({
    t: +c.dataset.cin, kind: 'count', to: +c.dataset.count, from: c.dataset.from ? +c.dataset.from : 0}));
  return ev;
}"""


# ---------- síntesis de efectos (estilo interfaz / corporativo) ----------
RNG = np.random.default_rng(7)

def env(n, decay):
    return np.exp(-np.arange(n) / SR / decay)

def tone(freq, dur, decay, partials=((1, 1.0),), sweep=0.0, attack=0.003):
    n = int(dur * SR); t = np.arange(n) / SR
    f = freq * (1 + sweep * np.exp(-t / 0.03))
    phase = 2 * np.pi * np.cumsum(f) / SR
    sig = sum(a * np.sin(phase * m) for m, a in partials)
    return sig * env(n, decay) * np.minimum(1, t / attack)

def lowpass(x, cut):
    """Pasabajos de un polo; cut puede ser un número o un array (barrido)."""
    cut = np.broadcast_to(cut, x.shape)
    alpha = 1 - np.exp(-2 * np.pi * cut / SR)
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)):
        acc += alpha[i] * (x[i] - acc); y[i] = acc
    return y

def highpass(x, cut):
    return x - lowpass(x, cut)

def mix(*sigs):
    out = np.zeros(max(len(x) for x in sigs))
    for x in sigs: out[:len(x)] += x
    return out

def shaped_noise(dur, f0, f1, peak=0.6, power=2):
    n = int(dur * SR)
    y = lowpass(RNG.standard_normal(n), np.geomspace(f0, f1, n))
    t = np.linspace(0, 1, n)
    shape = np.where(t < peak, (t / peak) ** power, ((1 - t) / (1 - peak)) ** 1.5)
    return y / (np.abs(y).max() + 1e-9) * shape

def sfx_click(bright=1.0):
    """Click de mouse: transitorio de ruido agudo + cuerpo corto."""
    n = int(0.03 * SR)
    burst = highpass(RNG.standard_normal(n), 3000) * env(n, 0.0025)
    return mix(0.55 * burst, 0.22 * tone(1800 * bright, 0.03, 0.004), 0.12 * tone(420, 0.04, 0.008))

def sfx_key():
    """Tecla de teclado: más seca y apagada que el click."""
    n = int(0.025 * SR)
    b = lowpass(highpass(RNG.standard_normal(n), 1200), 5000) * env(n, 0.003)
    return mix(0.35 * b, 0.06 * tone(260 * RNG.uniform(.9, 1.1), 0.03, 0.006))

def sfx_swipe():   return 0.16 * shaped_noise(0.45, 500, 3500, 0.55)
def sfx_title():   return mix(0.8 * sfx_click(0.7), 0.10 * tone(110, 0.25, 0.08))
def sfx_confirm(): return mix(0.16 * tone(880, 0.5, 0.12, ((1, 1), (3, .08))),
                              np.pad(0.14 * tone(1318.5, 0.6, 0.18, ((1, 1), (3, .08))), (int(.09 * SR), 0)))
def sfx_neg():     return 0.18 * tone(196, 0.35, 0.09, ((1, 1), (2, .2)))
def sfx_bell(f):   return 0.16 * tone(f, 1.0, 0.3, ((1, 1), (2.0, .25), (4.0, .05)), attack=0.004)

def sfx_riser(dur):
    """Subida para el gráfico: ruido filtrado que se abre + tono que sube suave."""
    n = int(dur * SR); t = np.linspace(0, 1, n)
    f = 220 * 2 ** (1.6 * t ** 1.3)
    tonal = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    shape = np.minimum(1, t / 0.15) * (0.35 + 0.65 * t) * np.minimum(1, (1 - t) / 0.06)
    air = lowpass(RNG.standard_normal(n), np.geomspace(300, 6000, n))
    return shape * (0.10 * tonal + 0.35 * air / np.abs(air).max())

def sfx_cta():
    out = np.zeros(int(2.2 * SR))
    for k, f in enumerate([587.3, 740.0, 880.0, 1108.7]):     # Dmaj7 arpegiado, suave
        s = 0.13 * tone(f, 1.8, 0.6, ((1, 1), (2.0, .2)), attack=0.01)
        o = int(k * 0.09 * SR); out[o:o + len(s)] += s
    c = sfx_click(); out[:len(c)] += c
    return out


# ---------- música de fondo (corporativa, 96 BPM, Re mayor) ----------
def midi(m): return 440 * 2 ** ((m - 69) / 12)

def music(duration, drums_from):
    beat = 60 / 96; bar = 4 * beat
    n = int((duration + 3) * SR); out = np.zeros(n)
    chords = [[50, 54, 57, 61], [47, 50, 54, 57], [43, 47, 50, 54], [45, 52, 57, 61]]  # Dmaj7 Bm7 Gmaj7 A
    roots = [38, 35, 31, 33]
    def add(sig, t0, gain=1.0):
        o = int(t0 * SR)
        if o < n: out[o:o + len(sig)] += gain * sig[:n - o]
    k = 0
    while k * bar < duration + bar:
        t0 = k * bar; ch = chords[k % 4]
        # pad: voces levemente desafinadas con ataque y release lentos
        L = int((bar + 1.2) * SR); t = np.arange(L) / SR
        padenv = np.minimum(1, t / 0.9) * np.clip((bar + 1.2 - t) / 1.2, 0, 1)
        pad = sum(np.sin(2 * np.pi * midi(m) * d * t) for m in ch for d in (0.997, 1.0, 1.003))
        add(pad * padenv, t0, 0.018)
        # bajo en 1 y 3
        for b in (0, 2):
            add(tone(midi(roots[k % 4]), beat * 2, 0.5, ((1, 1), (2, .25)), attack=0.01), t0 + b * beat, 0.16)
        # arpegio en corcheas, una octava arriba
        for i, idx in enumerate([0, 2, 1, 3, 2, 1, 3, 2]):
            add(tone(midi(ch[idx] + 12), 0.4, 0.14, ((1, 1), (2, .15), (3, .05)), attack=0.004), t0 + i * beat / 2, 0.055)
        # pulso: kick suave en 1 y 3, hi-hat en los contratiempos (entra después de la intro)
        if t0 >= drums_from - 0.01:
            for b in (0, 2):
                add(tone(55, 0.3, 0.09, sweep=1.5), t0 + b * beat, 0.28)
            for i in range(4):
                h = highpass(RNG.standard_normal(int(0.05 * SR)), 7000) * env(int(0.05 * SR), 0.012)
                add(h, t0 + (i + 0.5) * beat, 0.05)
        k += 1
    out = out[:int(duration * SR)]
    fade_in = int(0.6 * SR); out[:fade_in] *= np.linspace(0, 1, fade_in)
    fade_out = int(1.8 * SR); out[-fade_out:] *= np.linspace(1, 0, fade_out) ** 1.5
    return out / np.abs(out).max()


def build_audio(events, speed, duration, dots, span):
    fx = np.zeros(int((duration + 3) * SR))
    def put(sig, t):
        o = int(max(0, t) * SR); fx[o:o + len(sig)] += sig[:len(fx) - o]
    for e in sorted(events, key=lambda e: e['t']):
        t = e['t'] * speed; k = e['kind']
        if k == 'scene':    put(sfx_swipe(), t - 0.3)
        elif k == 'card':   put(sfx_click(RNG.uniform(.9, 1.1)), t + 0.05)
        elif k == 'title':  put(sfx_title(), t + 0.03)
        elif k == 'kicker': put(0.5 * sfx_key(), t)
        elif k == 'good':   put(mix(sfx_click(), sfx_confirm()), t + 0.05)
        elif k == 'bad':    put(mix(sfx_click(.8), sfx_neg()), t + 0.05)
        elif k == 'cta':    put(sfx_cta(), t + 0.1)
        elif k == 'count':
            # una tecla por cada cambio de número (máx. una cada 55 ms) y un click de cierre
            last_v, last_tick, dur = None, -1, 1.1 * speed
            for i in range(int(dur * 1000)):
                x = i / 1000 / dur
                v = round(e['from'] + (e['to'] - e['from']) * (1 - (1 - x) ** 3))
                if v != last_v and i / 1000 - last_tick > 0.055:
                    put(sfx_key(), t + i / 1000); last_tick = i / 1000
                last_v = v
            put(sfx_neg() if e['to'] < e['from'] else mix(sfx_click(), sfx_bell(1760)), t + dur - 0.05)
    # gráfico de consultas: subida durante el trazo y un click + campana (cada vez más aguda) por punto
    put(sfx_riser((span[1] - span[0]) * speed), span[0] * speed)
    for i, tb in enumerate(dots):
        put(mix(sfx_click(), sfx_bell([880, 1108.7, 1318.5][i % 3])), tb * speed)

    fx = fx[:int(duration * SR)]
    fx = fx / max(1e-9, np.abs(fx).max())
    first_scene = min(e['t'] for e in events if e['kind'] == 'scene') * speed
    track = 0.85 * fx + 0.30 * music(duration, drums_from=first_scene)
    fade = int(0.3 * SR); track[-fade:] *= np.linspace(1, 0, fade)
    track = np.tanh(track * 1.2) / np.tanh(1.2)               # limitador suave
    return (track / max(1e-9, np.abs(track).max()) * 0.9 * 32767).astype(np.int16)


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    page = browser.new_page(viewport={'width': 1080, 'height': 1920})
    page.goto((HERE / 'historia.html').as_uri() + '?capture')
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(800)
    if stills:
        for s in stills:
            page.evaluate(f'render({s})')
            page.screenshot(path=str(HERE / f'still_{s}.png'))
    else:
        duration, speed = page.evaluate('DURATION'), page.evaluate('SPEED')
        events = page.evaluate(EVENTS_JS)
        dots, span = page.evaluate('chartDotTimes()'), page.evaluate('chartSpan')

        wav = HERE / 'sfx.wav'
        with wave.open(str(wav), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes(build_audio(events, speed, duration, dots, span).tobytes())

        out = HERE / 'historia_jonathan_alvez.mp4'
        ff = subprocess.Popen([FFMPEG, '-y', '-f', 'image2pipe', '-framerate', str(FPS), '-i', '-',
                               '-i', str(wav), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
                               '-preset', 'slow', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest',
                               '-movflags', '+faststart', str(out)],
                              stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
        for i in range(int(round(duration * FPS))):
            page.evaluate(f'render({i / FPS})')
            ff.stdin.write(page.screenshot(type='jpeg', quality=95))
        ff.stdin.close(); ff.wait()
        wav.unlink()
        print('OK', out, f'{duration:.1f}s')
    browser.close()
