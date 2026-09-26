"""Grano de película: 8 fotogramas de ruido monocromo (tileables), usados en overlay de baja opacidad."""
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

rng = np.random.default_rng(3)
for i in range(8):
    n = gaussian_filter(rng.standard_normal((960, 540)), 0.6, mode="wrap")
    n = (n - n.mean()) / n.std()
    v = np.clip(128 + n * 48, 0, 255).astype(np.uint8)
    Image.fromarray(v, "L").save(f"public/grain/grain_{i}.png", optimize=True)
print("grain ok")
