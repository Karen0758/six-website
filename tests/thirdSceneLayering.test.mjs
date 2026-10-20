import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const styles = readFileSync(fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8');
const app = readFileSync(fileURLToPath(new URL('../src/App.tsx', import.meta.url)), 'utf8');
const config = readFileSync(fileURLToPath(new URL('../src/config.ts', import.meta.url)), 'utf8');

test('third-scene entrance stays above homepage layers while they exit downward', () => {
  const exit = styles.match(/\.scene--beige\s+\.home-exit-down\s*\{([^}]+)\}/)?.[1] ?? '';
  const enter = styles.match(/\.third-walker-enter\s*\{([^}]+)\}/)?.[1] ?? '';
  assert.match(exit, /z-index:\s*0\s*!important\s*;/, 'old homepage inline layer ranks must be overridden beneath the entering walker');
  assert.match(enter, /z-index:\s*2\s*;/, 'entering walker must remain above the exiting homepage');
});

test('third-scene entrance and chapter copy start after the homepage exit, while copy does not wait for the figure action', () => {
  assert.match(app, /if \(sceneRef\.current === 'beige'\) setBeigeExitComplete\(true\)/);
  assert.match(app, /scene === 'beige' && beigeExitComplete && <div className="third-walker-enter">/);
  assert.match(app, /isChapterContentReady\(scene, progress\)/);
  assert.doesNotMatch(app, /chapterAnimationCompleteScene/);
});

test('beige scene moves yellow left while pink and homepage figures move down', () => {
  assert.match(app, /const beigeExit = getBeigeExitMotion\(progress, canvas\.width, canvas\.height\)/, 'left and downward exits share one transition progress');
  assert.match(app, /scene === 'beige' && <>[\s\S]*?!beigeExitComplete && <svg className="beige-transition-art"/);
  assert.match(app, /className="beige-exit-pink"[\s\S]*?translate\(0 \$\{beigeExit\.pinkY\}\)[\s\S]*?clipPath="url\(#beige-exit-pink-clip\)"/);
  assert.match(app, /className="beige-exit-yellow"[\s\S]*?translate\(\$\{beigeYellowX\} 0\)[\s\S]*?clipPath="url\(#beige-exit-yellow-clip\)"/);
  assert.doesNotMatch(app, /className="figure figure-walker home-exit-down"/, 'the third figure stays off the homepage');
  assert.match(app, /scene !== 'beige' && <svg className="home-background home-exit-down"/);
  assert.match(app, /\(scene === 'pink' \|\| scene === 'yellow'\) && <svg className="pink-wave home-exit-down"/);
  assert.doesNotMatch(app, /purple/i, 'purple artwork must not return in the beige transition');
  assert.match(styles, /\.beige-transition-art\s*\{[^}]*z-index:\s*0/s);
  assert.doesNotMatch(app, /scene === 'beige' && <svg className="yellow-wave/);
});

test('pink reveal covers the editor-positioned middle figure while leaving the seated sequence above it', () => {
  const rule = styles.match(/\.scene--pink\s+\.figure-leaning\s*\{([^}]+)\}/)?.[1] ?? '';
  assert.match(rule, /z-index:\s*0\s*!important\s*;/, 'the middle homepage figure must sit under the pink reveal despite its editor inline rank');
  assert.match(styles, /\.sequence-editor-layer\s*\{[^}]*mix-blend-mode:\s*multiply/s, 'the active seated figure sequence remains its own visible layer');
});

test('yellow transition reveals a full-screen radial background above the pink wave', () => {
  const yellow = app.match(/className="yellow-wave home-exit-down"([\s\S]*?)<\/svg>/)?.[1] ?? '';
  assert.doesNotMatch(yellow, /style=\{styleFor\('centerFigure'\)\}/, 'character positioning must not shift or shrink the full-screen reveal');
  assert.match(app, /className="pink-wave home-exit-down"[\s\S]*?d=\{pinkPath\}/, 'the red paper wave remains animated during the yellow reveal');
  const yellowRule = styles.match(/\.yellow-wave\s*\{([^}]+)\}/)?.[1] ?? '';
  assert.match(yellowRule, /inset:\s*0/);
  assert.match(yellowRule, /width:\s*100%/);
  assert.match(yellowRule, /height:\s*100%/);
  const sceneLayers = styles.match(/\.scene--yellow\s+\.pink-wave\s*\{([^}]+)\}[\s\S]*?\.scene--yellow\s+\.yellow-wave\s*\{([^}]+)\}/);
  assert.ok(sceneLayers, 'yellow scene must define explicit transition layer order');
  assert.match(sceneLayers[1], /z-index:\s*2\s*!important/);
  assert.match(sceneLayers[1], /transform:\s*none\s*!important/);
  assert.match(sceneLayers[2], /z-index:\s*3\s*!important/);
  assert.match(sceneLayers[2], /transform:\s*none\s*!important/);
  assert.match(yellow, /cx=\{sceneYellowOrigin\.x\}/);
  assert.match(yellow, /cy=\{sceneYellowOrigin\.y\}/);
  assert.match(app, /const yellowRevealOrigin = \{ x: hero\.width \* 0\.2, y: hero\.height \/ 2 \}/);
  assert.match(config, /count: 20, fps: 12, box: \{ x: 560, y: 320, width: 364, height: 545 \}/);
});
