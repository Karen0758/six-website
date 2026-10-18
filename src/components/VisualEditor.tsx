import { useRef, useState, type PointerEvent, type CSSProperties } from 'react';
import { LAYER_IDS, clampLayerTransform, dragLayerTransform, moveLayerOrder, parseNumericDraft, type EditorConfig, type HomeText, type LayerId, type LayerTransform } from '../visualEditorConfig';

const layerNames: Record<LayerId, string> = {
  background: '背景', leftFigure: '左下人物', centerFigure: '中央人物与黄色区域',
  rightFigure: '右侧人物', pinkReveal: '粉色揭幕层', headline: '标题组',
};

interface VisualEditorProps {
  open: boolean;
  config: EditorConfig;
  onChange(config: EditorConfig): void;
  onReset(): void;
  onExport(): void;
  onToggle(): void;
  dragStyles: Record<LayerId, CSSProperties>;
}

type NumericField = 'x' | 'y' | 'scale' | 'scaleX' | 'scaleY';
const numericRanges: Record<NumericField, [number, number]> = {
  x: [-1676, 1676], y: [-939, 939], scale: [0.25, 3], scaleX: [0.25, 3], scaleY: [0.25, 3],
};
const figureLayers: LayerId[] = ['leftFigure', 'centerFigure', 'rightFigure'];

export default function VisualEditor({ open, config, onChange, onReset, onExport, onToggle, dragStyles }: VisualEditorProps) {
  const [selected, setSelected] = useState<LayerId>('leftFigure');
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});
  const dragStart = useRef<{ x: number; y: number; width: number; height: number; id: LayerId; layer: LayerTransform } | null>(null);
  const layer = config.layers[selected];
  const orderedLayers = [...LAYER_IDS].sort((a, b) => config.layers[a].zIndex - config.layers[b].zIndex);

  function updateLayer(values: Partial<typeof layer>) {
    onChange({ ...config, layers: { ...config.layers, [selected]: clampLayerTransform({ ...layer, ...values }) } });
  }
  function updateNumeric(field: NumericField, value: string) {
    const key = `${selected}.${field}`;
    setNumericDrafts(current => ({ ...current, [key]: value }));
    const [min, max] = numericRanges[field];
    const parsed = parseNumericDraft(value, min, max);
    if (parsed !== null) updateLayer({ [field]: parsed });
  }
  function numericValue(field: NumericField) {
    return numericDrafts[`${selected}.${field}`] ?? String(layer[field]);
  }
  function finishNumeric(field: NumericField) {
    setNumericDrafts(current => { const next = { ...current }; delete next[`${selected}.${field}`]; return next; });
  }
  function updateText(key: keyof HomeText, value: string) {
    onChange({ ...config, text: { ...config.text, [key]: value.slice(0, 500) } });
  }
  function changeOrder(direction: -1 | 1) {
    onChange(moveLayerOrder(config, selected, direction));
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const scene = event.currentTarget.closest('.scene');
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    dragStart.current = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, id: selected, layer: config.layers[selected] };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const start = dragStart.current;
    onChange({ ...config, layers: { ...config.layers, [start.id]: dragLayerTransform(start.layer, event.clientX - start.x, event.clientY - start.y, start.width, start.height) } });
  }

  return <>
    {open && <div className="editor-drag-target" role="button" tabIndex={0} aria-label="拖动选中图层调整位置" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { dragStart.current = null; }} onPointerCancel={() => { dragStart.current = null; }} style={dragStyles[selected]} onKeyDown={event => { const step = event.shiftKey ? 50 : 10; const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key]; if (delta) { event.preventDefault(); onChange({ ...config, layers: { ...config.layers, [selected]: clampLayerTransform({ ...config.layers[selected], x: config.layers[selected].x + delta[0], y: config.layers[selected].y + delta[1] }) } }); } }} />}
    <button className="editor-toggle" type="button" onClick={onToggle} aria-expanded={open}>{open ? '关闭编辑器' : '编辑页面'}</button>
    {open && <aside className="visual-editor" aria-label="首页内容编辑器">
      <header className="visual-editor-header"><h2>页面编辑</h2><button type="button" onClick={onToggle} aria-label="关闭编辑器">×</button></header>
      <label className="editor-field">图层（由后到前）
        <select value={selected} onChange={event => { setNumericDrafts({}); setSelected(event.target.value as LayerId); }}>{orderedLayers.map(id => <option key={id} value={id}>{layerNames[id]}</option>)}</select>
      </label>
      <label className="editor-field">横向位置<input aria-label="横向位置" type="number" value={numericValue('x')} min={-1676} max={1676} step={1} onChange={event => updateNumeric('x', event.target.value)} onBlur={() => finishNumeric('x')} /></label>
      <label className="editor-field">纵向位置<input aria-label="纵向位置" type="number" value={numericValue('y')} min={-939} max={939} step={1} onChange={event => updateNumeric('y', event.target.value)} onBlur={() => finishNumeric('y')} /></label>
      <label className="editor-field">缩放<input aria-label="缩放" type="number" value={numericValue('scale')} min={0.25} max={3} step={0.01} onChange={event => updateNumeric('scale', event.target.value)} onBlur={() => finishNumeric('scale')} /></label>
      {figureLayers.includes(selected) && <>
        <label className="editor-field">横向拉伸<input aria-label="横向拉伸" type="number" value={numericValue('scaleX')} min={0.25} max={3} step={0.01} onChange={event => updateNumeric('scaleX', event.target.value)} onBlur={() => finishNumeric('scaleX')} /></label>
        <label className="editor-field">纵向拉伸<input aria-label="纵向拉伸" type="number" value={numericValue('scaleY')} min={0.25} max={3} step={0.01} onChange={event => updateNumeric('scaleY', event.target.value)} onBlur={() => finishNumeric('scaleY')} /></label>
      </>}
      <div className="editor-field editor-order"><span>层级</span><div>
        <button type="button" onClick={() => changeOrder(1)} disabled={layer.zIndex >= LAYER_IDS.length - 1}>上移一层</button>
        <button type="button" onClick={() => changeOrder(-1)} disabled={layer.zIndex <= 0}>下移一层</button>
        <output aria-label="当前层级">{layer.zIndex + 1} / {LAYER_IDS.length}</output>
      </div></div>
      <div className="editor-divider" />
      <label className="editor-field">品牌名（最大标题）<input aria-label="品牌名（最大标题）" value={config.text.eyebrow} onChange={event => updateText('eyebrow', event.target.value)} /></label>
      <label className="editor-field">中文标题<textarea aria-label="中文标题" rows={2} value={config.text.title} onChange={event => updateText('title', event.target.value)} /></label>
      <label className="editor-field">介绍段落<textarea aria-label="介绍段落" rows={3} value={config.text.description} onChange={event => updateText('description', event.target.value)} /></label>
      <label className="editor-field">按钮文字<input aria-label="按钮文字" value={config.text.button} onChange={event => updateText('button', event.target.value)} /></label>
      <p className="editor-hint">拖动画布上的选中框调整位置；人物可分别设置横向、纵向拉伸。</p>
      <div className="editor-actions"><button type="button" onClick={onReset}>恢复默认</button><button type="button" onClick={onExport}>导出 JSON</button></div>
    </aside>}
  </>;
}
