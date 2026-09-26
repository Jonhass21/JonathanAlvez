# VARIABLES 01 — Reel de motion graphics (Remotion)

Jonathan Alvez · consultor de marketing estratégico.
Vertical 1080×1920 · 60 fps · H.264 + AAC · 71,98 s (4319 fotogramas) · loop perfecto.

## Uso

```bash
npm install
npm run studio                                   # previsualizar y ajustar en Remotion Studio
npm run preview                                  # 5 fotogramas de control en ./preview
npx remotion render Variables01 out/variables-01.mp4
```

## Estructura

```
voz.mp3                  voz en off recortada (se transcribe esta)
timings.json             palabras con timestamps (Whisper) + cues que disparan cada animación
whisper_raw.json         salida cruda de Whisper
source/                  audio original de WhatsApp
public/audio/            voz.wav (limpia, -16 LUFS) y musica.wav (loop)
public/sfx/              efectos sintetizados
public/fonts/            Cormorant Garamond 300 Italic · Jost 200
public/grain/            grano de película
scripts/                 preparación de voz, transcripción, música, SFX, grano y previews
src/theme.ts             paleta, tipografía, zona segura y easings (centralizados)
src/timings.ts           acceso a timings.json
src/components/          embudo, textos, marca, viñeta, grano, figuras, SFX, fuente
src/scenes/              Scene01 … Scene10, una por escena del guion
src/Soundtrack.tsx       voz + música (18%) + efectos
```

## Ajustar sincronía

Todos los disparos salen de `timings.json → cues`. Para mover una animación, cambiá el `frame`
(60 fps) del cue correspondiente, o regenerá desde Whisper:

```bash
./scripts/prepare_voice.sh
npm i --no-save sts-whisper-small @huggingface/transformers
node scripts/transcribe.mjs
python3 scripts/build_timings.py
```

## Audio

- **Voz**: recortada del primer fonema de "Si" al último de "este" (sin silencios),
  high-pass, reducción de ruido leve, compresión suave y normalizada a -16 LUFS.
- **Música**: original, sintetizada en `scripts/make_music.py` (Re menor, 60 BPM: pad de cuerdas,
  drone grave, piano de fieltro, latido sub). Termina en La (dominante) y resuelve en Re menor
  al volver al inicio. La cola se suma sobre el comienzo: empalma sin fade out. Volumen 18%.
- **Efectos**: sintetizados en `scripts/make_sfx.py` (aire/whoosh, trazo, tic de reloj, campana,
  notas de fieltro, golpe grave, partículas).
