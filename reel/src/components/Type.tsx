import React from 'react';
import {useCurrentFrame} from 'remotion';
import {prog} from '../anim';
import {C, EASE, F, SECONDARY, TRACK, W} from '../theme';

type Common = {
  text: string;
  /** centro vertical (px) */
  y: number;
  /** centro horizontal (px) */
  x?: number;
  size: number;
  color?: string;
  /** fotograma de entrada */
  at: number;
  /** fotograma de salida (opcional) */
  out?: number;
  /** desplazamiento de entrada en px (20–40) */
  dy?: number;
  dur?: number;
  outDur?: number;
  /** revelado por máscara en lugar de desplazamiento */
  mask?: boolean;
  opacity?: number;
  style?: React.CSSProperties;
};

const useEntrance = ({at, out, dy = 28, dur = 42, outDur = 30, mask}: Common) => {
  const f = useCurrentFrame();
  const pIn = prog(f, at, dur, EASE.out);
  const pOut = out === undefined ? 0 : prog(f, out, outDur, EASE.in);
  const opacity = pIn * (1 - pOut);
  const ty = mask ? 0 : (1 - pIn) * dy - pOut * dy * 0.5;
  const clip = mask ? `inset(${(1 - prog(f, at, dur + 12, EASE.inOut)) * 100}% 0 0 0)` : undefined;
  return {opacity, ty, clip, hidden: f < at || opacity <= 0.001};
};

const Base: React.FC<Common & {font: React.CSSProperties; track: number}> = (p) => {
  const {opacity, ty, clip, hidden} = useEntrance(p);
  if (hidden) return null;
  const x = p.x ?? W / 2;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - W / 2,
        width: W,
        top: p.y,
        transform: `translateY(calc(-50% + ${ty}px))`,
        textAlign: 'center',
        whiteSpace: 'pre',
        lineHeight: 1,
        fontSize: p.size,
        color: p.color ?? C.cream,
        letterSpacing: `${p.track}em`,
        // compensa el tracking final para centrar ópticamente
        paddingLeft: `${p.track}em`,
        opacity: opacity * (p.opacity ?? 1),
        clipPath: clip,
        ...p.font,
        ...p.style,
      }}
    >
      {p.text}
    </div>
  );
};

/** Datos, métricas y etiquetas: Jost ExtraLight, mayúsculas, tracking 0.3–0.4em */
export const Label: React.FC<Common & {track?: number}> = ({track = TRACK.normal, ...p}) => (
  <Base {...p} color={p.color ?? SECONDARY} font={F.sans} track={track} />
);

/** Frases y títulos: Cormorant Garamond Light Italic */
export const Serif: React.FC<Common> = (p) => <Base {...p} font={F.serif} track={0} />;
