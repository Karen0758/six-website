import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import test from 'node:test';

test('stagger delays finish their fade at three quarters of the animation duration', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { staggeredRevealDelays, CHAPTER_REVEAL_FADE_MS } = await vite.ssrLoadModule('/src/chapterContentTiming.ts');
    for (const [itemCount, duration] of [[7, 2000], [5, 1583.333], [7, 2000]]) {
      const delays = staggeredRevealDelays(itemCount, duration);
      assert.equal(delays.length, itemCount);
      assert.equal(delays[0], 0);
      const fullyVisibleAt = delays.at(-1) + CHAPTER_REVEAL_FADE_MS;
      assert.ok(Math.abs(fullyVisibleAt - duration * 0.75) <= 1, `${fullyVisibleAt} should equal 75% of ${duration}`);
    }
    assert.deepEqual(staggeredRevealDelays(0, 3000), []);
  } finally {
    await vite.close();
  }
});

test('frame sequence signals completion after its final frame', () => {
  const source = readFileSync(fileURLToPath(new URL('../src/components/FrameSequence.tsx', import.meta.url)), 'utf8');
  assert.match(source, /onComplete\?:\s*\(\)\s*=>\s*void/);
  assert.match(source, /else onCompleteRef\.current\?\.\(\)/);
});

test('pink and yellow figures start with their transitions while chapter text retains its reveal timing', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { isChapterContentReady, PINK_COVER_PROGRESS, YELLOW_TEXT_START_PROGRESS } = await vite.ssrLoadModule('/src/chapterContentTiming.ts');
    assert.equal(isChapterContentReady('pink', PINK_COVER_PROGRESS - 0.01), false);
    assert.equal(isChapterContentReady('pink', PINK_COVER_PROGRESS), true);
    assert.equal(YELLOW_TEXT_START_PROGRESS, 2 / 3);
    assert.equal(isChapterContentReady('yellow', YELLOW_TEXT_START_PROGRESS - 0.01), false);
    assert.equal(isChapterContentReady('yellow', YELLOW_TEXT_START_PROGRESS), true);
    assert.equal(isChapterContentReady('yellow', 1), true);
    assert.equal(isChapterContentReady('beige', 1), true);
    assert.equal(isChapterContentReady('home', 1), false);
    const app = readFileSync(fileURLToPath(new URL('../src/App.tsx', import.meta.url)), 'utf8');
    assert.doesNotMatch(app, /chapterAnimationCompleteScene/);
    assert.match(app, /isChapterContentReady\(scene, progress\)/);
    assert.match(app, /clip=\{hero\.seated\} active=\{scene === 'pink'\}/);
    assert.match(app, /clip=\{hero\.middle\} active=\{scene === 'yellow'\}/);
    assert.match(app, /scene === 'beige' && beigeExitComplete && <div className="third-walker-enter">[\s\S]*?<\/div>\}/);
  } finally {
    await vite.close();
  }
});
