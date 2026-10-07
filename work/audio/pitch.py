import numpy as np
sr=22050
x=np.fromfile("song.f32",dtype=np.float32).astype(np.float64)
hop=220; n=1024
T=[];F=[];C=[];E=[]
for i in range(0,len(x)-n,hop):
    fr=x[i:i+n]*np.hanning(n)
    fr=fr-fr.mean()
    spec=np.fft.rfft(fr,2*n)
    ac=np.fft.irfft(np.abs(spec)**2)[:n]
    if ac[0]<=1e-9: T.append(i/sr);F.append(0);C.append(0);E.append(0);continue
    ac=ac/ac[0]
    lo=int(sr/700); hi=int(sr/110)
    k=lo+np.argmax(ac[lo:hi])
    T.append((i+n/2)/sr); F.append(sr/k); C.append(ac[k]); E.append(np.sqrt((fr**2).mean()))
T=np.array(T);F=np.array(F);C=np.array(C);E=np.array(E)
np.save("pitch.npy",np.stack([T,F,C,E]))
# print per 50ms summary: midi note if conf>0.6
def midi(f): return 69+12*np.log2(f/440)
names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
line=[]
for j in range(0,len(T),5):
    c=C[j:j+5].mean(); f=np.median(F[j:j+5])
    if c>0.55:
        m=int(round(midi(f))); line.append(f"{T[j]:5.2f}:{names[m%12]}{m//12-1}({c:.2f})")
    else: line.append(f"{T[j]:5.2f}:--")
for k in range(0,len(line),10): print("  ".join(line[k:k+10]))
