import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from 'react';
import { clampLayerTransform, dragLayerTransform, parseNumericDraft, type EditorConfig, type HomeText, type LayerId, type LayerTransform, type PageTypography } from '../visualEditorConfig';

const layerNames: Record<LayerId, string> = {
  background: '背景', leftFigure: '左下人物', centerFigure: '中央人物与黄色区域',
  rightFigure: '右侧人物', pinkReveal: '粉色揭幕层', headline: '标题组',
  pinkFigure: '人物与影子', pinkContent: '“我们是谁”文字',
  foundersLandscape: '黄色竖带与树木', foundersContent: '合伙人文字',
  yellowFigure: '黄色人物', yellowContent: '“方法”文字',
  beigeFigure: '行走人物', beigeContent: '“如何加入”文字',
};

interface VisualEditorProps {
  open: boolean;
  config: EditorConfig;
  onChange(config: EditorConfig): void;
  onReset(): void;
  onExport(): void;
  onToggle(): void;
  dragStyles: Record<LayerId, CSSProperties>;
  layerIds: LayerId[];
  pageName: string;
  pageId: 'home' | 'pink' | 'founders' | 'yellow' | 'beige';
  onPageChange(page: 'home' | 'pink' | 'founders' | 'yellow' | 'beige'): void;
  textFields: Array<{ key: string; label: string; value: string; multiline?: boolean }>;
  onPageTextChange(key: string, value: string): void;
  typography: PageTypography;
  onTypographyChange(key: keyof PageTypography, value: number): void;
  showHomeText?: boolean;
}

const editorPages = [
  ['home', '首页'], ['pink', '我们是谁'], ['founders', '发起合伙人'], ['yellow', '方法'], ['beige', '如何加入'],
] as const;

type NumericField = 'x' | 'y' | 'scale' | 'scaleX' | 'scaleY';
const numericRanges: Record<NumericField, [number, number]> = {
  x: [-1676, 1676], y: [-939, 939], scale: [0.25, 3], scaleX: [0.25, 3], scaleY: [0.25, 3],
};
const figureLayers: LayerId[] = ['leftFigure', 'centerFigure', 'rightFigure', 'pinkFigure', 'yellowFigure', 'beigeFigure'];

