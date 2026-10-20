export type HomeEntry = 'firstFigure' | 'middleFigure' | 'thirdRegion' | 'joinCta';
export type ChapterScene = 'pink' | 'yellow' | 'beige';

const scenes: Record<HomeEntry, ChapterScene> = {
  firstFigure: 'pink',
  middleFigure: 'yellow',
  thirdRegion: 'beige',
  joinCta: 'beige',
};

export function sceneForHomeEntry(entry: HomeEntry): ChapterScene {
  return scenes[entry];
}
