import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Brand, Grain, Vignette} from './components/Atmosphere';
import {SourceNote} from './components/SourceNote';
import {Scene01Opening} from './scenes/Scene01Opening';
import {Scene02OneNumber} from './scenes/Scene02OneNumber';
import {Scene03Stages} from './scenes/Scene03Stages';
import {Scene04Attraction} from './scenes/Scene04Attraction';
import {Scene05Consideration} from './scenes/Scene05Consideration';
import {Scene06Conversion} from './scenes/Scene06Conversion';
import {Scene07Frequency} from './scenes/Scene07Frequency';
import {Scene08OneOfTwelve} from './scenes/Scene08OneOfTwelve';
import {Scene09Moment} from './scenes/Scene09Moment';
import {Scene10LoopClose} from './scenes/Scene10LoopClose';
import {Soundtrack} from './Soundtrack';
import {C} from './theme';
import {cue, sec, TOTAL_FRAMES} from './timings';

/** Monta una escena sólo dentro de su ventana (los fotogramas siguen siendo absolutos). */
const Window: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => {
  const f = useCurrentFrame();
  return f >= from && f < to ? <>{children}</> : null;
};

export const Variables01: React.FC = () => {
  const tail = sec(1.2); // margen para los fundidos de salida entre escenas
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <Window from={0} to={cue('s2_start') + tail}>
        <Scene01Opening />
      </Window>
      <Window from={cue('s2_start')} to={cue('s3_start') + tail}>
        <Scene02OneNumber />
      </Window>
      <Window from={cue('s3_start')} to={cue('s7_start') + tail}>
        <Scene03Stages />
      </Window>
      <Window from={cue('s4_start')} to={cue('s5_start') + tail}>
        <Scene04Attraction />
      </Window>
      <Window from={cue('s5_start')} to={cue('s6_start') + tail}>
        <Scene05Consideration />
      </Window>
      <Window from={cue('s6_start')} to={cue('s7_start') + tail}>
        <Scene06Conversion />
      </Window>
      <Window from={cue('s7_start')} to={cue('s8_start') + tail}>
        <Scene07Frequency />
      </Window>
      <Window from={cue('s8_start')} to={cue('s10_start') + tail}>
        <Scene08OneOfTwelve />
      </Window>
      <Window from={cue('s9_start')} to={cue('s10_start') + tail}>
        <Scene09Moment />
      </Window>
      <Window from={cue('s10_start')} to={TOTAL_FRAMES}>
        <Scene10LoopClose />
      </Window>
      <SourceNote />
      <Vignette />
      <Brand />
      <Grain />
      <Soundtrack />
    </AbsoluteFill>
  );
};
