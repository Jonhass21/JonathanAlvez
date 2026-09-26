import React from 'react';
import {useCurrentFrame} from 'remotion';
import {lerp, prog} from '../anim';
import {CAM_FULL, Funnel} from '../components/Funnel';
import {EASE} from '../theme';
import {cue, sec} from '../timings';

type Tri = [number, number, number];
const ACTIVE: Tri[] = [
  [1, 0.3, 0.3],
  [0.3, 1, 0.3],
  [0.3, 0.3, 1],
];

/** Estado de iluminación de franjas según el fotograma (escenas 4–6). */
const bandState = (f: number): {wall: Tri; fill: Tri} => {
  const keys = [cue('s4_start'), cue('s5_start'), cue('s6_start')];
  let wall: Tri = [1, 1, 1];
  let fill: Tri = [0, 0, 0];
  keys.forEach((k, i) => {
    const p = prog(f, k, sec(0.6), EASE.inOut);
    const on: Tri = [0, 0, 0];
    on[i] = 1;
    wall = wall.map((w, j) => lerp(w, ACTIVE[i][j], p)) as Tri;
    fill = fill.map((w, j) => lerp(w, on[j], p)) as Tri;
  });
  return {wall, fill};
};

/**
 * ESCENA 3 · "Pero la venta no empieza cuando el cliente paga. Tiene tres etapas."
 * Vuelve el embudo; en "tres etapas" se divide en tres franjas (separadores de arriba hacia abajo).
 * Este embudo queda como base de las escenas 4, 5 y 6.
 */
export const Scene03Stages: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const inP = prog(f, cue('s3_start'), sec(0.9), EASE.inOut);
  const outP = prog(f, cue('s7_start') - sec(0.1), sec(0.6), EASE.inOut);
  const t = cue('tres_etapas');
  const seps: [number, number] = [prog(f, t, sec(0.8), EASE.inOut), prog(f, t + sec(0.45), sec(0.8), EASE.inOut)];
  const {wall, fill} = bandState(f);
  // aparición: leve acercamiento (0.97 → 1), sin brusquedad
  const cam = {...CAM_FULL, z: lerp(0.97, 1, inP)};
  return (
    <Funnel cam={cam} opacity={inP * (1 - outP)} seps={seps} wall={wall} fill={fill}>
      {children}
    </Funnel>
  );
};
