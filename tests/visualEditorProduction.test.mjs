import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('production bundle omits editor controls and local storage', () => {
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe' });
  const assets = readdirSync(resolve(root, 'dist/assets'));
  const bundles = assets.filter(name => name.endsWith('.js') || name.endsWith('.css')).map(name => readFileSync(resolve(root, 'dist/assets', name), 'utf8'));
  const bundle = bundles.join('\n');
  for (const editorOnlyText of ['编辑页面', '导出 JSON', '恢复默认', 'six-homepage-visual-editor-v2', 'localStorage', '.visual-editor', '.editor-drag-target']) {
    assert.ok(!bundle.includes(editorOnlyText), `production bundle leaked ${editorOnlyText}`);
  }
});
