# sRGB luminance percentiles + mean saturation of an image (art bible target: p02 3-17, p10 23-39, p50 93-115, p90 196-203, p98 227-242)
import sys
from PIL import Image
import numpy as np
for f in sys.argv[1:]:
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    p = np.percentile(L, [2, 10, 50, 90, 98])
    print(f, 'p02/10/50/90/98 =', ' '.join(f'{v:.0f}' for v in p), ' sat=%.3f' % sat.mean())
