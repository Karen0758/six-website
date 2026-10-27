# Website media

The `six-1025-redesign` GitHub branch contains the optimized images and frame sequences needed for the website. Original source videos are not included. These files are the web-ready media:

- `background.webp`, `leaning.webp` — full-canvas 1676×939 scene layers
- `walker-poster.webp` — retained local right-character poster, no longer loaded on the homepage; `walk-cycle/frame_000.webp` through `frame_048.webp` — right-character walk-in/out sequence, transparent 512×890 WebP with the full source sole and 40px lower clearance
- `third-paper.webp` — full-screen beige handmade-paper background for the third scene
- `seated/frame_000.webp` through `frame_036.webp` — seated-to-standing clip, 628×586
- `keyframes/SIX-left-start-seated.png` and `keyframes/SIX-left-end-standing.png` — matching 1299×1211 start/end images for generating a replacement seated-to-standing video; these are separate from the currently playable sequence.
- `middle/frame_000.webp` through `frame_019.webp` — front-facing middle-character clip, 628×939
- `yellow-paper.webp` — mustard paper texture cropped from the hero background
- `pink-paper-wide.webp` — full-screen pink paper assembled from the original artwork, without tiled white seams; regenerate from `background.webp` with `/opt/homebrew/bin/python3 tools/build_pink_paper.py`

The homepage loads beige, yellow, and pink paper textures, the first seated frame, and the middle static character. The third poster stays off the homepage; walk frames load after “加入” or the beige area is triggered. Other frames load when their matching entry is focused, hovered, or clicked. Rebuild seated frames from a clean source with `python3 tools/build_seated_frames.py --video '/path/to/source.mp4' --output public/media/seated --clean-source`; rebuild the walk cycle and poster with `python3 tools/build_walk_frames.py --video '/path/to/source.mp4' --clean-source`. Rebuild the middle frames with `python3 tools/build_middle_frames.py --video '/path/to/source.mp4'`.
