# Contact sheet: python -I tools/sheet.py out.jpg cols cellw img1 img2 ...  (each cell labelled with its file stem)
import sys
from PIL import Image, ImageDraw, ImageFont
out, cols, cw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
ch = int(cw * 0.7)
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cw, rows * (ch + 22)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype("arial.ttf", 15)
except Exception: font = ImageFont.load_default()
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB"); im.thumbnail((cw - 4, ch - 4))
    x, y = (i % cols) * cw, (i // cols) * (ch + 22)
    sheet.paste(im, (x + (cw - im.width) // 2, y + (ch - im.height) // 2))
    d.text((x + 4, y + ch + 2), f.replace("\\", "/").split("/")[-1][:34], fill=(230, 230, 200), font=font)
sheet.save(out, quality=88)
print(out, sheet.size)
