import numpy as np, wave
SR=44100; DUR=19.0; out=np.zeros(int(SR*DUR)); rng=np.random.default_rng(7)
fr=lambda f: f/12.0
def band(n,lo,hi):
    x=rng.standard_normal(n); X=np.fft.rfft(x); fq=np.fft.rfftfreq(n,1/SR); X[(fq<lo)|(fq>hi)]=0; y=np.fft.irfft(X,n); return y/(np.abs(y).max()+1e-9)
def add(t0,sig,g):
    i=int(t0*SR); j=min(len(out),i+len(sig)); out[i:j]+=sig[:j-i]*g
def env(n,a,d):
    t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-t/d)
def pencil(f0,f1,g=0.10):
    n=int((fr(f1)-fr(f0))*SR); t=np.arange(n)/SR
    am=np.abs(np.sin(2*np.pi*(7+rng.random()*3)*t))**0.6*(0.6+0.4*rng.random(n).cumsum()%1*0)
    fade=np.minimum(1,np.minimum(t/0.03,(t[-1]-t)/0.05+1e-3))
    add(fr(f0),band(n,1800,7000)*am*fade,g)
def tick(f,g=0.22):
    n=int(0.05*SR); t=np.arange(n)/SR
    add(fr(f),band(n,1500,6000)*np.exp(-t/0.008)+0.5*np.sin(2*np.pi*1700*t)*np.exp(-t/0.012),g)
def paper(f,g=0.22):
    n=int(0.32*SR); t=np.arange(n)/SR; e=np.sin(np.pi*t/t[-1])**2
    add(fr(f)-0.05,band(n,250,5000)*e,g)
def thump(f,g=0.55):
    n=int(0.35*SR); t=np.arange(n)/SR; ph=2*np.pi*np.cumsum(90*np.exp(-t/0.12)+45)/SR
    add(fr(f),np.sin(ph)*np.exp(-t/0.09)+0.3*band(n,80,600)*np.exp(-t/0.03),g)
def whoosh(f,g=0.09):
    n=int(0.4*SR); t=np.arange(n)/SR; add(fr(f),band(n,400,1800)*np.sin(np.pi*t/t[-1])**2,g)
def pling(f,g=0.10):
    n=int(0.6*SR); t=np.arange(n)/SR; add(fr(f),(np.sin(2*np.pi*1318.5*t)+0.5*np.sin(2*np.pi*1975.5*t))*env(n,0.004,0.18),g)
def boom(f,g=0.75):
    n=int(0.9*SR); t=np.arange(n)/SR; ph=2*np.pi*np.cumsum(55+60*np.exp(-t/0.05))/SR
    add(fr(f),np.sin(ph)*env(n,0.003,0.28)+0.4*band(n,1000,6000)*np.exp(-t/0.006),g)
def chime(f,g=0.13):
    n=int(2.6*SR); t=np.arange(n)/SR
    for k,(hz,dl) in enumerate([(523.25,0),(659.25,0.09),(783.99,0.18),(1046.5,0.27)]):
        s=(np.sin(2*np.pi*hz*t)+0.25*np.sin(4*np.pi*hz*t))*env(n,0.01,0.75)
        add(fr(f)+dl,s,g*(1-0.15*k))
# scene 0
for f in (1,4,7): tick(f,0.18)
pencil(11,13); pencil(13,15); tick(16,0.15)
# transitions
for f in (30,78,126,168): paper(f)
# scene 1
pencil(35,46); for_=[tick(f,0.06) for f in range(46,59,2)]; pencil(63,69,0.12); tick(69,0.25)
# scene 2
pencil(86,95); thump(95)
for k in range(4): whoosh(96+k*4)
pling(108)
# scene 3
pencil(132,140); tick(140,0.25); pencil(149,154,0.13); tick(154,0.3)
# scene 4
for f in (171,172,173): tick(f,0.14)
pencil(179,186,0.11); boom(187)
whoosh(193,0.16); paper(196,0.18)
chime(200)
pk=np.abs(out).max(); out=np.tanh(out/pk*1.1)/np.tanh(1.1)*0.85
st=(np.stack([out,out],1)*32767).astype(np.int16)
w=wave.open('sfx.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
print('ok')
