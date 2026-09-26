"""Convierte whisper_raw.json -> timings.json (palabras + cues de animación por palabra)."""
import json
FPS = 60
TOTAL_FRAMES = 4319
raw = json.load(open("whisper_raw.json"))
words = []
for c in raw["chunks"]:
    s, e = c["timestamp"]
    words.append({"w": c["text"].strip(), "start": round(s, 2), "end": round(min(e or s, TOTAL_FRAMES / FPS), 2)})

def find(seq, after=0.0):
    """Primer índice donde empiezan las palabras `seq` (sin puntuación) a partir de `after` s."""
    seq = seq.lower().split()
    norm = lambda w: w.lower().strip(".,:;")
    for i in range(len(words) - len(seq) + 1):
        if words[i]["start"] >= after and all(norm(words[i + k]["w"]) == seq[k] for k in range(len(seq))):
            return i
    raise ValueError(seq)

# cue -> (palabras que lo disparan, a partir de qué segundo buscar)
CUES = {
    "s1_start":        None,
    "pelicula":        ("película", 0),
    "s2_start":        ("la mayoría", 0),
    "cuando_baja":     ("baja", 0),
    "mas_publicidad":  ("más publicidad", 0),
    "precio_bajo":     ("precios más", 0),
    "s3_start":        ("pero la venta", 0),
    "tres_etapas":     ("tres etapas", 0),
    "s4_start":        ("uno", 20),
    "atraccion":       ("atracción", 0),
    "gente":           ("gente", 0),
    "memoria":         ("memoria", 0),
    "s5_start":        ("dos", 30),
    "consideracion":   ("consideración", 0),
    "comparan":        ("comparan", 0),
    "prueba":          ("con pruebas", 0),
    "s6_start":        ("y la tercera", 0),
    "conversion":      ("conversión", 0),
    "decidir":         ("momento de decidir", 0),
    "responder_tarde": ("responder tarde", 0),
    "s7_start":        ("hay una variable", 0),
    "cada_cuanto":     ("cada cuanto", 0),
    "s8_start":        ("si te compran", 0),
    "uno_de_cada":     ("uno de cada", 0),
    "s9_start":        ("el que te recuerda", 0),
    "compra_final":    ("compra", 68),
    "s10_start":       ("por eso", 0),
    "este":            ("este", 70),
}
cues = {}
for k, v in CUES.items():
    if v is None:
        t = 0.0; word = "(inicio)"
    else:
        i = find(*v); t = words[i]["start"]; word = " ".join(w["w"] for w in words[i:i + len(v[0].split())])
    cues[k] = {"t": t, "frame": round(t * FPS), "word": word}
cues["end"] = {"t": round(TOTAL_FRAMES / FPS, 3), "frame": TOTAL_FRAMES, "word": "fin de «este»"}
json.dump({"fps": FPS, "durationInFrames": TOTAL_FRAMES, "source": "voz.mp3", "model": raw.get("model"),
           "cues": cues, "words": words}, open("timings.json", "w"), ensure_ascii=False, indent=1)
for k, v in cues.items():
    print(f"{k:16s} {v['t']:6.2f}s  f{v['frame']:5d}  «{v['word']}»")
