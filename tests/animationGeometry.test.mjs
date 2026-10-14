import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const sourcePath = fileURLToPath(new URL('../src/animationGeometry.ts', import.meta.url));
let geometry = {};
if (existsSync(sourcePath)) {
  const source = readFileSync(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  geometry = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}

test('pink wave resolves to a full-screen shape at completion', () => {
  assert.equal(typeof geometry.pinkWavePath, 'function');
  const path = geometry.pinkWavePath(1);
  for (const corner of ['M 0 0', 'H 100', 'V 100', 'H 0']) assert.ok(path.includes(corner));
});

test('yellow radial reveal reaches every viewport corner at completion', () => {
  assert.equal(typeof geometry.yellowRevealRadius, 'function');
  const width = 1676;
  const height = 939;
  const radius = geometry.yellowRevealRadius(1, width, height);
  assert.ok(radius >= Math.hypot(width, height) / 2);
});
