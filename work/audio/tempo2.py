import numpy as np, subprocess
sr=22050
raw=subprocess.run(['ffmpeg','-v','error','-i','assets/song_37s.m4a','-ac','1','-ar',str(sr),'-f','f32le','-'],capture_output=True).stdout
x=np.frombuffer(raw,np.float32); print('dur',len(x)/sr)
n=1024;hop=220
fr=np.lib.stride_tricks.sliding_window_view(x,n)[::hop]*np.hanning(n)
S=np.abs(np.fft.rfft(fr,axis=1)); f=np.fft.rfftfreq(n,1/sr)
t=(np.arange(len(S))*hop+n/2)/sr
L=np.log1p(S*10)
flux=np.maximum(0,np.diff(L,axis=0)).sum(1); flux=np.r_[0,flux]
low=np.maximum(0,np.diff(L[:,f<200],axis=0)).sum(1); low=np.r_[0,low]
def sc(env,bpm,off):
  ts=np.arange(off,37,60/bpm); i=np.searchsorted(t,ts); i=i[i<len(env)-2]
  return np.mean([env[max(0,k-2):k+3].max() for k in i])
best=[]
for bpm in np.arange(70,180,0.25):
  b=60/bpm
  for off in np.arange(0,b,0.01): best.append((sc(flux,bpm,off)+sc(low,bpm,off),bpm,off))
best.sort(reverse=True)
for r in best[:8]: print('%.3f %.2f %.2f'%r)
# vocal band energy 300-3000Hz, 50ms resolution
v=S[:,(f>300)&(f<3000)].sum(1); v=v/v.max()
step=int(0.05*sr/hop)
print(' '.join('%.2f:%d'%(t[i],int(v[i:i+step].mean()*99)) for i in range(0,len(v),step)))
