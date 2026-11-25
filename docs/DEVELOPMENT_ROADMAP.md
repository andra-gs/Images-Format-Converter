# Development Roadmap

The project will be developed in phases. Complete and test a phase before treating the next phase as active.

## Phase 0: Project foundation

Tasks:
- [x] Create GitHub repository.
- [x] Initialize Vite with Vanilla JavaScript.
- [x] Add initial package scripts.
- [x] Create a maintainable initial source structure.
- [x] Add base CSS variables and reset.
- [x] Decide styling approach: plain CSS.
- [x] Add Lucide through NPM.
- [x] Install dependencies and confirm package-lock.json is committed (verified in the GitHub repository).
- [x] Confirm the application runs on localhost (user-confirmed).
- [x] Verify the production build with `npm run build` (user-confirmed on 2026-11-17).

Deliverable: a working project skeleton.

## Phase 1: UI development

Tasks:
- [x] Navbar and application branding.
- [x] Hero section and local-processing explanation.
- [x] Upload workspace.
- [x] File picker interaction.
- [x] Drag-and-drop interaction.
- [x] File queue layout.
- [x] Preview component.
- [x] Conversion settings panel (interface only)
- [x] Custom accessible output-format dropdown with controlled option spacing
- [x] Startup skeleton to prevent unstyled content flash.
- [x] Results component (empty state only).
- [x] Light theme.
- [x] Dark theme.
- [x] Theme persistence preference, if implemented.
- [x] Responsive desktop and mobile layouts (user-confirmed).
- [x] Basic accessibility and keyboard interaction (user-confirmed).
- [x] Verify settings/results visibility and custom format selection on desktop and mobile (user-confirmed).
- [x] Verify quality slider visibility and value updates (user-confirmed).
- [x] Verify custom dropdown mouse and keyboard interactions (user-confirmed).
- [x] Verify startup skeleton prevents an unstyled-content flash (user-confirmed).
- [ ] Verify startup skeleton follows the selected light/dark theme. The user's last reported test found that it always appears in the light theme; fix and retest are still required.
- [x] Verify both panels disappear after clearing the file queue (user-confirmed).
- [x] Run a fresh production build after the latest UI changes (user-confirmed).

Deliverable: complete interface with file-selection and conversion-settings controls. Conversion execution remains in Phase 2.

## Phase 2: Core conversion engine (MVP)

Tasks:
- [x] File validation and signature detection (implementation exists; full manual verification remains part of QA).
- [x] Capability registry separating input decoding from output encoding (automated tests passed; user-confirmed).
- [x] Browser image decoding for PNG, JPEG, WebP, and BMP (user-confirmed successful real-file tests).
- [x] PNG output (encoder, conversion service, and UI flow; user verified PNG, JPEG, WebP, and BMP inputs convert successfully, output opens as PNG, dimensions and PNG transparency are preserved, filenames use .png, downloads work, and multiple files convert independently).
- [x] JPEG output (encoder, conversion service, quality control, white compositing for transparency, and main-interface download; user verified real-file conversion).
- [x] WebP output (encoder, conversion service, quality control, and main-interface download; user verified PNG, JPEG, WebP, and BMP inputs, transparency, MIME type, dimensions, preview, download, and unsupported-browser error handling).
- [x] BMP encoder (user verified PNG, JPEG, WebP, and BMP inputs; output opens, dimensions match, and transparent pixels become white).
- [x] Blob result generation for PNG, JPEG, WebP, and BMP output.
- [x] Output signature validation, reopening/decoding, and dimension checks for implemented formats.
- [x] Individual downloads for implemented output formats.
- [x] Per-file conversion error results.

Deliverable: reliable local conversion for implemented and tested formats.

## Phase 3: Batch processing

Status: Complete. The user verified batch queue behavior, worker execution, progress, cancellation, failure isolation, large-image responsiveness, cleanup, individual downloads, ZIP download, archive extraction, and image integrity.

