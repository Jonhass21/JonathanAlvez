import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {F, SAFE, SECONDARY, TRACK} from '../theme';
import {LAST_FRAME} from '../timings';

/** Firma fija de marca, arriba a la izquierda dentro de la zona segura. */
export const Brand: React.FC = () => (
  <div style={{position: 'absolute', left: SAFE.left, top: SAFE.top + 34}}>
    <div style={{...F.sans, fontSize: 24, letterSpacing: `${TRACK.wide}em`, color: SECONDARY, lineHeight: 1}}>
      Variables
    </div>
    <div style={{...F.serif, fontSize: 30, color: SECONDARY, marginTop: 12, lineHeight: 1}}>Jonathan Alvez</div>
  </div>
);

/** Viñeta suave (claroscuro): sólo oscurece los bordes, no introduce color. */
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.46) 100%)',
    }}
  />
);

/** Grano de película muy sutil. El último fotograma usa el mismo grano que el primero (loop). */
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const i = f === LAST_FRAME ? 0 : Math.floor(f / 2) % 8;
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.1}}>
      <Img src={staticFile(`grain/grain_${i}.png`)} style={{width: '100%', height: '100%'}} />
    </AbsoluteFill>
  );
};
