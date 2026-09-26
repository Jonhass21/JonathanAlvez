import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {lerp, prog} from '../anim';
import {CONSIDER, CONVERTER, DOTS, SHAPES} from '../components/dots';
import {StageText} from '../components/StageText';
import {C, cream, EASE, GLOW, STROKE} from '../theme';
import {cue, sec} from '../timings';
import {attractionPos} from './Scene04Attraction';

const shapePath = (kind: 'circle' | 'square' | 'rect', x: number, y: number) => {
  if (kind === 'circle') return `M ${x} ${y - 32} A 32 32 0 1 1 ${x - 0.01} ${y - 32} Z`;
  if (kind === 'square') return `M ${x - 30} ${y - 30} H ${x + 30} V ${y + 30} H ${x - 30} Z`;
  return `M ${x - 22} ${y - 36} H ${x + 22} V ${y + 36} H ${x - 22} Z`;
};

/** Posición de los puntos en consideración (se detienen frente a las formas). */
export const considerPos = (f: number, i: number) => {
  const d = DOTS[i];
  const from = attractionPos(cue('s5_start'), i);
  const start = cue('consideracion') + sec(0.2) + sec((CONSIDER.indexOf(i) / CONSIDER.length) * 1.4);
  const p = prog(f, start, sec(1.8), EASE.inOut);
  return {x: lerp(from.x, d.cx, p), y: lerp(from.y, d.cy, p)};
};

/**
 * ESCENA 5 · "Dos: consideración. Cuando aparece la necesidad, te comparan. Acá ganás con prueba."
 * Franja media. Menos puntos, que se detienen frente a tres formas abstractas.
 */
export const Scene05Consideration: React.FC = () => {
  const f = useCurrentFrame();
  const s5 = cue('s5_start');
  const out = cue('s6_start');
  const restFade = 1 - prog(f, s5, sec(0.8), EASE.inOut);
  const shapesIn = cue('consideracion') + sec(0.1);
  const shapesOut = 1 - prog(f, out + sec(0.3), sec(0.8), EASE.inOut);
  const proof = prog(f, cue('prueba'), sec(0.9), EASE.inOut);
  // la escena 6 toma el punto que convierte; el resto se desvanece allí
  const keepFade = 1 - prog(f, out, sec(0.8), EASE.inOut);

  return (
    <AbsoluteFill>
      <StageText num="02" word="Consideración" metric="Consultas" at={s5} wordAt={cue('consideracion')} out={out} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: GLOW.soft}}>
        {SHAPES.map((s, i) => {
          const p = prog(f, shapesIn + sec(i * 0.25), sec(1.1), EASE.inOut);
          if (p <= 0) return null;
          const d = shapePath(s.kind, s.x, s.y);
          return (
            <g key={i} opacity={shapesOut}>
              <path d={d} pathLength={1} strokeDasharray={`${p} 1`} fill="none" stroke={cream(0.85)} strokeWidth={STROKE.hair} />
              {i === 1 && proof > 0 && (
                <path d={d} pathLength={1} strokeDasharray={`${proof} 1`} fill="none" stroke={C.gold} strokeWidth={STROKE.line} />
              )}
            </g>
          );
        })}
        {DOTS.map((_, i) => {
          const inConsider = CONSIDER.includes(i);
          if (!inConsider) {
            if (restFade <= 0.001) return null;
            const p = attractionPos(f, i);
            return <circle key={i} cx={p.x} cy={p.y} r={4} fill={cream(0.85 * restFade)} />;
          }
          if (i === CONVERTER) return f < out ? <circle key={i} {...xy(considerPos(f, i))} r={4} fill={cream(0.85)} /> : null;
          return keepFade > 0.001 ? <circle key={i} {...xy(considerPos(f, i))} r={4} fill={cream(0.85 * keepFade)} /> : null;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const xy = (p: {x: number; y: number}) => ({cx: p.x, cy: p.y});
