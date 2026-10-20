export function pinkWavePath(progress: number): string {
  const p = Math.max(0, Math.min(1, progress));
  if (p === 1) return 'M 0 0 H 100 V 100 H 0 Z';
  const shift = p * 110;
  const rise = p * 130;
  const startY = 17 - rise;
  const endX = 91 + shift;
  return `M 0 ${startY} C ${10 + shift} ${28 - rise}, ${30 + shift} ${52 - rise}, ${47 + shift} ${72 - rise} S ${76 + shift} ${94 - rise}, ${endX} ${100 - rise} L ${endX} 100 L 0 100 Z`;
}

export interface Box { x: number; y: number; width: number; height: number }

export function interpolateBox(from: Box, to: Box, progress: number): Box {
  const p = Math.max(0, Math.min(1, progress));
  const eased = p * p * (3 - 2 * p);
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
    width: from.width + (to.width - from.width) * eased,
    height: from.height + (to.height - from.height) * eased,
  };
}

export function yellowRevealRadius(progress: number, width: number, height: number, originX = width / 2, originY = height / 2): number {
  const p = Math.max(0, Math.min(1, progress));
  const farthestCorner = Math.max(
    Math.hypot(originX, originY),
    Math.hypot(width - originX, originY),
    Math.hypot(originX, height - originY),
    Math.hypot(width - originX, height - originY),
  );
  return p * (farthestCorner + 2);
}

export function beigeExitMotion(progress: number, width: number, height: number) {
  const p = Math.max(0, Math.min(1, progress));
  return { yellowX: p === 0 ? 0 : -width * 0.62 * p, pinkY: height * 1.2 * p };
}

export function thirdFigureMotion(progress: number, viewportWidth: number, figureWidth: number) {
  const p = Math.max(0, Math.min(1, progress));
  const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);
  return {
    enterX: -figureWidth + (viewportWidth / 2 - figureWidth * 0.59 + figureWidth) * easeOut(p),
  };
}
