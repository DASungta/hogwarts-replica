# Find where to cut the long loud middle of a music track so it fits the film: a jump from a to b (b - a within a
# given range) where the music on both sides is most alike (chroma and loudness over a few seconds around the joint,
# with the beats lined up). python -I tools/music_cut.py track_mono.wav amin amax Lmin Lmax
import sys, wave, numpy as np
w = wave.open(sys.argv[1]); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
amin, amax, Lmin, Lmax = map(float, sys.argv[2:6])
N, H = 4096, 512
nf = (len(x) - N) // H
win = np.hanning(N).astype(np.float32)
freqs = np.fft.rfftfreq(N, 1 / sr)
pc = np.full(len(freqs), -1)
ok = (freqs > 60) & (freqs < 4000)
pc[ok] = (np.round(12 * np.log2(freqs[ok] / 440.0)) % 12).astype(int)
chroma = np.zeros((nf, 12), np.float32); rms = np.zeros(nf, np.float32); flux = np.zeros(nf, np.float32)
prev = None
for i in range(nf):
    seg = x[i * H:i * H + N]
    sp = np.abs(np.fft.rfft(seg * win))
    for k in range(12): chroma[i, k] = sp[pc == k].sum()
    chroma[i] /= np.linalg.norm(chroma[i]) + 1e-9
    rms[i] = np.sqrt(np.mean(seg ** 2))
    if prev is not None: flux[i] = np.maximum(sp - prev, 0).sum()
    prev = sp
db = 20 * np.log10(rms + 1e-9)
fr = sr / H
W = int(3 * fr)   # +-3 s around the joint
def score(ia, ib):
    a0, b0 = ia - W, ib - W
    if a0 < 0 or ib + W >= nf: return -9
    ca, cb = chroma[a0:ia + W], chroma[b0:ib + W]
    cs = float(np.mean(np.sum(ca * cb, axis=1)))
    ld = float(np.mean(np.abs(db[a0:ia + W] - db[b0:ib + W])))
    fa, fb = flux[a0:ia + W], flux[b0:ib + W]
    fc = float(np.corrcoef(fa, fb)[0, 1])
    return cs - 0.03 * ld + 0.5 * fc
best = []
for ta in np.arange(amin, amax, 0.05):
    ia = int(ta * fr)
    for L in np.arange(Lmin, Lmax, 0.05):
        ib = int((ta + L) * fr)
        best.append((score(ia, ib), ta, ta + L))
best.sort(reverse=True)
for s, a, b in best[:12]: print(f"score {s:.3f}  cut {a:.2f} -> {b:.2f}  (removes {b - a:.2f} s)")
