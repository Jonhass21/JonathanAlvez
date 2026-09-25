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
    else if (c.contains('kicker')) kind = 'kicker';
    if (kind) ev.push({t: +el.dataset.in, kind});
  });
  document.querySelectorAll('[data-count]').forEach(c => ev.push({
    t: +c.dataset.cin, kind: 'count', to: +c.dataset.count, from: c.dataset.from ? +c.dataset.from : 0}));
  return ev;
}"""


# ---------- síntesis de efectos ----------
def env(n, decay):
    return np.exp(-np.arange(n) / SR / decay)

def tone(freq, dur, decay, partials=((1, 1.0),), sweep=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = freq * (1 + sweep * np.exp(-t / 0.03))            # caída rápida de tono = "pop"
    phase = 2 * np.pi * np.cumsum(f) / SR
    sig = sum(a * np.sin(phase * m) for m, a in partials)
    attack = np.minimum(1, t / 0.003)
    return sig * env(n, decay) * attack

def noise_sweep(dur, f0, f1, peak=0.6):
    """Ruido filtrado con un pasabajos que barre de f0 a f1 = whoosh."""
    n = int(dur * SR); rng = np.random.default_rng(7)
    x = rng.standard_normal(n); y = np.zeros(n); acc = 0.0
    cut = np.geomspace(f0, f1, n)
    alpha = 1 - np.exp(-2 * np.pi * cut / SR)
    for i in range(n):
        acc += alpha[i] * (x[i] - acc); y[i] = acc
    t = np.linspace(0, 1, n)
    shape = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    return y / (np.abs(y).max() + 1e-9) * shape

def mix(*sigs):
    out = np.zeros(max(len(x) for x in sigs))
    for x in sigs: out[:len(x)] += x
    return out

def sfx_whoosh():  return mix(0.35 * noise_sweep(0.55, 300, 6000), 0.25 * tone(70, 0.4, 0.15, sweep=0.8))
def sfx_pop(i):    return 0.45 * tone(520 * 2 ** (i / 12 * 2), 0.18, 0.05, ((1, 1), (2, .25)), sweep=0.9)
def sfx_title():   return mix(0.35 * tone(90, 0.35, 0.12, sweep=1.2), 0.08 * noise_sweep(0.12, 2000, 400, 0.1))
def sfx_kicker():  return 0.18 * tone(2200, 0.06, 0.012)
def sfx_tick():    return 0.14 * tone(1900, 0.03, 0.006)
def sfx_ding():    return 0.35 * tone(1318.5, 1.2, 0.35, ((1, 1), (2.01, .35), (3.0, .12)))
def sfx_good():    return 0.40 * (tone(784, 0.3, 0.09) + np.pad(tone(1175, 0.3, 0.12), (int(.07 * SR), 0))[:int(.3 * SR)])
def sfx_bad():     return 0.30 * tone(160, 0.35, 0.12, ((1, 1), (3, .4), (5, .2)), sweep=-0.3)
def sfx_low():     return 0.30 * tone(220, 0.6, 0.2, ((1, 1), (2, .3)))
def sfx_cta():
    out = np.zeros(int(1.8 * SR))
    for k, f in enumerate([659.3, 830.6, 987.8, 1318.5]):   # acorde de Mi mayor en arpegio
        s = 0.28 * tone(f, 1.5, 0.45, ((1, 1), (2.01, .3)))
        o = int(k * 0.07 * SR); out[o:o + len(s)] += s
    shimmer = 0.2 * noise_sweep(0.5, 800, 9000, 0.15)
    out[:len(shimmer)] += shimmer
    return out

def build_audio(events, speed, duration):
    track = np.zeros(int((duration + 2) * SR))
    def put(sig, t):
        o = int(max(0, t) * SR); track[o:o + len(sig)] += sig[:len(track) - o]
    cards_seen = 0
    for e in sorted(events, key=lambda e: e['t']):
        t = e['t'] * speed; k = e['kind']
        if k == 'scene':   put(sfx_whoosh(), t - 0.3); cards_seen = 0
        elif k == 'card':  put(sfx_pop(cards_seen), t + 0.05); cards_seen += 1
        elif k == 'title': put(sfx_title(), t + 0.03)
        elif k == 'kicker': put(sfx_kicker(), t)
        elif k == 'good':  put(sfx_good(), t + 0.05)
        elif k == 'bad':   put(sfx_bad(), t + 0.05)
        elif k == 'cta':   put(sfx_cta(), t + 0.1)
        elif k == 'count':
            # un tick por cada cambio de número (máx. uno cada 45 ms) y cierre al terminar
            last_v, last_tick, dur = None, -1, 1.1 * speed
            for i in range(int(dur * 1000)):
                x = i / 1000 / dur
                v = round(e['from'] + (e['to'] - e['from']) * (1 - (1 - x) ** 3))
                if v != last_v and i / 1000 - last_tick > 0.045:
                    put(sfx_tick(), t + i / 1000); last_tick = i / 1000
                last_v = v
            put(sfx_low() if e['to'] < e['from'] else sfx_ding(), t + dur - 0.05)
    track = track[:int(duration * SR)]
    fade = int(0.4 * SR); track[-fade:] *= np.linspace(1, 0, fade)
    track = np.tanh(track * 1.1) / np.tanh(1.1)               # limitador suave
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

        wav = HERE / 'sfx.wav'
        with wave.open(str(wav), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes(build_audio(events, speed, duration).tobytes())

        out = HERE / 'historia_jonathan_alvez.mp4'
        ff = subprocess.Popen([FFMPEG, '-y', '-f', 'image2pipe', '-framerate', str(FPS), '-i', '-',
                               '-i', str(wav), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
                               '-preset', 'slow', '-c:a', 'aac', '-b:a', '192k', '-shortest',
                               '-movflags', '+faststart', str(out)],
                              stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
        for i in range(int(round(duration * FPS))):
            page.evaluate(f'render({i / FPS})')
            ff.stdin.write(page.screenshot(type='jpeg', quality=95))
        ff.stdin.close(); ff.wait()
        wav.unlink()
        print('OK', out, f'{duration:.1f}s')
    browser.close()
