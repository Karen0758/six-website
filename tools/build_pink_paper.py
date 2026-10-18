"""Build a wide pink paper field from the untouched paper in the home artwork."""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/media/background.webp"
OUTPUT = ROOT / "public/media/pink-paper-wide.webp"
WIDTH, HEIGHT = 1676, 939
PATCH_W, PATCH_H = 220, 180
OVERLAP = 60
STEP_X, STEP_Y = PATCH_W - OVERLAP, PATCH_H - OVERLAP

# This rectangle is entirely within the pink paper area of the original artwork.
source = np.asarray(Image.open(SOURCE).convert("RGB").crop((20, 590, 600, 920)), dtype=np.float32)
canvas = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float32)
rng = np.random.default_rng(6)

for y in range(0, HEIGHT, STEP_Y):
    for x in range(0, WIDTH, STEP_X):
        h, w = min(PATCH_H, HEIGHT - y), min(PATCH_W, WIDTH - x)
        left_overlap = min(OVERLAP, w) if x else 0
        top_overlap = min(OVERLAP, h) if y else 0
        best_patch, best_score = None, float("inf")
        for _ in range(20):
            sy = int(rng.integers(0, source.shape[0] - PATCH_H + 1))
            sx = int(rng.integers(0, source.shape[1] - PATCH_W + 1))
            patch = source[sy:sy + h, sx:sx + w]
            if rng.integers(2):
                patch = patch[:, ::-1]
            if rng.integers(2):
                patch = patch[::-1]
            score = 0.0
            if left_overlap:
                score += float(np.mean((patch[:, :left_overlap] - canvas[y:y + h, x:x + left_overlap]) ** 2))
            if top_overlap:
                score += float(np.mean((patch[:top_overlap] - canvas[y:y + top_overlap, x:x + w]) ** 2))
            if score < best_score:
                best_patch, best_score = patch, score
        alpha = np.ones((h, w), dtype=np.float32)
        if left_overlap:
            alpha[:, :left_overlap] *= np.linspace(0, 1, left_overlap)[None, :]
        if top_overlap:
            alpha[:top_overlap, :] *= np.linspace(0, 1, top_overlap)[:, None]
        current = canvas[y:y + h, x:x + w]
        canvas[y:y + h, x:x + w] = current * (1 - alpha[..., None]) + best_patch * alpha[..., None]

Image.fromarray(np.uint8(np.clip(canvas, 0, 255)), "RGB").save(OUTPUT, "WEBP", quality=88, method=6)
print(OUTPUT)
