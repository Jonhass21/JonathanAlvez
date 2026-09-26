import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {prog} from '../anim';
import {Figure, FIGURES, ORDER} from '../components/Figures';
import {EASE, gold, GLOW, STROKE} from '../theme';
import {cue, sec} from '../timings';

/** Fotograma en que se ilumina la k-ésima figura restante. */
export const lightAt = (k: number) => {
  const a = cue('s9_start') + sec(0.15);
  const b = cue('compra_final');
  return Math.round(a + ((b - a) * k) / (ORDER.length - 1));
};

/**
 * ESCENA 9 · "El que te recuerda cuando llega ese momento, es el que compra."
 * Las 11 figuras restantes se iluminan en dorado de a una, escalonadas, como si pasara el tiempo.
 */
export const Scene09Moment: React.FC = () => {
  const f = useCurrentFrame();
  const fadeOut = 1 - prog(f, cue('s10_start'), sec(0.45), EASE.inOut);
  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: GLOW.gold}}>
        {ORDER.map((idx, k) => {
          const p = prog(f, lightAt(k), sec(0.45), EASE.inOut);
          if (p <= 0) return null;
          const fig = FIGURES[idx];
          return <Figure key={idx} x={fig.x} y={fig.y} stroke={gold(p)} width={STROKE.line} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
