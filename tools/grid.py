# Overlay a labelled pixel grid on an image (to read landmark coordinates off a reference photo or a render):
#   python -I tools/grid.py in.jpg out.jpg [step=100] [crop x0 y0 x1 y1]
# Coordinates are those of the original image; the crop is only for viewing.
import sys
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 100
crop = [int(v) for v in sys.argv[4:8]] if len(sys.argv) >= 8 else None
im = Image.open(src).convert('RGB')
d = ImageDraw.Draw(im)
try: font = ImageFont.truetype('arial.ttf', max(12, step // 6))
except Exception: font = ImageFont.load_default()
for x in range(0, im.width, step):
    d.line([(x, 0), (x, im.height)], fill=(255, 255, 0) if x % (step * 5) == 0 else (0, 255, 255), width=1)
    for y in range(0, im.height, step * 2): d.text((x + 2, y + 2), str(x), fill=(255, 255, 0), font=font)
for y in range(0, im.height, step):
    d.line([(0, y), (im.width, y)], fill=(255, 255, 0) if y % (step * 5) == 0 else (0, 255, 255), width=1)
    for x in range(0, im.width, step * 2): d.text((x + 2, y + 2 + step // 2), str(y), fill=(255, 128, 0), font=font)
if crop: im = im.crop(crop)
im.save(out, quality=90)
print(out, im.size)