export default function VisualEditor({ open, config, onChange, onReset, onExport, onToggle, dragStyles, layerIds, pageName, pageId, onPageChange, textFields, onPageTextChange, typography, onTypographyChange, showHomeText = false }: VisualEditorProps) {
  const [selected, setSelected] = useState<LayerId>('leftFigure');
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});
  const dragStart = useRef<{ x: number; y: number; width: number; height: number; id: LayerId; layer: LayerTransform } | null>(null);
  const activeSelected = layerIds.includes(selected) ? selected : layerIds[0];
  const layer = config.layers[activeSelected];
  const orderedLayers = [...layerIds].sort((a, b) => config.layers[a].zIndex - config.layers[b].zIndex);
  const selectedOrderIndex = orderedLayers.indexOf(activeSelected);

  useEffect(() => {
    if (!layerIds.includes(selected) && layerIds[0]) {
      setNumericDrafts({});
      setSelected(layerIds[0]);
    }
  }, [layerIds, selected]);

  function updateLayer(values: Partial<typeof layer>) {
    onChange({ ...config, layers: { ...config.layers, [activeSelected]: clampLayerTransform({ ...layer, ...values }) } });
  }
  function updateNumeric(field: NumericField, value: string) {
    const key = `${activeSelected}.${field}`;
    setNumericDrafts(current => ({ ...current, [key]: value }));
    const [min, max] = numericRanges[field];
    const parsed = parseNumericDraft(value, min, max);
    if (parsed !== null) updateLayer({ [field]: parsed });
  }
  function numericValue(field: NumericField) {
    return numericDrafts[`${activeSelected}.${field}`] ?? String(layer[field]);
  }
  function finishNumeric(field: NumericField) {
    setNumericDrafts(current => { const next = { ...current }; delete next[`${activeSelected}.${field}`]; return next; });
  }
  function updateText(key: keyof HomeText, value: string) {
    onChange({ ...config, text: { ...config.text, [key]: value.slice(0, 500) } });
  }
  function changeOrder(direction: -1 | 1) {
    const nextIndex = selectedOrderIndex + direction;
    if (nextIndex < 0 || nextIndex >= orderedLayers.length) return;
    const otherId = orderedLayers[nextIndex];
    const layers = { ...config.layers };
    layers[activeSelected] = { ...layers[activeSelected], zIndex: layers[otherId].zIndex };
    layers[otherId] = { ...layers[otherId], zIndex: layer.zIndex };
    onChange({ ...config, layers });
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const scene = event.currentTarget.closest('.scene');
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    dragStart.current = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, id: activeSelected, layer: config.layers[activeSelected] };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const start = dragStart.current;
    onChange({ ...config, layers: { ...config.layers, [start.id]: dragLayerTransform(start.layer, event.clientX - start.x, event.clientY - start.y, start.width, start.height) } });
  }

  return <>
    {open && <div className="editor-drag-target" role="button" tabIndex={0} aria-label={`拖动${layerNames[activeSelected]}调整位置`} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { dragStart.current = null; }} onPointerCancel={() => { dragStart.current = null; }} style={dragStyles[activeSelected]} onKeyDown={event => { const step = event.shiftKey ? 50 : 10; const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key]; if (delta) { event.preventDefault(); onChange({ ...config, layers: { ...config.layers, [activeSelected]: clampLayerTransform({ ...config.layers[activeSelected], x: config.layers[activeSelected].x + delta[0], y: config.layers[activeSelected].y + delta[1] }) } }); } }} />}
    <button className="editor-toggle" type="button" onClick={onToggle} aria-expanded={open}>{open ? '关闭编辑器' : '编辑页面'}</button>
    {open && <aside className="visual-editor" aria-label={`${pageName}内容编辑器`} onWheelCapture={event => event.stopPropagation()} onTouchStartCapture={event => event.stopPropagation()} onTouchMoveCapture={event => event.stopPropagation()} onTouchEndCapture={event => event.stopPropagation()}>
      <header className="visual-editor-header"><div><p>当前页面</p><h2>{pageName}</h2></div><button type="button" onClick={onToggle} aria-label="关闭编辑器">×</button></header>
      <label className="editor-field">选择编辑页面
        <select aria-label="选择编辑页面" value={pageId} onChange={event => onPageChange(event.target.value as VisualEditorProps['pageId'])}>
          {editorPages.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <label className="editor-field">图层（由后到前）
        <select value={activeSelected} onChange={event => { setNumericDrafts({}); setSelected(event.target.value as LayerId); }}>{orderedLayers.map(id => <option key={id} value={id}>{layerNames[id]}</option>)}</select>
      </label>
      <label className="editor-field">横向位置<input aria-label="横向位置" type="number" value={numericValue('x')} min={-1676} max={1676} step={1} onChange={event => updateNumeric('x', event.target.value)} onBlur={() => finishNumeric('x')} /></label>
      <label className="editor-field">纵向位置<input aria-label="纵向位置" type="number" value={numericValue('y')} min={-939} max={939} step={1} onChange={event => updateNumeric('y', event.target.value)} onBlur={() => finishNumeric('y')} /></label>
      <label className="editor-field">缩放<input aria-label="缩放" type="number" value={numericValue('scale')} min={0.25} max={3} step={0.01} onChange={event => updateNumeric('scale', event.target.value)} onBlur={() => finishNumeric('scale')} /></label>
      {figureLayers.includes(activeSelected) && <>
        <label className="editor-field">横向拉伸<input aria-label="横向拉伸" type="number" value={numericValue('scaleX')} min={0.25} max={3} step={0.01} onChange={event => updateNumeric('scaleX', event.target.value)} onBlur={() => finishNumeric('scaleX')} /></label>
        <label className="editor-field">纵向拉伸<input aria-label="纵向拉伸" type="number" value={numericValue('scaleY')} min={0.25} max={3} step={0.01} onChange={event => updateNumeric('scaleY', event.target.value)} onBlur={() => finishNumeric('scaleY')} /></label>
      </>}
      <div className="editor-field editor-order"><span>层级</span><div>
        <button type="button" onClick={() => changeOrder(1)} disabled={selectedOrderIndex >= orderedLayers.length - 1}>上移一层</button>
        <button type="button" onClick={() => changeOrder(-1)} disabled={selectedOrderIndex <= 0}>下移一层</button>
        <output aria-label="当前层级">{selectedOrderIndex + 1} / {orderedLayers.length}</output>
      </div></div>
      {showHomeText && <><div className="editor-divider" />
      <label className="editor-field">品牌名（最大标题）<input aria-label="品牌名（最大标题）" value={config.text.eyebrow} onChange={event => updateText('eyebrow', event.target.value)} /></label></>}
      {textFields.length > 0 && <>
        <div className="editor-divider" />
        <h3 className="editor-section-title">本页文字</h3>
        {textFields.map(field => <label className="editor-field" key={field.key}>{field.label}
          {field.multiline
            ? <textarea aria-label={field.label} rows={3} value={field.value} onChange={event => onPageTextChange(field.key, event.target.value)} />
            : <input aria-label={field.label} value={field.value} onChange={event => onPageTextChange(field.key, event.target.value)} />}
        </label>)}
      </>}
      <div className="editor-divider" />
      <h3 className="editor-section-title">字号（px）</h3>
      <label className="editor-field">{showHomeText ? '品牌名' : '大标题'}<input aria-label="大标题字号" type="number" min={12} max={220} step={1} value={typography.title} onChange={event => onTypographyChange('title', Number(event.target.value))} /></label>
      <label className="editor-field">{showHomeText ? '首页主标题' : '小标题'}<input aria-label="小标题字号" type="number" min={12} max={120} step={1} value={typography.subtitle} onChange={event => onTypographyChange('subtitle', Number(event.target.value))} /></label>
      <label className="editor-field">{showHomeText ? '按钮文字' : '正文'}<input aria-label="正文字号" type="number" min={12} max={72} step={1} value={typography.body} onChange={event => onTypographyChange('body', Number(event.target.value))} /></label>
      <div className="editor-field">
        <span>行间距</span>
        <div className="editor-line-height-options" role="group" aria-label="行间距快捷设置">
          {[['紧凑', 1.5], ['标准', 1.75], ['舒展', 2], ['更松', 2.25]].map(([label, value]) => <button key={value} type="button" aria-pressed={typography.lineHeight === value} className={typography.lineHeight === value ? 'is-selected' : ''} onClick={() => onTypographyChange('lineHeight', value as number)}>{label as string}</button>)}
        </div>
      </div>
      <p className="editor-hint">当前只显示本页图层。拖动画布选中框调整位置；人物可分别设置横向、纵向拉伸。</p>
      <div className="editor-actions"><button type="button" onClick={onReset}>恢复默认</button><button type="button" onClick={onExport}>导出 JSON</button></div>
    </aside>}
  </>;
}
