import data from '../timings.json';

export type CueName = keyof typeof data.cues;

export const TOTAL_FRAMES: number = data.durationInFrames;
export const LAST_FRAME = TOTAL_FRAMES - 1;

/** Fotograma (absoluto) en el que se dice la palabra del cue, según Whisper. */
export const cue = (name: CueName): number => data.cues[name].frame;

/** Segundos -> fotogramas */
export const sec = (s: number): number => Math.round(s * data.fps);
