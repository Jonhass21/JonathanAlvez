// Exporta fotogramas de control a ./preview (0 s, 15 s, 30 s, 45 s y el último) o los que se pasen:
//   node scripts/preview.mjs            -> control
//   node scripts/preview.mjs 120 900    -> fotogramas sueltos
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const timings = JSON.parse(fs.readFileSync('timings.json', 'utf8'));
const last = timings.durationInFrames - 1;
const args = process.argv.slice(2).map(Number);
const frames = args.length
  ? args.map((f) => [f, `f${String(f).padStart(4, '0')}`])
  : [[0, '00s_first'], [15 * 60, '15s'], [30 * 60, '30s'], [45 * 60, '45s'], [last, 'zz_last']];

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_CHROME ?? null;
const composition = await selectComposition({serveUrl, id: 'Variables01', browserExecutable});
fs.mkdirSync('preview', {recursive: true});
for (const [frame, name] of frames) {
  await renderStill({composition, serveUrl, frame, output: `preview/${name}.png`, browserExecutable, overwrite: true});
  console.log('preview/' + name + '.png', `(frame ${frame})`);
}
