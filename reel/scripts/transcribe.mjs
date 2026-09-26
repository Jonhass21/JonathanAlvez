// Transcripción local con Whisper (small, ONNX q8 vía transformers.js) con timestamps por palabra.
// Uso: WHISPER_DIR=/ruta/a/models node scripts/transcribe.mjs   (modelo: npm i sts-whisper-small)
// Requiere ffmpeg en el PATH. Escribe ./whisper_raw.json
import {pipeline, env} from '@huggingface/transformers';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

env.allowRemoteModels = false;
env.localModelPath = process.env.WHISPER_DIR ?? './node_modules/sts-whisper-small/models/';
const pcm = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', 'voz.mp3', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], {maxBuffer: 1 << 28});
const audio = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {dtype: 'q8'});
const out = await asr(audio, {language: 'spanish', task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5});
fs.writeFileSync('whisper_raw.json', JSON.stringify({model: 'whisper-small (q8)', source: 'voz.mp3', ...out}, null, 1));
console.log(out.text);
