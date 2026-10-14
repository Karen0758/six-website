import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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