Tasks:
- [x] Multiple-file queue (existing UI queue and independent per-file conversion).
- [x] Queue job states: pending, processing, completed, failed, and cancelled.
- [x] Per-file status and indeterminate processing indicator, plus batch completion progress.
- [x] Web Worker conversion for supported browsers.
- [x] OffscreenCanvas and createImageBitmap feature detection with main-thread HTML API fallback.
- [x] Concurrency limit of one conversion job at a time to control memory usage.
- [x] Cancel remaining queued files after the active file finishes.
- [x] Quality adjustment for JPEG and WebP.
- [x] Verify ZIP download using JSZip (user-confirmed archive extraction and image integrity).
- [x] Resource cleanup for decoded images, output object URLs, and worker shutdown.

Deliverable: batch conversion without freezing the UI under normal test loads. Batch processing, worker execution, cancellation, cleanup, and ZIP export are user-verified.

## Phase 4: Advanced format support

Status: Complete (2026-11-20). HEIC/HEIF, TIFF, SVG, raster-to-SVG, GIF first-frame input, animated GIF-to-GIF, and static-image-to-GIF paths are implemented and user-verified. Lockfile synchronization, automated tests, production build, and real-browser checks have passed.

Tasks:
- [x] Evaluate and integrate HEIC/HEIF decoder adapter using heic-to (real-file decoder, conversion, and Worker tests user-confirmed).
- [x] Test real HEIC and HEIF fixtures in the browser, main conversion pipeline, and Web Worker (user-confirmed).
- [x] Integrate a UTIF2-based TIFF decoder adapter that renders the first page to Canvas.
- [x] Test real TIFF fixtures, including single-page/multi-page files and representative compression variants, in the browser and conversion pipeline (user-confirmed).
- [x] Evaluate TIFF encoder separately and select the existing UTIF2 encoder for baseline uncompressed TIFF output.
- [x] Integrate baseline uncompressed TIFF output in the main conversion pipeline and Web Worker.
- [x] Verify generated TIFF files with real files, independent viewers, dimensions, pixel data, and downloads (user-confirmed).
- [x] Implement a restricted SVG sanitizer and browser rasterization path without live-DOM insertion or external resource loading.
- [x] Verify SVG sanitization, browser rasterization, dimensions, and conversion to PNG, JPEG, WebP, BMP, and TIFF in the main application (user-confirmed on 2026-11-19).
- [x] Define raster-to-SVG behavior as an SVG wrapper containing an embedded PNG, clearly distinguished from true vectorization.
- [x] Implement the PNG-embedding SVG encoder, strict sanitizer support for embedded PNG data, main-thread conversion pipeline, and UI labeling.
- [x] Verify raster-to-SVG output in the real browser, including transparent and opaque sources, re-decoding, dimensions, individual downloads, and ZIP export (user-confirmed; `npm test` and `npm run build` also passed).
- [x] Implement and verify GIF first-frame decoding for raster conversion in the browser decoder and main application (user-confirmed).
- [x] Evaluate animated GIF decoder and encoder candidates; select modern-gif 2.1.0 (MIT) alongside the existing gifuct-js first-frame path.
- [x] Implement animated GIF-to-GIF frame decoding/re-encoding, frame delay and looping metadata handling, and single-frame GIF output from static images.
- [x] Add GIF-specific frame, dimension, and total-pixel limits plus user-facing compatibility notes.
- [x] Synchronize the npm lockfile and pass automated tests and production build in GitHub Actions.
- [x] Verify animated GIF behavior in the real browser: timing, looping, transparency, frame order, batch processing, individual downloads, and ZIP export (user-confirmed).
- [x] Update the GitHub Actions workflow to use current Node 24-compatible action versions while running the project on Node.js 22.

Deliverable: tested advanced-format pipelines. Complete. Limitations remain documented; do not imply animated GIF-to-WebP/APNG, multi-page TIFF output, or true raster vectorization is supported.

## Phase 5: Image manipulation

Status: Complete. The Editor integration was merged into `main` through PR #5 on 2026-11-22. The PR reported 98/98 automated tests passing, a successful production build, and real-browser verification of the Editor, HEIC/TIFF previews, Apply behavior, and existing conversion regressions. The project owner also reported post-merge `npm test` and `npm run dev` checks passing on 2026-11-23. Animated GIF remains on the original File-based conversion path to preserve animation.

### Team ownership

