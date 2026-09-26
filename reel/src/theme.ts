import {Easing} from 'remotion';

// ─── Paleta única permitida ────────────────────────────────────────────────
export const C = {
  bg: '#580010', // borgoña
  cream: '#F0EDE8', // texto principal
  gold: '#B8943A', // oro envejecido — acentos, trazos, elementos activos
} as const;

// crema con opacidad (texto secundario = 0.6)
export const cream = (a: number) => `rgba(240, 237, 232, ${a})`;
export const gold = (a: number) => `rgba(184, 148, 58, ${a})`;
export const SECONDARY = cream(0.6);

// ─── Tipografía ────────────────────────────────────────────────────────────
// Sin negritas en ningún texto: sólo pesos 300 (Cormorant) y 200 (Jost).
export const F = {
  serif: {
    fontFamily: '"Cormorant Garamond", serif',
    fontWeight: 300,
    fontStyle: 'italic',
  },
  sans: {
    fontFamily: '"Jost", sans-serif',
    fontWeight: 200,
    fontStyle: 'normal',
    textTransform: 'uppercase',
  },
} as const;

// Tracking de Jost: 0.3em – 0.4em
export const TRACK = {normal: 0.32, wide: 0.4} as const;

// ─── Lienzo y zona segura de Reels ──────────────────────────────────────────
export const W = 1080;
export const H = 1920;
export const FPS = 60;
export const SAFE = {top: 250, bottom: H - 420, right: W - 160, left: 72} as const;

// ─── Movimiento: sólo curvas suaves, sin overshoot ─────────────────────────
export const EASE = {
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // cubic in-out
  expo: Easing.bezier(0.87, 0, 0.13, 1), // expo in-out
  out: Easing.bezier(0.33, 1, 0.68, 1), // cubic out (entradas)
  in: Easing.bezier(0.32, 0, 0.67, 0), // cubic in (salidas)
} as const;

// Stroke finos
export const STROKE = {hair: 2.2, line: 3, sales: 4} as const;

/** Halo luminoso de las líneas (oro / crema de la paleta, sin colores nuevos) */
export const GLOW = {
  gold: 'drop-shadow(0 0 4px rgba(184, 148, 58, 0.9)) drop-shadow(0 0 14px rgba(184, 148, 58, 0.55))',
  soft: 'drop-shadow(0 0 3px rgba(184, 148, 58, 0.7)) drop-shadow(0 0 10px rgba(240, 237, 232, 0.25))',
} as const;
