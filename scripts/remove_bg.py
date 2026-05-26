"""Remove black backgrounds from new sprite JPGs and save as PNG."""
import os
import sys
from collections import deque
from PIL import Image
import numpy as np

IMAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')
ITEMS_DIR  = os.path.join(IMAGES_DIR, 'items')
os.makedirs(ITEMS_DIR, exist_ok=True)

def remove_bg(img: Image.Image, threshold: int = 30) -> Image.Image:
    """Flood-fill background from all edges, make it transparent."""
    rgba = img.convert('RGBA')
    data = np.array(rgba)
    h, w = data.shape[:2]
    bg = data[0, 0, :3].astype(int)

    def is_bg(r, c):
        return np.all(np.abs(data[r, c, :3].astype(int) - bg) < threshold)

    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    for r in range(h):
        for c in (0, w - 1):
            if not visited[r, c] and is_bg(r, c):
                visited[r, c] = True
                queue.append((r, c))
    for c in range(w):
        for r in (0, h - 1):
            if not visited[r, c] and is_bg(r, c):
                visited[r, c] = True
                queue.append((r, c))

    while queue:
        r, c = queue.popleft()
        for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < h and 0 <= nc < w and not visited[nr, nc] and is_bg(nr, nc):
                visited[nr, nc] = True
                queue.append((nr, nc))

    data[visited, 3] = 0
    return Image.fromarray(data)


def split_walk_sheet(img: Image.Image, cols: int = 3, rows: int = 2):
    """Split a sprite sheet into individual frames."""
    w, h = img.size
    fw, fh = w // cols, h // rows
    frames = []
    for row in range(rows):
        for col in range(cols):
            box = (col * fw, row * fh, (col + 1) * fw, (row + 1) * fh)
            frames.append(img.crop(box))
    return frames


def process(src, dst, split=False, cols=3, rows=2, threshold=30):
    print(f"  {os.path.basename(src)} -> {dst if isinstance(dst, str) else '[split]'}")
    img = Image.open(src)
    cleaned = remove_bg(img, threshold)
    if split:
        frames = split_walk_sheet(cleaned, cols, rows)
        for i, frame in enumerate(frames, start=1):
            out = dst.format(i)
            frame.save(out)
            print(f"    saved {os.path.basename(out)}")
    else:
        cleaned.save(dst)


if __name__ == '__main__':
    print("Processing sprites...")

    process(
        os.path.join(IMAGES_DIR, 'jimmy-sleeping.jpg'),
        os.path.join(IMAGES_DIR, 'jimmy-sleep.png'),
    )
    process(
        os.path.join(IMAGES_DIR, 'jimmy-dirty.jpg'),
        os.path.join(IMAGES_DIR, 'jimmy-dirty.png'),
    )
    # Hat: lower threshold — hat itself is black but is an island disconnected
    # from the edge background so flood-fill still isolates it correctly.
    process(
        os.path.join(IMAGES_DIR, 'top-hat.jpg'),
        os.path.join(ITEMS_DIR, 'hat.png'),
        threshold=20,
    )

    print("Done.")
