import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import test from 'node:test';

function imageAttributes(markup) {
  const image = markup.match(/<image\b[^>]*>/)?.[0];
  assert.ok(image, 'sequence renders its frame image');
  return new Map([...image.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]));
}

test('the seated sequence first frame keeps its original proportions', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const [{ default: FrameSequence }, { hero }] = await Promise.all([
      vite.ssrLoadModule('/src/components/FrameSequence.tsx'),
      vite.ssrLoadModule('/src/config.ts'),
    ]);
    const active = imageAttributes(renderToStaticMarkup(React.createElement(FrameSequence, { clip: hero.seated, active: true })));
    assert.equal(Number(active.get('x')), hero.seated.box.x);
    assert.equal(Number(active.get('y')), hero.seated.box.y);
    assert.equal(Number(active.get('width')), hero.seated.box.width);
    assert.equal(Number(active.get('height')), hero.seated.box.height);

    const inactive = imageAttributes(renderToStaticMarkup(React.createElement(FrameSequence, { clip: hero.seated, active: false })));
    assert.equal(Number(inactive.get('height')), hero.seated.box.height);
  } finally {
    await vite.close();
  }
});
