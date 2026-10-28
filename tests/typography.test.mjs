import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const stylesPath = fileURLToPath(new URL('../src/styles.css', import.meta.url));
const fontPath = fileURLToPath(new URL('../public/fonts/Newsreader-Medium.woff2', import.meta.url));
const chineseFontPath = fileURLToPath(new URL('../public/fonts/NotoSerifSC-SIX-500.ttf', import.meta.url));
const bodyFontPath = fileURLToPath(new URL('../public/fonts/NotoSansSC-SIX-400.ttf', import.meta.url));
const styles = readFileSync(stylesPath, 'utf8');

test('homepage typography gives SIX the largest restrained display style', () => {
  assert.ok(existsSync(fontPath), 'the chosen Newsreader face is bundled for a reliable local preview');
  assert.ok(existsSync(chineseFontPath), 'the same Chinese title face is bundled for desktop and mobile');
  assert.ok(existsSync(bodyFontPath), 'the same Chinese body face is bundled for desktop and mobile');
  assert.match(styles, /@font-face\s*\{[^}]*font-family:\s*['"]?Newsreader['"]?;[^}]*font-weight:\s*500;[^}]*font-display:\s*swap/s);
  assert.match(styles, /\.brand-wordmark\s*\{[^}]*font-family:\s*['"]?Newsreader['"]?/s);
  assert.match(styles, /\.brand-wordmark\s*\{[^}]*font-size:\s*clamp\(76px,/s);
  assert.match(styles, /\.headline-title\s*\{[^}]*Source Han Serif SC[^}]*font-size:\s*clamp\(42px,/s);
  assert.match(styles, /\.headline-title span:last-child\s*\{\s*font-size:\s*inherit;/);
  assert.match(styles, /font-family:\s*"SIX Noto Serif SC", "Source Han Serif SC"/);
  assert.match(styles, /:root\s*\{[^}]*SIX Noto Sans SC[^}]*Source Han Sans SC/s);
  assert.match(styles, /\.scene--english,\s*\.scene--english button,\s*\.scene--english a\s*\{[^}]*font-family:\s*"Newsreader"[^}]*font-weight:\s*500/s);
  assert.match(styles, /\.scene--english \.learn-more,\s*\.scene--english \.figure-caption\s*\{\s*font-size:\s*clamp\(16px,\s*1\.35vw,\s*21px\)/s);
  assert.match(styles, /\.scene--english \.chapter-content \.about-closing p,[\s\S]*?font-family:\s*"Newsreader";[^}]*font-weight:\s*500/s);
  assert.match(styles, /\.founders-heading-brand\s*\{[^}]*font-family:\s*"Newsreader";[^}]*font-weight:\s*500/s);
  assert.match(styles, /@media \(max-width:\s*700px\)[\s\S]*?\.scene--english \.chapter-content,[\s\S]*?\.scene--english \.chapter-content \.about-closing p,[\s\S]*?font-family:\s*"Newsreader";[^}]*font-weight:\s*500;/s);
  assert.match(styles, /@media \(max-width:\s*700px\)[\s\S]*?\.join-contact-action\s*\{[^}]*min-height:\s*44px;[^}]*font-size:\s*15px;/s);
  assert.doesNotMatch(styles, /wordmark-ripple|\.brand-wordmark::before|\.brand-wordmark::after/);
  assert.match(styles, /\.chapter-content--yellow\s*\{[^}]*top:\s*16%/s);
});
