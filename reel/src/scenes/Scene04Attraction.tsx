import React from 'react';
import {useCurrentFrame} from 'remotion';
import {lerp, prog} from '../anim';
import {DOTS} from '../components/dots';
import {StageText} from '../components/StageText';
import {cream, EASE, GLOW} from '../theme';
import {cue, sec} from '../timings';

/** Posición de cada punto durante atracción (entran desde los costados y flotan en la franja). */
export const attractionPos = (f: number, i: number) => {
  const d = DOTS[i];
  const start = cue('atraccion') + sec(0.3) + sec(d.delay * 2.6);
  const p = prog(f, start, sec(d.dur), EASE.inOut);
  const t = f / 60;
  const floatX = Math.sin(t * 0.9 + d.phase) * 5 * p;
  const floatY = Math.cos(t * 0.7 + d.phase) * 4 * p;
  return {x: lerp(d.sx, d.tx, p) + floatX, y: lerp(d.sy, d.ty, p) + floatY, visible: f >= start};
};

/**
 * ESCENA 4 · "Uno: atracción. Que te conozca gente que todavía no te necesita. Acá no se vende, se construye memoria."
 * Franja superior iluminada. Muchos puntos crema entran desde los costados.
 */
export const Scene04Attraction: React.FC = () => {
  const f = useCurrentFrame();
  const out = cue('s5_start');
  // a partir de la escena 5 los puntos los dibuja Scene05 (continuidad de posiciones)
  const fade = f < out ? 1 : 0;
  return (
    <>
      <StageText num="01" word="Atracción" metric="Alcance · Personas nuevas" at={cue('s4_start')} wordAt={cue('atraccion')} out={out} />
      {/* los puntos se dibujan dentro del SVG del embudo (coordenadas de mundo) */}
      <AttractionDots fade={fade} />
    </>
  );
};

export const AttractionDots: React.FC<{fade: number}> = ({fade}) => {
  const f = useCurrentFrame();
  if (fade <= 0.001) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: GLOW.soft}}>
      {DOTS.map((_, i) => {
        const p = attractionPos(f, i);
        if (!p.visible) return null;
        return <circle key={i} cx={p.x} cy={p.y} r={4} fill={cream(0.85 * fade)} />;
      })}
    </svg>
  );
};
