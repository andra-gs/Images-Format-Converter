# Development Log

This file records actual repository progress. Update it after meaningful implementation or testing work.

## Project status

- Current stage: v1.0.0 released
- Current phase status: Phases 0–7 are complete and the first stable release `v1.0.0` was published on 2026-11-26. Phase 1 retains one separately tracked UI issue: the startup skeleton was last reported to always appear in the light theme, even when dark theme is selected.
- Latest release: [v1.0.0](https://github.com/andra-gs/Images-Format-Converter/releases/tag/v1.0.0), published 2026-11-26
- Release tag commit: `df882784d4bd18854067663191bc4b00dae5c0d5`
- Last updated: 2026-11-26

## Status legend

- `Not started`: no implementation work has begun.
- `In progress`: implementation is underway.
- `Implemented`: code exists, but validation may still be pending.
- `Tested`: relevant tests passed.
- `Blocked`: progress depends on an unresolved issue.

## Phase tracker

| Phase | Status | Notes |
|---|---|---|
| Phase 0: Project foundation | Tested | User confirmed localhost works and `npm run build` succeeds; `package-lock.json` is present in the GitHub repository |
| Phase 1: UI development | Tested with known issue | User confirmed custom dropdown behavior, theme switching, and no unstyled flash. The user's last reported check found that the startup skeleton always appears in the light theme; theme matching remains unresolved and must be retested |
| Phase 2: Core conversion engine | Tested | PNG, JPEG, WebP, and BMP conversion paths are user-verified; user reports the requested automated tests and build checks passed |
| Phase 3: Batch processing | Tested | User verified batch queue, worker execution, progress, cancellation, failure isolation, large-image responsiveness, cleanup, individual downloads, ZIP extraction, and image integrity |
| Phase 4: Advanced formats | Tested | Completed; CI validation and user-run real-browser verification passed. Known format limitations remain documented |
| Phase 5: Image manipulation | Complete | Merged into `main`; project owner reports post-merge `npm test` and `npm run dev` checks passed on 2026-11-23. A separate post-merge production build result is not recorded |
| Phase 6: Image optimization and export workflow | Complete | Optimizer merged through PR #7; production Export UI integration merged through PR #9 on 2026-11-25. PR #9 reports 156/156 tests, successful build, successful integrated browser checks, and passing GitHub Actions. Metadata Management remains deferred |
| Phase 7: Testing and documentation | Complete and released | Phase 7 QA and documentation complete; GitHub release `v1.0.0` published on 2026-11-26 |

## Change log

### 2026-11-28 — Phase 8 Image to PDF UI foundation

- Status: UI foundation and contract mock committed on `phase-8-pdf-ui`; automated tests, production build, and browser verification remain pending.
- Created `phase-8-pdf-ui` from `main` at `098bc6c23d0d544c10d9b09e373f211bc719ee03`.
- Added a separate Image to PDF workspace with multi-image selection, drag-and-drop, stable queue entries, thumbnails, remove/clear/reorder controls, page preview, page settings, and responsive styles.
- Added an isolated mock for the approved `calculateImagePdfPageLayout()` and `createImagePdf()` UI contract. The mock simulates progress and cancellation but does not create or download a PDF.
- Preview positioning uses the layout helper's returned page and image geometry. No jsPDF dependency, image conversion service change, raster capability registry change, or PDF composition code was added.
- Transparency remains unavailable in the UI pending the two-independent-viewer verification gate.
- Added focused tests for mock page presets, orientation, Image Size at 96 PPI, margins, Fit/Fill geometry, and invalid layout inputs. These tests have not yet been executed.
- Added `docs/PHASE_8_PDF_UI.md` with scope, mock boundary, and browser verification checklist.
- Next: run `npm test`, `npm run build`, and browser checks locally; then continue real engine integration only after Andra's engine PR is merged into `main`.


### 2026-11-26 - v1.0.0 stable release published
- Status: Phase 7 QA and documentation are complete, and the first stable GitHub release `v1.0.0` has been published.
- Scope recorded as complete: cross-browser checks, mobile layout checks, large-image and memory checks, security review, advertised conversion-path verification, local-processing/network-transfer verification, production build check, README installation and usage instructions, screenshots, supported-format matrix, and known-limitations/browser-compatibility documentation.
- Release: [Images Format Converter v1.0.0](https://github.com/andra-gs/Images-Format-Converter/releases/tag/v1.0.0). Tag commit: `df882784d4bd18854067663191bc4b00dae5c0d5`.
- Release asset: `Images-Format-Converter-v1.0.0.zip` (1,767,000 bytes), SHA-256 `eed2ebda948193238bf5a0300c03f6d960db45e9e0ea74976d9b7ee4a8c58c41`.
- Release verification stated in the published release notes: 156/156 automated tests passed, production build succeeded, GitHub Actions checks passed, and integrated browser verification was reported complete. The release notes do not enumerate individual browser/device names or per-test outputs, so those details are not inferred here.
- Known issue: the previously recorded startup-skeleton theme mismatch remains separately tracked until a fix and retest are documented.
- Documentation synchronization only. No application code, tests, or production build were run by the assistant during this update.


### 2026-11-25 - Phase 6 merged and verified
- Status: Complete; PR #9 merged the production Export UI integration into `main` after optimizer PR #7.
- Integrated behavior: per-file JPEG/WebP Low/Medium/High presets and best-effort Target Size; `mode: none` for PNG, BMP, TIFF, GIF, and SVG; edited ImageData is passed to the optimizer without falling back to original pixels; animated GIF stays on the File-based path.
- Export results: validated optimizer Blob is stored once and reused by individual download and ZIP export. ZIP does not run optimization again. Result cards show actual source/output sizes, byte difference, percentage change, MIME type, and Target Size status.
- Verification reported in PR #9: `npm test` 156/156 passed; `npm run build` succeeded; integrated browser checks completed successfully; GitHub Actions checks passed.
- Build note: Vite continues to emit a non-fatal chunk-size advisory for the HEIC-related bundles (~3.2 MB each). The build completed successfully.
- Evidence: [PR #9](https://github.com/andra-gs/Images-Format-Converter/pull/9), merge commit `17bb59628660d31bad64bb16eebb5337d9bf44a6`.
- Verification boundary: these test/build/browser results were reported by the contributor in the PR. They were not independently rerun during this documentation update.

### 2026-11-25 - Documentation audit: outstanding UI issue
- Reviewed the last user-reported Phase 1 browser checklist. Custom dropdown padding, option selection, keyboard navigation, outside-click dismissal, theme switching, and absence of unstyled-content flash passed.
- The startup skeleton did not follow the selected theme and always appeared light. This remains a known issue after the v1.0.0 release and should be addressed and retested in a future maintenance update.

### 2026-11-25 - Production Image Optimizer wiring

- Status: Production integration code implemented on `phase-6-export-ui`; automated tests, production build, and real-browser verification have not yet been run after these changes.
- Git synchronization: created merge commit `82f7420` with `main` (`af254db`) as its second parent and the existing Export UI tree preserved. The compare endpoint now reports `main` as an ancestor of `phase-6-export-ui` (0 commits behind). No ref or file on `main` was changed.
- `src/js/main.js` now imports the real `optimizeImage()` and sends each export through `runExportWithOptimizer()` and the existing adapter.
- Each queue entry reads its own saved settings. Unedited sources use `entry.file`; edited sources use `{ file: entry.file, imageData }`. `buildExportOptions()` enforces `mode: "none"` for PNG, BMP, TIFF, SVG, and GIF.
- The existing sequential `for...of` queue remains intact. Each file is awaited and caught independently; progress, cancellation checks between files, and per-file failure reporting remain in the existing flow. `runIndependentExports()` is not used.
- Optimizer result Blobs are stored in `conversionResults`. Individual downloads use that Blob, and ZIP generation packages those same stored Blobs without running optimization again.
- Result cards now show original size, exported size, byte difference, percentage reduction/increase, output MIME type, and Target Size reached/not-reached status.
- Animated GIF continues through the optimizer's File-based conversion path. Edited ImageData to GIF remains explicitly rejected, matching the optimizer contract.
- Added result metric styling in `src/styles/components.css` and updated `docs/PHASE_6_OPTIMIZER_INTEGRATION_CHECKLIST.md` to distinguish implemented wiring from pending validation.
- Verification boundary: no claim is made that `npm test`, `npm run build`, or integrated browser tests passed after these edits. These checks must be run after the branch is pulled locally.

### 2026-11-25 - Optimizer synchronization and conflict-resolution checkpoint

- Status: Optimizer implementation files and API contract synchronized from `main` onto `phase-6-export-ui` through separate commits on the target branch.
- Added the exact optimizer module, API contract, optimizer documentation, automated test file, and three browser-harness files from the merged `main` state.
- Existing Export UI work, adapter, tests, and branch-specific development history were preserved.
- The three shared documentation files require manual reconciliation because both branches contain independent Phase 6 history. The branch's existing log and roadmap content is retained; optimizer status and implementation details are added without replacing the Export UI history.
- Andra reports real-browser verification of the optimizer is complete. This is recorded as owner-reported, not as a test executed by this contributor.
- No changes were made to `main`. Production integration in `main.js`, individual downloads, and ZIP per-file optimization are not yet completed.

### 2026-11-24 - Phase 6 Export UI and adapter verification

- Status: Stage 1 UI and Stage 2 adapter preparation passed user-run automated, build, and browser verification.
- Automated validation:
  - The user reported `npm test` completed successfully after the unsupported-format metadata validation error was fixed. The exact passing test count was not provided, so no count is recorded.
  - The user reported `npm run build` completed successfully.
- Browser validation (user-confirmed):
  - Export Optimization panel appears after an image is added.
  - JPEG/WebP controls display the correct optimization options; PNG/BMP/TIFF/GIF/SVG remain on No Optimization.
  - Output-format changes refresh the available controls.
  - Settings remain independent per image; changing or removing one image does not alter other images.
  - Light/dark themes display correctly.
  - No JavaScript Console errors were observed while using the panel.
- The build still reports the existing non-fatal Vite advisory for oversized HEIC-related chunks.
- Verification boundary: production optimizer output, individual-download optimization, and per-file ZIP optimization are not verified because the real optimizer is not yet integrated. The current per-file controls remain presentation-only.
- No shared conversion service, Queue, ZIP orchestration, or production optimizer code was changed in this verification update.


### 2026-11-23 - Phase 6 API integration preparation

- Status: Adapter and focused tests implemented; local verification pending.
- Re-read the approved optimizer contract on `main`.
- Added `src/js/ui/export-optimizer-adapter.js` to validate the UI-to-optimizer boundary without implementing optimization policy or connecting production conversion.
- Added `tests/export-optimizer-adapter.test.js` for source handoff, edited ImageData input, contract validation, actual size consistency, and negative reduction.
- Re-exported the adapter from `src/js/ui/export-panel.js` to preserve the existing test import path.
- No changes to shared conversion service, Editor, Queue, or ZIP orchestration. Production conversion, individual downloads, and ZIP remain unchanged.
- The legacy Image Quality slider still requires a decision with `andra-gs` before real integration.
- `npm test`, `npm run build`, and browser checks have not been run in this environment; the user must run them locally after pulling the branch.


Add newest entries first.

### 2026-11-23 - Phase 6 Export UI foundation

- Status: UI module foundation implemented; production integration and validation pending.
- Read the approved `docs/PHASE_6_OPTIMIZATION_API.md` contract from `main`.
- Added `src/js/ui/export-panel.js`, `src/styles/export-panel.css`, and `tests/export-panel.test.js` on `phase-6-export-ui`.
- Added per-file settings control primitives, JPEG/WebP-only preset and target-size options, explicit `mode: "none"` for unsupported formats, and validation of actual optimizer size metrics.
- Added a test-only mock optimizer handoff matching `optimizeImage(source, options)`; it does not replace or duplicate the real optimizer.
- Imported the new stylesheet from `src/styles/main.css`.
- The production conversion flow, individual downloads, and ZIP orchestration have not yet been changed. Wait for Andra’s optimizer PR to merge, then sync this branch and integrate the real API.
- `npm test` and `npm run build` have not been run in this environment.


### 2026-11-23 - Phase 6 Export UI kickoff and repository inspection

- Status: Planning and repository inspection complete; UI implementation not started.
- Owner: `FarrelPtrv`
- Branch: `phase-6-export-ui`
- Base commit: `eaa1c2db0361810aa0b522154c4ad522b4583cd2` (`main` at kickoff).
- Confirmed Phase 5 has been merged into `main`. The project owner reported post-merge `npm test` and `npm run dev` checks passed; no separate post-merge production build result was included.
- Reviewed `AGENTS.md`, `docs/DEVELOPMENT_ROADMAP.md`, `docs/PROJECT_CONTEXT.md`, and `docs/TECHNICAL_SPECIFICATION.md`.
- Inspected existing conversion settings, per-file conversion and download rendering, ZIP generation, shared theme tokens, responsive styles, and conversion-service entry points.
- Existing conversion UI currently has a single JPEG/WebP quality slider. Individual download links use the generated result Blob. ZIP export currently packages successful result Blobs already stored in the result map.
- Created `docs/PHASE_6_EXPORT_UI.md` with scope, repository findings, boundaries, pending API decisions, format expectations, and verification plan.
- No production UI, optimizer API, conversion-service, queue, or ZIP code was changed.
- API coordination with `andra-gs` is required before replacing the isolated UI mock with real optimizer integration.
- Next: agree on the optimizer API and capability/result contract; then implement the Export Settings UI and focused tests using a temporary mock only.

### 2026-11-22 - Latest Phase 5 verification after HEIC/TIFF queue thumbnail fix

- Status: User-reported automated tests, production build, and manual browser checks passed on the latest `phase-5-editor-ui` state.
- Automated tests:
  - `npm test`: 98 tests passed, 0 failed, 0 cancelled, 0 skipped, 0 todo.
  - Test duration: approximately 627 ms.
- Production build:
  - `npm run build`: successful.
  - Vite transformed 2,168 modules and completed in 3.73 seconds.
  - Vite emitted its advisory warning for chunks larger than 500 kB; the two HEIC-related chunks are approximately 3.23 MB each before gzip. This is not a build failure.
- Manual browser verification previously reported for this latest implementation:
  - HEIC and TIFF queue thumbnails and Editor previews appear.
  - PNG, JPEG, and WebP queue thumbnails appear and remain usable.
  - Apply edits works.
  - A short image-loading delay was observed, with no functional failure reported.
- Verification boundary: all local command results and browser checks above were reported by the user; they were not independently executed in this environment.
- Remaining work: final PR review and merge approval, followed by agreed post-merge verification. Do not merge without explicit approval.

### 2026-11-22 - HEIC/TIFF queue thumbnail browser verification

- Status: User-reported manual browser verification passed for all six Editor checks.
- Branch: `phase-5-editor-ui`
- The user confirmed:
  - HEIC enters the queue and its thumbnail appears; the Editor preview appears.
  - TIFF enters the queue and its thumbnail appears; the Editor preview appears.
  - PNG opens and its queue thumbnail appears.
  - JPEG opens and its queue thumbnail appears.
  - WebP opens and its queue thumbnail appears.
  - Editor successfully runs Apply edits.
- Observed behavior:
  - The user noticed a short loading delay while images are loaded. This is expected to be possible because the queue now decodes source images and rasterizes thumbnails; it was not reported as a failure.
- Verification boundary:
  - These six checks are user-reported manual browser results.
  - The user later reran `npm test` and `npm run build` after the thumbnail implementation; both passed. See the latest verification entry below.
- Next steps:
  - Check the latest GitHub Actions results and rerun local automated tests/build if needed.
  - Treat thumbnail-loading performance as a separate optimization only if the delay is noticeably disruptive.


### 2026-11-22 - Phase 5 Editor integration verification

- Status: Feature implementation and user-reported local verification complete on `phase-5-editor-ui`; final PR review and merge pending.
- Branch: `phase-5-editor-ui`
- Integration:
  - Connected the selected queued File to the Decoder and ImageData adapter.
  - Connected the processing adapter to the real Transformer and Adjuster modules in Transform → Adjust order.
  - Connected Apply, processed preview, and Reset behavior.
  - Connected edited ImageData to the existing conversion service for PNG, JPEG, WebP, BMP, TIFF, and SVG.
  - Preserved the original File-based conversion path and existing Worker orchestration. Animated GIF remains on its File-based path to preserve animation.
- Verification reported by the user:
  - `npm test`: 86 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo.
  - `npm run build`: successful; Vite transformed 2,166 modules and completed in 5.57 seconds.
  - Browser integration: Editor successfully processed an image and produced the expected result.
  - Browser regression: existing conversion features continued working.
- Known build warning: HEIC-related chunks remain approximately 3.23 MB each before gzip; Vite's chunk-size warning did not fail the build.
- Remaining work: perform final branch/diff review, open and review the Pull Request to `main`, merge according to team rules, then rerun the agreed post-merge tests and browser checks. Do not begin Phase 6 before integration is complete.


### 2026-11-21 - Fix Editor queue selection ID mismatch

- Status: Fix implemented; local verification pending
- Branch: `phase-5-editor-ui`
- Diagnosis:
  - Queue entry IDs are numeric, but `HTMLSelectElement.value` always returns a string.
  - The Editor previously compared these values with strict equality, so selecting an item could fail to resolve its queue entry and clear the preview.
- Changes:
  - Added `findEditorQueueEntry()` to normalize IDs during lookup.
  - Updated Editor selection changes to use the normalized lookup.
  - Explicitly assigns the selected option value as a string.
  - Added automated coverage for numeric IDs resolved from string select values.
- Validation:
  - The user retested the preview with two queued images: the first image appeared, selecting the second updated the preview, and selecting the first again restored its preview.
  - The user reported no new browser Console errors.
  - Preview selection behavior is user-confirmed; full processing-module integration remains pending.

### 2026-11-21 - Queue to Editor Custom Event bridge

- Status: Implemented; automated and browser verification pending
- Branch: `phase-5-editor-ui`
- Changes:
  - Added `ifc:queue-change` as the explicit Queue → Editor communication event.
  - Added `createEditorQueueSnapshot()` to publish only the queue identifier, file name, original File reference, detected format, and preview object URL.
  - Updated `main.js` to dispatch queue snapshots after add, remove, and clear operations.
  - Updated `image-editor.js` to consume event payloads and removed its DOM-based Queue reader and MutationObserver.
  - Kept the existing File/Blob conversion path and Worker orchestration unchanged.
  - Added `tests/editor-queue-events.test.js` for the event snapshot contract.
- Resource ownership:
  - The Queue retains ownership of each original File and its preview object URL.
  - The Editor only holds references from the latest snapshot; it does not revoke Queue URLs or close decoder resources.
- Validation:
  - Tests and production build have not been run in this environment after these changes.
  - Browser checks for add, remove, clear, and selection behavior are pending.
- Remaining work:
  - Verify the event bridge locally with `npm test` and `npm run build`.
  - Manually test Queue add/remove/clear and Editor selection behavior.
  - Connect selected File → Decoder → ImageData adapter in a subsequent integration step; keep Apply disabled until processing modules and the full edited-pixel route are ready.

### 2026-11-21 - Browser regression check

- User manually confirmed the app opens without errors.
- Existing standard image conversion continues to work.
- Editor panel remains visible and Apply remains disabled as expected.
- This verifies the current UI scaffold and existing conversion regression only; edited-pixel end-to-end processing still awaits the Transformer and Adjuster modules.

### 2026-11-21 - Edited ImageData conversion verification

- Status: Automated tests and production build passed; browser integration verification pending
- Tests reported by the user on `phase-5-editor-ui`:
  - `npm test`: 51 passed, 0 failed, 0 cancelled, 0 skipped. This includes four tests for the edited ImageData conversion entry point.
  - `npm run build`: Vite production build succeeded, transforming 2,163 modules in 4.22 seconds.
- Known warning:
  - Vite continues to report two HEIC-related chunks of approximately 3.23 MB each before gzip. The warning does not fail the build and remains a separate optimization task.
- Remaining work:
  - Perform browser regression checks for the existing converter and editor scaffold.
  - Browser-test the edited ImageData handoff with real processing modules once Transformer and Adjuster are available.
  - Keep Apply disabled until the complete editing pipeline and UI handoff are integrated and verified.

### 2026-11-21 - Edited ImageData conversion handoff

- Status: Implemented; new automated tests pending local execution
- Branch: `phase-5-editor-ui`
- Changes:
  - Refactored the direct conversion path to share `encodeAndValidateImage()` for encoding, output signature detection, output re-decoding, dimension verification, and verification-resource cleanup.
  - Added `convertImageDataToFormat(imageData, format, options)` to accept the edited sRGB ImageData representation without decoding the original File again.
  - The new entry point copies ImageData into a temporary Canvas-backed source, reuses the existing `encodeImage()`, and releases the temporary Canvas in a `finally` block.
  - Preserved the existing File/Blob conversion API and Worker routing.
  - Limited edited-ImageData output to PNG, JPEG, WebP, BMP, TIFF, and SVG, which are supported by the current image encoder. Animated GIF remains on its existing File-based path because it has separate animation-preservation behavior.
  - Added `tests/edited-image-conversion.test.js` for the edited-pixel handoff, output dimension verification, invalid ImageData, and GIF limitation.
  - Updated the technical specification and Phase 5 editor documentation.
- Validation:
  - The new tests have been added but have not yet been run locally.
  - The previous user-reported 47/47 test result and production build apply to the branch state before these changes; they must be rerun.
- Remaining work:
  - Run `npm test` and `npm run build` on this branch and address any failures.
  - After test results are confirmed, connect the editor's processed ImageData to the new service entry point when the Transformer and Adjuster modules are available.
  - Keep Apply disabled until the real processing modules, UI handoff, and end-to-end behavior are integrated and verified.

### 2026-11-21 - Phase 5 editor scaffold verification

- Status: Scaffold and adapter preparation verified; final image-processing integration remains in progress.
- Tests performed by the user on branch `phase-5-editor-ui`:
  - Ran `npm test`: 47 tests passed, 0 failed, 0 cancelled, 0 skipped, and 0 todo.
  - Ran `npm run build`: Vite production build completed successfully in 5.05 seconds after transforming 2,163 modules.
  - Reported that the application opens without errors, existing converter features continue to work, the editor panel does not break the layout, editor controls are usable, Apply remains disabled as intended, and the browser console has no red errors.
- Build note:
  - Vite emitted a warning for minified chunks larger than 500 kB. The largest HEIC-related chunks were approximately 3.23 MB each before gzip. This is an optimization warning; the build itself succeeded.
- Test interpretation:
  - The 47 passing automated tests verify the available code and adapter behavior, including injected Transform → Adjust sequencing. They do not establish that the real Transformer and Adjuster modules are integrated.
  - Browser checks are recorded as user-reported results and were not independently run in this environment.
- Remaining work:
  - Integrate the real processing modules after their PRs are merged into `main`.
  - Complete the edited-pixel handoff and preview/Apply integration while preserving the existing conversion service's output validation.
  - Repeat automated and browser regression checks after integration.
  - Consider a separate bundle-size optimization for the HEIC-related chunks.

### 2026-11-21 - Phase 5 shared ImageData adapter preparation

- Status: Adapter and documentation scaffold implemented; automated test execution, production build, and browser verification pending.
- Recorded the team's final shared sRGB ImageData contract in the Technical Specification and Phase 5 editor notes.
- Updated the editor draft state to use the agreed `transformations` and `adjustments` groups.
- Reworked `image-processing-adapter.js` to validate ImageData and dimension limits, copy decoder pixels into an owned pixel buffer, release its temporary canvas, and create a caller-owned Canvas result from ImageData.
- Added dependency injection for the Transformer and Adjuster functions. The adapter preserves Transform → Adjust ordering, validates each `{ imageData, width, height }` result, checks cancellation between stages, and wraps unexpected internal failures as `ImageProcessingError`.
- Kept all capabilities unavailable until both processing functions are supplied and Apply disabled until the decoded-image handoff and final conversion integration are connected. Updated the disabled Apply handler to use the adapter's object-shaped request.
- Updated the Phase 5 roadmap wording to reference the agreed contracts without marking unimplemented processing features complete.
- Automated tests were expanded for shared state, pixel validation, limits, decoder copying, canvas cleanup, processing order, output validation, placeholder behavior, and cancellation. Tests were not run in this environment.
- Existing conversion service, decoder, encoder, Worker orchestration, queue, and ZIP exporter were not modified.
- Next: inspect and integrate the two processing modules after their PRs are merged; coordinate a lossless edited-pixel handoff that retains the existing conversion service's output validation.

### 2026-11-21 - Phase 5 editor UI scaffold and placeholder adapter

- Status: Implemented scaffold; automated test, production build, and browser verification pending.
- Confirmed the three Phase 5 branches exist. At session start, the transformation and adjustment branches were identical to `main`; their assigned processing modules were not present.
- Added the FarrelPtrv editor workspace on `phase-5-editor-ui`.
- Added an original-image preview linked to the existing selected-file queue and draft controls for resize, crop coordinates, rotation, flips, brightness, contrast, saturation, blur, grayscale, and sepia.
- Added a temporary processing adapter that explicitly reports all processing capabilities as unavailable. The Apply action remains disabled; the preview remains the original image.
- Added responsive editor styles, adapter unit tests, and `docs/PHASE_5_EDITOR_UI.md`.
- Preserved editor draft state when unrelated files are added to or removed from the queue.
- Existing conversion service and conversion orchestration were not modified.
- Tests/build/browser checks were not run in this environment. Run `npm test`, `npm run build`, and browser checks in a local checkout before considering the scaffold verified.
- Next: agree on shared input/output, processing order, error behavior, and resource ownership with both processing-module owners; replace the placeholder only after their modules are integrated.


### 2026-11-21 - Phase 5 Image Transformation verification and CI results
- Status: Processing module tested; real-image browser verification and full repository CI passed (user-confirmed browser/local checks and GitHub Actions).
- Implementation:
  - Added `applyImageTransformations(imageData, transformations)` with crop, resize, rotation, and horizontal/vertical flip operations using the shared sRGB ImageData representation.
  - Preserved input immutability and used premultiplied-alpha interpolation during resize to reduce transparent-edge artifacts.
  - Added dimension, pixel-count, option, and crop-bound validation.
  - Added 16 focused Image Transformer unit tests and a real-image browser harness.
- Verification:
  - The user confirmed the browser harness produces the expected results with real image files.
  - The user ran `npm test`: 50 tests passed, 0 failed, 0 cancelled, and 0 skipped.
  - The user ran `npm run build`: Vite production build completed successfully.
  - GitHub Actions for PR #3 completed successfully. Dependency installation, all 50 tests, and the production build passed.
- Build note:
  - Vite reports the existing HEIC-related chunks exceed the 500 kB advisory threshold. This is a bundle-size warning, not a build failure.
- Verification boundaries:
  - These results validate the standalone Transformer module and its browser harness. They do not validate the integrated editor or the complete editing-to-conversion workflow.
- Remaining work:
  - Integrate the Transformer and Adjuster modules through the Editor UI branch.
  - Run end-to-end browser checks after editor integration.

### 2026-11-20 - Animated GIF conversion implementation

- Status: Implemented; dependency and real-browser verification pending.
- Evaluation:
  - Selected modern-gif 2.1.0, an MIT-licensed JavaScript GIF decoder/encoder with a documented Worker entry point and one runtime dependency, modern-palette 2.0.0.
  - Kept gifuct-js 2.1.2 for the existing first-frame-only GIF-to-static conversion path.
- Agreed behavior implemented:
  - GIF-to-GIF decodes all composited frames and re-encodes them in order.
  - Frame delays and looping metadata are passed through to the encoder.
  - Static image inputs produce a single-frame GIF.
  - GIF-to-static formats continue to use only the first image frame.
  - Animated GIF to animated WebP/APNG remains out of scope.
- Safety and resource limits:
  - Maximum 200 frames.
  - Maximum 16,384 pixels per dimension and 40 million pixels per individual frame.
  - Maximum 25 million logical-screen pixels across the complete animation.
  - Static source pixels are copied to an owned buffer before the decoded source and temporary canvas are released.
- Implementation:
  - Added `src/js/core/animated-gif.js`.
  - Integrated GIF conversion into the conversion service and main output selector.
  - Added GIF filename handling and user-facing compatibility notes.
  - Updated the capability registry and its automated expectations.
  - Added a Node test for animated GIF round-tripping, frame count, timing, transparency, and looping metadata.
  - Updated README, Project Context, Technical Specification, and Roadmap.
- Files changed:
  - `package.json`, `package-lock.json` (root dependency declaration only; full npm lock resolution is still required)
  - `src/js/core/animated-gif.js`, `src/js/core/conversion-service.js`, `src/js/main.js`, `src/js/core/capability-registry.js`, `index.html`
  - `tests/capability-registry.test.js`
  - `README.md`, `docs/PROJECT_CONTEXT.md`, `docs/TECHNICAL_SPECIFICATION.md`, `docs/DEVELOPMENT_ROADMAP.md`, `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Reviewed the modern-gif API and its decoder/encoder source implementation.
  - No npm install, automated test run, production build, or real-browser animated GIF test has been run in this environment.
- Known issues:
  - The package lock needs a full npm-generated resolution for modern-gif and modern-palette. Run `npm install` after pulling before using the app.
  - Transparency, disposal, looping, frame delays, Worker fallback, and large-animation memory behavior still require real-file verification.
- Next steps:
  - Run `npm install`, `npm test`, and `npm run build`.
  - Test animated GIF-to-GIF with multiple frames, partial-frame updates, transparency, disposal methods, finite/infinite looping, and varying frame delays.
  - Test static PNG/JPEG/WebP/BMP/TIFF/HEIC/SVG inputs to GIF.
  - Test GIF-to-PNG/JPEG/WebP/BMP/TIFF/SVG to confirm first-frame behavior remains unchanged.
  - Verify individual downloads, ZIP export, Worker execution, and fallback behavior.

### 2026-11-20 - Raster-to-SVG output verification and documentation sync

- Status: Tested; user-confirmed.
- Tests performed by the user:
  - Verified conversion of transparent and opaque raster images to SVG.
  - Confirmed SVG dimensions match the source.
  - Re-uploaded generated SVG and converted it back to PNG successfully.
  - Confirmed individual SVG downloads and ZIP export work.
  - Confirmed light and dark themes remain functional.
  - Ran `npm test` and `npm run build`; both completed successfully.
- Test results:
  - Raster-to-SVG wrapper output is now user-verified. SVG output embeds PNG data and is not true vectorization.
  - Phase 4 remains in progress because animated GIF evaluation/handling and format-specific error/compatibility notes remain open.
- Documentation synchronized:
  - Updated README, Development Roadmap, Development Log, Project Context, and Technical Specification to reflect verified SVG output behavior.
- Next steps:
  - Evaluate animated GIF decoding and encoding options before selecting an implementation.
  - Add format-specific error messages and compatibility notes.



### 2026-11-19 - Initial safe SVG rasterization

- Added a browser-side SVG sanitizer that parses XML without inserting untrusted markup into the live document.
- The sanitizer keeps a restricted set of vector shapes, text, gradients, and local clipping/mask references.
- It removes scripts, event-handler attributes, style blocks/attributes, external links, embedded images, foreignObject content, animation, and unsupported elements.
- DOCTYPE and entity declarations are rejected. SVG dimensions must be numeric or derivable from a valid viewBox, with per-dimension and pixel-count limits.
- The sanitized SVG is rasterized through createImageBitmap with an HTMLImageElement fallback.
- SVG source conversion runs on the main thread because safe parsing depends on browser DOMParser/XMLSerializer. Other formats retain their existing Worker path.
- Added a malicious-content browser fixture and included SVG in the browser decoder test page.
- SVG remains marked planned in the capability registry until real browser decoding and conversion checks pass.
- Verification pending: run automated tests/build, decode the sanitizer fixture, confirm removed active/external content, test valid SVG variants, convert to each supported raster output, and verify downloads and dimensions.



### 2026-11-19 - TIFF output real-file verification

- User confirmed that all TIFF output checks passed.
- Confirmed source-to-TIFF conversions: PNG, JPEG, WebP, BMP, HEIC/HEIF, and TIFF.
- User confirmed generated TIFF files open correctly and produce the expected dimensions and visual output.
- Worker conversion, individual downloads, and ZIP export were included in the successful checks.
- Baseline TIFF output is therefore user-verified. The encoder remains uncompressed and does not preserve source metadata or write multiple pages.
- Next task: implement safe SVG rasterization. SVG input must be sanitized, must not load external resources, and must not inject untrusted markup into the live document.



### 2026-11-19 - TIFF input verification and baseline TIFF encoder

- TIFF input status: Tested, based on user-reported real-file checks.
- User-confirmed TIFF checks:
  - Single-page and multi-page TIFF behavior, with the adapter intentionally using the first page.
  - Grayscale and RGB files.
  - LZW, Deflate, and PackBits files where available.
  - Main-interface conversion to PNG, JPEG, WebP, and BMP.
  - Web Worker conversion.
  - Output dimensions, image opening, and expected visual results.
- Encoder evaluation:
  - Selected the existing UTIF2 4.1.0 dependency. Its documented `encodeImage(rgba, width, height)` API returns a TIFF ArrayBuffer.
  - The encoder currently writes uncompressed TIFF data. It does not provide compression options through this API.
  - Reusing UTIF2 avoids adding another TIFF library or dependency.
  - This is a baseline raster TIFF output path, not a feature-complete TIFF writer. Compression selection, metadata preservation, and multi-page output are not included.
- Implementation:
  - Added TIFF encoding through UTIF2 using RGBA pixels read from OffscreenCanvas or HTML Canvas.
  - Added TIFF output to the capability registry, conversion service, Web Worker, and output-format selector.
  - Added an automated test that reopens the generated TIFF with UTIF2 and checks its dimensions and pixel buffer length.
- Verification still required:
  - Run `npm ci`, `npm test`, and `npm run build`.
  - Convert real PNG, JPEG, WebP, BMP, HEIC/HEIF, and TIFF sources to TIFF.
  - Open the generated TIFF files in an independent image viewer.
  - Verify dimensions, orientation, color, transparency behavior, MIME type, downloads, and Worker execution.
  - Confirm that the larger uncompressed TIFF file size is clearly communicated.
- Next steps:
  - Complete real-file verification of TIFF output.
  - Continue with safe SVG rasterization after TIFF output is stable.


### 2026-11-18 - HEIC/HEIF verification and TIFF decoder adapter
- HEIC/HEIF status: Tested, based on user-reported browser results.
- User-confirmed HEIC/HEIF checks:
  - Browser decoder test produced the expected result.
  - Main application conversion produced the expected result.
  - Web Worker conversion produced the expected result.
- HEIC and HEIF decoding are now marked implemented in the capability registry. Encoding remains not planned.
- TIFF decoder evaluation:
  - Selected UTIF2 4.1.0 for the first TIFF decoder integration. Its documented API decodes TIFF IFDs and converts the first decoded page to 8-bit RGBA. Its documentation lists grayscale, RGB, palette, Fax 3/4, JPEG, LZW, PackBits, and additional compression support.
  - The adapter reads the first IFD only and renders it to Canvas so the existing conversion pipeline can process the result. Multi-page selection and TIFF output encoding are not included.
- Changes:
  - Added UTIF2 as a dependency.
  - Added TIFF decoding through the dedicated adapter, including Canvas rendering and resource cleanup.
  - Extended the browser decoder test page to accept TIFF files.
  - Added capability-registry tests for verified HEIC/HEIF and planned TIFF status.
  - Kept TIFF decoding planned until real-file browser and Worker verification passes.
- Tests performed:
  - HEIC/HEIF decoder, main conversion, and Worker tests were user-confirmed.
  - TIFF implementation has not yet been run through npm tests, production build, or real TIFF fixtures.
- Next steps:
  - Run npm install to update package-lock.json, then npm test and npm run build.
  - Test real single-page TIFF files with common compression variants.
  - Test multi-page TIFF and confirm the first page is used.
  - Convert TIFF files to PNG, JPEG, WebP, and BMP through the main interface and Worker.
  - Verify dimensions, orientation, color, transparency where applicable, MIME types, output files, and downloads.



### 2026-11-18 - HEIC/HEIF decoder adapter
- Status: Implemented, pending real-file verification
- Evaluation:
  - Selected `heic-to` version 1.6.7. Its published documentation describes browser-side HEIC/HEIF conversion, a bitmap output, and a worker-specific `heic-to/next` entry. The package tracks libheif releases.
  - Native `createImageBitmap` remains the first decoding path. The WebAssembly decoder is the fallback for browsers without native HEIC/HEIF support.
- Changes:
  - Added `heic-to` to package dependencies.
  - Added HEIC/HEIF decoding fallback to the shared image decoder.
  - Selected the worker-specific package entry when running inside the conversion worker.
  - Extended the browser decoder test page to accept HEIC and HEIF fixtures.
  - Kept HEIC/HEIF capability status as planned until real files pass.
  - Updated project documentation and advanced-format roadmap.
- Files changed:
  - `package.json`
  - `src/js/core/image-decoder.js`
  - `src/js/core/capability-registry.js`
  - `tests/browser-decoder.html`
  - `README.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
  - `docs/PROJECT_CONTEXT.md`
- Tests performed:
  - Reviewed package API documentation and worker entry-point instructions.
  - No dependency installation, automated test, production build, or real-file browser test has been run for this change.
- Known issues:
  - Real HEIC and HEIF files still need to be tested.
  - The package's WebAssembly decoder increases the application bundle and memory use when loaded.
  - HEIC/HEIF must not be advertised as supported until real-file verification passes.
  - The existing `package-lock.json` does not yet include heic-to. Run `npm install` and commit the refreshed lockfile.
- Next steps:
  - Run `npm install` to synchronize `package-lock.json`, then run `npm test` and `npm run build`.
  - Test at least one real HEIC and one real HEIF file using `/tests/browser-decoder.html`.
  - Convert both formats to PNG, JPEG, WebP, and BMP in the main application.
  - Verify dimensions, orientation, color, output MIME types, downloads, and worker/main-thread fallback.


### 2026-11-18 - Phase 3 completion verified by user
- Status: Tested
- Tests performed by the user:
  - Verified batch queue, per-file states, progress, and sequential worker processing.
  - Verified failure isolation, cancellation, large-image responsiveness, and resource cleanup.
  - Verified individual downloads and ZIP downloads.
  - Extracted the ZIP archive and confirmed that all included images open correctly.
- Test results:
  - The user reports all Phase 3 tests behaved as expected.
  - Phase 3 is complete.
- Next steps:
  - Begin Phase 4 with HEIC/HEIF decoder evaluation and integration.

### 2026-11-18 - ZIP export implementation
- Status: Implemented, pending user verification
- Changes:
  - Added JSZip as an application dependency.
  - Added a Download all as ZIP action to the conversion results panel.
  - Included only successfully converted outputs in the archive.
  - Added duplicate filename handling with numeric suffixes.
  - Used ZIP STORE mode to avoid spending additional CPU time compressing already encoded image files.
  - Added accessible archive-generation status text and disabled the action while the archive is being created.
  - Kept individual image download links available.
- Files changed:
  - `package.json`
  - `index.html`
  - `src/js/main.js`
  - `src/styles/components.css`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `README.md`
- Tests performed:
  - Reviewed the ZIP flow, successful-result filtering, duplicate filename handling, and cleanup of the temporary archive Object URL.
  - Dependency installation, automated tests, production build, and browser ZIP extraction have not yet been verified.
- Test results:
  - Implementation committed to `main`.
  - `package-lock.json` must be refreshed by running `npm install` after pulling the update.
- Known issues:
  - ZIP generation runs on the main thread. STORE mode avoids compression work, but archive assembly still uses browser memory.
  - ZIP download and archive integrity need user verification.
- Next steps:
  - Pull `main`, run `npm install`, `npm test`, and `npm run build`.
  - Test ZIP downloads with multiple successful files, duplicate output names, mixed successful and failed conversions, and a single successful result.
  - Extract the downloaded archive and confirm each image opens.


### 2026-11-18 - User verification of Phase 3 batch processing
- Status: Tested
- Tests performed by the user:
  - Verified that multiple images enter the queue.
  - Verified per-file queue states and batch progress.
  - Verified that a failed file does not stop other conversions.
  - Verified cancellation after the active file finishes.
  - Verified large-image processing keeps the interface responsive.
  - Verified file removal, Clear all, and resource cleanup.
  - Verified converted files can be downloaded and opened.
  - User reported that all requested Phase 3 tests behaved as expected.
- Test results:
  - Phase 3 batch and worker foundation is user-verified.
  - ZIP export is the remaining Phase 3 item and has been implemented separately; its tests are pending.
- Next steps:
  - Install JSZip and refresh `package-lock.json`.
  - Run `npm test` and `npm run build`.
  - Verify ZIP extraction and image integrity in the browser.

### 2026-11-18 - Phase 3 batch processing foundation

- Status: Implemented; browser verification and automated test/build run pending
- Changes:
  - Added visible per-file states: pending, processing, completed, failed, and cancelled.
  - Added an indeterminate per-file processing indicator and overall batch completion progress.
  - Added a cancel-remaining action. The active conversion is allowed to finish; queued files are marked cancelled.
  - Added a module Web Worker for PNG, JPEG, WebP, and BMP conversion.
  - Added feature detection for Worker, OffscreenCanvas, and createImageBitmap.
  - Added main-thread fallback for browsers without the required worker capabilities or when worker conversion cannot complete, preserving HTML image and Canvas fallback APIs.
  - Kept concurrency at one job at a time to limit memory pressure.
  - Added worker cleanup on application unload.
  - Kept decoded image cleanup and output Object URL cleanup in the conversion lifecycle.
- Files changed:
  - `src/js/main.js`
  - `src/js/core/conversion-service.js`
  - `src/js/workers/conversion.worker.js`
  - `index.html`
  - `src/styles/components.css`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `README.md`
- Remaining Phase 3 work:
  - Add ZIP download for completed outputs using JSZip.
  - Verify worker processing, main-thread fallback, status transitions, cancellation behavior, and memory cleanup in a real browser.
  - Run `npm test` and `npm run build`.
- Known behavior:
  - Cancellation does not interrupt the active image operation. It finishes the current file and skips the remaining queued files.
  - The queue processes one file at a time.
  - ZIP export is not implemented yet.

### 2026-11-18 - BMP output verified with real files

- Status: User-confirmed browser verification
- User-confirmed checks:
  - PNG, JPEG, WebP, and BMP inputs convert to BMP.
  - Transparent areas become white.
  - Generated files open successfully.
  - Output dimensions match the source.
  - The output filename uses the BMP extension (the user typed ".bpm"; this is recorded as ".bmp" based on the stated BMP output format).
- Remaining checks:
  - Confirm the output MIME type is `image/bmp`.
  - Run `npm test` and `npm run build` after the BMP implementation.
- Phase 2 is functionally complete for the currently implemented PNG, JPEG, WebP, and BMP paths, pending the automated test/build run.

### 2026-11-18 - Dedicated BMP encoder implementation

- Status: Implemented; real-file browser verification pending
- Changes:
  - Added a dedicated 24-bit Windows BMP encoder using browser Canvas pixel data.
  - Writes the BMP file header and 40-byte DIB header.
  - Stores pixel rows bottom-up in BGR order and applies 4-byte row alignment.
  - Composites transparent pixels onto white because 24-bit BMP does not contain an alpha channel.
  - Added BMP conversion service integration and enabled BMP in the main output dropdown.
  - Added automated tests for BMP headers, dimensions, BGR pixel order, row padding, alpha compositing, and HTML Canvas fallback.
  - Updated the capability registry, README, technical specification, and roadmap.
- Files changed:
  - `src/js/core/image-encoder.js`
  - `src/js/core/conversion-service.js`
  - `src/js/core/capability-registry.js`
  - `src/js/main.js`
  - `index.html`
  - `tests/image-encoder.test.js`
  - `tests/capability-registry.test.js`
  - `README.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Added unit tests for BMP byte layout and the Canvas fallback.
  - The full automated test suite and production build have not yet been run after this change.
  - Real-file browser conversion has not yet been verified.
- Test results:
  - Implementation and tests are committed to `main`.
  - BMP must remain pending final verification until the user tests real files in the browser.
- Known limitations:
  - BMP output uses 24-bit color and does not preserve transparency. Transparent pixels become white.
  - Large images may require substantial memory while the BMP pixel buffer is created.
- Next steps:
  - Run `npm test` and `npm run build`.
  - Test PNG, JPEG, WebP, and BMP inputs converted to BMP in the main UI.
  - Confirm the output opens correctly, dimensions match, MIME type is `image/bmp`, and download uses the `.bmp` extension.
  - Test a transparent PNG and confirm transparent pixels become white.

### 2026-11-18 - WebP conversion verified and enabled in the main interface

- Status: Tested; user-confirmed real-file browser verification
- User-confirmed checks:
  - PNG, JPEG, WebP, and BMP inputs convert successfully to WebP.
  - PNG transparency remains intact.
  - Quality adjustment works.
  - The output MIME type is exactly `image/webp`.
  - Output dimensions match the source image.
  - The output preview displays correctly.
  - Download produces a `.webp` file.
  - Browsers without WebP encoding support show a clear error.
- Repository changes:
  - Marked WebP encoding as `implemented` in the capability registry.
  - Enabled WebP in the custom output-format dropdown.
  - Connected the main conversion action to `convertImageToWebp()` and passed the selected quality value.
  - Added the `.webp` output extension.
  - Updated capability-registry test expectations.
  - Updated README, Technical Specification, and Development Roadmap.
- Automated validation confirmed by the user after enabling WebP in the main interface:
  - `npm test`: 25 passed, 0 failed, 0 skipped.
  - `npm run build`: successful with Vite 7.3.8; 2,109 modules transformed.
  - Main-interface browser checks: WebP selectable; PNG, JPEG, WebP, and BMP sources convert; quality control works; preview and `.webp` download work; PNG transparency is preserved.
- Remaining limitations:
  - BMP output encoding is not implemented.
  - Browser support for WebP encoding varies. Unsupported browsers receive an explicit conversion error.

### 2026-11-18 - Initial WebP encoder and conversion integration

- Status: Implemented; real-browser verification pending
- Changes:
  - Extended the shared Canvas encoder to request WebP output and pass the quality setting to OffscreenCanvas and HTML Canvas.
  - Required the final Blob MIME type to be exactly `image/webp`; the conversion fails if the browser returns another format.
  - Added `convertImageToWebp()` with the shared signature, output-decoding, dimension, and resource-cleanup validation.
  - Added a standalone browser encoder test page with JPEG/WebP selection, a quality slider, output preview, and download.
  - Kept WebP encoding in the planned state in the capability registry and marked the dropdown option as `Testing`; it remains unavailable in the main converter until real-browser verification passes.
  - Kept BMP output disabled.
  - Added automated tests for OffscreenCanvas WebP encoding, HTML Canvas fallback, MIME mismatch rejection, and quality validation.
  - Updated README, Technical Specification, and Roadmap.
- Tests performed:
  - Automated tests have been added but have not yet been run by the user after this implementation.
  - Real-file browser verification is pending.
- Next steps:
  - Run `npm test` and `npm run build`.
  - Open `/tests/browser-encoder.html`, select WebP output, and test PNG, JPEG, WebP, and BMP source files.
  - Verify MIME type, quality changes, dimensions, preview, and `.webp` download.
  - Confirm unsupported browser WebP encoding produces a clear per-file error. Enable WebP in the main interface only after these checks pass.

### 2026-11-18 - JPEG conversion verified and enabled in the main interface

- Status: Tested; user-confirmed real-file browser verification
- User-confirmed checks:
  - PNG, JPEG, WebP, and BMP inputs convert successfully to JPEG.
  - Transparent areas in PNG sources become white in the JPEG output.
  - The quality setting produces valid output.
  - The output MIME type is `image/jpeg`.
  - Output dimensions match the source image.
  - The output preview displays correctly.
  - The `.jpg` download works.
- Repository changes:
  - Marked JPEG encoding as `implemented` in the capability registry.
  - Enabled JPEG in the custom output-format dropdown.
  - Connected the main conversion action to `convertImageToJpeg()` and passed the selected quality value.
  - Made result filenames, format labels, and download labels depend on the actual output format.
  - Updated README, Technical Specification, and Development Roadmap.
  - Updated capability-registry tests to expect PNG and JPEG as available output formats.
- Test status:
  - Real-browser JPEG checks were confirmed by the user.
  - `npm test` and `npm run build` must still be rerun after these repository changes. Do not treat the earlier 17/17 test result as validation of the latest commit.
- Remaining limitations:
  - JPEG background is currently fixed to white in the main interface.
  - WebP and BMP output remain unavailable.


### 2026-11-18 - Initial JPEG encoder and conversion service

- Status: Implemented; real-browser verification pending
- Changes:
  - Extended the shared image encoder to support JPEG alongside PNG.
  - Added JPEG quality handling using a normalized value from 0 to 1.
  - Added explicit background compositing before drawing the source image. The default background is white (`#ffffff`) because JPEG does not support transparency.
  - Kept OffscreenCanvas as the preferred path and added HTML Canvas fallback when OffscreenCanvas is unavailable, throws, or returns the wrong MIME type.
  - Required the final JPEG Blob to use the exact `image/jpeg` MIME type.
  - Refactored the conversion service to share output signature validation, output re-decoding, dimension checks, and resource cleanup between PNG and JPEG.
  - Added unit tests for JPEG quality, background compositing, fallback behavior, MIME mismatch fallback, invalid settings, and empty output.
  - Added a standalone browser test page at `/tests/browser-encoder.html` for real-file validation before enabling JPEG in the main interface.
- Files changed:
  - `src/js/core/image-encoder.js`
  - `src/js/core/conversion-service.js`
  - `tests/image-encoder.test.js`
  - `tests/browser-encoder.html`
  - `tests/browser-encoder.js`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `README.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Added automated tests. They have not yet been run in the user's local environment.
  - Added a browser test page. Real-file browser validation is pending.
- Known limitations:
  - JPEG output remains disabled in the main application until the browser test confirms real output behavior.
  - Transparent source pixels currently use a white background. User-selectable JPEG background color remains a later UI enhancement.
- Next steps:
  - Pull the latest `main`, run `npm test` and `npm run build`.
  - Open `/tests/browser-encoder.html` and test PNG, JPEG, WebP, and BMP sources.
  - Include a transparent PNG, verify the transparent areas become white, and check output quality, MIME type, dimensions, preview, and download.
  - Enable JPEG output in the main interface only after the user confirms these checks.

### 2026-11-18 - Capability registry tests pass after expectation update
- Status: Tested; user-confirmed
- Findings from the user's local validation:
  - `npm run build` completed successfully with Vite 7.3.8.
  - `npm test` reported 14 passing and 3 failing tests out of 17.
  - All three failures were in `tests/capability-registry.test.js`; assertions still expected no supported decoders or encoders and expected PNG encoding to remain planned.
- Changes:
  - Updated the expected available input formats to PNG, JPEG, WebP, and BMP.
  - Updated the expected available output formats to PNG.
  - Updated planned output formats to JPEG, WebP, and BMP.
  - Updated the JPEG capability assertion to reflect verified decoding while keeping JPEG encoding planned.
  - Updated the immutability test to verify that changing a returned PNG capability object cannot change the internal `implemented` encoding status.
- Files changed:
  - `tests/capability-registry.test.js`
  - `docs/DEVELOPMENT_LOG.md`
- Test results:
  - The user's production build passed before this test-only correction.
  - The user pulled the updated `main` branch and reran `npm test`.
- Test results:
  - All 17 tests passed.
  - 0 tests failed, cancelled, skipped, or marked todo.
  - The passing tests cover format capability definitions, supported input/output availability, capability separation and immutability, image decoding paths and validation, PNG encoding, and canvas fallbacks.
  - The user had already confirmed `npm run build` succeeded before this test-only correction.
- Next steps:
  - Continue Phase 2 with implementation and verification of the JPEG output encoder.

### 2026-11-18 - PNG conversion verified in the main interface

- Status: Tested; user-confirmed real-file browser verification
- User-confirmed tests:
  - Convert images button becomes active after selecting images.
  - PNG, JPEG, WebP, and BMP input files all convert successfully to PNG.
  - Generated output opens as a PNG image.
  - Output dimensions match the original image dimensions.
  - PNG transparency remains intact.
  - Output filenames use the `.png` extension.
  - Individual Download PNG actions work.
  - Multiple images convert independently without interfering with one another's results.
- Changes:
  - Marked PNG encoding as `implemented` in the capability registry.
  - Updated the roadmap to mark the verified PNG output path, Blob generation, output reopening/dimension validation, individual download, and per-file conversion error results as complete.
  - Updated README and technical specification to describe the verified PNG conversion path.
- Test scope:
  - These results are based on the user's browser tests of the main application.
  - The user subsequently ran `npm test` and `npm run build`. The production build passed, while the test suite reported 14/17 passing because three capability-registry assertions still expected the pre-PNG-encoder state. Those stale assertions were corrected in a follow-up commit; the test suite must be rerun to verify the correction.
- Remaining limitations:
  - JPEG, WebP, and BMP output encoders are not implemented.
  - GIF, TIFF, HEIC, HEIF, and SVG decoding remain planned.
  - Phase 2 remains in progress.
- Next steps:
  - Implement and verify JPEG output, including quality handling and an explicit background for transparent source pixels.
  - Keep WebP and BMP output disabled until their respective encoders pass real-file tests.

### 2026-11-18 - Initial PNG conversion pipeline

- Status: Implemented; main-interface browser verification pending
- Changes:
  - Added `image-encoder.js` with PNG output through `OffscreenCanvas` and an HTML canvas fallback.
  - Added `conversion-service.js` to orchestrate decoding, PNG encoding, PNG signature validation, output re-decoding, and dimension verification.
  - Added cleanup for decoded source and verification resources.
  - Connected the Convert images button to the PNG conversion service.
  - Added individual PNG download links and per-file conversion error results.
  - Disabled JPEG, WebP, and BMP output choices until their encoders are implemented.
  - Added unit tests for PNG encoder behavior and validation.
- Files changed:
  - `src/js/core/image-encoder.js`
  - `src/js/core/conversion-service.js`
  - `src/js/main.js`
  - `index.html`
  - `src/styles/components.css`
  - `tests/image-encoder.test.js`
  - `README.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Added automated tests for OffscreenCanvas PNG encoding, HTML canvas fallback, fallback after OffscreenCanvas errors, unsupported output formats, invalid decoded input, and empty output.
  - Source changes have been reviewed, but the complete test suite and production build have not yet been run after this implementation.
- Test results:
  - Automated test execution is pending in the user's local checkout.
  - Real PNG conversion, output reopening, dimensions, and download behavior must be verified in the main application.
- Known issues:
  - PNG encoding has not yet been marked implemented in the capability registry.
  - JPEG, WebP, and BMP encoders are not implemented.
- Next steps:
  - Pull the latest `main`, run `npm test` and `npm run build`.
  - Convert real PNG, JPEG, WebP, and BMP input files to PNG from the main UI.
  - Verify the output files open correctly, preserve dimensions and transparency, and download with a `.png` extension.
  - Mark PNG encoding as implemented only after those checks pass.

### 2026-11-18 - Browser image decoder verification

- Status: Tested
- User-confirmed tests:
  - Tested real PNG files in the browser; status showed `Decode Successful`.
  - Tested real JPEG files in the browser; status showed `Decode Successful`.
  - Tested real WebP files in the browser; status showed `Decode Successful`.
  - Tested real BMP files in the browser; status showed `Decode Successful`.
- Changes:
  - Marked PNG, JPEG, WebP, and BMP decoding as implemented in the capability registry.
  - Kept GIF, TIFF, HEIC, HEIF, and SVG decoding planned.
  - Updated the roadmap and README to reflect verified decoder support.
- Test results:
  - All four initial raster formats decoded successfully using real files in the browser.
  - The decoder test page also reports the detected format and image dimensions.
  - The complete automated test suite and production build have not yet been reconfirmed after the decoder addition.
- Known issues:
  - The decoder is not connected to the main conversion workflow.
  - File validation and format signature detection still need separate manual verification.
  - No output encoder or download flow is available yet.
- Next steps:
  - Run `npm test` and `npm run build` on the latest repository state.
  - Begin the PNG encoder and conversion pipeline integration after those checks.

### 2026-11-18 - Initial browser image decoder

- Status: Implemented; real-browser verification pending
- Changes:
  - Added `image-decoder.js` for the initial raster formats: PNG, JPEG, WebP, and BMP.
  - Uses `createImageBitmap()` when available and falls back to `HTMLImageElement` with an Object URL.
  - Returns a consistent result containing the decoded source, width, height, format, and a `close()` cleanup method.
  - Validates decoded dimensions and releases an invalid ImageBitmap if decoding returns unusable dimensions.
  - Rejects formats outside this module's scope. SVG, GIF, TIFF, HEIC, and HEIF remain separate work.
  - Kept decoding capability status as planned until real image fixtures are verified in target browsers.
  - Added unit tests for the ImageBitmap path, HTML image fallback, automatic format detection, unsupported formats, invalid/empty inputs, invalid dimensions, and resource cleanup.
  - Added a standalone Vite development test page at `tests/browser-decoder.html` so real PNG, JPEG, WebP, and BMP fixtures can be decoded in the browser without connecting the decoder to the main UI.
- Files changed:
  - `src/js/core/image-decoder.js`
  - `tests/image-decoder.test.js`
  - `tests/browser-decoder.html`
  - `tests/browser-decoder.css`
  - `tests/browser-decoder.js`
  - `src/js/core/capability-registry.js`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Ran the six image-decoder unit tests in an isolated Node.js environment using mocked browser APIs.
- Test results:
  - All six decoder unit tests passed in the isolated test environment.
  - The user had already confirmed that the existing `npm test` suite and `npm run build` passed before this decoder addition.
  - The complete test suite and production build must be rerun after pulling this latest commit.
  - Real PNG, JPEG, WebP, and BMP files still need browser verification through the new test page.
- Known issues:
  - The decoder is not yet connected to the conversion UI.
  - Browser support can vary. The capability registry must remain unchanged until real-file tests pass.
- Next steps:
  - Run `npm test` and `npm run build` after pulling.
  - Open `/tests/browser-decoder.html` through the Vite development server and test real PNG, JPEG, WebP, and BMP files.
  - Confirm reported dimensions and check that failed decodes show a useful error.
  - Only then mark verified formats as decodable and connect the decoder to the conversion pipeline.

### 2026-11-17 - Image format capability registry

- Status: Tested; automated tests and production build confirmed by user on 2026-11-18
- Changes:
  - Added `capability-registry.js` as the single source of truth for recognized formats and their separate detection, decoding, and encoding states.
  - Recorded PNG, JPEG, WebP, BMP, GIF, TIFF, HEIC, HEIF, and SVG as detectable formats.
  - Kept decoder status separate from detection. No decoder is marked implemented yet.
  - Marked PNG, JPEG, WebP, and BMP as planned output encoders, not currently available output formats.
  - Documented special handling requirements for JPEG transparency, WebP MIME verification, dedicated BMP encoding, GIF animation, TIFF/HEIC/HEIF decoders, and safe SVG rasterization.
  - Connected the capability metadata to file validation and queued file records.
  - Added Node's built-in test runner and capability-registry unit tests without adding a third-party testing dependency.
- Files changed:
  - `src/js/core/capability-registry.js`
  - `src/js/core/file-validator.js`
  - `src/js/main.js`
  - `tests/capability-registry.test.js`
  - `package.json`
  - `README.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Added automated tests for detected format definitions, unknown formats, separate decode/encode status, planned output formats, and protection against mutation of internal registry data.
  - Reviewed the committed source and test definitions.
  - The user ran `npm test` and `npm run build` after pulling the implementation and confirmed that all tests passed and the build succeeded.
- Test results:
  - Changes committed to `main`.
  - All five capability-registry tests passed in the user's environment.
- Known limitations:
  - The registry describes implementation state. It does not perform actual browser feature detection or image decoding.
  - No input decoder or output encoder is currently marked as implemented.
- Next steps:
  - Verify the registry tests and build.
  - Implement the browser image decoder for the initial raster formats.
  - Add runtime decoding checks and update capability status only after real-file tests pass.

### 2026-11-17 - Phase 1 verification and Phase 2 foundation

- Status: Phase 1 tested; Phase 2 in progress
- User-confirmed tests:
  - Startup skeleton follows both light and dark themes.
  - Theme preference remains correct after page refresh.
  - No unstyled page appears during startup.
  - `npm run build` succeeds for the version tested by the user before this Phase 2 code update.
- Repository audit:
  - Confirmed `package-lock.json` exists on `main`.
  - Confirmed the current application entry point and UI structure.
  - Updated README to describe the actual Phase 1 interface and clarify that conversion is not available yet.
  - Reconciled Phase 0 and Phase 1 checklist wording in the roadmap.
  - Clarified that plain CSS is the agreed styling choice.
- Phase 2 implementation:
  - Added signature-based detection for PNG, JPEG, GIF, WebP, BMP, TIFF, HEIC, HEIF, and SVG.
  - Added basic file validation for invalid objects, empty files, unreadable content, and unrecognized image content.
  - Uses detected file content rather than trusting the extension or declared MIME type.
  - Reports MIME mismatches as warnings and continues using the detected format.
  - Integrated validation into file selection and drag-and-drop.
  - Added accessible feedback for rejected files and MIME warnings.
  - Added a format-label fallback when the browser cannot display a preview for a recognized format.
- Files changed:
  - `src/js/core/format-detector.js`
  - `src/js/core/file-validator.js`
  - `src/js/main.js`
  - `index.html`
  - `src/styles/components.css`
  - `README.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/PROJECT_CONTEXT.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Reviewed the implementation and repository changes.
  - No local browser test or production build was run by the assistant for this new Phase 2 code.
- Test results:
  - Changes committed to `main`.
  - User must pull the latest changes and verify valid images, unsupported files, empty files where testable, and MIME mismatch behavior.
- Known limitations:
  - Format recognition does not prove browser decoding or conversion support.
  - HEIC/HEIF, TIFF, and some GIF/SVG previews may not render in the browser. A fallback label is shown.
  - The capability registry, image decoder, and encoders have not been implemented.
- Next steps:
  - Verify file validation and format detection with real files.
  - Implement the explicit input/output capability registry.
  - Then implement browser image decoding.

### 2026-11-17 - Theme-aware startup skeleton
- Status: Implemented, pending user visual confirmation
- Changes:
  - Added an early theme initialization script in the document head. It reads the saved theme before the body renders and falls back to the operating-system color preference.
  - Added light and dark skeleton color tokens to the critical inline CSS.
  - Applied the selected theme to the page background and skeleton before the application module loads, avoiding a light skeleton flash for dark-theme users.
  - Updated the browser theme-color metadata to match the initial theme.
- Files changed:
  - `index.html`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Reviewed the initialization order and confirmed the theme preference is read before the skeleton markup is painted.
- Test results:
  - Changes committed to `main`.
  - User needs to verify the skeleton in both light and dark themes after a hard refresh.
- Known issues:
  - If browser storage is unavailable, the skeleton falls back to the operating-system theme preference.
- Next steps:
  - Test first load and reload in both themes.
  - Run `npm run build`.

### 2026-11-17 - User verification of custom dropdown and startup skeleton
- Status: Tested
- Tests performed by the user:
  - Confirmed dropdown option padding is correct.
  - Confirmed all output format options can be selected.
  - Confirmed keyboard navigation works.
  - Confirmed clicking outside closes the dropdown.
  - Confirmed the skeleton appears, but reported it always uses the light theme.
  - Confirmed there is no unstyled-content flash.
  - Confirmed light and dark application themes still work.
  - Ran `npm run build` successfully.
- Test results:
  - All reported checks passed except skeleton theme matching. The newer entry above addresses that issue.
- Next steps:
  - Verify the skeleton theme fix in both themes, then proceed to Phase 2.


### 2026-11-17 - Custom output dropdown and startup skeleton
- Status: Implemented, pending user verification
- Changes:
  - Replaced the native output-format select with a custom listbox dropdown so option padding, spacing, hover, focus, and selected states are controlled by the application CSS.
  - Added keyboard interaction for the custom dropdown: Arrow Up/Down, Home, End, Enter, Space, and Escape.
  - Added outside-click handling to close the dropdown.
  - Added an initial skeleton screen with inline critical styling in the document head.
  - Kept the application root hidden until the Vite CSS module has loaded and the initial JavaScript setup has completed, preventing the unstyled page flash.
  - Added reduced-motion handling to the skeleton shimmer.
- Files changed:
  - `index.html`
  - `src/js/main.js`
  - `src/styles/components.css`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Reviewed markup, event handling, focus behavior, startup visibility sequence, and CSS changes.
- Test results:
  - Changes committed to `main`.
  - Browser interaction and production build have not yet been verified by the user.
- Known issues:
  - Startup skeleton is removed when the application module initializes. A JavaScript loading failure will leave the skeleton visible rather than exposing an unstyled application.
- Next steps:
  - Verify custom dropdown spacing, mouse selection, keyboard controls, and outside-click close.
  - Reload the page with cache disabled and confirm the skeleton appears without an unstyled flash.
  - Run `npm run build`.


### 2026-11-17 - Output format option spacing adjustment
- Status: Implemented, pending visual confirmation
- Changes:
  - Added vertical and horizontal padding to native output-format option elements.
  - Added option line-height to improve readability and spacing in the opened dropdown where the browser supports option styling.
- Files changed:
  - `src/styles/components.css`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Reviewed the existing select styling and the user-provided screenshot.
- Test results:
  - CSS adjustment committed to `main`.
  - Actual dropdown appearance still requires user confirmation because native select popup styling can vary by browser and operating system.
- Known issues:
  - Some browsers/operating systems limit styling of native select option menus. If padding remains unchanged in the user's browser, replace the native select with a fully custom accessible dropdown in a separate implementation.
- Next steps:
  - Pull the update and check the Output format dropdown.
  - If native option padding is still ignored, implement a custom accessible select.

### 2026-11-17 - User verification of conversion settings UI
- Status: Tested
- Tests performed by the user:
  - Selected an image and confirmed Conversion Settings and Conversion Results appear.
  - Confirmed output format choices are available.
  - Confirmed the quality slider appears only for JPEG and WebP.
  - Changed the slider and confirmed the percentage value updates.
  - Cleared all selected images and confirmed both panels disappear.
  - Confirmed desktop and mobile layouts look normal.
  - Ran `npm run build`; Vite transformed 2,102 modules and completed the production build in 21.79 seconds.
- Test results:
  - All seven user-reported checks passed.
  - The output-format dropdown has a spacing issue visible in the supplied screenshot; a CSS adjustment is recorded in the newer entry above.
- Known issues:
  - The Convert images button remains disabled until the Phase 2 conversion engine exists.
  - Format choices are interface options only; they do not indicate completed conversion support.
- Next steps:
  - Confirm the dropdown option spacing after the CSS update.
  - Then begin Phase 2 with file validation, format capability detection, and browser image decoding.

### 2026-11-17 - Conversion settings and results interface
- Status: Implemented
- Changes:
  - Added a conversion settings panel that appears after at least one image is selected.
  - Added output format choices for PNG, JPEG, WebP, and BMP as planned core output targets.
  - Added a quality slider for JPEG and WebP selections, with a live percentage value.
  - Added a disabled Convert images button and clear notice that conversion is not active yet.
  - Added a conversion results panel with an honest empty state. No fake result cards or download actions are shown.
  - Kept settings and results hidden when the file queue is empty.
  - Added responsive styling for the new panels and controls.
- Files changed:
  - `index.html`
  - `src/js/main.js`
  - `src/styles/components.css`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Reviewed the source changes and confirmed the settings UI is only a preview; no conversion operation is triggered.
  - Browser interaction and production build for this latest update had not been tested at implementation time.
- Test results:
  - Implementation is committed to `main`.
  - User subsequently verified the settings interface; see the newer verification entry above.
- Known issues:
  - Format options represent planned output targets and do not imply that conversion is already supported.
  - The Convert images button remains disabled until the Phase 2 conversion engine exists.
- Next steps:
  - Complete visual confirmation of the select option spacing.
  - Then begin Phase 2 with file validation, format capability detection, and browser image decoding.

### 2026-11-17 - Phase 1 workspace UI verification
- Status: Tested for the user-reported interactions
- Tests performed by the user:
  - Selected multiple image files at once.
  - Added images through drag-and-drop.
  - Confirmed thumbnails and file sizes appear.
  - Removed individual images.
  - Cleared the entire selection with Clear all.
  - Switched between light and dark themes.
  - Refreshed the page and confirmed the selected theme persisted.
  - Checked the mobile layout and reported no visible issues.
  - Navigated the interface with keyboard controls.
  - Confirmed Enter/Space opens the file picker from the upload area.
  - Ran `npm run build`; Vite transformed 2,102 modules and completed the production build in 18.18 seconds.
- Test results:
  - All user-reported checks passed for the version tested before the latest settings/results UI update.
- Next steps:
  - Continue Phase 2 after the settings/results UI was verified.

### 2026-11-17 - Phase 1 initial workspace UI
- Status: Implemented
- Changes:
  - Replaced the foundation placeholder with the initial converter workspace.
  - Added application branding, privacy messaging, hero section, and upload workspace.
  - Added file picker and drag-and-drop selection for multiple image files.
  - Added image preview thumbnails, file size/type details, duplicate filtering, per-file removal, and clear-all behavior.
  - Added light/dark theme switching with preference persistence in localStorage.
  - Added responsive layout and keyboard activation for the dropzone.
  - Kept conversion controls out of this iteration because the conversion engine belongs to Phase 2.
- Files changed:
  - `index.html`
  - `src/js/main.js`
  - `src/styles/variables.css`
  - `src/styles/layout.css`
  - `src/styles/components.css`
  - `src/styles/themes.css`
- Tests performed:
  - Reviewed the updated source and confirmed all changes were committed to `main`.
  - No local browser interaction or production build was run by the assistant.
- Test results:
  - The user later manually verified file selection, drag-and-drop, previews, removal, clear-all, theme switching, theme persistence, mobile layout, keyboard navigation, and production build. All reported checks passed for the version tested.
- Known issues:
  - Conversion execution and result downloads are not implemented yet.
  - Unsupported or malformed image files may still fail at preview time; deeper validation belongs to Phase 2.
- Next steps:
  - Finish the settings and results interface.
  - Begin core conversion after verification.

### 2026-11-17 - Phase 0 foundation implementation
- Status: In progress
- Decisions confirmed:
  - Plain CSS, without Tailwind CSS.
  - Lucide installed through NPM.
  - Vite entry point at root-level `index.html`.
- Changes:
  - Added `package.json` with Vite dev, build, and preview scripts.
  - Added `vite.config.js`.
  - Added root `index.html` with a local-first foundation screen.
  - Added `src/js/main.js` as the ES module entry point and initialized Lucide icons.
  - Added modular styles: `main.css`, `variables.css`, `reset.css`, `layout.css`, `components.css`, and `themes.css`.
  - Added `public/favicon.svg`.
  - Updated README, technical specification, project instructions, and roadmap.
- Files changed:
  - `package.json`, `vite.config.js`, `index.html`, `src/js/main.js`
  - `src/styles/main.css`, `variables.css`, `reset.css`, `layout.css`, `components.css`, `themes.css`
  - `public/favicon.svg`, `README.md`
  - `docs/TECHNICAL_SPECIFICATION.md`, `docs/CHATGPT_PROJECT_INSTRUCTIONS.md`
  - `docs/DEVELOPMENT_ROADMAP.md`, `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Confirmed new files were committed to branch `main`.
  - No npm install, local dev-server, or production-build command was run in this environment.
- Test results:
  - Source foundation files are present in the repository.
  - Runtime behavior, package resolution, and production build remain unverified.
- Known issues:
  - `package-lock.json` has not been generated. Run `npm install` locally.
  - Localhost and production build verification remain open Phase 0 tasks.
  - The starter page is not an image uploader or converter.
- Next steps:
  - Pull the latest `main`.
  - Run `npm install` to generate `package-lock.json`.
  - Run `npm run dev` and verify the page in a browser.
  - Run `npm run build` and fix any errors before completing Phase 0.

### 2026-11-17 - Initial repository audit
- Status: In progress
- Changes:
  - Inspected the public GitHub repository and confirmed `main` as the default branch.
  - Reviewed README, project context, technical specification, roadmap, development log, ChatGPT Project instructions, and starter prompt.
  - Confirmed the repository initially had no application source, `package.json`, Vite configuration, or `src/` directory.
  - Marked repository creation as completed in the roadmap and corrected the README clone URL.
- Files changed:
  - `README.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Inspected repository metadata, default branch, root contents, documentation directory, and commit history.
- Test results:
  - No application build or runtime test was possible before the Vite project was created.
- Known issues:
  - Candidate libraries for HEIC/HEIF, TIFF, and animated GIF need evaluation in their respective phases.
- Next steps:
  - Confirm initial dependency policy and styling approach.
  - Initialize Vite and add the source structure.
  - Run the development server and verify localhost.

### 2026-11-17 - Planning baseline
- Recorded the agreed Vanilla JavaScript and Vite direction.
- Recorded the client-side processing requirement and planned image formats.
- Recorded light and dark themes, hybrid processing, and phased MVP development.
- No application features had been implemented or tested at this point.

### 2026-11-25 - Documentation synchronization after Phase 6 merge
- Reconciled README, roadmap, project context, technical specification, Phase 5 and Phase 6 implementation notes, API contract, integration checklist, and starter prompt with the merged PR #9 state.
- Marked Phase 5 and Phase 6 complete based on merged PRs and reported verification evidence.
- Preserved earlier development-log entries as historical checkpoints. Their pending states are superseded by this entry and the PR #9 merge.
- No application code was changed and no tests or production build were run as part of this documentation-only update.


### 2026-11-27 - Post-v1.0.0 document conversion roadmap
- Status: Planned. Documentation update only.
- Decisions recorded:
  - Add a separate document-conversion roadmap after the stable v1.0.0 image-conversion release.
  - Phase 8: Image to PDF, prioritized as the first document workflow for combining supported images into a multi-page PDF.
  - Phase 9: PDF to Image, rendering selected or all PDF pages to PNG, JPEG, or WebP and reusing existing image export capabilities where appropriate.
  - Phase 10: DOCX to PDF, limited initially to research and a prototype. Full implementation is conditional on acceptable layout fidelity across a representative DOCX test corpus. Legacy DOC is out of scope.
  - Phase 11: PDF document management, beginning with merge, reorder, rotate, and remove-page operations.
  - PDF and DOCX must use a separate document-processing layer rather than being added as raster codecs to the current image pipeline.
  - Local-first processing remains mandatory. No document content may be uploaded to a remote conversion service.
  - pdf-lib, jsPDF, PDF.js, Mammoth.js, docx-preview, and LibreOffice are evaluation candidates only. No new dependency was selected or installed.
- Documentation updated:
  - README.md
  - docs/DEVELOPMENT_ROADMAP.md
  - docs/PROJECT_CONTEXT.md
  - docs/TECHNICAL_SPECIFICATION.md
  - docs/STARTER_PROMPT.md
  - docs/DEVELOPMENT_LOG.md
- Tests and build:
  - No application code or dependencies changed.
  - No automated tests, browser checks, or production build were run as part of this planning-only documentation update.
- Next steps:
  - Confirm the Phase 8 owner and branch under the project's collaboration rules.
  - Evaluate PDF generation candidates before selecting a dependency.
  - Define Phase 8 UI, page model, limits, and test fixtures before implementation.

### 2026-11-28 - Expanded post-v1.0.0 roadmap for Phases 8–13
- Status: Planned. Documentation-only update.
- Changes:
  - Expanded Phase 8–11 with explicit Andra/Farrel ownership, branch naming, integration order, and completion gates.
  - Added Phase 12 for unified document workflows and Phase 13 for final QA, documentation, and release.
  - Set v2.0.0 as the target, with DOCX-to-PDF conditional on the Phase 10 fidelity gate.
  - Recorded deferred scope: legacy DOC, OCR, PDF-to-DOCX, cloud storage/synchronization, online collaboration, and advanced metadata management.
  - Reaffirmed local-first processing and separation of document processing from the raster image pipeline.
- Documentation updated: docs/DEVELOPMENT_ROADMAP.md, docs/PROJECT_CONTEXT.md, docs/TECHNICAL_SPECIFICATION.md, docs/STARTER_PROMPT.md, and AGENTS.md.
- Tests and build:
  - No application code or dependencies changed.
  - No automated tests, browser checks, or production build were run because this update changes planning documentation only.


### 2026-11-28 — Phase 8 UI scope correction: generated PDF preview
- Status: UI viewer path prepared; real PDF integration pending engine merge.
- Scope correction:
  - Split the old single-image pre-export approximation into an explicitly labelled **Layout Preview** and a separate **Generated PDF Preview**.
  - The generated document area is designed to display only the actual non-empty `application/pdf` Blob returned by the Phase 8 engine.
  - Added embedded PDF viewing, output metadata, download, and clear-result controls, with Object URL cleanup on replacement, Clear All, explicit clear, and page unload.
  - Kept the mock honest: it produces no Blob, does not populate the PDF viewer, and does not enable a fake download.
  - Updated the Phase 8 UI scope and browser checklist so actual PDF viewer/navigation/download checks occur after engine integration, not during mock-only QA.
- Files changed:
  - `src/js/ui/image-to-pdf-panel.js`
  - `src/styles/image-to-pdf.css`
  - `docs/PHASE_8_PDF_UI.md`
- Verification:
  - Repository source was updated on `phase-8-pdf-ui`.
  - No local automated tests, production build, or browser QA were run for this scope correction.
  - The engine branch has not yet been integrated here; actual PDF preview remains unavailable until Andra's engine is merged and wired in.
- Next steps:
  - Pull the latest `phase-8-pdf-ui` branch.
  - Run automated tests and production build.
  - Browser-check the distinction between Layout Preview and the empty Generated PDF Preview in mock mode.
  - After engine merge, integrate the real engine and verify multi-page PDF viewing and download.


### 2026-11-28 — Separate image conversion workspaces
- Status: Implemented on `phase-8-pdf-ui`; validation after this change is pending.
- Changes:
  - Added a top-level mode selector with **Image Format Converter** and **Images to PDF** choices.
  - Each mode displays only its own workspace, reducing the amount of unrelated controls visible at once.
  - Switching modes hides rather than destroys the inactive workspace, preserving its current queue and settings.
  - Updated the page introduction and documented the mode-switching browser check.
- Files changed:
  - `index.html`
  - `src/js/main.js`
  - `src/js/ui/image-to-pdf-panel.js`
  - `src/styles/main.css`
  - `src/styles/workspace-mode.css`
  - `docs/PHASE_8_PDF_UI.md`
- Verification:
  - The owner reported that tests, build, and browser checks passed before this selector change.
  - Tests, production build, and browser QA must be rerun against this latest commit before PR creation.
