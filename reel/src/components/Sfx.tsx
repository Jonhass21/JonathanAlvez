import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';
import {sec} from '../timings';

/** Efecto de sonido disparado en un fotograma absoluto. */
export const Sfx: React.FC<{at: number; name: string; volume: number; len?: number}> = ({at, name, volume, len = 4}) => (
  <Sequence from={Math.max(0, at)} durationInFrames={sec(len)} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);
