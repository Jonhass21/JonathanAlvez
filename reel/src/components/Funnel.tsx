import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lerp} from '../anim';
import {C, cream, F, GLOW, H, SECONDARY, STROKE, TRACK, W} from '../theme';

// ─── Geometría del embudo (coordenadas de mundo = pantalla con zoom 1) ──────
export const FUNNEL = {
  topY: 400,
  botY: 1040,
  topL: 170,
  topR: 910,
  neckL: 495,
  neckR: 585,
  spoutY: 1130,
} as const;

export const wallX = (y: number, side: 'L' | 'R') => {
  const t = (y - FUNNEL.topY) / (FUNNEL.botY - FUNNEL.topY);
  return side === 'L' ? lerp(FUNNEL.topL, FUNNEL.neckL, t) : lerp(FUNNEL.topR, FUNNEL.neckR, t);
};

const bandH = (FUNNEL.botY - FUNNEL.topY) / 3;
/** límites [y0, y1] de cada franja (0 = atracción, 1 = consideración, 2 = conversión) */
export const BANDS = [0, 1, 2].map((i) => [FUNNEL.topY + i * bandH, FUNNEL.topY + (i + 1) * bandH]);

// ─── Línea de ventas en la punta (el primer y último fotograma) ─────────────
/** Punto de la punta al que apunta la cámara */
export const TIP = {x: 540, y: 1085};
/** Zoom del primer fotograma: la línea de ventas en primer plano */
export const Z0 = 9;
const SALES: [number, number][] = [
  [503, 1057], [511, 1053], [519, 1062], [527, 1059], [535, 1071],
  [543, 1067], [551, 1082], [559, 1090], [567, 1096], [577, 1113],
];
const salesD = 'M' + SALES.map(([x, y]) => `${x} ${y}`).join(' L');

/** Recorte de la línea de ventas hasta la fracción `t` de su longitud (para el efecto de caída). */
const salesUpTo = (t: number) => {
  const seg = SALES.slice(1).map((p, i) => Math.hypot(p[0] - SALES[i][0], p[1] - SALES[i][1]));
  let left = seg.reduce((a, b) => a + b, 0) * t;
  const pts: [number, number][] = [SALES[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      pts.push(SALES[i + 1]);
      left -= seg[i];
    } else {
      const k = left / seg[i];
      pts.push([lerp(SALES[i][0], SALES[i + 1][0], k), lerp(SALES[i][1], SALES[i + 1][1], k)]);
      break;
    }
  }
  return {d: 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L'), tip: pts[pts.length - 1]};
};

export type Camera = {z: number; /** posición en pantalla de TIP */ sx: number; sy: number};
/** Encuadre del embudo completo */
export const CAM_FULL: Camera = {z: 1, sx: TIP.x, sy: TIP.y};
/** Encuadre del primer fotograma (idéntico al último) */
export const CAM_TIP: Camera = {z: Z0, sx: W / 2, sy: H / 2};

/** Interpolación de cámara: zoom logarítmico, la punta se desliza en pantalla. */
export const camLerp = (a: Camera, b: Camera, t: number): Camera => ({
  z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t)),
  sx: lerp(a.sx, b.sx, t),
  sy: lerp(a.sy, b.sy, t),
});

export type FunnelProps = {
  cam: Camera;
  /** opacidad global de la capa */
  opacity?: number;
  /** progreso de dibujo de cada separador (0–1) */
  seps?: [number, number];
  /** opacidad de los trazos de cada franja */
  wall?: [number, number, number];
  /** relleno crema tenue de la franja activa */
  fill?: [number, number, number];
  /** opacidad de la etiqueta "VENTAS" (en pantalla) */
  salesLabel?: number;
  /** efecto de caída: la línea se re-traza cayendo (0–1). `ghost` = rastro tenue de la línea completa */
  trace?: number;
  ghost?: number;
  children?: React.ReactNode;
};

