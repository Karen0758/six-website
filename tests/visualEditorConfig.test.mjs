import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EDITOR_CONFIG,
  clampLayerTransform,
  exportEditorConfig,
  loadEditorConfig,
  moveLayerOrder,
  parseNumericDraft,
  resetEditorConfig,
  resolveEditorConfig,
  saveEditorConfig,
} from '../src/visualEditorConfig.ts';

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
    removeItem: () => { value = null; },
    read: () => value,
  };
}

test('defaults define editable layers and homepage text', () => {
  assert.deepEqual(Object.keys(DEFAULT_EDITOR_CONFIG.layers), [
    'background', 'leftFigure', 'centerFigure', 'rightFigure', 'pinkReveal', 'headline',
  ]);
  assert.equal(DEFAULT_EDITOR_CONFIG.layers.leftFigure.scale, 1.15);
  assert.deepEqual(Object.keys(DEFAULT_EDITOR_CONFIG.text), ['eyebrow', 'title', 'description', 'button']);
});

test('resolveEditorConfig merges overrides without mutating defaults', () => {
  const resolved = resolveEditorConfig(DEFAULT_EDITOR_CONFIG, {
    layers: { leftFigure: { x: 40 } }, text: { title: '自定义标题' },
  });
  assert.equal(resolved.layers.leftFigure.x, 40);
  assert.equal(resolved.layers.leftFigure.scale, 1.15);
  assert.equal(resolved.text.title, '自定义标题');
  assert.notEqual(DEFAULT_EDITOR_CONFIG.layers.leftFigure.x, 40);
});

test('clampLayerTransform bounds coordinates, scale, and order', () => {
  assert.deepEqual(clampLayerTransform({ x: 4000, y: -1200, scale: 9, zIndex: 123.4 }), {
    x: 1676, y: -939, scale: 3, zIndex: 99,
  });
  assert.deepEqual(clampLayerTransform({ x: NaN, y: Infinity, scale: 0, zIndex: -4 }), {
    x: 0, y: 0, scale: 0.25, zIndex: 0,
  });
});

test('loadEditorConfig falls back safely for malformed and invalid storage', () => {
  assert.deepEqual(loadEditorConfig(memoryStorage('{broken')), DEFAULT_EDITOR_CONFIG);
  const invalid = JSON.stringify({ layers: { leftFigure: { scale: 100 } }, text: { title: 42 } });
  const loaded = loadEditorConfig(memoryStorage(invalid));
  assert.equal(loaded.layers.leftFigure.scale, 1.15);
  assert.equal(loaded.text.title, DEFAULT_EDITOR_CONFIG.text.title);
  assert.deepEqual(loadEditorConfig(null), DEFAULT_EDITOR_CONFIG);
  assert.deepEqual(loadEditorConfig({ getItem() { throw new Error('blocked'); } }), DEFAULT_EDITOR_CONFIG);
});

test('load normalizes duplicate and out-of-range stack ranks into a complete layer order', () => {
  const duplicate = JSON.stringify({ layers: { leftFigure: { zIndex: 4 }, centerFigure: { zIndex: 4 } } });
  const loaded = loadEditorConfig(memoryStorage(duplicate));
  assert.deepEqual(Object.values(loaded.layers).map(layer => layer.zIndex).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5]);
  const invalidRanks = JSON.stringify({ layers: Object.fromEntries(Object.keys(DEFAULT_EDITOR_CONFIG.layers).map(id => [id, { zIndex: 99 }])) });
  const normalized = loadEditorConfig(memoryStorage(invalidRanks));
  assert.deepEqual(Object.values(normalized.layers).map(layer => layer.zIndex).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5]);
});

test('numeric drafts preserve partial typing and clamp complete values', () => {
  assert.equal(parseNumericDraft('-', -1676, 1676), null);
  assert.equal(parseNumericDraft('', -1676, 1676), null);
  assert.equal(parseNumericDraft('-100', -1676, 1676), -100);
  assert.equal(parseNumericDraft('0.8', 0.25, 3), 0.8);
  assert.equal(parseNumericDraft('9', 0.25, 3), 3);
});

test('save and reload preserve edits; reset removes the local override', () => {
  const storage = memoryStorage();
  const config = resolveEditorConfig(DEFAULT_EDITOR_CONFIG, { text: { button: '进入' } });
  saveEditorConfig(config, storage);
  assert.equal(loadEditorConfig(storage).text.button, '进入');
  resetEditorConfig(storage);
  assert.deepEqual(loadEditorConfig(storage), DEFAULT_EDITOR_CONFIG);
});

test('layer order remains a unique complete stack and respects both ends', () => {
  const moved = moveLayerOrder(DEFAULT_EDITOR_CONFIG, 'leftFigure', 1);
  const z = Object.values(moved.layers).map(layer => layer.zIndex).sort((a, b) => a - b);
  assert.deepEqual(z, [0, 1, 2, 3, 4, 5]);
  assert.equal(moved.layers.leftFigure.zIndex, 5);
  assert.deepEqual(moveLayerOrder(moved, 'leftFigure', 1).layers, moved.layers);
  const atBottom = { ...DEFAULT_EDITOR_CONFIG, layers: { ...DEFAULT_EDITOR_CONFIG.layers, background: { ...DEFAULT_EDITOR_CONFIG.layers.background, zIndex: 0 } } };
  assert.deepEqual(moveLayerOrder(atBottom, 'background', -1).layers, atBottom.layers);
});

test('storage write and reset failures do not interrupt editing', () => {
  const blocked = { getItem() { return null; }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(saveEditorConfig(DEFAULT_EDITOR_CONFIG, blocked), false);
  assert.equal(resetEditorConfig(blocked), false);
});

test('exportEditorConfig creates stable pretty JSON', () => {
  const exported = exportEditorConfig(DEFAULT_EDITOR_CONFIG);
  assert.equal(exported, JSON.stringify(DEFAULT_EDITOR_CONFIG, null, 2));
});
