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
      dragStyles: Object.fromEntries(Object.keys(DEFAULT_EDITOR_CONFIG.layers).map(id => [id, {}])),
    }));
    for (const label of ['图层', '横向位置', '纵向位置', '缩放', '横向拉伸', '纵向拉伸', '层级', '品牌名（最大标题）', '中文标题', '介绍段落', '按钮文字', '恢复默认', '导出 JSON', '拖动选中图层调整位置']) {
      assert.ok(html.includes(label), `missing editor control: ${label}`);
    }
    assert.match(html, /aria-label="横向位置"/);
    assert.match(html, /aria-label="纵向位置"/);
    assert.match(html, /aria-label="缩放"/);
    assert.match(html, /aria-label="横向拉伸"/);
    assert.match(html, /aria-label="纵向拉伸"/);
    assert.match(html, /aria-label="拖动选中图层调整位置"/);
  } finally {
    await vite.close();
  }
});
