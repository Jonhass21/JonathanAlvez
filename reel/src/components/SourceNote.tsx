import React from 'react';
import {useCurrentFrame} from 'remotion';
import {visible} from '../anim';
import {cream, F} from '../theme';
import {cue, sec} from '../timings';

/** Fuente de la regla 95:5, desde la escena 7 hasta el final de la escena 8 (dentro de la zona segura). */
export const SourceNote: React.FC = () => {
  const f = useCurrentFrame();
  const o = visible(f, cue('s7_start') + sec(0.6), cue('s9_start'), sec(0.6));
  if (o <= 0.001) return null;
  const line: React.CSSProperties = {
    ...F.sans,
    fontSize: 19,
    letterSpacing: '0.3em',
    paddingLeft: '0.3em',
    color: cream(0.5),
    lineHeight: 1,
    textAlign: 'center',
  };
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: 1408, opacity: o}}>
      <div style={line}>Basado en la regla 95:5</div>
      <div style={{...line, marginTop: 14}}>J. Dawes · Ehrenberg-Bass Institute (2021)</div>
    </div>
  );
};
