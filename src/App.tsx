import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { hero } from './config';
import FrameSequence, { preloadFrames, preloadStartFrames } from './components/FrameSequence';
import { beigeExitMotion as getBeigeExitMotion, pinkWavePath, thirdFigureMotion, yellowRevealRadius } from './animationGeometry';
import { nextSceneForScroll, previousSceneForScroll } from './scrollSequence';
import { DEFAULT_EDITOR_CONFIG, exportEditorConfig, layerStyle, loadEditorConfig, resolveEditorConfig, resetEditorConfig as clearEditorConfig, saveEditorConfig, type EditorConfig, type LayerId } from './visualEditorConfig';
import VisualEditor from './components/VisualEditor';
import ChapterContent from './components/ChapterContent';
import { isChapterContentReady } from './chapterContentTiming';
import { sceneForHomeEntry } from './homeNavigation';
import { getSiteCopy, type Language } from './siteCopy';
import { mobileCanvas, mobilePinkPath, mobileWalkerMotionWidth, mobileYellowBand, mobileYellowOrigin } from './mobileLayout';

if (import.meta.env.DEV && typeof window !== 'undefined') void import('./editor.css');

type Scene = 'home' | 'pink' | 'yellow' | 'beige';
const PINK_WIPE_MS = 1200;
const YELLOW_WIPE_MS = 1500;
const BEIGE_TRANSITION_MS = 700;
const BEIGE_WALK_ENTER_MS = 2500;
const yellowRevealOrigin = { x: hero.width * 0.2, y: hero.height / 2 };
const homePinkPath = 'M0 405 C185 490 415 585 594 674 C830 804 1260 887 1640 939 H0Z';

