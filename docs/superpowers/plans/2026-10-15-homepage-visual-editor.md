# SIX Homepage Visual Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a developer-only, in-page visual editor for SIX homepage layers and text, with local persistence and JSON export, and enlarge the lower-left figure by about 15% while preserving its alignment.

**Architecture:** Keep homepage defaults in the existing configuration and define editor state as a separate serializable overlay. A configuration utility validates, merges, persists, resets, and exports that overlay; React renders through one resolved visual configuration. A development-only editor panel edits the overlay, while production builds always render defaults and omit editor controls.

**Tech Stack:** React 19, TypeScript, Vite, Node built-in test runner, CSS.

**Spec:** `docs/superpowers/specs/2026-10-15-homepage-visual-editor-design.md`

## Global Constraints

- Preserve the existing 1676×939 design coordinate system and current image, frame-sequence, multiply, shadow, and wave rendering pipelines.
- The editor is available only in the development preview; production uses defaults and does not read localStorage.
- Persist editor values only in the local browser; provide reset-to-default and JSON export.
- Do not modify, regenerate, or publish supplied media assets.
- Left figure default scale is approximately 1.15×, keeping the figure's visual center and foot baseline aligned in both seated and standing states.

## Review Focus

- Malformed, unavailable, or stale localStorage must fall back to defaults without preventing the homepage from rendering; test invalid JSON, wrong shape, and storage access throwing.
- Numeric edits must remain finite and within supported bounds so a bad value cannot send a layer off-canvas or create a zero/huge scale; test boundary clamping and rejection.
- Layer ordering must remain a complete, duplicate-free permutation after edits; test reorder up/down at both ends and serialized order validation.
- Text edits must update rendered content while preserving the selected layer geometry and existing click interactions; test all four text fields and independent geometry.
- Production output must contain neither editor UI nor browser-persisted overrides; verify a production build and inspect the output bundle for editor labels/storage key.

---

### Task 1: Serializable visual configuration and storage

**Files:**
- Create: `src/visualEditorConfig.ts`
- Test: `tests/visualEditorConfig.test.mjs`
- Modify: `package.json` only if a test script adjustment is needed (the current `node --test tests/*.test.mjs` should already discover the new test)

**Interfaces:**
- Produces `EDITOR_STORAGE_KEY`, `DEFAULT_EDITOR_CONFIG`, `loadEditorConfig(storage)`, `saveEditorConfig(config, storage)`, `resetEditorConfig(storage)`, `exportEditorConfig(config)`, `resolveEditorConfig(defaults, overrides)`, and `clampLayerTransform(transform)`.
- Use serializable `LayerId`, `LayerTransform`, `EditorConfig`, and `HomeText` types. Layer IDs are `background`, `leftFigure`, `centerFigure`, `rightFigure`, `pinkReveal`, and `headline`.
- Each layer has `x`, `y`, `scale`, and `zIndex` in design coordinates. Text fields are `eyebrow`, `title`, `description`, and `button`.

- [x] **Step 1: Write failing tests** for default values; override merging; clamping x/y to `[-1676,1676]`/`[-939,939]`, scale to `[0.25,3]`, and zIndex to integer `[0,99]`; malformed JSON, invalid fields, missing storage, and throwing storage; reset; and stable pretty JSON export.
- [x] **Step 2: Run `npm test`** from `outputs/six-website`; confirm the new tests fail because the module is missing.
- [x] **Step 3: Implement the typed configuration and safe storage helpers** in `src/visualEditorConfig.ts`. Validate persisted values field by field, use defaults for invalid/missing values, and catch storage exceptions.
- [x] **Step 4: Run `npm test`**; all existing and new tests pass.
- [x] **Step 5: Commit only the new config utility and its test** with message `feat: add visual editor configuration storage`.

