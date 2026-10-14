# Local media

Generated images and videos are intentionally excluded from Git. The app builds without them, showing a color-block fallback. For the full local preview place these files here:

- `background.webp`, `leaning.webp`, `walker.webp` — full-canvas 1676×939 scene layers
- `seated/frame_000.webp` through `frame_051.webp` — seated-to-standing clip, 628×586
- `middle/frame_000.webp` through `frame_019.webp` — front-facing middle-character clip, 628×939
- `yellow-paper.webp` — mustard paper texture cropped from the hero background

Only the first seated frame loads with the page. Other frames load when their matching character card is focused, hovered, or clicked. Rebuild the middle frames with `python3 tools/build_middle_frames.py --video '/path/to/source.mp4'`.
