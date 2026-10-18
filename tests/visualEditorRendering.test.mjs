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
    assert.match(html, /class="figure figure-walker"[^>]+translate\(-4\.475vw, 0vh\) scale\(0\.9\)/);
    assert.ok(html.includes('aria-label="点击左侧人物卡片'));
    assert.ok(html.includes('aria-label="点击黄色区域人物'));
    assert.ok(html.includes('aria-label="点击右侧人物，黄紫色向左、粉色与人物向下退出'));
    for (const [label, action] of [
      ['我们是谁', '粉色纸纹铺满屏幕并播放站起动作'],
      ['怎么工作', '黄色纸纹从中心铺满屏幕并播放转向镜头的动作'],
      ['加入 SIX', '黄紫色向左、粉色与人物向下退出，人物从左侧走入米色纸纹画面'],
    ]) {
      assert.ok(html.includes(`>${label}</button>`), `missing clickable chapter label: ${label}`);
      assert.ok(html.includes(`aria-label="${label}，${action}"`), `${label} should announce its matching scene action`);
    }
  } finally {
    await vite.close();
  }
});
