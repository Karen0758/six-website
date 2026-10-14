import { useRef, useState, type PointerEvent, type CSSProperties } from 'react';
import { LAYER_IDS, clampLayerTransform, moveLayerOrder, parseNumericDraft, type EditorConfig, type HomeText, type LayerId } from '../visualEditorConfig';

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
  dragStyle?: CSSProperties;
}

export default function VisualEditor({ open, config, onChange, onReset, onExport, onToggle, dragStyle }: VisualEditorProps) {
  const [selected, setSelected] = useState<LayerId>('leftFigure');
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});
  const dragStart = useRef<{ x: number; y: number; layerX: number; layerY: number } | null>(null);
  const layer = config.layers[selected];
  const orderedLayers = [...LAYER_IDS].sort((a, b) => config.layers[a].zIndex - config.layers[b].zIndex);

  function updateLayer(values: Partial<typeof layer>) {
    onChange({ ...config, layers: { ...config.layers, [selected]: clampLayerTransform({ ...layer, ...values }) } });
  }
  function updateNumeric(field: 'x' | 'y' | 'scale', value: string, min: number, max: number) {
    const key = `${selected}.${field}`;
    setNumericDrafts(current => ({ ...current, [key]: value }));
    const parsed = parseNumericDraft(value, min, max);
    if (parsed !== null) updateLayer({ [field]: parsed });
  }
  function numericValue(field: 'x' | 'y' | 'scale') {
    return numericDrafts[`${selected}.${field}`] ?? String(layer[field]);
  }
  function finishNumeric(field: 'x' | 'y' | 'scale') {
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
    dragStart.current = { x: event.clientX, y: event.clientY, layerX: config.layers.leftFigure.x, layerY: config.layers.leftFigure.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.canvasWidth = String(rect.width);
    event.currentTarget.dataset.canvasHeight = String(rect.height);
    event.preventDefault();
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const width = Number(event.currentTarget.dataset.canvasWidth);
    const height = Number(event.currentTarget.dataset.canvasHeight);
    onChange({ ...config, layers: { ...config.layers, leftFigure: clampLayerTransform({
      ...config.layers.leftFigure,
      x: dragStart.current.layerX + (event.clientX - dragStart.current.x) * 1676 / width,
      y: dragStart.current.layerY + (event.clientY - dragStart.current.y) * 939 / height,
    }) } });
  }

  return <>
    {open && <div className="editor-drag-target" role="button" tabIndex={0} aria-label="拖动左侧人物调整位置" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { dragStart.current = null; }} onPointerCancel={() => { dragStart.current = null; }} style={dragStyle} onKeyDown={event => { const step = event.shiftKey ? 50 : 10; const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key]; if (delta) { event.preventDefault(); onChange({ ...config, layers: { ...config.layers, leftFigure: clampLayerTransform({ ...config.layers.leftFigure, x: config.layers.leftFigure.x + delta[0], y: config.layers.leftFigure.y + delta[1] }) } }); } }} />}
    <button className="editor-toggle" type="button" onClick={onToggle} aria-expanded={open}>{open ? '关闭编辑器' : '编辑页面'}</button>
    {open && <aside className="visual-editor" aria-label="首页内容编辑器">
      <header className="visual-editor-header"><h2>页面编辑</h2><button type="button" onClick={onToggle} aria-label="关闭编辑器">×</button></header>
      <label className="editor-field">图层（由后到前）
        <select value={selected} onChange={event => { setNumericDrafts({}); setSelected(event.target.value as LayerId); }}>{orderedLayers.map(id => <option key={id} value={id}>{layerNames[id]}</option>)}</select>
      </label>
      <label className="editor-field">横向位置<input aria-label="横向位置" type="number" value={numericValue('x')} min={-1676} max={1676} step={1} onChange={event => updateNumeric('x', event.target.value, -1676, 1676)} onBlur={() => finishNumeric('x')} /></label>
      <label className="editor-field">纵向位置<input aria-label="纵向位置" type="number" value={numericValue('y')} min={-939} max={939} step={1} onChange={event => updateNumeric('y', event.target.value, -939, 939)} onBlur={() => finishNumeric('y')} /></label>
      <label className="editor-field">缩放<input aria-label="缩放" type="number" value={numericValue('scale')} min={0.25} max={3} step={0.01} onChange={event => updateNumeric('scale', event.target.value, 0.25, 3)} onBlur={() => finishNumeric('scale')} /></label>
      <div className="editor-field editor-order"><span>层级</span><div>
        <button type="button" onClick={() => changeOrder(1)} disabled={layer.zIndex >= LAYER_IDS.length - 1}>上移一层</button>
        <button type="button" onClick={() => changeOrder(-1)} disabled={layer.zIndex <= 0}>下移一层</button>
        <output aria-label="当前层级">{layer.zIndex + 1} / {LAYER_IDS.length}</output>
      </div></div>
      <div className="editor-divider" />
      <label className="editor-field">品牌副标题<input aria-label="品牌副标题" value={config.text.eyebrow} onChange={event => updateText('eyebrow', event.target.value)} /></label>
      <label className="editor-field">主标题<textarea aria-label="主标题" rows={2} value={config.text.title} onChange={event => updateText('title', event.target.value)} /></label>
      <label className="editor-field">介绍段落<textarea aria-label="介绍段落" rows={3} value={config.text.description} onChange={event => updateText('description', event.target.value)} /></label>
      <label className="editor-field">按钮文字<input aria-label="按钮文字" value={config.text.button} onChange={event => updateText('button', event.target.value)} /></label>
      <p className="editor-hint">拖动左侧人物调整位置</p>
      <div className="editor-actions"><button type="button" onClick={onReset}>恢复默认</button><button type="button" onClick={onExport}>导出 JSON</button></div>
    </aside>}
  </>;
}
