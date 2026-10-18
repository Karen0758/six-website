import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const builderPath = fileURLToPath(new URL('../tools/build_middle_frames.py', import.meta.url));

test('middle sequence samples only the front-facing turn and includes its final gaze', () => {
  assert.ok(existsSync(builderPath), 'middle frame builder is present');
  const result = spawnSync('python3', ['-c', `import runpy; m=runpy.run_path(${JSON.stringify(builderPath)}); print(','.join(map(str,m['SOURCE_INDICES'])))`], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), Array.from({ length: 20 }, (_, i) => 34 + i * 2).join(','));
});

test('seated sequence samples the complete replacement clip at 12 fps', () => {
  const result = spawnSync('python3', ['-c', `import runpy; m=runpy.run_path(${JSON.stringify(fileURLToPath(new URL('../tools/build_seated_frames.py', import.meta.url)))}); print(','.join(map(str,m['sample_indices'](73))))`], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), Array.from({ length: 37 }, (_, i) => i * 2).join(','));
});

test('third figure walk cycle ships 49 optimized transparent frames and a paper background', () => {
  const media = fileURLToPath(new URL('../public/media', import.meta.url));
  const frames = readdirSync(`${media}/walk-cycle`).filter(name => /^frame_\d{3}\.webp$/.test(name));
  assert.equal(frames.length, 49);
  assert.ok(statSync(`${media}/third-paper.webp`).size > 20_000);
  assert.ok(frames.reduce((total, name) => total + statSync(`${media}/walk-cycle/${name}`).size, 0) < 2_500_000);
});
