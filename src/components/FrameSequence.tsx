import { useEffect, useRef, useState } from 'react';
import { hero } from '../config';
import { interpolateBox, yellowRevealRadius } from '../animationGeometry';
import { mobileCanvas, mobileMiddleBox, mobileSeatedBox, mobileStandingBox, mobileWalkerBox } from '../mobileLayout';

type Clip = typeof hero.seated | typeof hero.middle | typeof hero.walkCycle;

const cachedFrames = new Map<string, HTMLImageElement[]>();
const loadingFrames = new Map<string, Promise<HTMLImageElement[]>>();
const loadingStartFrames = new Map<string, Promise<void>>();

function startFrameFor(clip: Clip): number {
  return clip === hero.seated ? hero.seated.startFrame : 0;
}

export function preloadStartFrames(clip: Clip): Promise<void> {
  const key = clip.framePath(0);
  if (cachedFrames.has(key)) return Promise.resolve();
  const loading = loadingStartFrames.get(key);
  if (loading) return loading;
  const start = startFrameFor(clip);
  const promise = Promise.all(Array.from({ length: Math.min(6, clip.count - start) }, (_, offset) => {
    const image = new Image();
    return new Promise<void>((resolve, reject) => {
      image.onload = () => { void image.decode().then(resolve, resolve); };
      image.onerror = () => reject(new Error(`图片加载失败：${clip.framePath(start + offset)}`));
      image.src = clip.framePath(start + offset);
    });
  })).then(() => {});
  loadingStartFrames.set(key, promise);
  return promise.finally(() => { loadingStartFrames.delete(key); });
}

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
  revealOrigin?: { x: number; y: number };
  translateX?: number;
  onComplete?: () => void;
  mobile?: boolean;
}

export default function FrameSequence({ clip, active, revealProgress, revealOrigin = { x: hero.width / 2, y: hero.height / 2 }, translateX = 0, onComplete, mobile = false }: FrameSequenceProps) {
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const raf = useRef(0);
  const runId = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const firstFrame = startFrameFor(clip);

  useEffect(() => {
    if (!active) return;
    const run = ++runId.current;
    let start = 0;
    let shown = firstFrame;
    setIndex(firstFrame);
    setError('');
    void preloadStartFrames(clip).then(() => {
      if (run !== runId.current) return;
      start = performance.now();
      function tick(now: number) {
        if (run !== runId.current) return;
        const next = Math.min(clip.count - 1, firstFrame + Math.floor((now - start) * clip.fps / 1000));
        if (next !== shown) {
          shown = next;
          setIndex(next);
        }
        if (next < clip.count - 1) raf.current = requestAnimationFrame(tick);
        else onCompleteRef.current?.();
      }
      raf.current = requestAnimationFrame(tick);
    }).catch(caught => setError(caught instanceof Error ? caught.message : '动作帧加载失败'));
    return () => { runId.current++; cancelAnimationFrame(raf.current); };
  }, [active, clip, firstFrame]);

  const sequenceProgress = active ? Math.max(0, index - firstFrame) / Math.max(clip.count - 1 - firstFrame, 1) : 0;
  const box = mobile
    ? clip === hero.seated
      ? active ? interpolateBox(mobileSeatedBox, mobileStandingBox, sequenceProgress) : mobileSeatedBox
      : clip === hero.middle ? mobileMiddleBox : mobileWalkerBox
    : clip === hero.seated && active && clip.activeBox
      ? interpolateBox(clip.box, clip.activeBox, sequenceProgress)
      : clip.box;
  const canvas = mobile ? mobileCanvas : hero;
  const clipId = `frame-reveal-${clip.framePath(0).replace(/[^a-z0-9]/gi, '-')}`;
  return <svg className={`figure-sequence ${clip === hero.middle ? 'figure-sequence-middle' : ''} ${clip === hero.walkCycle ? 'figure-sequence-walker' : ''}`}
    viewBox={`0 0 ${canvas.width} ${canvas.height}`} preserveAspectRatio={mobile ? 'xMidYMid meet' : 'xMidYMid slice'}
    aria-label={clip.label} role="img">
    {revealProgress !== undefined && <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse">
      <circle cx={revealOrigin.x} cy={revealOrigin.y}
        r={yellowRevealRadius(revealProgress, canvas.width, canvas.height, revealOrigin.x, revealOrigin.y)} />
    </clipPath></defs>}
    <g clipPath={revealProgress !== undefined ? `url(#${clipId})` : undefined} transform={`translate(${translateX} 0)`}>
      <image href={clip.framePath(index)} x={box.x} y={box.y} width={box.width} height={box.height} preserveAspectRatio="none" />
    </g>
    {error && <title>{error}</title>}
  </svg>;
}
