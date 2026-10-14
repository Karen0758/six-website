export function pinkWavePath(progress: number): string {
  const p = Math.max(0, Math.min(1, progress));
  if (p >= 0.995) return 'M 0 0 H 100 V 100 H 0 Z';
  const shift = p * 110;
  const rise = p * 130;
  const startY = 17 - rise;
  return `M 0 ${startY} C ${10 + shift} ${28 - rise}, ${30 + shift} ${52 - rise}, ${47 + shift} ${72 - rise} S ${76 + shift} ${94 - rise}, ${91 + shift} ${100 - rise} L 0 100 Z`;
}

export function yellowRevealRadius(progress: number, width: number, height: number): number {
  const p = Math.max(0, Math.min(1, progress));
  return p * (Math.hypot(width, height) / 2 + 2);
}
