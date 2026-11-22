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
- [x] Verify startup skeleton appears, follows light/dark theme, and no unstyled flash occurs (user-confirmed).
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

Status: In progress. Both standalone processing modules (Image Transformer and Image Adjuster) have been implemented, independently tested, and merged into `main`. Their real-image browser verification, focused tests, repository test suites, and production builds have passed. The initial FarrelPtrv editor workspace, ImageData adapter preparation, edited-image conversion handoff, Queue event bridge, and image preview selection have been added on `phase-5-editor-ui`. Full processing-module integration, Apply functionality, and the complete editing-to-conversion workflow remain pending. The work is divided among three members, with Pull Requests targeting `main`.

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
- [ ] Verify the Transform → Adjust pipeline through the integrated editor after both processing modules are merged.

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

- [ ] Design and implement an editing workspace that fits the existing application layout and design system.
- [ ] Add an image preview area for the currently selected image.
- [ ] Add width and height controls for resizing.
- [ ] Add an aspect-ratio lock/unlock control.
- [ ] Add crop selection controls and a clear way to apply or cancel a crop.
- [ ] Add rotation controls for 90, 180, and 270 degrees.
- [ ] Add horizontal and vertical flip controls.
- [ ] Add brightness, contrast, saturation, and blur controls.
- [ ] Add grayscale and sepia controls.
- [ ] Show the current values of numeric adjustment controls.
- [ ] Update the preview when the user changes editing controls, while avoiding unnecessary repeated processing that would make the interface unresponsive.
- [ ] Add a Reset action that restores the editing settings to their initial state.
- [ ] Add an Apply action that confirms the edited result for subsequent conversion.
- [ ] Define and coordinate the shared editing state and module contracts with `andra-gs` and `Adit1945-web` before connecting their modules.
- [ ] Connect the editor to the transformation and adjustment modules after their interfaces are agreed.
- [ ] Pass the resulting edited image into the existing conversion service without duplicating or replacing the established decoders and encoders.
- [ ] Ensure the original uploaded file remains available for reset or re-editing according to the agreed editing-state design.
- [ ] Handle processing, invalid input, and error states visibly.
- [ ] Ensure the editor works in light and dark themes.
- [ ] Ensure the editor is responsive on desktop and mobile.
- [ ] Preserve keyboard accessibility, focus behavior, and clear control labels.
- [ ] Add UI and integration tests for the editing workflow, reset, apply, preview updates, errors, themes, and conversion handoff.

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
4. `FarrelPtrv` updates `phase-5-editor-ui` from the latest `main`, connects the merged modules, and completes the editor integration.
5. The editor Pull Request is reviewed and merged.
6. The team runs all automated tests and the production build, then tests the complete editing-to-conversion workflow in the browser.

Deliverable: an image editor that supports geometric transformation and visual adjustment before conversion, integrated with the existing conversion engine.

## Phase 6: Advanced export and image optimization

Status: Planned and agreed by the project team on 2026-11-20. Phase 6 begins only after Phase 5 has been integrated and verified. The work is divided among the same three members.

### Team ownership

| GitHub account | Responsibility | Branch |
|---|---|---|
| `andra-gs` | Image Optimization | `phase-6-optimization` |
| `Adit1945-web` | Metadata Management | `phase-6-metadata` |
| `FarrelPtrv` | Export Presets and UI | `phase-6-export-ui` |

### 6.1 `andra-gs`: Image Optimization

Objective: implement optimization options that reduce output file size while keeping visual quality within the user's selected preference.

Tasks:

- [ ] Evaluate the existing encoders and determine which output formats support meaningful optimization controls.
- [ ] Implement optimization presets for low, medium, and high quality where the target encoder supports the relevant controls.
- [ ] Map each preset to documented encoder settings. Do not assume that the same quality number produces equivalent results across different formats.
- [ ] Implement an optional target-file-size mode where it is technically feasible for the selected output format and encoder.
- [ ] If exact target-size output cannot be guaranteed, report the achieved size and make the limitation clear rather than promising an exact result.
- [ ] Measure and report the source file size and generated output file size.
- [ ] Calculate the size difference and percentage reduction or increase accurately.
- [ ] Ensure optimization does not silently change the selected output format.
- [ ] Validate the output MIME type and file signature using the existing conversion validation approach.
- [ ] Reopen or decode generated output where the current pipeline supports that verification.
- [ ] Test visual quality at each preset using representative images, including photographs, graphics, and images with transparency where supported.
- [ ] Document format-specific limitations, including formats that do not expose a lossy quality control.
- [ ] Add automated tests for preset mapping, target-size behavior, size calculations, unsupported formats, invalid values, and output validation.

Primary implementation file:

```text
src/js/core/image-optimizer.js
tests/image-optimizer.test.js
```

The exact optimizer API must be agreed with `FarrelPtrv` before UI integration. The optimizer must use the existing encoder/conversion pipeline rather than creating a parallel conversion system.

Completion criteria:

- Optimization presets produce valid output for every format explicitly declared as supported.
- Source and output sizes are measured from actual files, not estimated values presented as exact results.
- Target-size mode is offered only where feasible and communicates when the requested size cannot be reached.
- Visual quality and transparency behavior are tested and documented.
- Automated tests pass.

### 6.2 `Adit1945-web`: Metadata Management

Objective: inspect supported image metadata and give the user a clear option to remove metadata from exported images.

Tasks:

