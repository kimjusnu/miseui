"""Fixed-column contact sheet with file names burnt in: grid_sheet.py out.png folder columns cell_width file1,file2"""
import os
import sys

from PIL import Image, ImageDraw

out, folder, columns, cell = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
names = sys.argv[5].split(",")
images = []
for name in names:
    path = os.path.join(folder, f"{name}.png")
    if not os.path.exists(path):
        print("missing", name)
        continue
    image = Image.open(path).convert("RGB")
    image = image.resize((cell, int(image.height * cell / image.width)), Image.LANCZOS)
    ImageDraw.Draw(image).text((6, 4), name, fill="#d00")
    images.append(image)
rows = [images[i : i + columns] for i in range(0, len(images), columns)]
heights = [max(image.height for image in row) for row in rows]
sheet = Image.new("RGB", (columns * (cell + 6), sum(heights) + 6 * len(rows)), "#888")
y = 0
for row, height in zip(rows, heights):
    for x, image in enumerate(row):
        sheet.paste(image, (x * (cell + 6), y))
    y += height + 6
sheet.save(os.path.join(folder, out))
print(out, sheet.size)
