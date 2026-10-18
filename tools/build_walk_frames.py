#!/usr/bin/env python3
"""Extract a light transparent walk cycle and its clean homepage poster."""
import argparse
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image

CONTENT_SIZE = (532, 850)
OUTPUT_SIZE = (532, 890)  # include the full source sole, then leave 40px transparent clearance
OUTPUT_FPS = 12
FRAME_COUNT = 49
KEY_SIMILARITY = 0.10
CROP = (662, 1055, 190, 25)
POSTER_BOX = (1307, 357, 348, 582)


def remove_watermark(frame: Image.Image) -> None:
    """Remove the lower-right generator mark while preserving the shoe edge."""
    pixels = frame.load()
    for y in range(792, frame.height):
        for x in range(422, frame.width):
            r, g, b, _ = pixels[x, y]
            pixels[x, y] = (r, g, b, 0)
        for x in range(397, 422):
            r, g, b, a = pixels[x, y]
            if a and (r + g + b) / 3 > 90:
                pixels[x, y] = (r, g, b, 0)


def build(frames_dir: Path, output: Path, clean_source: bool = False):
    frames = sorted(frames_dir.glob('frame_*.png'))
    if len(frames) != FRAME_COUNT:
        raise ValueError(f'Expected {FRAME_COUNT} frames at {OUTPUT_FPS} fps, found {len(frames)}')
    output.mkdir(parents=True, exist_ok=True)
    for stale in output.glob('frame_*.webp'):
        stale.unlink()

    first_frame = None
    for index, path in enumerate(frames):
        frame = Image.open(path).convert('RGBA')
        if not clean_source:
            remove_watermark(frame)
        if first_frame is None:
            first_frame = frame.copy()
        frame.save(output / f'frame_{index:03d}.webp', format='WEBP', quality=88, method=6)

    poster = Image.new('RGBA', (1676, 939), (0, 0, 0, 0))
    tile = first_frame.resize(POSTER_BOX[2:], Image.Resampling.LANCZOS)
    poster.alpha_composite(tile, POSTER_BOX[:2])
    poster.save(output.parent / 'walker-poster.webp', format='WEBP', quality=92, method=6)
    return len(frames)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--video', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('public/media/walk-cycle'))
    parser.add_argument('--clean-source', action='store_true', help='Skip watermark removal for a clean source video')
    args = parser.parse_args()

    width, height, x, y = CROP
    with TemporaryDirectory() as temp:
        folder = Path(temp)
        subprocess.run([
            'ffmpeg', '-v', 'error', '-i', str(args.video), '-map', '0:v:0',
        '-vf', f'fps={OUTPUT_FPS},crop={width}:{height}:{x}:{y},'
            f'scale={CONTENT_SIZE[0]}:{CONTENT_SIZE[1]}:flags=lanczos,'
            f'colorkey=0xdfccb4:{KEY_SIMILARITY}:0.05,format=rgba,'
            f'pad={OUTPUT_SIZE[0]}:{OUTPUT_SIZE[1]}:0:0:color=black@0',
            '-frames:v', str(FRAME_COUNT), '-start_number', '0',
            str(folder / 'frame_%03d.png'),
        ], check=True)
        count = build(folder, args.output, args.clean_source)
    size = sum(path.stat().st_size for path in args.output.glob('frame_*.webp'))
    print(f'frames={count} fps={OUTPUT_FPS} duration={count / OUTPUT_FPS:.2f}s bytes={size}')


if __name__ == '__main__':
    main()