### Task 2: Route homepage rendering through resolved values

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/config.ts`
- Modify: `src/components/FrameSequence.tsx` only if its existing props cannot accept the resolved box values cleanly
- Test: `tests/visualEditorRendering.test.mjs`

**Interfaces:**
- Consumes Task 1 `EditorConfig`, `resolveEditorConfig`, and transform types.
- Produces a homepage render path that accepts resolved transforms and text as props/state without changing the default animation semantics.

- [x] **Step 1: Write failing tests** that assert each configured text field is used by its corresponding rendered content; each layer's x/y/scale/zIndex is applied to its visual layer; editing configuration does not replace click handlers; and layer order is normalized as a unique ordered list.
- [x] **Step 2: Run the focused test** with `node --test tests/visualEditorRendering.test.mjs`; confirm failure on current hard-coded JSX/styles.
- [x] **Step 3: Refactor `src/App.tsx`** to resolve visual settings from defaults plus overrides and apply them consistently to scene elements and the headline group. Keep existing scene mode and click handlers intact.
- [x] **Step 4: Run `npm test` and `npm run build`**; all tests and TypeScript/Vite build pass.
- [x] **Step 5: Commit the integrated rendering/editor work** with the later tasks after staging only feature files; keep unrelated pre-existing edits out.

### Task 3: Development-only visual editor and enlarged left figure

**Files:**
- Create: `src/components/VisualEditor.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/config.ts`
- Test: `tests/visualEditorInteraction.test.mjs`

**Interfaces:**
- Consumes the resolved visual settings from Task 2 and Task 1 storage helpers.
- `VisualEditor` props: `config: EditorConfig`, `onChange(config: EditorConfig): void`, `onReset(): void`, `onExport(): void`.
- Editor UI includes a dev-only “编辑页面” toggle; selected-layer controls for x/y/scale, order up/down, draggable left figure on canvas, four text fields, reset, and export JSON.

- [x] **Step 1: Write failing tests** for editor visibility only in development, select/update/drag changes reaching the config callback, order controls respecting boundaries, all four text controls, reset/export callbacks, and keyboard-operable labeled form controls.
- [x] **Step 2: Run the focused test** with `node --test tests/visualEditorInteraction.test.mjs`; confirm failure because the editor component is missing.
- [x] **Step 3: Implement the editor panel** with semantic buttons/inputs, clear labels, selected-layer state, numeric editing, left-figure pointer drag in design coordinates, order controls, reset, and downloadable JSON. Store config updates through the helpers from Task 1.
- [x] **Step 4: Set the left figure default to approximately 1.15×** in the separate visual editor defaults and anchor the transformed canvas near the foot baseline; preserve existing seated/active boxes and frame sequence.
- [x] **Step 5: Run `npm test` and `npm run build`**; all tests and build pass.
- [x] **Step 6: Include the editor, integration, and interaction tests in the integrated feature commit.**

### Task 4: Production isolation, project documentation, and browser verification

**Files:**
- Modify: `src/App.tsx` or `vite.config.ts` only if needed to statically eliminate editor controls from production output
- Modify: `PROJECT.md` and `README.md`
- Test: `tests/visualEditorProduction.test.mjs`

**Interfaces:**
- Consumes the development editor and resolved settings from Tasks 1–3.
- Produces a production bundle with default visual settings and no editor controls or localStorage reads.

- [x] **Step 1: Write a failing production test** that runs/inspects the built assets and asserts editor labels, export/reset controls, and the editor storage key are absent.
- [x] **Step 2: Run the production test** and confirm it fails against the current unguarded build.
- [x] **Step 3: Add an explicit `import.meta.env.DEV` compile-time guard** around editor-only UI and persistence; document how to open the editor, adjust layers/text, reset, and export in `README.md` and `PROJECT.md`.
- [x] **Step 4: Run clean verification**: `npm test`, `npm run build`, then the production bundle test; all pass.
- [x] **Step 5: Inspect in browser**: open the dev homepage, verify editor toggle/panel, change and refresh a transform and text field, reset and export, then exercise seated-to-standing and pink/yellow interactions to confirm they remain responsive and aligned. Open a production preview and confirm editor controls are absent.
- [x] **Step 6: Update this plan and include README/production verification in the integrated feature commit; preserve mixed pre-existing edits in `PROJECT.md` and `docs/ANIMATION.md` in the worktree.**
