import numpy as np
sr=22050; hop=220
flux=np.load("flux.npy"); fl=np.load("fl_low.npy"); times=np.load("times.npy")
def score(env, bpm, off):
    beat=60/bpm; ts=np.arange(off, 37, beat); idx=np.round((ts - 1024/sr)/(hop/sr)).astype(int); idx=idx[(idx>=0)&(idx<len(env))]
    # take max in +-2 frames
    return np.mean([env[max(0,i-2):i+3].max() for i in idx])
res=[]
for bpm in np.arange(126,131,0.05):
    beat=60/bpm
    for off in np.arange(0, beat, 0.005):
        res.append((score(fl,bpm,off)+0.3*score(flux,bpm,off), bpm, off))
res.sort(reverse=True)
for r in res[:10]: print("%.3f bpm=%.2f off=%.3f"%r)
bpm,off=res[0][1],res[0][2]
beat=60/bpm
# print strong low onsets for inspection
from numpy import argsort
pk=[i for i in range(2,len(fl)-2) if fl[i]==fl[i-2:i+3].max() and fl[i]>np.percentile(fl,90)]
print("strong low onsets:", " ".join("%.2f"%(times[i]-1024/sr) for i in pk[:80]))
