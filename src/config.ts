export const hero = {
  width: 1676, height: 939, background: './media/background.webp',
  yellowTexture: './media/yellow-paper.webp',
  seated: {
    label: '坐着的女性',
    framePath: (i: number) => `./media/seated/frame_${String(i).padStart(3, '0')}.webp`,
    count: 37, fps: 12, box: { x: 0, y: 270, width: 628, height: 586 },
  },
  middle: {
    label: '转向镜头的女性',
    framePath: (i: number) => `./media/middle/frame_${String(i).padStart(3, '0')}.webp`,
    count: 20, fps: 12, box: { x: 595, y: 320, width: 364, height: 545 },
  },
  leaning: { label: '倚墙的女性', image: './media/leaning.webp' },
  walker: { label: '行走的女性', image: './media/walker.webp' },
} as const;
