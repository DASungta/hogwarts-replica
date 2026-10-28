# Reference photo and render side by side at the same height, each keeping its own aspect, labelled in Chinese:
# python -I tools/pair.py out.jpg "参考：格洛斯特回廊（照片）" ref.jpg "复原：S5-1" render.png [crop x0 y0 x1 y1 for the reference]
import os, sys
from PIL import Image, ImageDraw, ImageFont
out, la, fa, lb, fb = sys.argv[1:6]
crop = [int(v) for v in sys.argv[6:10]] if len(sys.argv) >= 10 else None
FONTS = ['C:/Windows/Fonts/msyhbd.ttc', 'C:/Windows/Fonts/msyh.ttc', '/System/Library/Fonts/STHeiti Medium.ttc',
         '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc']
font = ImageFont.truetype(next(f for f in FONTS if os.path.exists(f)), 26)
H = 720
a = Image.open(fa).convert('RGB')
if crop: a = a.crop(crop)
b = Image.open(fb).convert('RGB')
a = a.resize((round(a.width * H / a.height), H), Image.LANCZOS)
b = b.resize((round(b.width * H / b.height), H), Image.LANCZOS)
sheet = Image.new('RGB', (a.width + b.width + 12, H + 48), (18, 18, 18))
sheet.paste(a, (0, 48))
sheet.paste(b, (a.width + 12, 48))
d = ImageDraw.Draw(sheet)
d.text((12, 8), la, fill=(255, 226, 120), font=font)
d.text((a.width + 24, 8), lb, fill=(255, 226, 120), font=font)
sheet.save(out, quality=90)
