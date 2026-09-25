"""Renderiza historia.html a MP4 1080x1920 (30 fps) cuadro por cuadro.
Uso: python3 render.py [--stills 2,6,12,17,21,27]"""
import subprocess, sys, pathlib
import imageio_ffmpeg
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
FPS = 30
stills = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[1] == '--stills' else None

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
        duration = page.evaluate('DURATION')
        out = HERE / 'historia_jonathan_alvez.mp4'
        ff = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-f', 'image2pipe', '-framerate', str(FPS),
                               '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
                               '-preset', 'slow', '-movflags', '+faststart', str(out)],
                              stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
        for i in range(int(duration * FPS)):
            page.evaluate(f'render({i / FPS})')
            ff.stdin.write(page.screenshot(type='jpeg', quality=95))
        ff.stdin.close(); ff.wait()
        print('OK', out)
    browser.close()
