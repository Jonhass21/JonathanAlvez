import React from 'react';
import {useCurrentFrame} from 'remotion';
import {prog} from '../anim';
import {CAM_FULL, CAM_TIP, Camera, camLerp, Funnel} from '../components/Funnel';
import {EASE} from '../theme';
import {cue, sec} from '../timings';

/** Deriva lentísima del primer plano: continúa el movimiento del zoom-in final (loop). */
export const DRIFT_PER_FRAME = 0.00022;

/**
 * ESCENA 1 · "Si solo medís ventas, estás mirando el final de una película que no viste."
 * Línea de ventas cayendo en primer plano. En "película": zoom out lento → punta de un embudo dorado.
 */
export const Scene01Opening: React.FC = () => {
  const f = useCurrentFrame();
  const zoomAt = cue('pelicula');
  const zoomDur = sec(2.4);

  const drift: Camera = {...CAM_TIP, z: CAM_TIP.z * Math.exp(DRIFT_PER_FRAME * Math.min(f, zoomAt))};
  const cam = camLerp(drift, CAM_FULL, prog(f, zoomAt, zoomDur, EASE.inOut));
  const label = 1 - prog(f, zoomAt, sec(0.6), EASE.in);
  const opacity = 1 - prog(f, cue('s2_start') + sec(0.1), sec(0.6), EASE.inOut);

  // "ventas": la línea se apaga a un rastro y se vuelve a trazar cayendo, acelerando (la caída se entiende)
  const v = cue('ventas');
  const dimIn = prog(f, v - sec(0.15), sec(0.15), EASE.inOut);
  const trace = f < v - sec(0.15) ? 1 : prog(f, v, sec(1.5), EASE.in);
  const ghost = trace >= 1 ? 0 : dimIn;

  return <Funnel cam={cam} opacity={opacity} salesLabel={label} trace={trace} ghost={ghost} />;
};
