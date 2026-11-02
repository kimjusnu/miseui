"""Masonry contact sheet: sheet.py out.png name1,name2 [suffix]"""
import os
import tempfile
import sys

from PIL import Image

HERE = tempfile.gettempdir()
out, names = sys.argv[1], sys.argv[2].split(",")
suffix = sys.argv[3] if len(sys.argv) > 3 else ""
WIDTH = 500
cols, heights = [[], []], [0, 0]
for name in names:
    path = os.path.join(HERE, "miseui-review", f"{name}{suffix}.png")
    if not os.path.exists(path):
        print("missing", name)
        continue
    image = Image.open(path).convert("RGB")
    image = image.resize((WIDTH, int(image.height * WIDTH / image.width)))
    column = 0 if heights[0] <= heights[1] else 1
    cols[column].append(image)
    heights[column] += image.height + 4
sheet = Image.new("RGB", (2 * WIDTH + 6, max(heights)), "#999")
for x, column in enumerate(cols):
    y = 0
    for image in column:
        sheet.paste(image, (x * (WIDTH + 6), y))
        y += image.height + 4
sheet.save(os.path.join(HERE, "miseui-review", out))
print(out, sheet.size)
