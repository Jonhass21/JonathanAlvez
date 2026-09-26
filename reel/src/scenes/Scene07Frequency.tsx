import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {prog} from '../anim';
import {C, cream, EASE, F, gold, GLOW, STROKE, TRACK} from '../theme';
import {cue, sec} from '../timings';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLS = 3;
const CW = 190;
const CH = 118;
const GAP = 30;
const X0 = 540 - (COLS * CW + (COLS - 1) * GAP) / 2;
const Y0 = 600;
/** Mes que se rellena en "cada cuánto" */
export const ACTIVE_MONTH = 2;

/**
 * ESCENA 7 · "Hay una variable que casi nadie mira: cada cuánto te compra un cliente."
 * Grilla de 12 meses. En "cada cuánto" se rellena un solo mes en dorado.
 */
export const Scene07Frequency: React.FC = () => {
  const f = useCurrentFrame();
  const s7 = cue('s7_start');
  const out = 1 - prog(f, cue('s8_start') - sec(0.1), sec(0.6), EASE.inOut);
  const fill = prog(f, cue('cada_cuanto'), sec(0.9), EASE.inOut);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: GLOW.soft}}>
        {MONTHS.map((_, i) => {
          const x = X0 + (i % COLS) * (CW + GAP);
          const y = Y0 + Math.floor(i / COLS) * (CH + GAP);
          const p = prog(f, s7 + sec(0.35) + sec(i * 0.09), sec(1.1), EASE.inOut);
          if (p <= 0) return null;
          return (
            <g key={i}>
              <rect x={x} y={y} width={CW} height={CH} pathLength={1} strokeDasharray={`${p} 1`} fill="none" stroke={cream(0.7)} strokeWidth={STROKE.hair} />
              {i === ACTIVE_MONTH && fill > 0 && (
                <rect x={x} y={y + CH * (1 - fill)} width={CW} height={CH * fill} fill={gold(0.92)} stroke={C.gold} strokeWidth={STROKE.hair} />
              )}
            </g>
          );
        })}
      </svg>
      {MONTHS.map((m, i) => {
        const x = X0 + (i % COLS) * (CW + GAP);
        const y = Y0 + Math.floor(i / COLS) * (CH + GAP);
        const p = prog(f, s7 + sec(0.7) + sec(i * 0.09), sec(0.9), EASE.out);
        const active = i === ACTIVE_MONTH;
        return (
          <div
            key={m}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: CW,
              height: CH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...F.sans,
              fontSize: 26,
              letterSpacing: `${TRACK.normal}em`,
              paddingLeft: `${TRACK.normal}em`,
              color: active && fill > 0.5 ? C.bg : cream(0.6),
              opacity: p,
              transform: `translateY(${(1 - p) * 20}px)`,
            }}
          >
            {m}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