| GitHub account | Responsibility | Branch |
|---|---|---|
| `andra-gs` | Image Transformation | `phase-5-transformation` |
| `Adit1945-web` | Image Adjustment | `phase-5-adjustment` |
| `FarrelPtrv` | Editor UI and Integration | `phase-5-editor-ui` |

### 5.1 `andra-gs`: Image Transformation

Objective: implement image geometry and orientation operations. These operations change the image's dimensions, visible area, or orientation before the edited image is passed to the existing conversion service.

Tasks:

- [x] Implement image resizing with explicit output width and height.
- [x] Support keeping the original aspect ratio while resizing.
- [x] Support unlocking the aspect ratio when the user wants independent width and height values.
- [x] Validate width and height values. Reject zero, negative, non-finite, or excessive dimensions using project limits.
- [x] Implement cropping by a defined selection rectangle.
- [x] Validate crop coordinates and crop dimensions against the source image boundaries.
- [x] Implement rotation by 90, 180, and 270 degrees.
- [x] Implement horizontal flipping.
- [x] Implement vertical flipping.
- [x] Ensure output dimensions are correct after resizing, cropping, and rotation.
- [x] Handle transparent pixels without introducing an unintended background during transformations, using premultiplied-alpha interpolation during resize.
- [x] Keep the processing module free of DOM, Canvas, and ImageBitmap dependencies. It allocates only its output pixel buffer and leaves input ownership with the caller.
- [x] Add automated tests for resize, aspect-ratio behavior, crop bounds, rotation, flipping, output dimensions, invalid input, and error paths.
- [x] Document the module's public interface and the agreed input/output contract for the editor integration.

Primary implementation file:

```text
src/js/core/image-transformer.js
tests/image-transformer.test.js
```

The team has agreed on the shared sRGB ImageData representation and the `applyImageTransformations(imageData, transformations)` API. The function returns `{ imageData, width, height }`. See `docs/TECHNICAL_SPECIFICATION.md` for the final parameter behavior, output shape, limits, and ownership contract. Do not independently introduce a second editing data model.

Completion criteria:

- Automated unit tests and the production build pass (user-confirmed on 2026-11-21).
- The user confirmed real-image verification through `/tests/browser-transformer.html` with representative local files.
- All listed transformations work with representative real images.
- Aspect ratio and output dimensions match the selected operation.
- Crop selections outside the source bounds are rejected or safely constrained according to the agreed contract.
- Transparency behaves as documented.
- Automated tests pass.
- The module can be called by the editor integration without changing the existing conversion service's established behavior.

### 5.2 `Adit1945-web`: Image Adjustment

Objective: implement pixel appearance and color adjustments. These operations modify the visual appearance of the image without changing its geometric dimensions.

Status: Processing module, focused unit tests, and real-image browser verification are complete on `phase-5-adjustment`. The full repository test suite and production build also pass. Editor integration and the complete editing-to-conversion workflow remain pending.

Tasks:

