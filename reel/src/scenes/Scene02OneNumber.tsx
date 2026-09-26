import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {prog} from '../anim';
import {Label} from '../components/Type';
import {C, EASE, GLOW, H, STROKE, W} from '../theme';
import {cue, sec} from '../timings';

const Strike: React.FC<{at: number; y: number; half: number; out: number}> = ({at, y, half, out}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, sec(0.7), EASE.inOut);
  const o = 1 - prog(f, out, sec(0.5), EASE.in);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: o, filter: GLOW.gold}}>
      <line x1={W / 2 - half} y1={y} x2={W / 2 - half + 2 * half * p} y2={y} stroke={C.gold} strokeWidth={STROKE.line} strokeLinecap="round" />
    </svg>
  );
};

/** Círculo dorado que se dibuja alrededor de "$ VENTAS": la variable de la que hablamos. */
export const CIRCLE_AT = (s2: number) => s2 + sec(1.2);
const Circle: React.FC<{at: number; out: number}> = ({at, out}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, sec(1.1), EASE.inOut);
  const o = 1 - prog(f, out, sec(0.5), EASE.in);
  if (p <= 0) return null;
  // elipse levemente inclinada que cierra con un pequeño solape, como un trazo a mano precisa
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: o, filter: GLOW.gold}}>
      <ellipse
        cx={W / 2 + 6}
        cy={862}
        rx={352}
        ry={104}
        transform={`rotate(-3 ${W / 2} 862) rotate(180 ${W / 2 + 6} 862)`}
        pathLength={1}
        strokeDasharray={`${p * 1.03} 2`}
        fill="none"
        stroke={C.gold}
        strokeWidth={STROKE.line}
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * ESCENA 2 · "La mayoría de los negocios mira un solo número. Y cuando baja, reacciona igual:
 * más publicidad o precio más bajo."
 */
export const Scene02OneNumber: React.FC = () => {
  const f = useCurrentFrame();
  const out = cue('s3_start') - sec(0.1);
  const pub = cue('mas_publicidad');
  const pre = cue('precio_bajo');
  // "cuando baja": el número desciende apenas
  const sink = prog(f, cue('cuando_baja'), sec(1.4), EASE.inOut);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${sink * 22}px)`, opacity: 1 - sink * 0.15}}>
        <Label text="$ Ventas" y={860} size={78} track={0.34} color={C.cream} at={cue('s2_start') + sec(0.35)} out={out} dur={sec(1)} />
        <Circle at={CIRCLE_AT(cue('s2_start'))} out={out} />
      </div>
      <Label text="+ Publicidad" y={1070} size={40} at={pub} out={out} />
      <Strike at={pub + sec(0.75)} y={1070} half={215} out={out} />
      <Label text="– Precio" y={1170} size={40} at={pre} out={out} />
      <Strike at={pre + sec(0.75)} y={1170} half={150} out={out} />
    </AbsoluteFill>
  );
};
