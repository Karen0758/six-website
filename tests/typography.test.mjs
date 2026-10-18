import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const stylesPath = fileURLToPath(new URL('../src/styles.css', import.meta.url));
const fontPath = fileURLToPath(new URL('../public/fonts/Newsreader-Medium.woff2', import.meta.url));
const styles = readFileSync(stylesPath, 'utf8');

test('homepage typography gives SIX the largest restrained display style', () => {
  assert.ok(existsSync(fontPath), 'the chosen Newsreader face is bundled for a reliable local preview');
  assert.match(styles, /@font-face\s*\{[^}]*font-family:\s*['"]?Newsreader['"]?;[^}]*font-weight:\s*500;[^}]*font-display:\s*swap/s);
  assert.match(styles, /\.brand-wordmark\s*\{[^}]*font-family:\s*['"]?Newsreader['"]?/s);
  assert.match(styles, /\.brand-wordmark\s*\{[^}]*font-size:\s*clamp\(76px,/s);
  assert.match(styles, /\.headline-title\s*\{[^}]*Source Han Serif SC[^}]*font-size:\s*clamp\(28px,/s);
  assert.match(styles, /:root\s*\{[^}]*Source Han Sans SC/s);
});
