#!/usr/bin/env bash
# Recorta la voz en off al primer y último fonema (sin silencio), la limpia y normaliza.
# Inicio/fin detectados por envolvente RMS (ver README). Duración = frames exactos a 60 fps.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="source/WhatsApp Audio 2026-09-26 at 10.29.09.mp4"
START=1.26      # ataque de la "S" de "Si"
FRAMES=4319     # 71.983 s a 60 fps -> termina en la última sílaba de "este"
DUR=$(python3 -c "print(${FRAMES}/60)")
ffmpeg -hide_banner -loglevel error -y -ss "$START" -t "$DUR" -i "$SRC" \
  -af "highpass=f=75,afftdn=nr=8:nf=-38,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000" \
  -ac 1 -ar 48000 -c:a pcm_s16le public/audio/voz.wav
ffmpeg -hide_banner -loglevel error -y -i public/audio/voz.wav -c:a libmp3lame -b:a 192k voz.mp3
echo "voz: $DUR s ($FRAMES frames)"
