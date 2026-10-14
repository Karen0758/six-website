# SIX website

An independent React/TypeScript website project based on the current Figma Make three-woman home-page composition. It is a foundation for the future full site, not a copy of every Figma Make chapter.

## Local run

```sh
npm install
npm run dev
```

Run `npm run build` before publishing. To regenerate local media, create a project Python environment, install `requirements-assets.txt`, and run the command in `docs/ANIMATION.md` (ffmpeg is also required). The build output is `dist/`. Media files are kept local for now, so a fresh GitHub checkout shows the color-block fallback until assets are placed in `public/media/`.

## Structure

- `src/` — scene, frame-sequence playback and timing configuration
- `public/media/` — generated art and frames, excluded from Git
- `tools/build_seated_frames.py` — regenerate the seated clip from the user-supplied video
- `PROJECT.md` — project scope, status, performance targets and release gates
- `docs/ANIMATION.md` — motion and asset specifications

The first seated frame appears on page load when local media is present. Remaining frames load only when that figure is clicked. The other figures stay still until their videos are provided.