- [ ] Evaluate a browser-compatible metadata reader and document its license, bundle impact, and supported metadata formats.
- [ ] Detect metadata availability without assuming every image contains EXIF data.
- [ ] Read supported EXIF fields from image files.
- [ ] Expose camera make and model when those fields exist.
- [ ] Expose orientation information when that field exists.
- [ ] Identify other metadata fields that are safe and useful to show in the interface. Document the exact supported field list.
- [ ] Handle missing, malformed, unsupported, and partially readable metadata without breaking image conversion.
- [ ] Implement metadata removal for exported files where the output pipeline can reliably omit the relevant metadata.
- [ ] Distinguish between metadata that can be read, metadata that can be removed, and metadata that can be preserved. These are separate capabilities.
- [ ] Verify the behavior separately for each supported output format. Do not claim metadata preservation when the encoder discards metadata.
- [ ] Ensure metadata removal does not modify the original uploaded file.
- [ ] Add automated tests for metadata detection, supported field extraction, missing fields, malformed metadata, removal behavior, and format-specific limitations.
- [ ] Document privacy implications and exactly which metadata fields the application reads or removes.

Primary implementation file:

```text
src/js/core/metadata-manager.js
tests/metadata-manager.test.js
```

The exact metadata result shape and API must be agreed with `FarrelPtrv` before UI integration.

Completion criteria:

- Supported metadata is read accurately from representative real image files.
- Missing or malformed metadata does not break the conversion workflow.
- Metadata removal is verified against actual exported files for each format declared as supported.
- Read, remove, and preserve capabilities are reported separately.
- Automated tests pass and format limitations are documented.

### 6.3 `FarrelPtrv`: Export Presets and UI

Objective: build the export settings interface and connect it to the optimization and metadata modules.

Tasks:

- [ ] Design and implement an export settings panel that follows the existing application design system.
- [ ] Add low-, medium-, and high-quality optimization preset controls.
- [ ] Add a target-file-size control only for formats and encoders that support the agreed target-size workflow.
- [ ] Add metadata inspection controls and a clear presentation of available metadata fields.
- [ ] Add an option to remove metadata from exported files when the selected output path supports it.
- [ ] Clearly distinguish metadata removal from metadata preservation. Do not display a preservation option for a format that cannot support it.
- [ ] Display the actual source file size and final output file size.
- [ ] Display the actual size difference and percentage change.
- [ ] Display an estimated size only if it is explicitly labeled as an estimate and the estimate has a documented basis.
- [ ] Connect export controls to `image-optimizer.js` and `metadata-manager.js` after their APIs are agreed.
- [ ] Integrate the export settings with individual downloads.
- [ ] Integrate the export settings with ZIP export so each successful file uses its selected export settings.
- [ ] Ensure failed optimization or metadata operations are reported per file and do not unnecessarily cancel unrelated batch items.
- [ ] Ensure the export panel works in light and dark themes.
- [ ] Ensure responsive layout and keyboard accessibility.
- [ ] Add UI and integration tests for presets, metadata controls, size reporting, individual downloads, ZIP export, error handling, and theme behavior.

Primary implementation files:

```text
src/js/ui/export-panel.js
src/styles/export-panel.css
tests/export-panel.test.js
```

The file list is a starting ownership boundary. Coordinate any required changes to shared files before editing them.

Completion criteria:

- The user can select a supported optimization preset and metadata option before export.
- The selected settings reach the correct processing modules.
- Actual source/output size information is displayed accurately.
- Individual downloads and ZIP export use the selected settings.
- Unsupported options are hidden or clearly disabled with an explanation.
- Automated tests, browser checks, and production build pass.

### Phase 6 integration order

1. Confirm Phase 5 is merged and stable.
2. Agree on the optimizer and metadata APIs, supported format matrix, error behavior, and resource ownership.
3. `andra-gs` and `Adit1945-web` implement their processing modules and automated tests.
4. Review and merge their Pull Requests into `main` one at a time.
5. `FarrelPtrv` updates `phase-6-export-ui` from the latest `main`, connects both modules, and completes individual-download and ZIP integration.
6. Review and merge the export UI Pull Request.
7. Run the full automated test suite and production build, then test export behavior with representative real files and formats.

Deliverable: an export workflow with tested optimization presets, accurate file-size reporting, supported metadata inspection/removal, and integration with individual and ZIP downloads.

## Phase 7: Testing, documentation, and release

This phase contains the release-readiness work that was previously listed as Phase 6. It is intentionally separate from the newly agreed Phase 6 feature work.

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

This repository is developed by a three-person team. The GitHub account names below are the authoritative task owners. ChatGPT sessions used by any team member must read this section and the Development Roadmap before proposing or changing project files.

| GitHub account | Phase 5 responsibility | Phase 6 responsibility |
|---|---|---|
| `andra-gs` | Image Transformation | Image Optimization |
| `Adit1945-web` | Image Adjustment | Metadata Management |
| `FarrelPtrv` | Editor UI and Integration | Export Presets and UI |

### Mandatory instructions for ChatGPT sessions

1. Read the root-level `AGENTS.md` before taking action.
2. Identify the current developer by their GitHub username. If it is not known, ask the user to provide it before selecting an assigned task.
3. Read `docs/DEVELOPMENT_ROADMAP.md`, this file, `docs/PROJECT_CONTEXT.md`, and `docs/TECHNICAL_SPECIFICATION.md` before making implementation decisions.
3. Work only on the responsibility assigned to the identified GitHub account for the active phase. Do not silently take over another member's module.
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
| Phase 6 | `phase-6-optimization` | `phase-6-metadata` | `phase-6-export-ui` |

Branch names are the agreed convention. The branches are created when the relevant phase begins; documenting a branch name does not mean that the branch already exists.
