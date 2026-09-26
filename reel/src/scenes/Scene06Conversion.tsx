import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {lerp, prog} from '../anim';
import {CONVERTER} from '../components/dots';
import {FUNNEL} from '../components/Funnel';
import {StageText} from '../components/StageText';
import {C, cream, EASE, gold, STROKE} from '../theme';
import {cue, sec} from '../timings';
import {considerPos} from './Scene05Consideration';

const CLOCK = {x: 300, y: 940, r: 58};

/**
 * ESCENA 6 · "Tres: conversión. El momento de decidir. Acá se pierde por responder tarde o complicar la compra."
 * Franja inferior. Un solo punto dorado cruza hacia la salida. En "responder tarde", reloj de línea fina.
 */
export const Scene06Conversion: React.FC = () => {
  const f = useCurrentFrame();
  const s6 = cue('s6_start');
  const out = cue('s7_start');
  const fadeOut = 1 - prog(f, out - sec(0.1), sec(0.6), EASE.inOut);

  // punto: se vuelve dorado y cruza la franja inferior hasta la salida
  const from = considerPos(s6, CONVERTER);
  const toGold = prog(f, s6, sec(0.8), EASE.inOut);
  const cross = prog(f, cue('conversion') + sec(0.2), sec(3.2), EASE.inOut);
  const pts = [
    [from.x, from.y],
    [540, 900],
    [540, FUNNEL.spoutY + 40],
  ];
  const seg = cross < 0.5 ? 0 : 1;
  const lt = cross < 0.5 ? cross * 2 : (cross - 0.5) * 2;
  const x = lerp(pts[seg][0], pts[seg + 1][0], lt);
  const y = lerp(pts[seg][1], pts[seg + 1][1], lt);
  const exitFade = 1 - prog(f, cue('conversion') + sec(3.0), sec(0.6), EASE.inOut);

  // reloj
  const rt = cue('responder_tarde');
  const clockIn = prog(f, rt, sec(0.8), EASE.inOut);
  const hand = prog(f, rt + sec(0.3), out - rt - sec(0.3), (t) => t); // avance continuo
  const ang = (-90 + hand * 330) * (Math.PI / 180);

  return (
    <AbsoluteFill>
      <StageText num="03" word="Conversión" metric="Tasa de cierre" at={s6} wordAt={cue('conversion')} out={out} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: fadeOut}}>
        {/* estela sutil del recorrido */}
        {cross > 0 && cross < 1 && (
          <line x1={540} y1={Math.max(900, y - 60)} x2={540} y2={y} stroke={gold(0.35 * exitFade)} strokeWidth={1} />
        )}
        <circle cx={x} cy={y} r={lerp(4, 6, toGold)} fill={toGold < 1 ? cream(0.85 * (1 - toGold)) : 'none'} />
        <circle cx={x} cy={y} r={lerp(4, 6, toGold)} fill={gold(toGold * exitFade)} />
        {clockIn > 0 && (
          <g>
            <circle
              cx={CLOCK.x}
              cy={CLOCK.y}
              r={CLOCK.r}
              pathLength={1}
              strokeDasharray={`${clockIn} 1`}
              transform={`rotate(-90 ${CLOCK.x} ${CLOCK.y})`}
              fill="none"
              stroke={cream(0.6)}
              strokeWidth={STROKE.hair}
            />
            {Array.from({length: 12}, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const r0 = CLOCK.r - (i % 3 === 0 ? 11 : 6);
              return (
                <line
                  key={i}
                  x1={CLOCK.x + Math.cos(a) * r0}
                  y1={CLOCK.y + Math.sin(a) * r0}
                  x2={CLOCK.x + Math.cos(a) * (CLOCK.r - 2)}
                  y2={CLOCK.y + Math.sin(a) * (CLOCK.r - 2)}
                  stroke={cream(0.45 * clockIn)}
                  strokeWidth={1}
                />
              );
            })}
            <line x1={CLOCK.x} y1={CLOCK.y} x2={CLOCK.x + 26} y2={CLOCK.y - 15} stroke={cream(0.6 * clockIn)} strokeWidth={STROKE.hair} strokeLinecap="round" />
            <line
              x1={CLOCK.x}
              y1={CLOCK.y}
              x2={CLOCK.x + Math.cos(ang) * (CLOCK.r - 14)}
              y2={CLOCK.y + Math.sin(ang) * (CLOCK.r - 14)}
              stroke={C.gold}
              strokeOpacity={clockIn}
              strokeWidth={STROKE.line}
              strokeLinecap="round"
            />
            <circle cx={CLOCK.x} cy={CLOCK.y} r={2.5} fill={gold(clockIn)} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
