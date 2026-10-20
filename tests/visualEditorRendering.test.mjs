import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { DEFAULT_EDITOR_CONFIG, resolveEditorConfig } from '../src/visualEditorConfig.ts';

test('homepage renders edited copy and layer transforms while keeping character actions', async () => {
  const vite = await createServer({
    configFile: './vite.config.ts',
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });
  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
    const config = resolveEditorConfig(DEFAULT_EDITOR_CONFIG, {
      layers: {
        background: { x: 100, y: -40, scale: 1.2, zIndex: 8 },
        leftFigure: { x: 30, y: 50, scale: 1.4, scaleX: 1.15, scaleY: 0.9, zIndex: 9 },
        centerFigure: { x: 200, y: 25, scale: 1.3, zIndex: 10 },
        rightFigure: { x: -75, y: 0, scale: 0.9, zIndex: 11 },
        headline: { x: -20, y: 10, scale: 0.9, zIndex: 12 },
      },
      text: { eyebrow: '自定义眉题', title: '新的标题', description: '新的介绍', button: '马上了解' },
    });
    const html = renderToStaticMarkup(React.createElement(App, { initialConfig: config }));
    assert.ok(html.includes('aria-label="SIX 官网首页主视觉，可点击人物卡片或向下滚动依次体验三段动作"'));
    for (const text of ['自定义眉题', '新的标题', '新的介绍', '马上了解']) assert.ok(html.includes(text));
    assert.match(html, /<h1 class="brand-wordmark">自定义眉题<\/h1>/, 'the brand name must be the page’s primary heading');
    assert.match(html, /<h2 class="headline-title"><span>新的标题<\/span><\/h2>/, 'the editable Chinese title remains visible beneath SIX');
    assert.match(html, /z-index:5/);
    assert.match(html, /translate\(5\.967vw, -4\.26vh\) scale\(1\.2\)/);
    assert.match(html, /translate\(1\.79vw, 5\.325vh\) scale\(1\.61, 1\.26\)/);
    assert.match(html, /class="figure figure-leaning home-exit-down"[^>]+translate\(11\.933vw, 2\.662vh\) scale\(1\.3\)/);
    assert.match(html, /class="home-background home-exit-down"/);
    assert.doesNotMatch(html, /class="figure figure-walker"/, 'third figure must not appear on the homepage');
    assert.ok(html.includes('aria-label="点击第一个人物，查看我们是谁'));
    assert.ok(html.includes('aria-label="点击中间黄色人物，查看方法'));
    assert.ok(html.includes('aria-label="点击米色区域，查看如何加入'));
    assert.doesNotMatch(html, /class="chapter-label/);
  } finally {
    await vite.close();
  }
});
