import { useEffect, useRef, useState } from 'react';
import { hero } from './config';
import FrameSequence, { preloadFrames } from './components/FrameSequence';

const WIPE_MS = 4300;

function wavePath(progress: number) {
  const shift = progress * 110;
  const rise = progress * 130;
  const startY = 17 - rise;
  return `M 0 ${startY} C ${10 + shift} ${28 - rise}, ${30 + shift} ${52 - rise}, ${47 + shift} ${72 - rise} S ${76 + shift} ${94 - rise}, ${91 + shift} ${100 - rise} L 0 100 Z`;
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const raf = useRef(0);
  const startTime = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function runWave() {
    startTime.current = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - startTime.current) / WIPE_MS);
      setProgress(next);
      if (next < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  async function begin() {
    if (started || loading) return;
    setLoading(true);
    setError('');
    try {
      await preloadFrames();
      setStarted(true);
      runWave();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '动作帧加载失败');
    } finally {
      setLoading(false);
    }
  }

  return <main className="scene" aria-label="SIX 官网首页主视觉">
    <img className="background" src={hero.background} width={hero.width} height={hero.height} alt="" fetchPriority="high" />
    <img className="figure figure-leaning" src={hero.leaning.image} width={hero.width} height={hero.height} alt={hero.leaning.label} />
    <img className="figure figure-walker" src={hero.walker.image} width={hero.width} height={hero.height} alt={hero.walker.label} />

    <div className={`headline ${started ? 'headline-exiting' : ''}`}>
      <small>SIX&nbsp;&nbsp; — &nbsp;&nbsp;一场价值投资实验</small>
      <h1>与年轻的创业家<br />一起冒险</h1>
      <p>有想象力、有活力、有胆识的新一代创业者，<br />和她们的新冒险。</p>
      <button className="learn-more" type="button" onClick={begin} disabled={started || loading}>了解我们　→</button>
    </div>

    <svg className={`pink-wave ${started ? 'pink-wave-active' : ''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <clipPath id="wave-clip" clipPathUnits="userSpaceOnUse"><path d={wavePath(progress)} /></clipPath>
        <pattern id="pink-paper" width="12" height="12" patternUnits="userSpaceOnUse">
          <image href="/media/pink-texture.webp" width="12" height="12" preserveAspectRatio="none" />
        </pattern>
      </defs>
      <g clipPath="url(#wave-clip)">
        <rect width="100" height="100" fill="#f23a64" />
        <rect width="100" height="100" fill="url(#pink-paper)" opacity=".2" />
      </g>
    </svg>

    <FrameSequence active={started} />
    {!started && <button className="figure-hit" type="button" onPointerEnter={() => { void preloadFrames().catch(() => {}); }} onFocus={() => { void preloadFrames().catch(() => {}); }} onClick={begin} aria-label="点击左侧坐姿女性，播放她站起并推进粉色浪潮" />}
    {loading && <div className="loading-note" role="status">准备动作…</div>}
    {error && <div className="error-note" role="alert">{error}</div>}
  </main>;
}
