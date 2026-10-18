export type ChapterScene = 'home' | 'pink' | 'yellow' | 'beige';

// The diagonal pink edge has already moved beyond every viewport corner here.
export const PINK_COVER_PROGRESS = 0.65;

export const CHAPTER_REVEAL_FADE_MS = 320;

export function staggeredRevealDelays(
  itemCount: number,
  animationDurationMs: number,
  revealFraction = 0.75,
  fadeDurationMs = CHAPTER_REVEAL_FADE_MS,
): number[] {
  if (itemCount <= 0) return [];
  if (itemCount === 1) return [0];
  const lastStart = Math.max(0, animationDurationMs * revealFraction - fadeDurationMs);
  const interval = lastStart / (itemCount - 1);
  return Array.from({ length: itemCount }, (_, index) => Math.round(interval * index));
}

export function isChapterContentReady(scene: ChapterScene, transitionProgress: number): boolean {
  if (scene === 'pink') return transitionProgress >= PINK_COVER_PROGRESS;
  return scene !== 'home' && transitionProgress >= 1;
}
