# Lay the edges of a render over a reference photo shot from the same camera (to see where each building is off):
#   python -I tools/overlay.py photo.jpg render.png out.jpg [label]
# The render is resized to the photo; its edges are drawn in red over a darkened, desaturated photo.
import os, sys
from PIL import Image, ImageFilter, ImageOps, ImageChops, ImageDraw, ImageFont
photo, render, out = sys.argv[1:4]
label = sys.argv[4] if len(sys.argv) > 4 else ''
a = Image.open(photo).convert('RGB')
b = Image.open(render).convert('RGB').resize(a.size, Image.LANCZOS)
base = ImageOps.grayscale(a).point(lambda v: int(v * 0.75)).convert('RGB')
e = ImageOps.grayscale(b).filter(ImageFilter.GaussianBlur(0.8)).filter(ImageFilter.FIND_EDGES)
e = e.point(lambda v: 255 if v > 18 else 0).filter(ImageFilter.MaxFilter(3))
red = Image.new('RGB', a.size, (255, 40, 30))
res = Image.composite(red, base, e)
if label:
    FONTS = ['C:/Windows/Fonts/msyhbd.ttc', 'C:/Windows/Fonts/msyh.ttc']
    f = next((p for p in FONTS if os.path.exists(p)), None)
    font = ImageFont.truetype(f, 34) if f else ImageFont.load_default()
    ImageDraw.Draw(res).text((16, 12), label, fill=(255, 226, 120), font=font)
res.thumbnail((1600, 1600))
res.save(out, quality=88)
print(out, res.size)
