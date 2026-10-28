import type { Box } from './animationGeometry';

export const mobileCanvas = { width: 390, height: 844 } as const;
export const mobileYellowBand = { x: 170, width: 96 } as const;
export const mobilePinkPath = 'M0 418 C108 480 233 611 390 702 V844 H0 Z';
export const mobileYellowOrigin = { x: 196, y: 490 } as const;

export const mobileSeatedBox: Box = { x: -280, y: 276, width: 534, height: 498 };
export const mobileStandingBox: Box = { x: -380, y: 250, width: 600, height: 560 };
export const mobileMiddleBox: Box = { x: 20, y: 410, width: 264, height: 395 };
export const mobileWalkerBox: Box = { x: 95, y: 478, width: 280, height: 366 };
export const mobileWalkerMotionWidth = 260;
