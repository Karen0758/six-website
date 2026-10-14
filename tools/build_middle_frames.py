#!/usr/bin/env python3
"""Build the centered, front-facing local frame sequence from the supplied clip."""
import argparse
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image, ImageChops, ImageDraw, ImageStat, ImageOps

SOURCE_FPS = 24
OUTPUT_FPS = 12
SOURCE_INDICES = list(range(34, 73, 2))
CANVAS = (628, 939)


def build_frames(frames_dir: Path, output: Path):
    output.mkdir(parents=True, exist_ok=True)
    frames = sorted(frames_dir.glob('frame_*.png'))
    if len(frames) != 73:
        raise ValueError(f'Expected 73 source frames, found {len(frames)}')

    for out_index, source_index in enumerate(SOURCE_INDICES):
        source = Image.open(frames[source_index]).convert('L')
        neutral = float(ImageStat.Stat(source.crop((0, 0, 120, 120))).median[0])
        factor = 255.0 / max(neutral, 1.0)
        ink = source.point(lambda value: min(255, round(value * factor)))
        ink = ink.point(lambda value: 255 if value >= 248 else value)

        # The embedded generator mark is below the shoe line in the lower-right corner.
        ImageDraw.Draw(ink).rectangle((610, 1178, 755, 1211), fill=255)
        tile = ImageOps.contain(ink, CANVAS, Image.Resampling.LANCZOS)
        canvas = Image.new('L', CANVAS, 255)
        canvas.paste(tile, ((CANVAS[0] - tile.width) // 2, (CANVAS[1] - tile.height) // 2))
        canvas.save(output / f'frame_{out_index:03d}.webp', format='WEBP', quality=79, method=5)
    return len(SOURCE_INDICES)


def build_yellow_texture(background_path: Path, output: Path):
    background = Image.open(background_path).convert('RGB')
    # Sample the mustard paper color, then add fine and broad non-repeating grain.
    swatch = background.crop((790, 370, 890, 470))
    base = ImageStat.Stat(swatch).mean
    width, height = 1676, 939
    fine = Image.effect_noise((width, height), 45)
    coarse = Image.effect_noise((width // 14, height // 14), 24).resize(
        (width, height), Image.Resampling.BICUBIC)
    grain = ImageChops.blend(fine, coarse, 0.28)
    low = tuple(max(0, round(channel - 40)) for channel in base)
    high = tuple(min(255, round(channel + 40)) for channel in base)
    ImageOps.colorize(grain, black=low, white=high).save(output, format='WEBP', quality=90, method=5)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--video', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('public/media/middle'))
    parser.add_argument('--background', type=Path, default=Path('public/media/background.webp'))
    parser.add_argument('--yellow-texture', type=Path, default=Path('public/media/yellow-paper.webp'))
    args = parser.parse_args()

    with TemporaryDirectory() as temp:
        folder = Path(temp)
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-i', str(args.video), '-map', '0:v:0',
             '-fps_mode', 'passthrough', '-start_number', '0', str(folder / 'frame_%04d.png')],
            check=True,
        )
        count = build_frames(folder, args.output)
    build_yellow_texture(args.background, args.yellow_texture)
    size = sum(path.stat().st_size for path in args.output.glob('frame_*.webp'))
    print(f'frames={count} fps={OUTPUT_FPS} duration={count / OUTPUT_FPS:.2f}s bytes={size}')


if __name__ == '__main__':
    main()
