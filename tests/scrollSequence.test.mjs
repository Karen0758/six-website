import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const sourcePath = fileURLToPath(new URL('../src/scrollSequence.ts', import.meta.url));
let scrollSequence = {};
if (existsSync(sourcePath)) {
  const source = readFileSync(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  scrollSequence = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}

test('each downward gesture advances home through the three character scenes in order', () => {
  const next = scrollSequence.nextSceneForScroll;
  assert.equal(typeof next, 'function');
  assert.equal(next('home'), 'pink');
  assert.equal(next('pink'), 'yellow');
  assert.equal(next('yellow'), 'beige');
  assert.equal(next('beige'), null);
});

test('queued scroll gestures advance after the current scene without skipping the order', () => {
  const next = scrollSequence.nextSceneForScroll;
  assert.equal(next('pink', 1), 'beige');
  assert.equal(next('pink', 2), null);
  assert.equal(next('yellow', 1), null);
});
