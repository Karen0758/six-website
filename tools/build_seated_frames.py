#!/usr/bin/env python3
"""Build the local seated-to-standing image sequence from a user-supplied video.

Requires ffmpeg, Pillow and NumPy. Original video and generated media stay local.
"""
import argparse
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory
from PIL import Image, ImageDraw
import numpy as np

SOURCE_FPS = 24
OUTPUT_FPS = 12
CANVAS = (628, 586)
ZOOM_KEYS = [(0, 1.00), (24, 1.04), (60, 1.08), (72, 1.24),
             (84, 1.45), (96, 1.60), (108, 1.70), (120, 1.80)]
SOURCE_INDICES = list(range(0, 37, 4)) + list(range(38, 121, 2))


def zoom_curve():
    xs, ys = zip(*ZOOM_KEYS)
    raw = np.interp(np.arange(121), xs, ys)
    kernel = np.array([1, 2, 3, 4, 3, 2, 1], dtype=float)
    kernel /= kernel.sum()
    return np.convolve(np.pad(raw, (3, 3), mode='edge'), kernel, mode='valid')


def bridge_shadow(canvas: Image.Image):
    """Join the source clip's detached long shadow to the standing feet."""
    a = np.asarray(canvas)
    shadow = np.where(a[500:570, :350] < 110)
    feet = np.where(a[530:575, 350:510] < 110)
    if not len(shadow[1]) or not len(feet[1]):
        return
    sx = int(shadow[1].max())
    fx = int(feet[1].min() + 350)
    gap = fx - sx
    if gap < 22 or gap > 190:
        return
    sy_values = shadow[0][shadow[1] >= sx - 8] + 500
    fy_values = feet[0][feet[1] <= fx - 350 + 8] + 530
    sy = int(np.median(sy_values))
    fy = int(np.median(fy_values))
    draw = ImageDraw.Draw(canvas)
    draw.polygon([(sx-9, sy-4), (fx+3, fy-2), (fx+5, fy+2), (sx-9, sy+5)], fill=69)
    draw.line([(sx-11, sy+1), (fx+4, fy)], fill=42, width=1)


def build(frames_dir: Path, output: Path):
    output.mkdir(parents=True, exist_ok=True)
    frames = sorted(frames_dir.glob('frame_*.png'))
    if len(frames) != 121:
        raise ValueError(f'Expected 121 source frames, found {len(frames)}')
    scales = zoom_curve()
    for out_index, source_index in enumerate(SOURCE_INDICES):
        source = np.asarray(Image.open(frames[source_index]).convert('L'), dtype=np.float32)
        neutral = float(np.median(source[:80, -220:-20]))
        ink = np.uint8(np.clip(np.round(source * 255 / neutral), 0, 255))
        ink[ink >= 250] = 255  # white is neutral for Multiply
        scale = float(scales[source_index])
        width = round(1256 * scale / 2)
        height = round(732 * scale / 2)
        tile = Image.fromarray(ink, 'L').resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.new('L', CANVAS, 255)
        x = round((700 - 700 * scale) / 2)
        y = round((1130 - 660 * scale) / 2)
        canvas.paste(tile, (x, y))
        if source_index >= 78:
            bridge_shadow(canvas)
        canvas.save(output / f'frame_{out_index:03d}.webp', format='WEBP', quality=78, method=5)
    return scales


def main():
    parser = argparse.ArgumentParser()
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument('--video', type=Path, help='User-supplied 24 fps video')
    inputs.add_argument('--frames-dir', type=Path, help='Already extracted 121 PNG source frames')
    parser.add_argument('--output', type=Path, default=Path('public/media/seated'))
    args = parser.parse_args()
    if args.frames_dir:
        scales = build(args.frames_dir, args.output)
    else:
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            subprocess.run(['ffmpeg', '-v', 'error', '-i', str(args.video), '-map', '0:v:0',
                            '-fps_mode', 'passthrough', '-start_number', '0',
                            str(folder / 'frame_%04d.png')], check=True)
            scales = build(folder, args.output)
    size = sum(p.stat().st_size for p in args.output.glob('frame_*.webp'))
    print(f'frames={len(SOURCE_INDICES)} fps={OUTPUT_FPS} duration={len(SOURCE_INDICES)/OUTPUT_FPS:.2f}s '
          f'zoom={scales[0]:.3f}..{scales[-1]:.3f} bytes={size}')


if __name__ == '__main__':
    main()
