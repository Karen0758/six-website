import { useEffect, useRef, useState } from 'react';
import { hero } from '../config';
const clip = hero.seated;
let cache: HTMLImageElement[] | null = null;
let inflight: Promise<HTMLImageElement[]> | null = null;
async function loadFrames(): Promise<HTMLImageElement[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const result = new Array<HTMLImageElement>(clip.count);
    let next = 0;
    async function worker() {
      while (next < clip.count) {
        const i = next++;
        const im = new Image();
        await new Promise<void>((resolve, reject) => {
          im.onload = () => resolve();
          im.onerror = () => reject(new Error(`无法加载 ${clip.framePath(i)}`));
          im.src = clip.framePath(i);
        });
        result[i] = im;
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    await Promise.all(result.slice(0, 8).map(im => im.decode().catch(() => {})));
    cache = result;
    return result;
  })();
  try { return await inflight; } finally { inflight = null; }
}
export default function FrameSequence() {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<'idle'|'loading'|'playing'|'ended'|'error'>('idle');
  const [error, setError] = useState('');
  const raf = useRef(0), runId = useRef(0);
  useEffect(() => () => { runId.current++; cancelAnimationFrame(raf.current); }, []);
  async function play() {
    if (state === 'loading' || state === 'playing') return;
    const run = ++runId.current;
    setState('loading');
    try {
      const frames = await loadFrames();
      if (run !== runId.current) return;
      setIndex(0); setState('playing');
      const start = performance.now(); let shown = 0;
      function tick(now: number) {
        if (run !== runId.current) return;
        const i = Math.min(clip.count-1, Math.floor((now-start)*clip.fps/1000));
        if (i !== shown) { shown = i; setIndex(i); frames[Math.min(i+3,clip.count-1)].decode().catch(() => {}); }
        if (i < clip.count-1) raf.current = requestAnimationFrame(tick);
        else setState('ended');
      }
      raf.current = requestAnimationFrame(tick);
    } catch (e) {
      if (run !== runId.current) return;
      setError(e instanceof Error ? e.message : '素材加载失败'); setState('error');
    }
  }
  const message = { idle:'点击左侧人物播放站起动作',loading:'正在加载动作图片…',playing:'正在播放',ended:'动作结束 · 点击可重播',error }[state];
  return <>
    <img className="figure figure-seated" src={clip.framePath(index)} alt={clip.label} width="628" height="586" />
    <button className="figure-hit" onClick={play} disabled={state==='loading'} aria-label="播放左侧女性站起的逐帧动作" />
    <div className="play-controls"><button onClick={play} disabled={state==='loading'||state==='playing'}>播放左侧人物动作</button><span role="status">{message}</span><small>52 张 WebP · 12 帧/秒 · 点击后加载</small></div>
  </>;
}
