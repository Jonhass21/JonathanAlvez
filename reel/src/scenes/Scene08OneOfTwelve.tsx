import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {prog} from '../anim';
import {Figure, FIGURES, READY} from '../components/Figures';
import {Label, Serif} from '../components/Type';
import {C, cream, EASE, GLOW, STROKE, TRACK} from '../theme';
import {cue, sec} from '../timings';

/**
 * ESCENA 8 · "Si te compran una vez por año, este mes solo uno de cada doce está listo para comprar.
 * El resto no te está ignorando: todavía no te necesita."
 * 12 figuras; en "uno de cada doce" una se ilumina en dorado y las otras 11 quedan al 25%.
 */
export const Scene08OneOfTwelve: React.FC = () => {
  const f = useCurrentFrame();
  const s8 = cue('s8_start');
  const one = cue('uno_de_cada');
  const out = cue('s10_start');
  const fadeOut = 1 - prog(f, out, sec(0.45), EASE.inOut);
  const pick = prog(f, one, sec(0.9), EASE.inOut);
  const dim = 0.85 - 0.6 * pick; // 85% → 25%
  const quiet = 1 - 0.6 * prog(f, cue('s9_start'), sec(1.2), EASE.inOut); // el texto cede foco en la escena 9

  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <div style={{position: 'absolute', inset: 0, opacity: quiet}}>
        <Serif text="1 de 12" y={560} size={156} at={one} dur={sec(0.9)} mask />
        <Label text="Este mes" y={676} size={30} track={TRACK.wide} at={one + sec(0.4)} />
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: GLOW.soft}}>
        {FIGURES.map((p, i) => {
          const draw = prog(f, s8 + sec(0.3) + sec(i * 0.08), sec(1.2), EASE.inOut);
          if (draw <= 0) return null;
          const isReady = i === READY;
          const stroke = isReady ? interpolateColors(pick, [0, 1], [cream(0.85), C.gold]) : cream(dim);
          return <Figure key={i} x={p.x} y={p.y} draw={draw} stroke={stroke} width={isReady ? STROKE.line : STROKE.hair} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
