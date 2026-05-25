"""
Remove black backgrounds from new sprites and slice the walk spritesheet
into individual frames. Outputs transparent PNGs to public/images/.
"""
from PIL import Image
from collections import deque
import os

OUT = r'C:\Users\jslev\ClaudeCodeProjects\ReadingGame\public\images'

def remove_black_bg(img, threshold=40):
    """Flood-fill from all four edges, treating near-black pixels as background."""
    rgba = img.convert('RGBA')
    pixels = rgba.load()
    w, h = rgba.size
    mask = [[False] * w for _ in range(h)]

    def is_bg(x, y):
        r, g, b, _ = pixels[x, y]
        return r < threshold and g < threshold and b < threshold

    queue = deque()
    for x in range(w):
        if is_bg(x, 0) and not mask[0][x]:
            mask[0][x] = True; queue.append((x, 0))
        if is_bg(x, h-1) and not mask[h-1][x]:
            mask[h-1][x] = True; queue.append((x, h-1))
    for y in range(h):
        if is_bg(0, y) and not mask[y][0]:
            mask[y][0] = True; queue.append((0, y))
        if is_bg(w-1, y) and not mask[y][w-1]:
            mask[y][w-1] = True; queue.append((w-1, y))

    while queue:
        x, y = queue.popleft()
        for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
            nx, ny = x+dx, y+dy
            if 0 <= nx < w and 0 <= ny < h and not mask[ny][nx] and is_bg(nx, ny):
                mask[ny][nx] = True
                queue.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                pixels[x, y] = (0, 0, 0, 0)

    return rgba


def process_single(src_path, out_name):
    img = Image.open(src_path)
    out = remove_black_bg(img)
    dest = os.path.join(OUT, out_name)
    out.save(dest)
    print(f"  saved {out_name}")


def process_walk_sheet(src_path):
    img = Image.open(src_path)
    w, h = img.size
    cols, rows = 3, 2
    fw = w // cols
    fh = h // rows
    col_bounds = [(c * fw, (c+1)*fw if c < cols-1 else w) for c in range(cols)]
    n = 1
    for row in range(rows):
        y0 = row * fh
        y1 = (row+1)*fh if row < rows-1 else h
        for col in range(cols):
            x0, x1 = col_bounds[col]
            cell = img.crop((x0, y0, x1, y1))
            out = remove_black_bg(cell)
            name = f'jimmy-walk-{n}.png'
            out.save(os.path.join(OUT, name))
            print(f"  saved {name}  ({x1-x0}x{y1-y0})")
            n += 1


print("Processing jimmy-happy.jpg...")
process_single(os.path.join(OUT, 'jimmy-happy.jpg'), 'jimmy-happy.png')

print("Processing jimmy-sad.jpg...")
process_single(os.path.join(OUT, 'jimmy-sad.jpg'), 'jimmy-sad.png')

print("Processing jimmy-walk.jpg (spritesheet)...")
process_walk_sheet(os.path.join(OUT, 'jimmy-walk.jpg'))

print("Done.")
