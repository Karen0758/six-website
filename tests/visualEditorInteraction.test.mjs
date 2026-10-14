import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { DEFAULT_EDITOR_CONFIG } from '../src/visualEditorConfig.ts';

test('visual editor exposes accessible controls for layers, text, reset, and export', async () => {
  const vite = await createServer({
    configFile: './vite.config.ts', server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent',
  });
  try {
    const { default: VisualEditor } = await vite.ssrLoadModule('/src/components/VisualEditor.tsx');
    const html = renderToStaticMarkup(React.createElement(VisualEditor, {
      open: true,
      config: DEFAULT_EDITOR_CONFIG,
      onChange() {}, onReset() {}, onExport() {}, onToggle() {},
    }));
    for (const label of ['图层', '横向位置', '纵向位置', '缩放', '层级', '品牌副标题', '主标题', '介绍段落', '按钮文字', '恢复默认', '导出 JSON', '拖动左侧人物调整位置']) {
      assert.ok(html.includes(label), `missing editor control: ${label}`);
    }
    assert.match(html, /aria-label="横向位置"/);
    assert.match(html, /aria-label="纵向位置"/);
    assert.match(html, /aria-label="缩放"/);
  } finally {
    await vite.close();
  }
});
