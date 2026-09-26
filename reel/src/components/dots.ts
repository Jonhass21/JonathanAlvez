import {lerp, rand} from '../anim';
import {BANDS, wallX} from './Funnel';

/** Posiciones de las tres formas abstractas (marcas en comparación) en la franja media. */
export const SHAPES = [
  {kind: 'circle' as const, x: 420, y: 752},
  {kind: 'square' as const, x: 540, y: 752},
  {kind: 'rect' as const, x: 660, y: 752},
];

export const N_DOTS = 38;
/** Índices de los puntos que llegan a consideración (3 por forma) */
export const CONSIDER = [0, 1, 2, 3, 4, 5, 6, 7, 8];
/** El punto que convierte (frente a la forma central) */
export const CONVERTER = 4;

export type Dot = {sx: number; sy: number; tx: number; ty: number; delay: number; dur: number; phase: number; cx: number; cy: number};

export const DOTS: Dot[] = Array.from({length: N_DOTS}, (_, i) => {
  const left = i % 2 === 0;
  const [y0, y1] = BANDS[0];
  const ty = lerp(y0 + 34, y1 - 30, rand(i + 1));
  const l = wallX(ty, 'L') + 36;
  const r = wallX(ty, 'R') - 36;
  const tx = lerp(l, r, rand(i + 50));
  // destino en consideración: 3 puntos frente a cada forma
  const s = SHAPES[Math.floor(i / 3) % 3];
  const k = (i % 3) - 1;
  return {
    sx: left ? -30 : 1110,
    sy: lerp(260, 900, rand(i + 100)),
    tx,
    ty,
    delay: rand(i + 200),
    dur: lerp(1.6, 2.6, rand(i + 300)),
    phase: rand(i + 400) * Math.PI * 2,
    cx: s.x + k * 20,
    cy: s.y - 70 + Math.abs(k) * 6,
  };
});
