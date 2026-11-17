import json, base64, subprocess, urllib.request, sys, os
SEG=["¿Marketing, publicidad y ventas son lo mismo? No.",
     "Marketing es la estrategia: a quién le hablás y qué le decís.",
     "Publicidad hace que esas personas te vean.",
     "Ventas convierte ese interés en una decisión.",
     "Separadas suman. Juntas, generan acción.",
     "Borgo. Estrategia digital para emprendedores."]
VOICES={"masculina":"JBFqnCBsd6RMkjVDRZzb","femenina":"EXAVITQu4vr4xnSDxMaL"}
os.chdir(os.path.dirname(os.path.abspath(__file__)))
for name,vid in VOICES.items():
    for i,txt in enumerate(SEG):
        out=f"{name}_{i}"
        if os.path.exists(out+".json"): continue
        body={"text":txt,"model_id":"eleven_multilingual_v2","language_code":"es",
              "voice_settings":{"stability":0.45,"similarity_boost":0.8,"style":0.15,"use_speaker_boost":True,"speed":(1.2 if name=="femenina" else 1.12)},
              "previous_text":" ".join(SEG[:i])[-300:] or None,"next_text":" ".join(SEG[i+1:])[:300] or None}
        req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps(body).encode(),headers={"xi-api-key":"proxy-injected","Content-Type":"application/json"})
        d=json.load(urllib.request.urlopen(req,timeout=120))
        open(out+".mp3","wb").write(base64.b64decode(d["audio_base64"]))
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",out+".mp3","-ar","44100","-ac","1",out+".wav"],check=True)
        json.dump(d["alignment"],open(out+".json","w"))
        a=d["alignment"]; print(name,i,round(a["character_end_times_seconds"][-1],2),"s")
