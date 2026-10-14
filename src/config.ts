export const hero = {
  width: 1676, height: 939, background: '/media/background.webp',
  seated: { label: '坐着的女性', framePath: (i: number) => `/media/seated/frame_${String(i).padStart(3, '0')}.webp`, count: 52, fps: 12 },
  leaning: { label: '倚墙的女性', image: '/media/leaning.webp' },
  walker: { label: '行走的女性', image: '/media/walker.webp' },
} as const;
