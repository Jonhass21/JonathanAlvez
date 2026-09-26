import React from 'react';
import {useCurrentFrame} from 'remotion';
import {prog} from '../anim';
import {CAM_FULL, CAM_TIP, camLerp, Funnel} from '../components/Funnel';
import {EASE} from '../theme';
import {cue, LAST_FRAME, sec} from '../timings';

/**
 * ESCENA 10 · CIERRE DEL LOOP · "Por eso, el error más común es este:"
 * Vuelve el embudo completo con las tres franjas y hace zoom in continuo a la punta
 * hasta el encuadre EXACTO del primer fotograma (último fotograma == primero).
 */
export const Scene10LoopClose: React.FC = () => {
  const f = useCurrentFrame();
  const s10 = cue('s10_start');
  const inP = prog(f, s10, sec(0.5), EASE.inOut);
  const zoomFrom = s10 + sec(0.3);
  const t = prog(f, zoomFrom, LAST_FRAME - zoomFrom, EASE.inOut);
  const cam = camLerp(CAM_FULL, CAM_TIP, t);
  const label = prog(f, LAST_FRAME - sec(0.6), sec(0.6), EASE.out);
  return <Funnel cam={cam} opacity={inP} seps={[1, 1]} salesLabel={label} />;
};
