import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { hero } from './config';
import FrameSequence, { preloadFrames, preloadStartFrames } from './components/FrameSequence';
import { beigeExitMotion as getBeigeExitMotion, pinkWavePath, thirdFigureMotion, yellowRevealRadius } from './animationGeometry';
import { nextSceneForScroll } from './scrollSequence';
import { DEFAULT_EDITOR_CONFIG, exportEditorConfig, layerStyle, loadEditorConfig, resolveEditorConfig, resetEditorConfig as clearEditorConfig, saveEditorConfig, type EditorConfig, type LayerId } from './visualEditorConfig';
import VisualEditor from './components/VisualEditor';
import ChapterContent from './components/ChapterContent';
import { isChapterContentReady, PINK_COVER_PROGRESS } from './chapterContentTiming';

if (import.meta.env.DEV && typeof window !== 'undefined') void import('./editor.css');

type Scene = 'home' | 'pink' | 'yellow' | 'beige';
const PINK_WIPE_MS = 1200;
const YELLOW_WIPE_MS = 1500;
const BEIGE_TRANSITION_MS = 700;
const BEIGE_WALK_ENTER_MS = 2500;
const yellowRevealOrigin = { x: hero.width * 0.2, y: hero.height / 2 };

export default function App({ initialConfig }: { initialConfig?: EditorConfig } = {}) {
  const [scene, setScene] = useState<Scene>('home');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorConfig, setEditorConfig] = useState<EditorConfig>(() => import.meta.env.DEV
    ? (initialConfig ?? loadEditorConfig())
    : DEFAULT_EDITOR_CONFIG);
  const visual = resolveEditorConfig(DEFAULT_EDITOR_CONFIG, editorConfig);
  const [progress, setProgress] = useState(0);
  const [beigeExitComplete, setBeigeExitComplete] = useState(false);
  const [walkEnterProgress, setWalkEnterProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const raf = useRef(0);
  const startTime = useRef(0);
  const sceneRef = useRef<Scene>('home');
  const transitioningRef = useRef(false);
  const queuedScrollAdvancesRef = useRef(0);
  const preloadCountRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    const preloadTimer = window.setTimeout(() => {
      void preloadFrames(hero.seated).catch(() => {});
    }, 350);
    return () => window.clearTimeout(preloadTimer);
  }, []);

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
    transitioningRef.current = true;
    startTime.current = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - startTime.current) / duration);
      setProgress(next);
      if (next < 1) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      transitioningRef.current = false;
      if (sceneRef.current === 'beige') setBeigeExitComplete(true);
      if (queuedScrollAdvancesRef.current > 0) {
        queuedScrollAdvancesRef.current--;
        const nextScene = nextSceneForScroll(sceneRef.current);
        if (nextScene) void begin(nextScene);
      }
    };
    raf.current = requestAnimationFrame(tick);
  }

  async function begin(nextScene: Exclude<Scene, 'home'>) {
    if (transitioningRef.current) return;
    const clip = nextScene === 'pink' ? hero.seated : nextScene === 'yellow' ? hero.middle : hero.walkCycle;
    sceneRef.current = nextScene;
    setBeigeExitComplete(false);
    setWalkEnterProgress(0);
    preloadCountRef.current++;
    setLoading(true);
    setError('');
    void preloadStartFrames(clip).catch(() => {});
    const preload = preloadFrames(clip);
    setProgress(0);
    setScene(nextScene);
    runTransition(nextScene === 'pink' ? PINK_WIPE_MS : nextScene === 'yellow' ? YELLOW_WIPE_MS : BEIGE_TRANSITION_MS);
    try {
      await preload;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '动作帧加载失败');
    } finally {
      preloadCountRef.current--;
      setLoading(preloadCountRef.current > 0);
    }
  }

  useEffect(() => {
    if (scene !== 'beige' || !beigeExitComplete) return;
    let entranceStart = 0;
    let entranceRaf = 0;
    const tick = (now: number) => {
      if (!entranceStart) entranceStart = now;
      const next = Math.min(1, (now - entranceStart) / BEIGE_WALK_ENTER_MS);
      setWalkEnterProgress(next);
      if (next < 1) entranceRaf = requestAnimationFrame(tick);
    };
    entranceRaf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(entranceRaf);
  }, [scene, beigeExitComplete]);

  function requestScrollAdvance() {
    const nextScene = nextSceneForScroll(sceneRef.current, queuedScrollAdvancesRef.current);
    if (!nextScene) return;
    if (transitioningRef.current) {
      queuedScrollAdvancesRef.current++;
      return;
    }
    void begin(nextScene);
  }

  useEffect(() => {
    let accumulatedWheel = 0;
    let wheelGestureTriggered = false;
    let wheelIdleTimer = 0;
    let touchStartY: number | null = null;
    let touchStartChapter: HTMLElement | null = null;

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (!nextSceneForScroll(sceneRef.current, queuedScrollAdvancesRef.current)) return;
      const chapter = event.target instanceof Element ? event.target.closest<HTMLElement>('.chapter-content') : null;
      if (chapter && chapter.scrollTop + chapter.clientHeight < chapter.scrollHeight - 1) return;
      event.preventDefault();
      window.clearTimeout(wheelIdleTimer);
      if (!wheelGestureTriggered) {
        accumulatedWheel += event.deltaY;
        if (accumulatedWheel >= 55) {
          wheelGestureTriggered = true;
          requestScrollAdvance();
        }
      }
      wheelIdleTimer = window.setTimeout(() => {
        accumulatedWheel = 0;
        wheelGestureTriggered = false;
      }, 360);
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null;
      touchStartChapter = event.target instanceof Element ? event.target.closest<HTMLElement>('.chapter-content') : null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartY === null || event.changedTouches.length !== 1) return;
      const swipeUpDistance = touchStartY - event.changedTouches[0].clientY;
      touchStartY = null;
      if (swipeUpDistance >= 70 && touchStartChapter && touchStartChapter.scrollTop + touchStartChapter.clientHeight < touchStartChapter.scrollHeight - 1) {
        touchStartChapter = null;
        return;
      }
      touchStartChapter = null;
      if (swipeUpDistance >= 70) requestScrollAdvance();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.clearTimeout(wheelIdleTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const pinkPath = pinkWavePath(progress);
  const radius = yellowRevealRadius(progress, hero.width, hero.height, yellowRevealOrigin.x, yellowRevealOrigin.y);
  const beigeExit = getBeigeExitMotion(progress, hero.width, hero.height);
  const thirdEnterMotion = thirdFigureMotion(walkEnterProgress, hero.width, hero.walkCycle.motionWidth);
  const chapterAnimationDurationMs = scene === 'pink'
    ? (hero.seated.count - 1 - hero.seated.startFrame) / hero.seated.fps * 1000
    : scene === 'yellow'
      ? (hero.middle.count - 1) / hero.middle.fps * 1000
      : (hero.walkCycle.count - 1) / hero.walkCycle.fps * 1000;
  const styleFor = (id: LayerId, origin?: string) => layerStyle(visual.layers[id], hero.width, hero.height, origin);
  const leftFigureStyle = styleFor('leftFigure', '24% 91.2%');
  const leftHitStyle = styleFor('leftFigure', '55% 101%');
  const editorDragStyles: Record<LayerId, CSSProperties> = {
    background: { ...styleFor('background'), left: '0%', top: '0%', width: '100%', height: '100%', zIndex: 25 },
    leftFigure: { ...leftHitStyle, left: '15%', top: '50%', width: '14%', height: '45%', zIndex: 25 },
    centerFigure: { ...styleFor('centerFigure'), left: '43%', top: '32%', width: '23%', height: '66%', zIndex: 25 },
    rightFigure: { ...styleFor('rightFigure'), left: '76%', top: '20%', width: '22%', height: '62%', zIndex: 25 },
    pinkReveal: { ...styleFor('pinkReveal'), left: '0%', top: '0%', width: '100%', height: '100%', zIndex: 25 },
    headline: { ...styleFor('headline'), left: '7%', top: '19%', width: '45%', height: '68%', zIndex: 25 },
  };

  return <main className={`scene scene--${scene}`} aria-label="SIX 官网首页主视觉，可点击人物卡片或向下滚动依次体验三段动作">
    {scene === 'beige' && <>
      <img className="beige-background" src={hero.thirdBackground} width={hero.width} height={hero.height} alt="" />
      <svg className="beige-transition-art" viewBox={`0 0 ${hero.width} ${hero.height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id="beige-exit-pink-clip" clipPathUnits="userSpaceOnUse">
            <path d="M0 163 C93 251 294 331 400 389 C520 466 677 634 779 700 C851 744 907 781 980 807 C1150 860 1330 884 1507 939 H0Z" />
          </clipPath>
          <clipPath id="beige-exit-yellow-purple-clip" clipPathUnits="userSpaceOnUse">
            <path d="M0 0H980V807 C907 781 851 744 779 700 C677 634 520 466 400 389 C294 331 93 251 0 163Z" />
          </clipPath>
        </defs>
        <g className="beige-exit-pink" transform={`translate(0 ${beigeExit.pinkY})`}>
          <image href={hero.background} x="0" y="0" width={hero.width} height={hero.height} clipPath="url(#beige-exit-pink-clip)" />
        </g>
        <g className="beige-exit-yellow-purple" transform={`translate(${beigeExit.yellowPurpleX} 0)`}>
          <image href={hero.background} x="0" y="0" width={hero.width} height={hero.height} clipPath="url(#beige-exit-yellow-purple-clip)" />
        </g>
      </svg>
    </>}
    {scene !== 'beige' && <img className="background home-exit-down" src={hero.background} width={hero.width} height={hero.height} alt="" fetchPriority="high" style={styleFor('background')} />}
    <img className="figure figure-leaning home-exit-down" src={hero.leaning.image} width={hero.width} height={hero.height} alt={hero.leaning.label} style={styleFor('centerFigure')} />
    {scene === 'home' && <img className="figure figure-walker" src={hero.walker.image} width={hero.width} height={hero.height} alt={hero.walker.label} style={styleFor('rightFigure')} />}
    {scene === 'beige' && <img className="figure figure-walker home-exit-down" src={hero.walker.image} width={hero.width} height={hero.height} alt={hero.walker.label} style={styleFor('rightFigure')} />}

    <div className={`headline home-exit-down ${scene !== 'home' ? 'headline-exiting' : ''}`} style={styleFor('headline')}>
      <h1 className="brand-wordmark">{visual.text.eyebrow}</h1>
      <h2 className="headline-title">{visual.text.title.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</h2>
      <p>{visual.text.description.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</p>
      <button className="learn-more" type="button" onClick={() => void begin('pink')} disabled={scene !== 'home' || loading}>{visual.text.button}</button>
    </div>

    {scene !== 'beige' && <svg className="pink-wave home-exit-down" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={styleFor('pinkReveal')}>
      <defs>
        <clipPath id="pink-wave-clip" clipPathUnits="userSpaceOnUse"><path d={pinkPath} /></clipPath>
      </defs>
      <g clipPath="url(#pink-wave-clip)">
        <rect width="100" height="100" fill="#f23a64" />
        <image href="./media/pink-paper-wide.webp" x="0" y="0" width="100" height="100" preserveAspectRatio="none" />
      </g>
    </svg>}

    {scene === 'yellow' && <svg className="yellow-wave home-exit-down" viewBox={`0 0 ${hero.width} ${hero.height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <clipPath id="yellow-background-reveal" clipPathUnits="userSpaceOnUse">
          <circle cx={yellowRevealOrigin.x} cy={yellowRevealOrigin.y} r={radius} />
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

    {scene !== 'yellow' && <div className="sequence-editor-layer home-exit-down" style={leftFigureStyle}><FrameSequence clip={hero.seated} active={scene === 'pink' && progress >= PINK_COVER_PROGRESS} /></div>}
    {scene === 'yellow' && <div className="sequence-editor-layer" style={styleFor('centerFigure')}><FrameSequence clip={hero.middle} active={scene === 'yellow' && progress >= 1} revealProgress={progress} revealOrigin={yellowRevealOrigin} /></div>}
    {scene === 'beige' && beigeExitComplete && <div className="third-walker-enter">
      <FrameSequence clip={hero.walkCycle} active translateX={thirdEnterMotion.enterX} />
    </div>}
    {isChapterContentReady(scene, progress) && <ChapterContent scene={scene} animationDurationMs={chapterAnimationDurationMs} />}

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
      <button className="figure-hit figure-hit-right" type="button"
        onPointerEnter={() => { void preloadFrames(hero.walkCycle).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.walkCycle).catch(() => {}); }}
        onClick={() => void begin('beige')}
        aria-label="点击右侧人物，黄紫色向左、粉色与人物向下退出，人物从左侧走入米色纸纹画面" style={styleFor('rightFigure')} />
      <button className="chapter-label chapter-label-pink" type="button"
        onPointerEnter={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onClick={() => void begin('pink')}
        aria-label="我们是谁，粉色纸纹铺满屏幕并播放站起动作">我们是谁</button>
      <button className="chapter-label chapter-label-yellow" type="button"
        onPointerEnter={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onClick={() => void begin('yellow')}
        aria-label="怎么工作，黄色纸纹从中心铺满屏幕并播放转向镜头的动作">怎么工作</button>
      <button className="chapter-label chapter-label-beige" type="button"
        onPointerEnter={() => { void preloadFrames(hero.walkCycle).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.walkCycle).catch(() => {}); }}
        onClick={() => void begin('beige')}
        aria-label="加入 SIX，黄紫色向左、粉色与人物向下退出，人物从左侧走入米色纸纹画面">加入 SIX</button>
    </>}
    {import.meta.env.DEV && <VisualEditor open={editorOpen} config={visual} onChange={updateEditorConfig} onReset={restoreEditorDefaults} onExport={downloadEditorConfig} onToggle={() => setEditorOpen(value => !value)} dragStyles={editorDragStyles} />}
    {loading && scene === 'home' && <div className="loading-note" role="status">准备动作…</div>}
    {error && <div className="error-note" role="alert">{error}</div>}
  </main>;
}
