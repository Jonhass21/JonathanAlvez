import React from 'react';
import {Html5Audio, staticFile} from 'remotion';
import {Sfx} from './components/Sfx';
import {cue, LAST_FRAME, sec} from './timings';
import {lightAt} from './scenes/Scene09Moment';

/** Volumen de la música: 18% (siempre por debajo de la voz, normalizada a -16 LUFS). */
export const MUSIC_VOLUME = 0.18;

/**
 * Voz + música + efectos. Sin fades de audio: la música ya viene cortada para empalmar
 * su final con su inicio (ver scripts/make_music.py).
 */
export const Soundtrack: React.FC = () => (
  <>
    <Html5Audio src={staticFile('audio/voz.wav')} volume={1} />
    <Html5Audio src={staticFile('audio/musica.wav')} volume={MUSIC_VOLUME} />

    {/* 1 · zoom out en "película" */}
    <Sfx at={cue('pelicula') - sec(0.15)} name="whoosh_out" volume={0.32} />
    {/* 2 · un solo número, publicidad y precio tachados */}
    <Sfx at={cue('s2_start') + sec(0.3)} name="text_in" volume={0.22} />
    <Sfx at={cue('mas_publicidad')} name="text_in" volume={0.16} />
    <Sfx at={cue('mas_publicidad') + sec(0.75)} name="stroke" volume={0.3} />
    <Sfx at={cue('precio_bajo')} name="text_in" volume={0.16} />
    <Sfx at={cue('precio_bajo') + sec(0.75)} name="stroke" volume={0.3} />
    {/* 3 · vuelve el embudo, tres etapas */}
    <Sfx at={cue('s3_start') - sec(0.2)} name="air" volume={0.22} />
    <Sfx at={cue('tres_etapas')} name="boom" volume={0.34} />
    <Sfx at={cue('tres_etapas')} name="stroke" volume={0.22} />
    <Sfx at={cue('tres_etapas') + sec(0.45)} name="stroke" volume={0.22} />
    {/* 4 · atracción: muchos puntos */}
    <Sfx at={cue('s4_start')} name="text_in" volume={0.18} />
    <Sfx at={cue('atraccion') + sec(0.4)} name="dots" volume={0.3} />
    <Sfx at={cue('atraccion') + sec(2.2)} name="dots" volume={0.2} />
    {/* 5 · consideración: prueba */}
    <Sfx at={cue('s5_start')} name="text_in" volume={0.18} />
    <Sfx at={cue('consideracion') + sec(0.2)} name="dots" volume={0.16} />
    <Sfx at={cue('prueba')} name="chime" volume={0.2} />
    {/* 6 · conversión: punto dorado y reloj */}
    <Sfx at={cue('s6_start')} name="text_in" volume={0.18} />
    <Sfx at={cue('conversion') + sec(0.2)} name="note_01" volume={0.22} />
    {Array.from({length: 7}, (_, i) => (
      <Sfx key={`t${i}`} at={cue('responder_tarde') + sec(0.3 + i * 0.5)} name="tick" volume={0.2} len={0.5} />
    ))}
    {/* 7 · grilla de meses */}
    <Sfx at={cue('s7_start') - sec(0.1)} name="air" volume={0.22} />
    <Sfx at={cue('s7_start') + sec(0.4)} name="stroke" volume={0.18} />
    <Sfx at={cue('cada_cuanto')} name="chime" volume={0.24} />
    {/* 8 · uno de cada doce */}
    <Sfx at={cue('s8_start') - sec(0.1)} name="air" volume={0.2} />
    <Sfx at={cue('uno_de_cada')} name="chime" volume={0.24} />
    {/* 9 · las otras 11 se iluminan */}
    {Array.from({length: 11}, (_, k) => (
      <Sfx key={`n${k}`} at={lightAt(k)} name={`note_${String(k + 1).padStart(2, '0')}`} volume={0.2} len={3} />
    ))}
    {/* 10 · zoom in de cierre, termina justo en el último fotograma */}
    <Sfx at={cue('s10_start') - sec(0.1)} name="air" volume={0.18} />
    <Sfx at={LAST_FRAME + 1 - sec(2.4)} name="whoosh_in" volume={0.24} len={2.4} />
  </>
);
