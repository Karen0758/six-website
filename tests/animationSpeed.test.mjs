import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import test from 'node:test';

test('chapter exits are faster, especially beige, while its walker entrance remains at 0.8x', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { hero } = await vite.ssrLoadModule('/src/config.ts');
    assert.equal(hero.seated.startFrame, 12);
    assert.ok((hero.seated.count - 1 - hero.seated.startFrame) / hero.seated.fps * 1000 < 1400);
    assert.equal(hero.walkCycle.fps, 19.2);
    assert.equal((hero.walkCycle.count - 1) / hero.walkCycle.fps * 1000, 2500);

    const app = readFileSync(fileURLToPath(new URL('../src/App.tsx', import.meta.url)), 'utf8');
    assert.match(app, /const PINK_WIPE_MS = 1200/);
    assert.match(app, /const YELLOW_WIPE_MS = 1500/);
    assert.match(app, /const BEIGE_TRANSITION_MS = 700/);
    const styles = readFileSync(fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8');
    assert.match(styles, /animation:\s*beige-content-exit\s+0\.7s\b/);
    assert.match(app, /const BEIGE_WALK_ENTER_MS = 2500/);
    assert.match(app, /\(now - entranceStart\) \/ BEIGE_WALK_ENTER_MS/);
  } finally {
    await vite.close();
  }
});
