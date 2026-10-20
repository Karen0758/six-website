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

test('pink wave sweeps diagonally toward the upper-left and clears the lower-right corner before finishing', () => {
  const start = geometry.pinkWavePath(0);
  const nearEnd = geometry.pinkWavePath(0.9);
  assert.match(start, /^M 0 17 C/);
  assert.match(nearEnd, /^M 0 -100 C/);
  assert.match(nearEnd, /L 190 100 L 0 100 Z$/);
});

test('seated figure grows and moves into the original homepage position over the standing sequence', () => {
  const home = { x: 0, y: 270, width: 628, height: 586 };
  const standing = { x: -120, y: 200, width: 703, height: 656 };
  assert.deepEqual(geometry.interpolateBox(home, standing, 0), home);
  assert.deepEqual(geometry.interpolateBox(home, standing, 1), standing);
  assert.ok(geometry.interpolateBox(home, standing, 0.5).width > home.width);
});

test('yellow radial reveal reaches every viewport corner at completion', () => {
  assert.equal(typeof geometry.yellowRevealRadius, 'function');
  const width = 1676;
  const height = 939;
  const radius = geometry.yellowRevealRadius(1, width, height);
  assert.ok(radius >= Math.hypot(width, height) / 2);
});

test('yellow reveal expands from the left-side figure and still reaches the farthest screen corner', () => {
  const width = 1676;
  const height = 939;
  const originX = width * 0.2;
  const originY = height / 2;
  const radius = geometry.yellowRevealRadius(1, width, height, originX, originY);
  const farthestCorner = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(width - originX, originY),
    Math.hypot(originX, height - originY),
    Math.hypot(width - originX, height - originY),
  );
  assert.ok(radius >= farthestCorner);
});

test('beige transition sends yellow left while pink and figures move down in parallel', () => {
  assert.equal(typeof geometry.beigeExitMotion, 'function');
  assert.deepEqual(geometry.beigeExitMotion(0, 1676, 939), { yellowX: 0, pinkY: 0 });
  const halfway = geometry.beigeExitMotion(0.5, 1676, 939);
  assert.ok(halfway.yellowX < 0);
  assert.ok(halfway.pinkY > 0);
  const end = geometry.beigeExitMotion(1, 1676, 939);
  assert.ok(end.yellowX <= -1676 * 0.6);
  assert.ok(end.yellowX > -1676);
  assert.ok(end.pinkY >= 939);
});

test('third figure enters from the left and settles at center after the homepage exits', () => {
  assert.equal(typeof geometry.thirdFigureMotion, 'function');
  const start = geometry.thirdFigureMotion(0, 1676, 300);
  const early = geometry.thirdFigureMotion(0.05, 1676, 300);
  const end = geometry.thirdFigureMotion(1, 1676, 300);
  assert.equal(start.enterX, -300);
  assert.ok(early.enterX > start.enterX, 'entry movement starts immediately');
  assert.equal(end.enterX, 661);
});
