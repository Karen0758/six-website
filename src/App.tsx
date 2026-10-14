import { useEffect, useRef, useState } from 'react';
import { hero } from './config';
import FrameSequence, { preloadFrames } from './components/FrameSequence';
import { pinkWavePath, yellowRevealRadius } from './animationGeometry';

type Scene = 'home' | 'pink' | 'yellow';
const PINK_WIPE_MS = 4300;
const YELLOW_WIPE_MS = 2100;

export default function App() {
  const [scene, setScene] = useState<Scene>('home');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const raf = useRef(0);
  const startTime = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

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

  return <main className="scene" aria-label="SIX 官网首页主视觉">
    <img className="background" src={hero.background} width={hero.width} height={hero.height} alt="" fetchPriority="high" />
    <img className="figure figure-leaning" src={hero.leaning.image} width={hero.width} height={hero.height} alt={hero.leaning.label} />
    <img className="figure figure-walker" src={hero.walker.image} width={hero.width} height={hero.height} alt={hero.walker.label} />

    <div className={`headline ${scene !== 'home' ? 'headline-exiting' : ''}`}>
      <small>SIX&nbsp;&nbsp; — &nbsp;&nbsp;一场价值投资实验</small>
      <h1>与年轻的创业家<br />一起冒险</h1>
      <p>有想象力、有活力、有胆识的新一代创业者，<br />和她们的新冒险。</p>
      <button className="learn-more" type="button" onClick={() => void begin('pink')} disabled={scene !== 'home' || loading}>了解我们　→</button>
    </div>

    <svg className="pink-wave" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
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

    {scene === 'yellow' && <svg className="yellow-wave" viewBox={`0 0 ${hero.width} ${hero.height}`} preserveAspectRatio="none" aria-hidden="true">
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

    {scene !== 'yellow' && <FrameSequence clip={hero.seated} active={scene === 'pink'} />}
    {scene === 'yellow' && <FrameSequence clip={hero.middle} active revealProgress={progress} />}

    {scene === 'home' && <>
      <button className="figure-hit figure-hit-left" type="button"
        onPointerEnter={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.seated).catch(() => {}); }}
        onClick={() => void begin('pink')}
        aria-label="点击左侧人物卡片，粉色纸纹铺满屏幕并播放站起动作" />
      <button className="figure-hit figure-hit-middle" type="button"
        onPointerEnter={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onFocus={() => { void preloadFrames(hero.middle).catch(() => {}); }}
        onClick={() => void begin('yellow')}
        aria-label="点击黄色区域人物，黄色纸纹从中心铺满屏幕并播放转向镜头的动作" />
    </>}
    {loading && <div className="loading-note" role="status">准备动作…</div>}
    {error && <div className="error-note" role="alert">{error}</div>}
  </main>;
}