- [x] Implement brightness adjustment.
- [x] Implement contrast adjustment.
- [x] Implement saturation adjustment.
- [x] Implement grayscale conversion.
- [x] Implement sepia adjustment.
- [x] Implement blur adjustment.
- [x] Define and enforce valid minimum, maximum, and default values for each numeric adjustment.
- [x] Ensure adjustment values outside the accepted range are rejected or clamped consistently with the agreed API contract.
- [x] Ensure image dimensions remain unchanged by color and appearance adjustments.
- [x] Define how alpha transparency is handled by each adjustment, and preserve transparency where the operation allows it.
- [x] Ensure adjustments can be combined in a deterministic order.
- [x] Avoid mutating the original uploaded File or the original source image data.
- [x] Release temporary pixel buffers and canvases after processing.
- [x] Add automated tests for default values, boundary values, brightness, contrast, saturation, grayscale, sepia, blur, transparency, dimensions, combined adjustments, and invalid input.
- [x] Document the module's public interface and the agreed input/output contract for the editor integration.
- [x] Verify all adjustments with representative real image files in the browser test harness (user-confirmed).
- [x] Verify the Transform → Adjust pipeline through the integrated editor after both processing modules are merged (PR #5 integration and browser checks reported complete).

Primary implementation file:

```text
src/js/core/image-adjuster.js
tests/image-adjuster.test.js
```

The exact exported function names, adjustment ranges, and argument shapes must be agreed with `FarrelPtrv` before implementation. Do not create a UI-specific state model inside this processing module.

Completion criteria:

- Every listed adjustment produces the expected visual change.
- Adjustment values stay within documented ranges.
- Dimensions remain unchanged.
- Transparency behaves as documented.
- Multiple adjustments produce deterministic results.
- Automated tests pass.
- The module can be called by the editor integration using the shared contract.

### 5.3 `FarrelPtrv`: Editor UI and Integration

Objective: build the image-editing workspace and connect the transformation and adjustment modules to the application. This member owns the editor-facing UI and the integration flow, not the internal implementation of the transformation or adjustment algorithms.

Tasks:

- [x] Design and implement an editing workspace that fits the existing application layout and design system.
- [x] Add an image preview area for the currently selected image.
- [x] Add width and height controls for resizing.
- [x] Add an aspect-ratio lock/unlock control.
- [x] Add crop selection controls and a clear way to apply or cancel a crop.
- [x] Add rotation controls for 90, 180, and 270 degrees.
- [x] Add horizontal and vertical flip controls.
- [x] Add brightness, contrast, saturation, and blur controls.
- [x] Add grayscale and sepia controls.
- [x] Show the current values of numeric adjustment controls.
- [x] Update the preview when the user changes editing controls, while avoiding unnecessary repeated processing that would make the interface unresponsive.
- [x] Add a Reset action that restores the editing settings to their initial state.
- [x] Add an Apply action that confirms the edited result for subsequent conversion.
- [x] Define and coordinate the shared editing state and module contracts with `andra-gs` and `Adit1945-web` before connecting their modules.
- [x] Connect the editor to the transformation and adjustment modules after their interfaces are agreed.
- [x] Pass the resulting edited image into the existing conversion service without duplicating or replacing the established decoders and encoders.
- [x] Ensure the original uploaded file remains available for reset or re-editing according to the agreed editing-state design.
- [x] Handle processing, invalid input, and error states visibly.
- [x] Ensure the editor works in light and dark themes.
- [x] Ensure the editor is responsive on desktop and mobile.
- [x] Preserve keyboard accessibility, focus behavior, and clear control labels.
- [x] Add UI and integration tests for the editing workflow, reset, apply, preview updates, errors, themes, and conversion handoff.

Primary implementation files:

```text
src/js/ui/image-editor.js
src/styles/editor.css
tests/image-editor.test.js
```

The file list is a starting ownership boundary. If the current repository structure requires a different location, document the change and coordinate it before editing files owned by another module.

Completion criteria:

- A user can select an image, edit it, preview the changes, reset them, and apply the edited result.
- Transformation and adjustment controls call the corresponding processing modules.
- The edited result can be converted using the existing conversion formats and download flow.
- Existing upload, batch conversion, Worker behavior, ZIP export, and theme behavior continue to work.
- Automated tests, browser checks, and production build pass.

### Phase 5 integration order

1. All three members agree on the editing data model, module contracts, error handling, and resource ownership before implementation.
2. `andra-gs` and `Adit1945-web` implement their independent processing modules and tests.
3. Their Pull Requests are reviewed and merged into `main` one at a time.
4. `FarrelPtrv` updates `phase-5-editor-ui` from the latest `main`, connects the merged modules, and completes the editor integration. This integration has been implemented and locally verified on the feature branch.
5. Review and merge the Editor Pull Request into `main`.
6. After merge, rerun the complete automated test suite and production build, then repeat the editing-to-conversion browser regression checks.

Deliverable: an image editor that supports geometric transformation and visual adjustment before conversion, integrated with the existing conversion engine.

## Phase 6: Image optimization and export workflow

Status: Complete. The Image Optimization Engine was merged through PR #7 and the production Export UI integration was merged through PR #9 on 2026-11-25. PR #9 reports 156/156 automated tests passing, a successful production build, successful integrated browser checks, and passing GitHub Actions. The build retains a non-fatal Vite chunk-size advisory for the HEIC-related bundles (~3.2 MB each). Metadata Management remains deferred to a future backlog item.

### Team ownership

| GitHub account | Responsibility | Branch |
|---|---|---|
| `andra-gs` | Image Optimization Engine | `phase-6-optimization` |
| `FarrelPtrv` | Export Presets and UI Integration | `phase-6-export-ui` |

### Phase objectives

- Reduce output file size where the selected encoder supports meaningful optimization.
- Provide clear quality presets without pretending quality values are equivalent across formats.
- Report actual source and output file sizes, including the size difference and percentage change.
- Integrate optimization settings with individual downloads and ZIP export.
- Preserve the existing browser-local conversion architecture, decoders, encoders, and conversion service.
- Keep unsupported options hidden or clearly unavailable.

### 6.1 `andra-gs`: Image Optimization Engine

Objective: implement the core optimization module and accurate file-size measurement. The optimizer must use the existing encoder/conversion pipeline rather than creating a parallel conversion system.

Tasks:

- [x] Inspect existing encoders and identify which formats expose meaningful optimization controls.
- [x] Define a supported-format and capability matrix for optimization.
- [x] Implement `src/js/core/image-optimizer.js`.
- [x] Add Low, Medium, and High quality presets for formats where the encoder supports them.
- [x] Map presets to documented, format-specific encoder settings. Do not assume the same quality number produces equivalent results across formats.
- [x] Implement target-file-size behavior only for formats where repeated encoding and quality adjustment are technically feasible. Start with JPEG and WebP if the current encoder path supports the required controls.
- [x] Do not promise an exact target size. Return the achieved size and clearly report when the requested target cannot be reached.
- [x] Measure source and output sizes from actual File/Blob data.
- [x] Calculate byte difference and percentage reduction or increase accurately, including cases where output is larger.
- [x] Ensure optimization never silently changes the selected output format.
- [x] Validate output MIME type and file signature using the existing conversion validation path.
- [x] Reopen or decode generated output where the current pipeline supports that verification.
- [x] Test visual quality using representative photographs, graphics, and transparent images where supported.
- [x] Document format-specific behavior and unsupported optimization options.
- [x] Add automated tests for preset mapping, format capability checks, target-size iteration and failure behavior, actual size calculations, invalid values, and output validation.

Primary files:

```text
src/js/core/image-optimizer.js
tests/image-optimizer.test.js
docs/PHASE_6_OPTIMIZATION.md
```

Final API contract: approved and implemented in [`PHASE_6_OPTIMIZATION_API.md`](./PHASE_6_OPTIMIZATION_API.md). The public API is `optimizeImage(source, options)` with `IMAGE_OPTIMIZATION_CAPABILITIES`; it accepts File/Blob or `{ file, imageData }` sources and returns a validated Blob with actual size and optimization metadata.

Completion criteria:

- Presets produce valid output for every format explicitly marked as supported.
- Source and output sizes come from actual file data, not estimates presented as exact values.
- Target-size behavior is offered only where feasible and reports the achieved result honestly.
- Visual quality, transparency, and format integrity are tested.
- The module integrates with the existing conversion service without duplicating decoders or encoders.
- Focused tests, full test suite, and production build pass.

### 6.2 `FarrelPtrv`: Export Presets and UI Integration

Objective: implement the export settings interface and connect it to the Image Optimizer and existing download workflow.

Tasks:

- [x] Design an Export Settings panel consistent with the existing application design system.
- [x] Add Low, Medium, and High preset controls when supported by the selected output format.
- [x] Show format-specific quality controls only when the selected encoder supports them.
- [x] Add a target-file-size control only for formats supported by the agreed optimizer contract.
- [x] Display the actual source file size.
- [x] Display the actual generated output size.
- [x] Display the byte difference and percentage reduction or increase.
- [x] Make clear when optimization is unavailable for the selected format.
- [x] Integrate the panel with `image-optimizer.js` using the agreed API.
- [x] Apply the selected settings to individual downloads.
- [x] Apply the selected settings to ZIP export so each successful item uses its own selected output settings.
- [x] Keep per-file optimization failures isolated so one failed item does not unnecessarily cancel unrelated batch items.
- [x] Preserve existing conversion, validation, queue, Worker, and ZIP behavior.
- [x] Support light and dark themes.
- [x] Ensure responsive desktop/mobile layout and keyboard accessibility.
- [x] Add UI and integration tests for presets, capability-dependent controls, size reporting, individual downloads, ZIP export, error states, and theme behavior.
- [x] Document the UI behavior and integration contract in `docs/PHASE_6_EXPORT_UI.md`.

Primary files:

```text
src/js/ui/export-panel.js
src/styles/export-panel.css
tests/export-panel.test.js
docs/PHASE_6_EXPORT_UI.md
```

The file list is an initial ownership boundary. Coordinate changes to shared files, especially the conversion service, queue orchestration, and ZIP export, before editing them.

Completion criteria:

- Users can select a supported optimization preset before export.
- Settings reach the optimizer correctly for each file.
- Actual size information is accurate and understandable.
- Individual downloads and ZIP export use the selected settings.
- Unsupported options are hidden or clearly disabled with an explanation.
- Existing conversion and batch behavior remains functional.
- Focused tests, full test suite, browser checks, and production build pass.

### Verified optimization capability matrix

The following behavior is implemented and covered by the merged optimizer and Export UI integration:

| Output format | Verified export optimization behavior |
|---|---|
| JPEG | Low/Medium/High presets and best-effort Target Size; target search uses up to 7 validated candidates in the quality range 0.10–0.95 |
| WebP | Low/Medium/High presets and best-effort Target Size; target search uses up to 7 validated candidates in the quality range 0.10–0.95 |
| PNG | `mode: none`; existing PNG encoder path |
| BMP | `mode: none`; existing dedicated 24-bit BMP encoder |
| TIFF | `mode: none`; existing baseline uncompressed TIFF encoder |
| GIF | `mode: none`; preserve animated GIF through the existing File-based path |
| SVG | `mode: none`; SVG wrapper continues to embed PNG and is not vector optimization |
| HEIC/HEIF | Input decoding only; no output encoder in the current capability registry |

### Phase 6 integration order and completion evidence

1. [x] Complete Phase 5 post-merge checks before starting Phase 6.
2. [x] Create `phase-6-optimization` and `phase-6-export-ui` from the appropriate `main` history.
3. [x] Approve the shared optimizer API, preset mapping, capability matrix, error behavior, size-reporting shape, and resource ownership.
4. [x] Implement and merge the Image Optimization Engine through [PR #7](https://github.com/andra-gs/Images-Format-Converter/pull/7).
5. [x] Synchronize the Export UI branch with the merged optimizer and integrate the real optimizer into the production conversion flow.
6. [x] Integrate per-file settings, edited ImageData handling, sequential queue behavior, individual downloads, and ZIP reuse.
7. [x] Review and merge the production Export UI integration through [PR #9](https://github.com/andra-gs/Images-Format-Converter/pull/9) on 2026-11-25.
8. [x] Run the integrated test suite and production build, then complete real-browser verification of presets, Target Size reached/not-reached, unsupported-format `none` mode, animated GIF, edited images, mixed batches, failure isolation, individual downloads, ZIP integrity, and existing conversion/Editor regressions.

Verification reported for PR #9:
- `npm test`: 156/156 passed, 0 failed.
- `npm run build`: successful.
- GitHub Actions: all checks passed.
- Integrated browser checks: contributor-reported as completed successfully.
- Existing non-fatal Vite chunk-size advisory remains for HEIC-related bundles (~3.2 MB each).

These results were reported in the PR and were not independently rerun during this documentation update.

### Deferred backlog: Metadata Management

Metadata Management is intentionally excluded from Phase 6 to keep the two-person scope focused. It may be proposed as a separate future phase after the export workflow is stable.

Potential future scope:

- Evaluate a browser-compatible metadata reader and document license, bundle impact, and supported formats.
- Detect metadata availability without assuming every image contains EXIF.
- Read a documented subset of EXIF fields, such as camera make/model and orientation when present.
- Handle missing, malformed, unsupported, and partially readable metadata without breaking conversion.
- Investigate metadata removal for exported formats where the encoder can reliably omit metadata.
- Distinguish reading, removing, and preserving metadata. Do not claim preservation when an encoder discards metadata.
- Verify behavior separately for each output format.
- Ensure metadata operations never modify the original uploaded file.
- Add tests and document privacy implications and format-specific limitations.

No owner, branch, API, or delivery date is assigned to this deferred work yet.

## Phase 7: Testing, documentation, and release

Status: Next phase; not started. Phase 0–6 feature development is complete. This phase contains the remaining project-wide release-readiness work.

Tasks:

- [ ] Cross-browser testing.
- [ ] Mobile layout testing.
- [ ] Large-image and memory testing.
- [ ] Security review, especially SVG handling and image metadata parsing.
- [ ] Validate all advertised conversion paths.
- [ ] Verify no image upload/network transfer occurs during normal image processing.
- [ ] Check production build.
- [ ] Complete README installation and usage instructions.
- [ ] Add screenshots and a supported-format matrix.
- [ ] Document known limitations and browser compatibility.
- [ ] Tag release `v1.0.0` when release criteria are met.

Deliverable: documented, tested, release-ready GitHub version.

## Priority guide

- P0: required for the first working MVP.
- P1: important improvements after core conversion.
- P2: advanced formats and complex format behavior.
- P3: optional enhancements.

## Suggested feature priorities

| Feature | Priority |
|---|---|
| File upload and drag/drop | P0 |
| Preview | P0 |
| PNG/JPEG/WebP conversion | P0 |
| BMP conversion | P0 target, subject to dedicated encoder |
| Individual download | P0 |
| Validation and error handling | P0 |
| Batch conversion | P1 |
| Web Worker processing | P1 |
| Quality controls | P1 |
| ZIP download | P1 |
| HEIC/HEIF | P2 |
| TIFF | P2 |
| SVG | P2 |
| GIF static conversion | P2 |
| GIF animation | P2 |
| Resizing and compression | P1/P2 |
| Metadata viewer | P3 |

## Completion policy

Do not mark a phase complete based on appearance alone. A feature must work with real files and pass relevant tests. Update `DEVELOPMENT_LOG.md` as work progresses. Follow the team ownership, branch, review, and integration rules in the collaboration section below.


## Team collaboration and task ownership

This repository is developed by a three-person team overall. Phase 6 feature work is assigned to two members only. The GitHub account names below are the authoritative task owners. ChatGPT sessions used by any team member must read this section and the Development Roadmap before proposing or changing project files.

| GitHub account | Phase 5 responsibility | Phase 6 responsibility |
|---|---|---|
| `andra-gs` | Image Transformation | Image Optimization Engine |
| `Adit1945-web` | Image Adjustment | Not assigned to Phase 6 |
| `FarrelPtrv` | Editor UI and Integration | Export Presets and UI Integration |

### Mandatory instructions for ChatGPT sessions

1. Read the root-level `AGENTS.md` before taking action.
2. Identify the current developer by their GitHub username. If it is not known, ask the user to provide it before selecting an assigned task.
3. Read `docs/DEVELOPMENT_ROADMAP.md`, this file, `docs/PROJECT_CONTEXT.md`, and `docs/TECHNICAL_SPECIFICATION.md` before making implementation decisions.
4. Work only on the responsibility assigned to the identified GitHub account for the active phase. Do not silently take over another member's module.
4. Do not change the ownership table or reassign tasks unless the project owner explicitly agrees.
5. Preserve the existing architecture: Vanilla JavaScript ES modules, Vite, plain CSS, browser-local image processing, and the existing conversion pipeline.
6. Do not claim a feature is complete until its implementation, automated tests, relevant browser checks, and production build have been verified. Record who performed manual tests and what was tested.
7. Do not push directly to `main`. Work on the assigned feature branch and submit a Pull Request.
8. Keep documentation synchronized with actual implementation. Planned work must remain marked as planned until it exists and passes verification.

### Shared collaboration rules

- Each member owns one feature branch per phase. Create the branch from the latest `main` when the phase begins.
- Do not create or use a shared working branch as a substitute for the member's assigned branch.
- Avoid editing another member's owned module or the same integration files without prior coordination.
- Before implementation, agree on module input/output contracts, error behavior, resource ownership, and how the module connects to the existing application.
- If a task requires a change outside the assigned module, explain the dependency and coordinate it in the team before changing the other member's files.
- Keep commits focused and descriptive. Include tests with the feature implementation.
- Before opening a Pull Request, run `npm test` and `npm run build`, and perform the relevant browser checks.
- Pull Requests target `main`. Review the diff, resolve conflicts, and merge one Pull Request at a time.
- For each phase, merge the processing modules before the UI/integration module. The UI/integration owner must update their branch from the newly merged `main` before final integration.
- After all three Pull Requests are merged, run the full test suite and production build again, then perform end-to-end browser testing.
- Do not force-push over another member's work or overwrite a teammate's commit.

### Branch naming

| Phase | `andra-gs` | `Adit1945-web` | `FarrelPtrv` |
|---|---|---|---|
| Phase 5 | `phase-5-transformation` | `phase-5-adjustment` | `phase-5-editor-ui` |
| Phase 6 | `phase-6-optimization` | Not applicable | `phase-6-export-ui` |

Branch names are the agreed convention. The branches are created when the relevant phase begins; documenting a branch name does not mean that the branch already exists.


## 2026-11-25 - Phase 6 optimizer synchronization update

The Image Optimization Engine has been merged into `main` through PR #7 and its source, API contract, optimizer tests, and standalone browser harness have been synchronized onto `phase-6-export-ui`. Andra reports that real-browser verification has been completed. This report is owner-confirmed; the current branch still requires integrated application testing after Export UI production wiring.

Completed synchronization items:
- [x] Bring `src/js/core/image-optimizer.js` onto `phase-6-export-ui`.
- [x] Bring the approved optimizer API contract and implementation notes onto `phase-6-export-ui`.
- [x] Bring the optimizer automated test file and browser harness onto `phase-6-export-ui`.
- [x] Preserve the existing Export UI, adapter, and branch-specific history.
- [ ] Integrate the optimizer into the production conversion flow.
- [ ] Apply per-file settings to individual downloads.
- [ ] Apply per-file settings to ZIP exports while preserving per-file failure isolation.
- [ ] Run the full automated suite, production build, and integrated browser regression checks.

All synchronization commits are targeted at `phase-6-export-ui`. The `main` branch is not modified by this update.


## 2026-11-25 - Export UI production optimizer wiring

Current branch: `phase-6-export-ui` (head `ba40e1e` at this documentation checkpoint).

Implementation now present:
- `main.js` calls the real optimizer through the validated Export UI adapter.
- Per-file optimization settings are passed independently, with original File or edited `{ file, imageData }` sources.
- Unsupported optimization formats use `mode: "none"`.
- The existing sequential queue, per-file error isolation, progress updates, and between-file cancellation checks are retained.
- Individual downloads and ZIP export reuse the same optimizer result Blob; ZIP does not re-encode.
- Result UI reports source/output sizes, byte and percentage change, MIME type, and Target Size status.

Still required before PR:
- [ ] Run `npm test` after production integration.
- [ ] Run `npm run build` after production integration.
- [ ] Test JPEG/WebP presets and Target Size reached/not-reached with real images.
- [ ] Test PNG/BMP/TIFF/SVG no-optimization and animated GIF preservation.
- [ ] Test edited ImageData, mixed-format batch, failure isolation, individual downloads, and ZIP Blob reuse.
- [ ] Repeat existing conversion, Editor, queue progress, cancellation, and theme regression checks in a real browser.
- [ ] Record actual results and limitations in the development log.

## 2026-11-25 - Phase 6 completion and documentation correction

PR #9 merged the production Export UI integration into `main` after the Image Optimization Engine from PR #7 had already been merged. The latest Phase 6 integration report records 156/156 automated tests passing, a successful production build, successful integrated browser checks, and passing GitHub Actions.

The current roadmap now marks Phase 5 and Phase 6 complete. Earlier Phase 6 checkpoints in this file that describe production integration or verification as pending are historical checkpoints and are superseded by this completion record.

Known outstanding issue carried into Phase 7: the user's last reported UI check found that the startup skeleton always appears in the light theme, even when dark theme is selected. The no-unstyled-content-flash check passed. Theme matching still requires a fix and retest.
