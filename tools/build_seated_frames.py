#!/usr/bin/env python3
"""Build the local seated-to-standing image sequence from a user-supplied video.

Requires ffmpeg, Pillow, and OpenCV. Original video and generated media stay local.
"""
import argparse
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory
from PIL import Image, ImageStat

SOURCE_FPS = 24
OUTPUT_FPS = 12
CANVAS = (628, 586)
FIXED_SCALE = 1.35  # Fixed across the sequence to avoid zoom drift and keep the head in frame
SOURCE_STEP = SOURCE_FPS // OUTPUT_FPS


def sample_indices(frame_count: int):
    return list(range(0, frame_count, SOURCE_STEP))


def remove_watermark(source: Image.Image) -> Image.Image:
    """Inpaint the fixed lower-right generator mark without painting over the foot."""
    import cv2
    import numpy as np

    mask_path = Path(__file__).parent / 'assets' / 'kling_watermark_mask.png'
    mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
    if mask is None:
        raise FileNotFoundError(f'Watermark mask not found: {mask_path}')
    width, height = source.size
    if mask.shape != (height, width):
        mask = cv2.resize(mask, (width, height), interpolation=cv2.INTER_NEAREST)
    restored = cv2.inpaint(np.asarray(source), mask, 4, cv2.INPAINT_TELEA)
    return Image.fromarray(restored)


def build(frames_dir: Path, output: Path):
    output.mkdir(parents=True, exist_ok=True)
    frames = sorted(frames_dir.glob('frame_*.png'))
    if not frames:
        raise ValueError('No source frames found')
    indices = sample_indices(len(frames))
    for stale in output.glob('frame_*.webp'):
        stale.unlink()
    for out_index, source_index in enumerate(indices):
        source = remove_watermark(Image.open(frames[source_index]).convert('L'))
        width, height = source.size
        neutral_crop = (round(width * 0.80), 0, round(width * 0.98), min(80, height))
        neutral = float(ImageStat.Stat(source.crop(neutral_crop)).median[0])
        factor = 255.0 / max(neutral, 1.0)
        ink = source.point(lambda value: min(255, round(value * factor)))
        ink = ink.point(lambda value: 255 if value >= 250 else value)
        scale = FIXED_SCALE
        tile = ink.resize((round(width * scale / 2), round(height * scale / 2)), Image.Resampling.LANCZOS)
        canvas = Image.new('L', CANVAS, 255)
        x = round((700 - 700 * scale) / 2 - 150)
        y = round((1130 - 660 * scale) / 2) - 14  # keep the complete shoe inside the frame
        canvas.paste(tile, (x, y))
        canvas.save(output / f'frame_{out_index:03d}.webp', format='WEBP', quality=78, method=5)
    return FIXED_SCALE, len(indices)


def main():
    parser = argparse.ArgumentParser()
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument('--video', type=Path, help='User-supplied 24 fps video')
    inputs.add_argument('--frames-dir', type=Path, help='Already extracted 24 fps PNG source frames')
    parser.add_argument('--output', type=Path, default=Path('public/media/seated'))
    args = parser.parse_args()
    if args.frames_dir:
        scale, count = build(args.frames_dir, args.output)
    else:
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            subprocess.run(['ffmpeg', '-v', 'error', '-i', str(args.video), '-map', '0:v:0',
                            '-fps_mode', 'passthrough', '-start_number', '0',
                            str(folder / 'frame_%04d.png')], check=True)
            scale, count = build(folder, args.output)
    size = sum(p.stat().st_size for p in args.output.glob('frame_*.webp'))
    print(f'frames={count} fps={OUTPUT_FPS} duration={count/OUTPUT_FPS:.2f}s '
          f'fixed_scale={scale:.2f} bytes={size}')


if __name__ == '__main__':
    main()
