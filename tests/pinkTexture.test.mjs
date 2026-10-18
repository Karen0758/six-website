import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const app = readFileSync(fileURLToPath(new URL('../src/App.tsx', import.meta.url)), 'utf8');

test('pink reveal uses a full-width paper texture derived from the original artwork', () => {
  assert.match(app, /<image href="\.\/media\/pink-paper-wide\.webp" x="0" y="0" width="100" height="100" preserveAspectRatio="none"\s*\/>/);
  assert.doesNotMatch(app, /<pattern id="pink-paper" width="18" height="34"/);
  const asset = fileURLToPath(new URL('../public/media/pink-paper-wide.webp', import.meta.url));
  assert.ok(statSync(asset).size > 20_000);
});