export const Funnel: React.FC<FunnelProps> = ({
  cam,
  opacity = 1,
  seps = [0, 0],
  wall = [1, 1, 1],
  fill = [0, 0, 0],
  salesLabel = 0,
  trace = 1,
  ghost = 0,
  children,
}) => {
  if (opacity <= 0.001) return null;
  const vw = W / cam.z;
  const vh = H / cam.z;
  const cx = TIP.x - (cam.sx - W / 2) / cam.z;
  const cy = TIP.y - (cam.sy - H / 2) / cam.z;
  const px = (n: number) => n / cam.z; // tamaño constante en pantalla
  const ns = {vectorEffect: 'non-scaling-stroke' as const, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};

  const band = (i: number) => {
    const [y0, y1] = BANDS[i];
    return {y0, y1, l0: wallX(y0, 'L'), r0: wallX(y0, 'R'), l1: wallX(y1, 'L'), r1: wallX(y1, 'R')};
  };
  const sepY = [BANDS[0][1], BANDS[1][1]];
  const sepOp = [Math.max(wall[0], wall[1]), Math.max(wall[1], wall[2])];

  return (
    <AbsoluteFill style={{opacity}}>
      <svg width={W} height={H} viewBox={`${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`} style={{filter: GLOW.soft}}>
        {/* rellenos de franja activa */}
        {[0, 1, 2].map((i) => {
          const b = band(i);
          return fill[i] > 0.001 ? (
            <polygon key={`f${i}`} points={`${b.l0},${b.y0} ${b.r0},${b.y0} ${b.r1},${b.y1} ${b.l1},${b.y1}`} fill={cream(0.06 * fill[i])} />
          ) : null;
        })}
        {/* borde superior */}
        <line x1={FUNNEL.topL} y1={FUNNEL.topY} x2={FUNNEL.topR} y2={FUNNEL.topY} stroke={C.gold} strokeOpacity={wall[0]} strokeWidth={STROKE.hair} {...ns} />
        {/* paredes por franja */}
        {[0, 1, 2].map((i) => {
          const b = band(i);
          return (
            <g key={`w${i}`} stroke={C.gold} strokeOpacity={wall[i]} strokeWidth={STROKE.hair}>
              <line x1={b.l0} y1={b.y0} x2={b.l1} y2={b.y1} {...ns} />
              <line x1={b.r0} y1={b.y0} x2={b.r1} y2={b.y1} {...ns} />
            </g>
          );
        })}
        {/* cuello / salida */}
        <g stroke={C.gold} strokeOpacity={wall[2]} strokeWidth={STROKE.hair}>
          <line x1={FUNNEL.neckL} y1={FUNNEL.botY} x2={FUNNEL.neckL} y2={FUNNEL.spoutY} {...ns} />
          <line x1={FUNNEL.neckR} y1={FUNNEL.botY} x2={FUNNEL.neckR} y2={FUNNEL.spoutY} {...ns} />
        </g>
        {/* separadores de etapas, dibujados de izquierda a derecha */}
        {sepY.map((y, i) => {
          const p = seps[i];
          if (p <= 0.001) return null;
          const l = wallX(y, 'L');
          const r = wallX(y, 'R');
          return <line key={`s${i}`} x1={l} y1={y} x2={lerp(l, r, p)} y2={y} stroke={C.gold} strokeOpacity={sepOp[i]} strokeWidth={STROKE.hair} {...ns} />;
        })}
        {/* línea de ventas cayendo */}
        <line x1={500} y1={1122} x2={580} y2={1122} stroke={cream(0.45)} strokeWidth={1.5} {...ns} />
        {ghost > 0 && <path d={salesD} stroke={C.cream} strokeOpacity={1 - 0.82 * ghost} strokeWidth={STROKE.sales} {...ns} />}
        {(() => {
          const s = trace >= 1 ? {d: salesD, tip: SALES[SALES.length - 1]} : salesUpTo(trace);
          const o = Math.max(0.35, wall[2]);
          return (
            <>
              {trace > 0.001 && <path d={s.d} stroke={C.cream} strokeOpacity={o} strokeWidth={STROKE.sales} {...ns} />}
              <circle cx={s.tip[0]} cy={s.tip[1]} r={px(8)} fill={C.gold} fillOpacity={o} />
            </>
          );
        })()}
        {children}
      </svg>
      {salesLabel > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: W,
            top: cam.sy - (TIP.y - 1040) * cam.z + 86,
            textAlign: 'center',
            ...F.sans,
            fontSize: 28,
            letterSpacing: `${TRACK.wide}em`,
            paddingLeft: `${TRACK.wide}em`,
            color: SECONDARY,
            opacity: salesLabel,
            lineHeight: 1,
          }}
        >
          Ventas
        </div>
      )}
    </AbsoluteFill>
  );
};
