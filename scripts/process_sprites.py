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


def find_row_split(img, threshold=40):
    """
    Find the y-coordinate that separates the two sprite rows.
    Finds all contiguous content segments, then splits at the midpoint
    of the gap between the first and second segment.
    """
    pixels = img.load()
    w, h = img.size

    def row_has_content(y):
        for x in range(w):
            r, g, b = pixels[x, y][:3]
            if not (r < threshold and g < threshold and b < threshold):
                return True
        return False

    content_rows = [y for y in range(h) if row_has_content(y)]
    if not content_rows:
        return h // 2

    # Find contiguous segments
    segments = []
    start = prev = content_rows[0]
    for y in content_rows[1:]:
        if y > prev + 1:
            segments.append((start, prev))
            start = y
        prev = y
    segments.append((start, prev))

    print(f"  Content segments: {segments}")

    if len(segments) < 2:
        print("  Only one segment found, using h//2")
        return h // 2

    gap_start = segments[0][1] + 1
    gap_end   = segments[1][0] - 1
    split = (gap_start + gap_end) // 2
    print(f"  Gap y={gap_start}–{gap_end}, splitting at y={split}")
    return split


def process_single(src_path, out_name):
    img = Image.open(src_path)
    out = remove_black_bg(img)
    dest = os.path.join(OUT, out_name)
    out.save(dest)
    print(f"  saved {out_name}")


def tight_bbox(rgba_img):
    """Return (left, top, right, bottom) of non-transparent content."""
    pixels = rgba_img.load()
    w, h = rgba_img.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] > 0:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    return (min_x, min_y, max_x + 1, max_y + 1)


def process_walk_sheet(src_path):
    img = Image.open(src_path)
    w, h = img.size
    cols = 3
    print(f"  Image size: {w}x{h}")

    split_y = find_row_split(img)

    row_bounds = [(0, split_y), (split_y, h)]
    col_bounds = [(c * (w // cols), (c+1) * (w // cols) if c < cols-1 else w) for c in range(cols)]

    # First pass: remove backgrounds, record per-frame content bboxes in original coords
    frames = []  # (rgba_cell, cell_x0, cell_y0, abs_l, abs_t, abs_r, abs_b)
    global_top    = 9999
    global_bottom = 0
    max_content_w = 0

    for (y0, y1) in row_bounds:
        for (x0, x1) in col_bounds:
            cell = img.crop((x0, y0, x1, y1))
            out = remove_black_bg(cell)
            l, t, r, b = tight_bbox(out)
            abs_t = y0 + t
            abs_b = y0 + b
            global_top    = min(global_top,    abs_t)
            global_bottom = max(global_bottom, abs_b)
            max_content_w = max(max_content_w, r - l)
            frames.append((out, x0, y0, l, t, r, b))

    # Canvas size: wide enough for the widest frame, tall enough for the tallest frame.
    # All frames are bottom-aligned so the giraffe's feet sit at the same position
    # in every frame — matches the CSS bottom-8 rendering in Jimmy.jsx.
    max_content_h = max(b - t for (_, _, _, l, t, r, b) in frames)
    out_h = max_content_h
    out_w = max_content_w
    print(f"  Output: {out_w}x{out_h} (bottom-aligned)")

    for n, (frame, x0, y0, l, t, r, b) in enumerate(frames, 1):
        canvas = Image.new('RGBA', (out_w, out_h), (0, 0, 0, 0))
        content = frame.crop((l, t, r, b))
        content_h = b - t
        content_w = r - l
        dst_y = out_h - content_h        # bottom-align
        dst_x = (out_w - content_w) // 2 # centre horizontally
        canvas.paste(content, (dst_x, dst_y))
        name = f'jimmy-walk-{n}.png'
        canvas.save(os.path.join(OUT, name))
        print(f"  saved {name}  content={content_w}x{content_h}  dst=({dst_x},{dst_y})")


print("Processing jimmy-happy.jpg...")
process_single(os.path.join(OUT, 'jimmy-happy.jpg'), 'jimmy-happy.png')

print("Processing jimmy-sad.jpg...")
process_single(os.path.join(OUT, 'jimmy-sad.jpg'), 'jimmy-sad.png')

print("Processing jimmy-walk.jpg (spritesheet)...")
process_walk_sheet(os.path.join(OUT, 'jimmy-walk.jpg'))

print("Done.")
