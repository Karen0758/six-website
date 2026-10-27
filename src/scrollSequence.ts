export type ScrollScene = 'home' | 'pink' | 'founders' | 'yellow' | 'beige';

const SCENE_ORDER: ScrollScene[] = ['home', 'pink', 'founders', 'yellow', 'beige'];

export function nextSceneForScroll(scene: ScrollScene, queuedAdvances = 0): Exclude<ScrollScene, 'home'> | null {
  const sceneIndex = SCENE_ORDER.indexOf(scene);
  const nextIndex = sceneIndex + Math.max(0, queuedAdvances) + 1;
  const nextScene = SCENE_ORDER[nextIndex];
  return nextScene && nextScene !== 'home' ? nextScene : null;
}

export function previousSceneForScroll(scene: ScrollScene): ScrollScene | null {
  const previousIndex = SCENE_ORDER.indexOf(scene) - 1;
  return previousIndex >= 0 ? SCENE_ORDER[previousIndex] : null;
}
