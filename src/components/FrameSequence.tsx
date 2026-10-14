import { useEffect, useRef, useState } from 'react';
import { hero } from '../config';

const clip = hero.seated;
let cachedFrames: HTMLImageElement[] | null = null;
let loadingFrames: Promise<HTMLImageElement[]> | null = null;

export function preloadFrames(): Promise<HTMLImageElement[]> {
  if (cachedFrames) return Promise.resolve(cachedFrames);
  if (loadingFrames) return loadingFrames;
  loadingFrames = (async () => {
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
    cachedFrames = result;
    return result;
  })();
  return loadingFrames.finally(() => { loadingFrames = null; });
}

export default function FrameSequence({ active }: { active: boolean }) {
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const raf = useRef(0);
  const runId = useRef(0);

  useEffect(() => {
    if (!active) return;
    const run = ++runId.current;
    let start = 0;
    let shown = 0;
    void preloadFrames().then(frames => {
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
  }, [active]);

  return <svg className="figure-sequence" viewBox={`0 0 ${hero.width} ${hero.height}`} preserveAspectRatio="xMidYMid slice" aria-label={clip.label} role="img">
    <image href={clip.framePath(index)} x="0" y="270" width="628" height="586" preserveAspectRatio="none" />
    {error && <title>{error}</title>}
  </svg>;
}