export default function App({ initialConfig }: { initialConfig?: EditorConfig } = {}) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'cn';
    try { return window.localStorage.getItem('six-language') === 'en' ? 'en' : 'cn'; } catch { return 'cn'; }
  });
  const copy = getSiteCopy(language);
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches);
  const [scene, setScene] = useState<Scene>('home');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorConfig, setEditorConfig] = useState<EditorConfig>(() => import.meta.env.DEV
    ? (initialConfig ?? loadEditorConfig())
    : DEFAULT_EDITOR_CONFIG);
  const visual = resolveEditorConfig(DEFAULT_EDITOR_CONFIG, editorConfig);
  const homeCopy = language === 'cn' ? visual.text : copy.home;
  const [progress, setProgress] = useState(0);
  const [beigeExitComplete, setBeigeExitComplete] = useState(false);
  const [walkEnterProgress, setWalkEnterProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const raf = useRef(0);
  const startTime = useRef(0);
  const sceneRef = useRef<Scene>('home');
  const transitioningRef = useRef(false);
  const preloadCountRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    try { window.localStorage.setItem('six-language', language); } catch { /* storage may be disabled */ }
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = language === 'en' ? 'SIX | An adventure with young founders' : 'SIX · 与年轻的创业家一起冒险';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = language === 'en'
      ? 'SIX is an experiment in value investing. We back founders with imagination, energy, and courage.'
      : 'SIX 是一场价值投资实验。与年轻的创业家一起冒险。';
  }, [language]);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    void preloadStartFrames(hero.seated).catch(() => {});
    void preloadStartFrames(hero.middle).catch(() => {});
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
      setError(copy.ui.loadError);
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
    if (transitioningRef.current) return;
    const nextScene = nextSceneForScroll(sceneRef.current);
    if (!nextScene) return;
    void begin(nextScene);
  }

  function returnHome() {
    if (transitioningRef.current) return;
    sceneRef.current = 'home';
    setScene('home');
    setProgress(0);
    setBeigeExitComplete(false);
    setWalkEnterProgress(0);
    setError('');
  }

  function requestScrollBack() {
    if (transitioningRef.current) return;
    const previousScene = previousSceneForScroll(sceneRef.current);
    if (previousScene === 'home') returnHome();
    else if (previousScene) void begin(previousScene);
  }

  useEffect(() => {
    let accumulatedWheel = 0;
    let wheelGestureTriggered = false;
    let wheelIdleTimer = 0;
    let touchStartY: number | null = null;
    let touchStartChapter: HTMLElement | null = null;
    let touchStartScrollTop = 0;

    const onWheel = (event: WheelEvent) => {
      if (!event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const direction = Math.sign(event.deltaY);
      if (direction > 0 ? !nextSceneForScroll(sceneRef.current) : !previousSceneForScroll(sceneRef.current)) return;
      const chapter = event.target instanceof Element ? event.target.closest<HTMLElement>('.chapter-content') : null;
      if (chapter && (direction > 0
        ? chapter.scrollTop + chapter.clientHeight < chapter.scrollHeight - 1
        : chapter.scrollTop > 1)) return;
      event.preventDefault();
      window.clearTimeout(wheelIdleTimer);
      if (!wheelGestureTriggered && !transitioningRef.current) {
        accumulatedWheel = Math.sign(accumulatedWheel) === direction ? accumulatedWheel + event.deltaY : event.deltaY;
        if (Math.abs(accumulatedWheel) >= 55) {
          wheelGestureTriggered = true;
          if (direction > 0) requestScrollAdvance();
          else requestScrollBack();
        }
      }
      wheelIdleTimer = window.setTimeout(() => {
        accumulatedWheel = 0;
        wheelGestureTriggered = false;
      }, 500);
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null;
      touchStartChapter = event.target instanceof Element ? event.target.closest<HTMLElement>('.chapter-content') : null;
      touchStartScrollTop = touchStartChapter?.scrollTop ?? 0;
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartY === null || event.changedTouches.length !== 1) return;
      const swipeDistance = touchStartY - event.changedTouches[0].clientY;
      touchStartY = null;
      if (Math.abs(swipeDistance) < 70) return;
      if (touchStartChapter && (swipeDistance > 0
        ? touchStartScrollTop + touchStartChapter.clientHeight < touchStartChapter.scrollHeight - 1
        : touchStartScrollTop > 1)) {
        touchStartChapter = null;
        return;
      }
      touchStartChapter = null;
      if (swipeDistance > 0) requestScrollAdvance();
      else requestScrollBack();
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
  const canvas = mobile ? mobileCanvas : hero;
  const scenePinkPath = mobile ? mobilePinkPath : homePinkPath;
  const yellowBand = mobile ? mobileYellowBand : { x: 594, width: 236 };
  const sceneYellowOrigin = mobile ? mobileYellowOrigin : yellowRevealOrigin;
  const radius = yellowRevealRadius(progress, canvas.width, canvas.height, sceneYellowOrigin.x, sceneYellowOrigin.y);
  const beigeExit = getBeigeExitMotion(progress, canvas.width, canvas.height);
  const beigeYellowX = mobile ? -canvas.width * progress : beigeExit.yellowX;
  const thirdEnterMotion = thirdFigureMotion(walkEnterProgress, canvas.width, mobile ? mobileWalkerMotionWidth : hero.walkCycle.motionWidth);
  const chapterAnimationDurationMs = scene === 'pink'
    ? (hero.seated.count - 1 - hero.seated.startFrame) / hero.seated.fps * 1000
    : scene === 'yellow'
      ? (hero.middle.count - 1) / hero.middle.fps * 1000
      : (hero.walkCycle.count - 1) / hero.walkCycle.fps * 1000;
  const styleFor = (id: LayerId, origin?: string) => layerStyle(visual.layers[id], hero.width, hero.height, origin);
  const leftFigureStyle = styleFor('leftFigure', '24% 91.2%');
  const leftHitStyle = styleFor('leftFigure', '55% 101%');
  const middleHitStyle = { ...styleFor('centerFigure'), zIndex: Math.max(leftHitStyle.zIndex + 1, visual.layers.centerFigure.zIndex) };
  const editorDragStyles: Record<LayerId, CSSProperties> = {
    background: { ...styleFor('background'), left: '0%', top: '0%', width: '100%', height: '100%', zIndex: 25 },
    leftFigure: { ...leftHitStyle, left: '15%', top: '50%', width: '14%', height: '45%', zIndex: 25 },
    centerFigure: { ...styleFor('centerFigure'), left: '43%', top: '32%', width: '23%', height: '66%', zIndex: 25 },
    rightFigure: { ...styleFor('rightFigure'), left: '76%', top: '20%', width: '22%', height: '62%', zIndex: 25 },
    pinkReveal: { ...styleFor('pinkReveal'), left: '0%', top: '0%', width: '100%', height: '100%', zIndex: 25 },
    headline: { ...styleFor('headline'), left: '7%', top: '19%', width: '45%', height: '68%', zIndex: 25 },
  };

  return <main className={`scene scene--${scene} ${language === 'en' ? 'scene--english' : ''}`} aria-label={copy.ui.main}>
    <div className="language-switcher" role="group" aria-label={copy.ui.language}>
      <button type="button" className={language === 'en' ? 'is-active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
      <span aria-hidden="true">/</span>
      <button type="button" className={language === 'cn' ? 'is-active' : ''} aria-pressed={language === 'cn'} onClick={() => setLanguage('cn')}>CN</button>
    </div>
    {scene === 'beige' && <>
      <img className="beige-background" src={hero.thirdBackground} width={hero.width} height={hero.height} alt="" />
      {!beigeExitComplete && <svg className="beige-transition-art" viewBox={`0 0 ${canvas.width} ${canvas.height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id="beige-exit-pink-clip" clipPathUnits="userSpaceOnUse">
            <path d={scenePinkPath} />
          </clipPath>
          <clipPath id="beige-exit-yellow-clip" clipPathUnits="userSpaceOnUse">
            <rect x={yellowBand.x} y="0" width={yellowBand.width} height={canvas.height} />
          </clipPath>
        </defs>
        <g className="beige-exit-pink" transform={`translate(0 ${beigeExit.pinkY})`}>
          <image href="./media/pink-paper-wide.webp" x="0" y="0" width={canvas.width} height={canvas.height} preserveAspectRatio={mobile ? 'xMidYMid slice' : 'none'} clipPath="url(#beige-exit-pink-clip)" />
        </g>
        <g className="beige-exit-yellow" transform={`translate(${beigeYellowX} 0)`}>
          <image href={hero.yellowTexture} x="0" y="0" width={canvas.width} height={canvas.height} preserveAspectRatio={mobile ? 'xMidYMid slice' : 'none'} clipPath="url(#beige-exit-yellow-clip)" />
        </g>
      </svg>}
    </>}
    {scene !== 'beige' && <svg className="home-background home-exit-down" viewBox={`0 0 ${canvas.width} ${canvas.height}`} preserveAspectRatio="none" aria-hidden="true" style={styleFor('background')}>
      <defs>
        <clipPath id="home-yellow-clip" clipPathUnits="userSpaceOnUse"><rect x={yellowBand.x} y="0" width={yellowBand.width} height={canvas.height} /></clipPath>
        <clipPath id="home-pink-clip" clipPathUnits="userSpaceOnUse"><path d={scenePinkPath} /></clipPath>
      </defs>
      <image href={hero.thirdBackground} x="0" y="0" width={canvas.width} height={canvas.height} preserveAspectRatio={mobile ? 'xMidYMid slice' : 'none'} />
      <image href={hero.yellowTexture} x="0" y="0" width={canvas.width} height={canvas.height} preserveAspectRatio={mobile ? 'xMidYMid slice' : 'none'} clipPath="url(#home-yellow-clip)" />
      <image href="./media/pink-paper-wide.webp" x="0" y="0" width={canvas.width} height={canvas.height} preserveAspectRatio={mobile ? 'xMidYMid slice' : 'none'} clipPath="url(#home-pink-clip)" />
    </svg>}
    <img className="figure figure-leaning home-exit-down" src={hero.leaning.image} width={hero.width} height={hero.height} alt={copy.ui.leaningFigure} style={styleFor('centerFigure')} />

    <div className={`headline home-exit-down ${scene !== 'home' ? 'headline-exiting' : ''}`} style={styleFor('headline')}>
      <h1 className="brand-wordmark">{visual.text.eyebrow}</h1>
      <h2 className="headline-title">{homeCopy.title.split('\n').map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</h2>
      <p>{homeCopy.description.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</p>
      <button className="learn-more" type="button"
        onPointerEnter={() => { void preloadFrames(hero.walkCycle).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.walkCycle).catch(() => {}); }}
        onClick={() => void begin(sceneForHomeEntry('joinCta'))} disabled={scene !== 'home' || loading}>{language === 'cn' ? visual.text.button : copy.home.button}</button>
    </div>

    {(scene === 'pink' || scene === 'yellow') && <svg className="pink-wave home-exit-down" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={styleFor('pinkReveal')}>
      <defs>
        <clipPath id="pink-wave-clip" clipPathUnits="userSpaceOnUse"><path d={pinkPath} /></clipPath>
      </defs>
      <g clipPath="url(#pink-wave-clip)">
        <rect width="100" height="100" fill="#f23a64" />
        <image href="./media/pink-paper-wide.webp" x="0" y="0" width="100" height="100" preserveAspectRatio="none" />
      </g>
    </svg>}

    {scene === 'yellow' && <svg className="yellow-wave home-exit-down" viewBox={`0 0 ${canvas.width} ${canvas.height}`} preserveAspectRatio={mobile ? 'xMidYMid slice' : 'none'} aria-hidden="true">
      <defs>
        <clipPath id="yellow-background-reveal" clipPathUnits="userSpaceOnUse">
          <circle cx={sceneYellowOrigin.x} cy={sceneYellowOrigin.y} r={radius} />
        </clipPath>
        <pattern id="yellow-paper" width={canvas.width} height={canvas.height} patternUnits="userSpaceOnUse">
          <image href={hero.yellowTexture} width={canvas.width} height={canvas.height} preserveAspectRatio={mobile ? 'xMidYMid slice' : 'none'} />
        </pattern>
      </defs>
      <g clipPath="url(#yellow-background-reveal)">
        <rect width={canvas.width} height={canvas.height} fill="#d9a534" />
        <rect width={canvas.width} height={canvas.height} fill="url(#yellow-paper)" />
      </g>
    </svg>}

    {scene !== 'yellow' && <div className="sequence-editor-layer home-exit-down" style={leftFigureStyle}><FrameSequence clip={hero.seated} active={scene === 'pink'} mobile={mobile} language={language} /></div>}
    {scene === 'yellow' && <div className="sequence-editor-layer" style={styleFor('centerFigure')}><FrameSequence clip={hero.middle} active={scene === 'yellow'} revealProgress={progress} revealOrigin={sceneYellowOrigin} mobile={mobile} language={language} /></div>}
    {scene === 'beige' && beigeExitComplete && <div className="third-walker-enter">
      <FrameSequence clip={hero.walkCycle} active translateX={thirdEnterMotion.enterX} mobile={mobile} language={language} />
    </div>}
    {isChapterContentReady(scene, progress) && <ChapterContent scene={scene} animationDurationMs={chapterAnimationDurationMs} language={language} />}
    {(scene === 'pink' || scene === 'yellow') && progress >= 1 && <button className="scroll-cue" type="button" onClick={requestScrollAdvance} aria-label={copy.ui.scrollAria}>
      <span>{copy.ui.scroll}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v16m-6-6 6 6 6-6" /></svg>
    </button>}
    {scene === 'beige' && progress >= 1 && <button className="return-home" type="button" onClick={returnHome} aria-label={copy.ui.home}>
      <span>{copy.ui.home}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6" /></svg>
    </button>}

    {scene === 'home' && <>
      <button className="figure-caption figure-caption-left" type="button"
        onPointerEnter={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onClick={() => void begin(sceneForHomeEntry('firstFigure'))}
        aria-label={`01 ${copy.ui.aboutCaption}`}>
        <span className="figure-caption-number">01</span><span className="figure-caption-name">{copy.ui.aboutCaption}</span><svg className="figure-caption-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5 M9 5h10v10" /></svg>
      </button>
      <button className="figure-caption figure-caption-middle" type="button"
        onPointerEnter={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onClick={() => void begin(sceneForHomeEntry('middleFigure'))}
        aria-label={`02 ${copy.ui.workCaption}`}>
        <span className="figure-caption-number">02</span><span className="figure-caption-name">{copy.ui.workCaption}</span><svg className="figure-caption-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5 5 19 M5 9v10h10" /></svg>
      </button>
      <button className="figure-hit figure-hit-left" type="button"
        onPointerEnter={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onClick={() => void begin(sceneForHomeEntry('firstFigure'))}
        aria-label={copy.ui.firstFigure} style={leftHitStyle} />
      <button className="figure-hit figure-hit-middle" type="button"
        onPointerEnter={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onClick={() => void begin(sceneForHomeEntry('middleFigure'))}
        aria-label={copy.ui.middleFigure} style={middleHitStyle} />
      <button className="figure-hit figure-hit-right" type="button"
        onPointerEnter={() => { void preloadFrames(hero.walkCycle).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.walkCycle).catch(() => {}); }}
        onClick={() => void begin(sceneForHomeEntry('thirdRegion'))}
        aria-label={copy.ui.thirdFigure} style={styleFor('rightFigure')} />
    </>}
    {import.meta.env.DEV && <VisualEditor open={editorOpen} config={visual} onChange={updateEditorConfig} onReset={restoreEditorDefaults} onExport={downloadEditorConfig} onToggle={() => setEditorOpen(value => !value)} dragStyles={editorDragStyles} />}
    {loading && scene === 'home' && <div className="loading-note" role="status">{copy.ui.loading}</div>}
    {error && <div className="error-note" role="alert">{error}</div>}
  </main>;
}
