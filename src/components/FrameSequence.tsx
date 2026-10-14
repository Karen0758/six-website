import { useEffect, useRef, useState } from 'react';
import { hero } from '../config';
import { yellowRevealRadius } from '../animationGeometry';

type Clip = typeof hero.seated | typeof hero.middle;

const cachedFrames = new Map<string, HTMLImageElement[]>();
const loadingFrames = new Map<string, Promise<HTMLImageElement[]>>();

export function preloadFrames(clip: Clip): Promise<HTMLImageElement[]> {
  const key = clip.framePath(0);
  const cached = cachedFrames.get(key);
  if (cached) return Promise.resolve(cached);
  const loading = loadingFrames.get(key);
  if (loading) return loading;
  const promise = (async () => {
    const result = new Array<HTMLImageElement>(clip.count);
    let next = 0;
    async function worker() {
      while (next < clip.count) {
        const index = next++;
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error(`图片加载失败：${clip.framePath(index)}`));
          image.src = clip.framePath(index);
        });
        result[index] = image;
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    await Promise.all(result.slice(0, 8).map(image => image.decode().catch(() => {})));
    cachedFrames.set(key, result);
    return result;
  })();
  loadingFrames.set(key, promise);
  return promise.finally(() => { loadingFrames.delete(key); });
}

interface FrameSequenceProps {
  clip: Clip;
  active: boolean;
  revealProgress?: number;
}

export default function FrameSequence({ clip, active, revealProgress }: FrameSequenceProps) {
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const raf = useRef(0);
  const runId = useRef(0);

  useEffect(() => {
    if (!active) return;
    const run = ++runId.current;
    let start = 0;
    let shown = 0;
    setIndex(0);
    setError('');
    void preloadFrames(clip).then(frames => {
      if (run !== runId.current) return;
      start = performance.now();
      function tick(now: number) {
        if (run !== runId.current) return;
        const next = Math.min(clip.count - 1, Math.floor((now - start) * clip.fps / 1000));
        if (next !== shown) {
          shown = next;
          setIndex(next);
          frames[Math.min(next + 3, clip.count - 1)].decode().catch(() => {});
        }
        if (next < clip.count - 1) raf.current = requestAnimationFrame(tick);
      }
      raf.current = requestAnimationFrame(tick);
    }).catch(caught => setError(caught instanceof Error ? caught.message : '动作帧加载失败'));
    return () => { runId.current++; cancelAnimationFrame(raf.current); };
  }, [active, clip]);

  const box = clip.box;
  const clipId = `frame-reveal-${clip.framePath(0).replace(/[^a-z0-9]/gi, '-')}`;
  return <svg className={`figure-sequence ${clip === hero.middle ? 'figure-sequence-middle' : ''}`}
    viewBox={`0 0 ${hero.width} ${hero.height}`} preserveAspectRatio="xMidYMid slice"
    aria-label={clip.label} role="img">
    {revealProgress !== undefined && <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse">
      <circle cx={hero.width / 2} cy={hero.height / 2}
        r={yellowRevealRadius(revealProgress, hero.width, hero.height)} />
    </clipPath></defs>}
    <g clipPath={revealProgress !== undefined ? `url(#${clipId})` : undefined}>
      <image href={clip.framePath(index)} x={box.x} y={box.y} width={box.width} height={box.height} preserveAspectRatio="none" />
    </g>
    {error && <title>{error}</title>}
  </svg>;
}
