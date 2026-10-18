import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const builder = fileURLToPath(new URL('../tools/build_walk_frames.py', import.meta.url));

test('walk frame export preserves a horizontal shoe sole beside the ankle', () => {
  const temp = mkdtempSync(join(tmpdir(), 'walk-frame-sole-'));
  const script = String.raw`
import os, runpy, sys
from pathlib import Path
from PIL import Image, ImageDraw
m = runpy.run_path(sys.argv[1])
root = Path(sys.argv[2]); source = root / 'source'; output = root / 'output'
source.mkdir()
im = Image.new('RGBA', (512, 890), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
d.rectangle((140, 780, 170, 821), fill=(20, 20, 20, 255))
d.rectangle((55, 820, 220, 824), fill=(20, 20, 20, 255))
first = source / 'frame_000.png'; im.save(first)
for i in range(1, 49): os.link(first, source / f'frame_{i:03d}.png')
m['build'](source, output, True)
print(Image.open(output / 'frame_000.webp').convert('RGBA').getpixel((60, 822))[3])
`;
  try {
    const result = spawnSync('python3', ['-c', script, builder, temp], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(Number(result.stdout.trim()) > 240, 'the free shoe sole should remain opaque instead of being cleared with the floor line');
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test('walk source crop reaches the video edge while keeping the current display scale', () => {
  const script = String.raw`
import runpy, sys
m = runpy.run_path(sys.argv[1])
print(*m['CROP'], *m['CONTENT_SIZE'], *m['OUTPUT_SIZE'], *m['POSTER_BOX'])
`;
  const result = spawnSync('python3', ['-c', script, builder], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const [cropWidth, cropHeight, cropX, cropY, contentWidth, contentHeight, outputWidth, outputHeight, , , posterWidth] = result.stdout.trim().split(/\s+/).map(Number);
  assert.equal(cropX + cropWidth, 852, 'crop must include the source video’s right edge where the full toe appears');
  assert.ok(Math.abs(cropWidth / contentWidth - cropHeight / contentHeight) < 0.004, 'keep the expanded crop proportional');
  assert.equal(outputWidth, contentWidth);
  assert.equal(outputHeight, contentHeight + 40);
  assert.ok(Math.abs(posterWidth / contentWidth - 335 / 512) < 0.003, 'preserve the current on-page pixel scale');
});
