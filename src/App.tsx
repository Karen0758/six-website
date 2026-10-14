import { useEffect, useRef, useState } from 'react';
import { hero } from './config';
import FrameSequence, { preloadFrames } from './components/FrameSequence';
import { pinkWavePath, yellowRevealRadius } from './animationGeometry';
import { DEFAULT_EDITOR_CONFIG, exportEditorConfig, layerStyle, loadEditorConfig, resolveEditorConfig, resetEditorConfig as clearEditorConfig, saveEditorConfig, type EditorConfig, type LayerId } from './visualEditorConfig';
import VisualEditor from './components/VisualEditor';

if (import.meta.env.DEV && typeof window !== 'undefined') void import('./editor.css');

type Scene = 'home' | 'pink' | 'yellow';
const PINK_WIPE_MS = 4300;
const YELLOW_WIPE_MS = 2100;

export default function App({ initialConfig }: { initialConfig?: EditorConfig } = {}) {
  const [scene, setScene] = useState<Scene>('home');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorConfig, setEditorConfig] = useState<EditorConfig>(() => import.meta.env.DEV
    ? (initialConfig ?? loadEditorConfig())
    : DEFAULT_EDITOR_CONFIG);
  const visual = resolveEditorConfig(DEFAULT_EDITOR_CONFIG, editorConfig);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const raf = useRef(0);
  const startTime = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function updateEditorConfig(next: EditorConfig) {
    setEditorConfig(next);
    if (import.meta.env.DEV) saveEditorConfig(next);
  }

  function restoreEditorDefaults() {
    if (import.meta.env.DEV) clearEditorConfig();
    setEditorConfig(DEFAULT_EDITOR_CONFIG);
  }

  function downloadEditorConfig() {
    const file = new Blob([exportEditorConfig(visual)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'six-homepage-visual-settings.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function runTransition(duration: number) {
    startTime.current = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - startTime.current) / duration);
      setProgress(next);
      if (next < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  async function begin(nextScene: Exclude<Scene, 'home'>) {
    if (scene !== 'home' || loading) return;
    const clip = nextScene === 'pink' ? hero.seated : hero.middle;
    setLoading(true);
    setError('');
    try {
      await preloadFrames(clip);
      setProgress(0);
      setScene(nextScene);
      runTransition(nextScene === 'pink' ? PINK_WIPE_MS : YELLOW_WIPE_MS);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '动作帧加载失败');
    } finally {
      setLoading(false);
    }
  }

  const pinkPath = pinkWavePath(progress);
  const radius = yellowRevealRadius(progress, hero.width, hero.height);
  const styleFor = (id: LayerId, origin?: string) => layerStyle(visual.layers[id], hero.width, hero.height, origin);
  const leftFigureStyle = styleFor('leftFigure', '24% 91.2%');
  const leftHitStyle = styleFor('leftFigure', '55% 101%');

  return <main className="scene" aria-label="SIX 官网首页主视觉">
    <img className="background" src={hero.background} width={hero.width} height={hero.height} alt="" fetchPriority="high" style={styleFor('background')} />
    <img className="figure figure-leaning" src={hero.leaning.image} width={hero.width} height={hero.height} alt={hero.leaning.label} style={styleFor('centerFigure')} />
    <img className="figure figure-walker" src={hero.walker.image} width={hero.width} height={hero.height} alt={hero.walker.label} style={styleFor('rightFigure')} />

    <div className={`headline ${scene !== 'home' ? 'headline-exiting' : ''}`} style={styleFor('headline')}>
      <small>{visual.text.eyebrow}</small>
      <h1>{visual.text.title.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</h1>
      <p>{visual.text.description.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</p>
      <button className="learn-more" type="button" onClick={() => void begin('pink')} disabled={scene !== 'home' || loading}>{visual.text.button}</button>
    </div>

    <svg className="pink-wave" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={styleFor('pinkReveal')}>
      <defs>
        <clipPath id="pink-wave-clip" clipPathUnits="userSpaceOnUse"><path d={pinkPath} /></clipPath>
        <pattern id="pink-paper" width="18" height="34" patternUnits="userSpaceOnUse">
          <image href="./media/pink-texture.webp" width="18" height="34" preserveAspectRatio="none" />
        </pattern>
      </defs>
      <g clipPath="url(#pink-wave-clip)">
        <rect width="100" height="100" fill="#f23a64" />
        <rect width="100" height="100" fill="url(#pink-paper)" opacity=".86" />
      </g>
    </svg>

    {scene === 'yellow' && <svg className="yellow-wave" viewBox={`0 0 ${hero.width} ${hero.height}`} preserveAspectRatio="none" aria-hidden="true" style={styleFor('centerFigure')}>
      <defs>
        <clipPath id="yellow-background-reveal" clipPathUnits="userSpaceOnUse">
          <circle cx={hero.width / 2} cy={hero.height / 2} r={radius} />
        </clipPath>
        <pattern id="yellow-paper" width={hero.width} height={hero.height} patternUnits="userSpaceOnUse">
          <image href={hero.yellowTexture} width={hero.width} height={hero.height} preserveAspectRatio="none" />
        </pattern>
      </defs>
      <g clipPath="url(#yellow-background-reveal)">
        <rect width={hero.width} height={hero.height} fill="#d9a534" />
        <rect width={hero.width} height={hero.height} fill="url(#yellow-paper)" />
      </g>
    </svg>}

    {scene !== 'yellow' && <div className="sequence-editor-layer" style={leftFigureStyle}><FrameSequence clip={hero.seated} active={scene === 'pink'} /></div>}
    {scene === 'yellow' && <div className="sequence-editor-layer" style={styleFor('centerFigure')}><FrameSequence clip={hero.middle} active revealProgress={progress} /></div>}

    {scene === 'home' && <>
      <button className="figure-hit figure-hit-left" type="button"
        onPointerEnter={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onClick={() => void begin('pink')}
        aria-label="点击左侧人物卡片，粉色纸纹铺满屏幕并播放站起动作" style={leftHitStyle} />
      <button className="figure-hit figure-hit-middle" type="button"
        onPointerEnter={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onClick={() => void begin('yellow')}
        aria-label="点击黄色区域人物，黄色纸纹从中心铺满屏幕并播放转向镜头的动作" style={styleFor('centerFigure')} />
    </>}
    {import.meta.env.DEV && <VisualEditor open={editorOpen} config={visual} onChange={updateEditorConfig} onReset={restoreEditorDefaults} onExport={downloadEditorConfig} onToggle={() => setEditorOpen(value => !value)} dragStyle={{ ...leftHitStyle, zIndex: 25 }} />}
    {loading && <div className="loading-note" role="status">准备动作…</div>}
    {error && <div className="error-note" role="alert">{error}</div>}
  </main>;
}
