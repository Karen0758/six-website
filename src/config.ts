export const hero = {
  width: 1676, height: 939, background: './media/background.webp',
  yellowTexture: './media/yellow-paper.webp',
  seated: {
    label: '坐着的女性',
    framePath: (i: number) => `./media/seated/frame_${String(i).padStart(3, '0')}.webp?v=5`,
    count: 37, fps: 18, startFrame: 12,
    box: { x: 0, y: 270, width: 628, height: 586 },
    activeBox: { x: -112, y: 200, width: 703, height: 656 },
  },
  middle: {
    label: '转向镜头的女性',
    framePath: (i: number) => `./media/middle/frame_${String(i).padStart(3, '0')}.webp`,
    count: 20, fps: 12, box: { x: 560, y: 320, width: 364, height: 545 },
  },
  walkCycle: {
    label: '从左侧走入的女性',
    framePath: (i: number) => `./media/walk-cycle/frame_${String(i).padStart(3, '0')}.webp?v=13`,
    count: 49, fps: 19.2, box: { x: 0, y: 185, width: 348, height: 582 }, motionWidth: 335, exitStartX: 1307,
  },
  thirdBackground: './media/third-paper.webp',
  leaning: { label: '倚墙的女性', image: './media/leaning.webp' },
  walker: { label: '行走的女性', image: './media/walker-poster.webp?v=10' },
} as const;
