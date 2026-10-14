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
        leftFigure: { x: 30, y: 50, scale: 1.4, zIndex: 9 },
        centerFigure: { x: 200, y: 25, scale: 1.3, zIndex: 10 },
        rightFigure: { x: -75, y: 0, scale: 0.9, zIndex: 11 },
        headline: { x: -20, y: 10, scale: 0.9, zIndex: 12 },
      },
      text: { eyebrow: '自定义眉题', title: '新的标题', description: '新的介绍', button: '马上了解' },
    });
    const html = renderToStaticMarkup(React.createElement(App, { initialConfig: config }));
    for (const text of ['自定义眉题', '新的标题', '新的介绍', '马上了解']) assert.ok(html.includes(text));
    assert.match(html, /z-index:5/);
    assert.match(html, /translate\(5\.967vw, -4\.26vh\) scale\(1\.2\)/);
    assert.match(html, /translate\(1\.79vw, 5\.325vh\) scale\(1\.4\)/);
    assert.match(html, /class="figure figure-leaning"[^>]+translate\(11\.933vw, 2\.662vh\) scale\(1\.3\)/);
    assert.match(html, /class="figure figure-walker"[^>]+translate\(-4\.475vw, 0vh\) scale\(0\.9\)/);
    assert.ok(html.includes('aria-label="点击左侧人物卡片'));
    assert.ok(html.includes('aria-label="点击黄色区域人物'));
  } finally {
    await vite.close();
  }
});
