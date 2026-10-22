const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const [, , out, stills] = process.argv;
const FPS = 30, DUR = 12;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + path.join(__dirname, 'anim.html'));
  await pg.evaluate(() => document.fonts.ready);
  if (stills) {
    for (const t of stills.split(',')) {
      await pg.evaluate(t => render(t), +t);
      await pg.screenshot({ path: `${out}/still_${t}.png` });
    }
    return b.close();
  }
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', FPS, '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let f = 0; f < FPS * DUR; f++) {
    await pg.evaluate(t => render(t), f / FPS);
    ff.stdin.write(await pg.screenshot({ type: 'png' }));
  }
  ff.stdin.end();
  ff.on('close', () => b.close());
})();
