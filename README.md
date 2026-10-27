# SIX website

An independent React/TypeScript website project based on the current Figma Make three-woman home-page composition. It is a foundation for the future full site, not a copy of every Figma Make chapter.

## 本地运行

```sh
npm install
npm run dev
```

当前 10/25 改版位于独立分支 `six-1025-redesign`，与 `main` 分开，尚未部署到线上域名。此分支包含网页所需的优化图片帧与纹理，不含原始视频。运行 `npm run build` 可检查构建；产物在 `dist/`。如需重做帧图，请在项目 Python 环境安装 `requirements-assets.txt`，并按 `docs/ANIMATION.md` 操作（需要 ffmpeg）。

## Structure

- `src/` — scene, frame-sequence playback and timing configuration
- `public/media/` — optimized art, textures and playback frames included in this branch; source videos remain local
- `tools/build_seated_frames.py` — regenerate the seated clip from the user-supplied video
- `PROJECT.md` — project scope, status, performance targets and release gates
- `docs/ANIMATION.md` — motion and asset specifications

The first seated frame appears on page load when local media is present. Remaining frames load only when that figure is clicked. The other figures stay still until their videos are provided.

## Homepage visual editor

In the local Vite preview, choose **编辑页面** in the upper-right corner. Select a layer to adjust its horizontal/vertical position, scale, or front-to-back order. The left figure can also be dragged on the canvas; the four homepage text fields update the page immediately. Changes are saved in this browser on this local preview. Use **恢复默认** to clear them, or **导出 JSON** to download a settings file.

The editor is development-only. A production build omits the editor and always uses project defaults. Exported settings are a local backup and are not automatically applied to a published site.
