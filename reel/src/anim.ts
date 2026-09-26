import {interpolate} from 'remotion';
import {EASE} from './theme';

type EaseFn = (t: number) => number;

/** Progreso 0→1 entre dos fotogramas, con easing y clamp. */
export const prog = (frame: number, from: number, dur: number, ease: EaseFn = EASE.inOut) =>
  interpolate(frame, [from, from + Math.max(1, dur)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/** Entra en `inAt` y sale en `outAt` (fundidos de `dur` fotogramas). */
export const visible = (frame: number, inAt: number, outAt: number, dur = 30) =>
  Math.min(prog(frame, inAt, dur, EASE.out), 1 - prog(frame, outAt, dur, EASE.in));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Pseudo-aleatorio determinista */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
