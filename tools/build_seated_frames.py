#!/usr/bin/env python3
"""Build the local seated-to-standing image sequence from a user-supplied video.

Requires ffmpeg and Pillow. Original video and generated media stay local.
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
SOURCE_INDICES = list(range(0, 37, 4)) + list(range(38, 121, 2))


def build(frames_dir: Path, output: Path):
    output.mkdir(parents=True, exist_ok=True)
    frames = sorted(frames_dir.glob('frame_*.png'))
    if len(frames) != 121:
        raise ValueError(f'Expected 121 source frames, found {len(frames)}')
    for out_index, source_index in enumerate(SOURCE_INDICES):
        source = Image.open(frames[source_index]).convert('L')
        neutral = float(ImageStat.Stat(source.crop((1000, 0, 1230, 80))).median[0])
        factor = 255.0 / max(neutral, 1.0)
        ink = source.point(lambda value: min(255, round(value * factor)))
        ink = ink.point(lambda value: 255 if value >= 250 else value)
        scale = FIXED_SCALE
        tile = ink.resize((round(1256 * scale / 2), round(732 * scale / 2)), Image.Resampling.LANCZOS)
        canvas = Image.new('L', CANVAS, 255)
        x = round((700 - 700 * scale) / 2 - 150)
        y = round((1130 - 660 * scale) / 2)
        canvas.paste(tile, (x, y))
        canvas.save(output / f'frame_{out_index:03d}.webp', format='WEBP', quality=78, method=5)
    return FIXED_SCALE


def main():
    parser = argparse.ArgumentParser()
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument('--video', type=Path, help='User-supplied 24 fps video')
    inputs.add_argument('--frames-dir', type=Path, help='Already extracted 121 PNG source frames')
    parser.add_argument('--output', type=Path, default=Path('public/media/seated'))
    args = parser.parse_args()
    if args.frames_dir:
        scale = build(args.frames_dir, args.output)
    else:
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            subprocess.run(['ffmpeg', '-v', 'error', '-i', str(args.video), '-map', '0:v:0',
                            '-fps_mode', 'passthrough', '-start_number', '0',
                            str(folder / 'frame_%04d.png')], check=True)
            scale = build(folder, args.output)
    size = sum(p.stat().st_size for p in args.output.glob('frame_*.webp'))
    print(f'frames={len(SOURCE_INDICES)} fps={OUTPUT_FPS} duration={len(SOURCE_INDICES)/OUTPUT_FPS:.2f}s '
          f'fixed_scale={scale:.2f} bytes={size}')


if __name__ == '__main__':
    main()
