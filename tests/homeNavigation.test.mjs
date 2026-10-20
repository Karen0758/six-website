import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('homepage entries lead to the intended animation scenes', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { sceneForHomeEntry } = await vite.ssrLoadModule('/src/homeNavigation.ts');
    for (const [entry, expected] of [
      ['firstFigure', 'pink'],
      ['middleFigure', 'yellow'],
      ['joinCta', 'beige'], ['thirdRegion', 'beige'],
    ]) assert.equal(sceneForHomeEntry(entry), expected, `${entry} should open ${expected}`);
  } finally {
    await vite.close();
  }
});

test('homepage has one join CTA beneath the title and no top-right chapter links', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
    const html = renderToStaticMarkup(React.createElement(App));
    assert.match(html, /class="learn-more"[^>]*>加入我们[\s\S]*?→<\/button>/);
    assert.doesNotMatch(html, /class="chapter-label/);
  } finally {
    await vite.close();
  }
});

test('the center figure receives clicks where its hit area overlaps the first figure', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
    const html = renderToStaticMarkup(React.createElement(App));
    const left = html.match(/class="figure-hit figure-hit-left"[^>]*style="([^"]+)"/)?.[1];
    const middle = html.match(/class="figure-hit figure-hit-middle"[^>]*style="([^"]+)"/)?.[1];
    assert.ok(left && middle, 'both figures need a clickable hit area');
    const leftRank = Number(left.match(/z-index:(\d+)/)?.[1]);
    const middleRank = Number(middle.match(/z-index:(\d+)/)?.[1]);
    assert.ok(middleRank > leftRank, `middle hit area (${middleRank}) must sit above the overlapping first figure (${leftRank})`);
  } finally {
    await vite.close();
  }
});

test('chapter headings match their homepage entries', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: ChapterContent } = await vite.ssrLoadModule('/src/components/ChapterContent.tsx');
    const render = scene => renderToStaticMarkup(React.createElement(ChapterContent, { scene, animationDurationMs: 3000 }));
    assert.match(render('pink'), /<h2[^>]*>我们是谁<\/h2>/);
    assert.match(render('yellow'), /<h2[^>]*>方法<\/h2>/);
    const join = render('beige');
    assert.match(join, /<h2[^>]*>如何加入<\/h2>/);
    assert.match(join, /href="mailto:xiaozhege@six\.com"/);
    assert.match(join, /class="join-email-icon"/);
    assert.match(join, /class="join-email-action">发邮件<\/span>/);
  } finally {
    await vite.close();
  }
});

test('visible figure captions identify the content behind each current figure', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const [{ default: App }, { siteCopy }] = await Promise.all([
      vite.ssrLoadModule('/src/App.tsx'),
      vite.ssrLoadModule('/src/siteCopy.ts'),
    ]);
    const html = renderToStaticMarkup(React.createElement(App));
    assert.match(html, new RegExp(`class="figure-caption figure-caption-left"[^>]*>[\\s\\S]*?${siteCopy.about.title}`));
    assert.match(html, new RegExp(`class="figure-caption figure-caption-middle"[^>]*>[\\s\\S]*?${siteCopy.work.title}`));
    assert.match(html, /class="figure-caption figure-caption-middle"[^>]*>[\s\S]*?<svg class="figure-caption-arrow"[^>]*>[\s\S]*?M19 5 5 19/);
    assert.doesNotMatch(html, /<span aria-hidden="true">[↗↙]<\/span>/, 'arrow labels should not use emoji-capable text glyphs');
    assert.doesNotMatch(html, /figure-caption-right/);
  } finally {
    await vite.close();
  }
});

test('the homepage headline keeps 一起冒险 on its own line without a leading dash', async () => {
  const vite = await createServer({ configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
    const html = renderToStaticMarkup(React.createElement(App));
    assert.match(html, /<h2 class="headline-title"><span>与年轻的创业家<\/span><span>一起冒险<\/span><\/h2>/);
  } finally {
    await vite.close();
  }
});
