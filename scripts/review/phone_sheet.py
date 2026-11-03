"""Side by side phone captures, a few per sheet: phone_sheet.py prefix name1,name2,... [per_sheet]"""
import os
import sys
import tempfile

from PIL import Image

ROOT = os.path.join(tempfile.gettempdir(), "miseui-review")
prefix, names = sys.argv[1], sys.argv[2].split(",")
per_sheet = int(sys.argv[3]) if len(sys.argv) > 3 else 4
for start in range(0, len(names), per_sheet):
    group = names[start:start + per_sheet]
    images = [Image.open(os.path.join(ROOT, f"{n}-light-375.png")).convert("RGB") for n in group]
    sheet = Image.new("RGB", (sum(i.width + 8 for i in images), max(i.height for i in images)), "#999")
    x = 0
    for image in images:
        sheet.paste(image, (x, 0))
        x += image.width + 8
    out = os.path.join(ROOT, f"{prefix}-{start // per_sheet}.png")
    sheet.save(out)
    print(out, sheet.size)
