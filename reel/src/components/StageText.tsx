import React from 'react';
import {C, TRACK} from '../theme';
import {sec} from '../timings';
import {Label, Serif} from './Type';

/** Bloque de texto de cada etapa: número (Jost, oro) + palabra (Cormorant) + métrica (Jost). */
export const StageText: React.FC<{num: string; word: string; metric: string; at: number; wordAt: number; out: number}> = ({
  num,
  word,
  metric,
  at,
  wordAt,
  out,
}) => (
  <>
    <Label text={num} y={1212} size={34} track={TRACK.wide} color={C.gold} at={at} out={out} />
    <Serif text={word} y={1296} size={104} at={wordAt} out={out} mask dur={sec(0.9)} />
    <Label text={metric} y={1404} size={25} at={wordAt + sec(0.9)} out={out} />
  </>
);
