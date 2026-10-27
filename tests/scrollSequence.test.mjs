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

test('each downward gesture advances through the about and founders pages before the next character', () => {
  const next = scrollSequence.nextSceneForScroll;
  assert.equal(typeof next, 'function');
  assert.equal(next('home'), 'pink');
  assert.equal(next('pink'), 'founders');
  assert.equal(next('founders'), 'yellow');
  assert.equal(next('yellow'), 'beige');
  assert.equal(next('beige'), null);
});

test('queued scroll gestures advance after the current scene without skipping the order', () => {
  const next = scrollSequence.nextSceneForScroll;
  assert.equal(next('pink', 1), 'yellow');
  assert.equal(next('pink', 2), 'beige');
  assert.equal(next('yellow', 1), null);
});

test('upward gestures return one scene at a time until home', () => {
  const previous = scrollSequence.previousSceneForScroll;
  assert.equal(previous('beige'), 'yellow');
  assert.equal(previous('yellow'), 'founders');
  assert.equal(previous('founders'), 'pink');
  assert.equal(previous('pink'), 'home');
  assert.equal(previous('home'), null);
});
