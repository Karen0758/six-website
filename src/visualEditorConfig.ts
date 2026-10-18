export const EDITOR_STORAGE_KEY = 'six-homepage-visual-editor-v1';

export const LAYER_IDS = [
  'background', 'leftFigure', 'centerFigure', 'rightFigure', 'pinkReveal', 'headline',
] as const;
export type LayerId = typeof LAYER_IDS[number];

export interface LayerTransform {
  x: number;
  y: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
}

export interface HomeText {
  eyebrow: string;
  title: string;
  description: string;
  button: string;
}

export interface EditorConfig {
  layers: Record<LayerId, LayerTransform>;
  text: HomeText;
}

export type EditorConfigOverrides = {
  layers?: Partial<Record<LayerId, Partial<LayerTransform>>>;
  text?: Partial<HomeText>;
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  layers: {
    background: { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, zIndex: 0 },
    leftFigure: { x: -84.31307952924395, y: 87.66923564189189, scale: 1.53, scaleX: 1, scaleY: 1, zIndex: 5 },
    centerFigure: { x: -13, y: 46, scale: 1, scaleX: 1, scaleY: 1, zIndex: 3 },
    rightFigure: { x: 0, y: -197, scale: 1, scaleX: 1, scaleY: 1, zIndex: 1 },
    pinkReveal: { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, zIndex: 2 },
    headline: { x: -73, y: -130, scale: 0.91, scaleX: 1, scaleY: 1, zIndex: 4 },
  },
  text: {
    eyebrow: 'SIX',
    title: '与年轻的创业家\n一起冒险',
    description: '有想象力、有活力、有胆识的新一代创业者，\n和她们的新冒险。',
    button: '了解我们　→',
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function clampLayerTransform(transform: Partial<LayerTransform>): LayerTransform {
  const finite = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return {
    x: Math.max(-1676, Math.min(1676, finite(transform.x, 0))),
    y: Math.max(-939, Math.min(939, finite(transform.y, 0))),
    scale: Math.max(0.25, Math.min(3, finite(transform.scale, 1))),
    scaleX: Math.max(0.25, Math.min(3, finite(transform.scaleX, 1))),
    scaleY: Math.max(0.25, Math.min(3, finite(transform.scaleY, 1))),
    zIndex: Math.round(Math.max(0, Math.min(99, finite(transform.zIndex, 0)))),
  };
}

export function resolveEditorConfig(defaults: EditorConfig, overrides: EditorConfigOverrides = {}): EditorConfig {
  const layers = Object.fromEntries(LAYER_IDS.map(id => [
    id,
    clampLayerTransform({ ...defaults.layers[id], ...overrides.layers?.[id] }),
  ])) as Record<LayerId, LayerTransform>;
  const ordered = [...LAYER_IDS].sort((a, b) => layers[a].zIndex - layers[b].zIndex || LAYER_IDS.indexOf(a) - LAYER_IDS.indexOf(b));
  ordered.forEach((id, zIndex) => { layers[id] = { ...layers[id], zIndex }; });
  const text = { ...defaults.text };
  for (const key of Object.keys(text) as (keyof HomeText)[]) {
    const value = overrides.text?.[key];
    if (typeof value === 'string' && value.length <= 500) text[key] = value;
  }
  return { layers, text };
}

export function loadEditorConfig(storage?: StorageLike | null): EditorConfig {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target) return resolveEditorConfig(DEFAULT_EDITOR_CONFIG);
    const raw = target.getItem(EDITOR_STORAGE_KEY);
    if (!raw) return resolveEditorConfig(DEFAULT_EDITOR_CONFIG);
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return resolveEditorConfig(DEFAULT_EDITOR_CONFIG);

    const layerOverrides: NonNullable<EditorConfigOverrides['layers']> = {};
    if (isRecord(parsed.layers)) {
      for (const id of LAYER_IDS) {
        const candidate = parsed.layers[id];
        if (!isRecord(candidate)) continue;
        const safe: Partial<LayerTransform> = {};
        for (const key of ['x', 'y', 'scale', 'scaleX', 'scaleY', 'zIndex'] as const) {
          if (typeof candidate[key] === 'number' && Number.isFinite(candidate[key])) {
            const value = candidate[key] as number;
            const min = key === 'x' ? -1676 : key === 'y' ? -939 : key === 'zIndex' ? 0 : 0.25;
            const max = key === 'x' ? 1676 : key === 'y' ? 939 : key === 'zIndex' ? 99 : 3;
            if (value >= min && value <= max) safe[key] = value;
          }
        }
        layerOverrides[id] = safe;
      }
    }
    const textOverrides: Partial<HomeText> = {};
    if (isRecord(parsed.text)) {
      for (const key of ['eyebrow', 'title', 'description', 'button'] as const) {
        if (typeof parsed.text[key] === 'string' && (parsed.text[key] as string).length <= 500) {
          textOverrides[key] = parsed.text[key] as string;
        }
      }
    }
    return resolveEditorConfig(DEFAULT_EDITOR_CONFIG, { layers: layerOverrides, text: textOverrides });
  } catch {
    return resolveEditorConfig(DEFAULT_EDITOR_CONFIG);
  }
}

export function saveEditorConfig(config: EditorConfig, storage?: StorageLike | null): boolean {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target) return false;
    target.setItem(EDITOR_STORAGE_KEY, exportEditorConfig(resolveEditorConfig(DEFAULT_EDITOR_CONFIG, config)));
    return true;
  } catch {
    return false;
  }
}

export function resetEditorConfig(storage?: StorageLike | null): boolean {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target) return false;
    target.removeItem(EDITOR_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function exportEditorConfig(config: EditorConfig): string {
  return JSON.stringify(resolveEditorConfig(DEFAULT_EDITOR_CONFIG, config), null, 2);
}

export function layerStyle(transform: LayerTransform, width = 1676, height = 939, origin = 'center center') {
  const x = Number((transform.x / width * 100).toFixed(3));
  const y = Number((transform.y / height * 100).toFixed(3));
  const scaleX = Number((transform.scale * transform.scaleX).toFixed(3));
  const scaleY = Number((transform.scale * transform.scaleY).toFixed(3));
  return {
    transform: `translate(${x}vw, ${y}vh) scale(${scaleX}${scaleX === scaleY ? '' : `, ${scaleY}`})`,
    transformOrigin: origin,
    zIndex: transform.zIndex,
  };
}

export function dragLayerTransform(transform: LayerTransform, deltaX: number, deltaY: number, canvasWidth: number, canvasHeight: number): LayerTransform {
  return clampLayerTransform({
    ...transform,
    x: transform.x + deltaX * 1676 / Math.max(1, canvasWidth),
    y: transform.y + deltaY * 939 / Math.max(1, canvasHeight),
  });
}

export function parseNumericDraft(value: string, min: number, max: number): number | null {
  if (value.trim() === '' || value === '-' || value === '.' || value === '-.') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(min, Math.min(max, parsed));
}

export function moveLayerOrder(config: EditorConfig, id: LayerId, direction: -1 | 1): EditorConfig {
  const ordered = [...LAYER_IDS].sort((a, b) => config.layers[a].zIndex - config.layers[b].zIndex || LAYER_IDS.indexOf(a) - LAYER_IDS.indexOf(b));
  const index = ordered.indexOf(id);
  const next = index + direction;
  if (next < 0 || next >= ordered.length) return config;
  [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
  const layers = { ...config.layers };
  ordered.forEach((layerId, zIndex) => { layers[layerId] = { ...layers[layerId], zIndex }; });
  return { ...config, layers };
}
