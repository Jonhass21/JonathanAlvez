"""Limpieza de la voz con RNNoise (red neuronal de reducción de ruido), compensando su latencia."""
import sys
import numpy as np
import soundfile as sf
from pyrnnoise import RNNoise

src, dst = sys.argv[1], sys.argv[2]
x, sr = sf.read(src, dtype="int16")
assert sr == 48000
den = RNNoise(sr)
out = [np.asarray(fr).reshape(-1) for _, fr in den.denoise_chunk(x, partial=True)]
y = np.concatenate(out).astype(np.float32)
xf = x.astype(np.float32)
# alinear (latencia del modelo) por correlación en los primeros segundos
n = sr * 4
best = max(range(0, 2400), key=lambda d: float(np.dot(xf[:n], y[d:d + n])))
y = y[best:best + len(x)]
y = np.pad(y, (0, len(x) - len(y)))
sf.write(dst, y.astype(np.int16), sr, subtype="PCM_16")
print(f"rnnoise ok · latencia compensada: {best} muestras")
