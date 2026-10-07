import numpy as np
sr = 22050
x = np.fromfile("song.f32", dtype=np.float32)
print("samples", len(x), "dur", len(x)/sr, "peak", np.abs(x).max(), "rms", np.sqrt((x**2).mean()))
hop = 220  # 10ms
n = 2048
win = np.hanning(n)
frames = []
for i in range(0, len(x)-n, hop):
    frames.append(np.abs(np.fft.rfft(x[i:i+n]*win)))
S = np.array(frames)  # T x F
freqs = np.fft.rfftfreq(n, 1/sr)
times = np.arange(S.shape[0])*hop/sr + n/2/sr
np.save("S.npy", S.astype(np.float32)); np.save("times.npy", times)
# spectral flux onset envelope (full band, log)
L = np.log1p(S*10)
flux = np.maximum(0, np.diff(L, axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux])
# low band (kick) flux
lb = (freqs>30)&(freqs<150)
fl_low = np.concatenate([[0], np.maximum(0, np.diff(L[:,lb], axis=0)).sum(axis=1)])
# tempo via autocorrelation of flux
f = flux - flux.mean()
ac = np.correlate(f, f, mode='full')[len(f)-1:]
lags = np.arange(len(ac))*hop/sr
best = []
for bpm in np.arange(60, 200, 0.5):
    lag = 60/bpm
    k = int(round(lag*sr/hop))
    best.append((ac[k] + 0.5*ac[2*k] if 2*k < len(ac) else ac[k], bpm))
best.sort(reverse=True)
print("tempo candidates", [b for _, b in best[:8]])
np.save("flux.npy", flux); np.save("fl_low.npy", fl_low)
