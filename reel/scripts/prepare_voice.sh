#!/usr/bin/env bash
# Recorta la voz en off al primer y último fonema (sin silencio), le saca el ruido de fondo (RNNoise),
# la hace más nítida (EQ de presencia) y la normaliza. Duración = fotogramas exactos a 60 fps.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="source/WhatsApp Audio 2026-09-26 at 10.29.09.mp4"
START=1.26      # ataque de la "S" de "Si"
FRAMES=4319     # 71.983 s a 60 fps -> termina en la última sílaba de "este"
DUR=$(python3 -c "print(${FRAMES}/60)")
TMP=$(mktemp -d)
ffmpeg -hide_banner -loglevel error -y -ss "$START" -t "$DUR" -i "$SRC" -ac 1 -ar 48000 -c:a pcm_s16le "$TMP/raw.wav"
python3 scripts/denoise_voice.py "$TMP/raw.wav" "$TMP/clean.wav"
# nitidez: fuera graves y barro, presencia y aire, de-esser suave, compresión y -16 LUFS
ffmpeg -hide_banner -loglevel error -y -i "$TMP/clean.wav" -af "\
highpass=f=90,\
afftdn=nr=6:nf=-45,\
equalizer=f=250:t=q:w=1.2:g=-3,\
equalizer=f=3500:t=q:w=1.0:g=3.5,\
highshelf=f=8000:g=2,\
deesser=i=0.35,\
acompressor=threshold=-22dB:ratio=3:attack=6:release=110:makeup=2,\
loudnorm=I=-16:TP=-1.5:LRA=8,aresample=48000" \
  -ac 1 -ar 48000 -c:a pcm_s16le public/audio/voz.wav
ffmpeg -hide_banner -loglevel error -y -i public/audio/voz.wav -c:a libmp3lame -b:a 192k voz.mp3
rm -rf "$TMP"
echo "voz: $DUR s ($FRAMES frames)"
