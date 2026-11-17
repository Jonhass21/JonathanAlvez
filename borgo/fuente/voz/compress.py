"""Acorta silencios internos largos (>MAXP) de cada frase y re-mapea las marcas de tiempo."""
import json, wave, numpy as np, sys
SR=44100; MAXP=0.26; HOP=int(0.01*SR)
for n in ('masculina','femenina'):
    for i in range(6):
        w=wave.open(f'{n}_{i}.wav'); x=np.frombuffer(w.readframes(w.getnframes()),np.int16)/32768.0; w.close()
        rms=np.sqrt(np.convolve(x**2,np.ones(HOP*2)/(HOP*2),'same'))[::HOP]
        thr=rms.max()*10**(-36/20); sil=rms<thr
        # tramos de silencio (en ventanas de 10 ms)
        runs=[];k=0
        while k<len(sil):
            if sil[k]:
                j=k
                while j<len(sil) and sil[j]: j+=1
                runs.append((k*HOP/SR,j*HOP/SR)); k=j
            else: k+=1
        first=next((b for a,b in runs if a<=0.001),0.0)
        last=next((a for a,b in reversed(runs) if b>=len(x)/SR-0.02),len(x)/SR)
        maxp=0.45 if i==0 else MAXP   # en el gancho dejamos una pausa dramática antes del "No."
        cuts=[(a+maxp/2,b-maxp/2) for a,b in runs if a>first and b<last and b-a>maxp]
        cuts=[(0,max(0,first-0.03))]+cuts+[(last+0.12,len(x)/SR)]
        keep=np.ones(len(x),bool)
        for a,b in cuts: keep[int(a*SR):int(b*SR)]=False
        y=x[keep]
        def mp(t): return t-sum(max(0,min(t,b)-a) for a,b in cuts if t>a)
        al=json.load(open(f'{n}_{i}.json'))
        al['character_start_times_seconds']=[mp(t) for t in al['character_start_times_seconds']]
        al['character_end_times_seconds']=[mp(t) for t in al['character_end_times_seconds']]
        json.dump(al,open(f'{n}_{i}_c.json','w'))
        w=wave.open(f'{n}_{i}_c.wav','wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((y*32767).astype(np.int16).tobytes());w.close()
        print(n,i,f'{len(x)/SR:.2f}s -> {len(y)/SR:.2f}s',[f'{b-a:.2f}' for a,b in cuts[1:-1]])
