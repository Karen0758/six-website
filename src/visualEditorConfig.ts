export const EDITOR_STORAGE_KEY = 'six-homepage-visual-editor-v1';

export const LAYER_IDS = [
  'background', 'leftFigure', 'centerFigure', 'rightFigure', 'pinkReveal', 'headline',
] as const;
export type LayerId = typeof LAYER_IDS[number];

export interface LayerTransform {
  x: number;
  y: number;
  scale: number;
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
    background: { x: 0, y: 0, scale: 1, zIndex: 0 },
    leftFigure: { x: 0, y: 0, scale: 1.15, zIndex: 4 },
    centerFigure: { x: 0, y: 0, scale: 1, zIndex: 4 },
    rightFigure: { x: 0, y: 0, scale: 1, zIndex: 1 },
    pinkReveal: { x: 0, y: 0, scale: 1, zIndex: 3 },
    headline: { x: 0, y: 0, scale: 1, zIndex: 2 },
  },
  text: {
    eyebrow: 'SIX  —  一场价值投资实验',
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
    zIndex: Math.round(Math.max(0, Math.min(99, finite(transform.zIndex, 0)))),
  };
}

export function resolveEditorConfig(defaults: EditorConfig, overrides: EditorConfigOverrides = {}): EditorConfig {
  const layers = Object.fromEntries(LAYER_IDS.map(id => [
    id,
    clampLayerTransform({ ...defaults.layers[id], ...overrides.layers?.[id] }),
  ])) as Record<LayerId, LayerTransform>;
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
        for (const key of ['x', 'y', 'scale', 'zIndex'] as const) {
          if (typeof candidate[key] === 'number' && Number.isFinite(candidate[key])) {
            const value = candidate[key] as number;
            const min = key === 'x' ? -1676 : key === 'y' ? -939 : key === 'scale' ? 0.25 : 0;
            const max = key === 'x' ? 1676 : key === 'y' ? 939 : key === 'scale' ? 3 : 99;
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
