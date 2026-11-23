# Development Log

This file records actual repository progress. Update it after meaningful implementation or testing work.

## Project status

- Current stage: Phase 6 - Image Optimization and Export Workflow
- Current phase status: Phase 5 has been merged into `main`. The project owner reports post-merge `npm test` and `npm run dev` passed on 2026-11-23. For Phase 6, `andra-gs` has implemented the optimizer and focused tests on `phase-6-optimization`; the project owner reports `npm test` and `npm run build` both completed without errors on 2026-11-23. A dedicated browser harness has been added, but real-browser verification remains pending. `FarrelPtrv` owns Export Presets and UI Integration on `phase-6-export-ui`.
- Latest release: None
- Last updated: 2026-11-23

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
| Phase 1: UI development | Tested | User confirmed the skeleton follows light/dark themes, theme persists after refresh, no unstyled flash appears, and `npm run build` succeeds |
| Phase 2: Core conversion engine | Tested | PNG, JPEG, WebP, and BMP conversion paths are user-verified; user reports the requested automated tests and build checks passed |
| Phase 3: Batch processing | Tested | User verified batch queue, worker execution, progress, cancellation, failure isolation, large-image responsiveness, cleanup, individual downloads, ZIP extraction, and image integrity |
| Phase 4: Advanced formats | Tested | Completed; CI validation and user-run real-browser verification passed. Known format limitations remain documented |
| Phase 5: Image manipulation | Complete | Merged into `main`; project owner reports post-merge `npm test` and `npm run dev` passed on 2026-11-23. A separate production build result is not recorded |
| Phase 6: Image optimization and export workflow | In progress | Encoder capability inspection completed on `phase-6-optimization`; optimizer implementation and validation remain pending. Export UI foundation is on `phase-6-export-ui`. Metadata Management is deferred |
| Phase 7: Testing, documentation, and release | Not started | Cross-browser QA, security review, documentation, production validation, and v1.0.0 readiness |

## Change log

Add newest entries first.

## 2026-11-23 - Optimizer test failure analysis and corrections

- The project owner ran `npm test` on `phase-6-optimization`: 121 passed, 2 failed, 0 skipped.
- The edited-ImageData-to-GIF test exposed an error-wrapping bug. `convertSource()` correctly raised `UNSUPPORTED_OUTPUT_FORMAT`, but the outer optimizer catch converted it to `ENCODING_FAILED`. The optimizer now preserves typed `ImageOptimizationError` instances in both normal conversion and target-size candidate paths.
- The SVG optimizer test failed because Node does not provide `DOMParser` and `XMLSerializer`. The test harness now supplies minimal SVG DOM shims for the optimizer conversion-flow test. This does not replace real browser SVG sanitization or browser verification.
- The two corrections are committed on `phase-6-optimization`. The project owner must rerun `npm test` and `npm run build`; no passing result is claimed yet.


### 2026-11-23 - Phase 6 initial Image Optimization Engine implementation

- Status: Initial implementation and focused test file added; runtime validation pending.
- Owner: `andra-gs`
- Branch: `phase-6-optimization`
- Implemented `src/js/core/image-optimizer.js` with the agreed `optimizeImage(source, options)` API and exported frozen `IMAGE_OPTIMIZATION_CAPABILITIES`.
- Supports original File/Blob sources and edited `{ file, imageData }` sources. Edited pixels use `convertImageDataToFormat()`; animated GIF remains on the original File-based conversion path.
- Added JPEG/WebP Low/Medium/High mappings (0.55 / 0.75 / 0.90) and bounded target-size sampling with a maximum of seven attempts across quality values from 0.10 to 0.95.
- Candidate outputs are measured by actual Blob size and are only considered after the existing conversion service validates the output. Failed candidates are skipped; all-candidate failure rejects the request.
- Added actual source/output size metrics, byte difference, percentage reduction/increase, output MIME type, dimensions, optimization metadata, and validation status.
- Refined error classification so GIF frame-count and loop-metadata verification failures are reported as output-validation failures.
- Added `tests/image-optimizer.test.js` covering source/options validation, capability gating, output formats in none mode, preset mapping, target-size selection and failure behavior, signature validation, edited ImageData immutability, and size reporting.
- Updated `docs/PHASE_6_OPTIMIZATION_API.md`, `docs/PHASE_6_OPTIMIZATION.md`, and `docs/TECHNICAL_SPECIFICATION.md` with the implemented API and limitations.
- `npm test`, `npm run build`, and real-browser checks have not been run in this environment. The implementation must not be treated as tested or complete until those checks pass.


### 2026-11-23 - Phase 6 encoder inspection and capability mapping

- Status: First Phase 6 task completed; optimizer implementation not started.
- Owner: `andra-gs`
- Branch: `phase-6-optimization`
- Base commit: `247b803b824b68cabf59eb7a5cf019ab314135d2` (`main` at branch creation).
- Inspected the existing image encoder, conversion service, capability registry, animated GIF path, and approved optimizer API contract.
- Confirmed that JPEG and WebP accept meaningful quality values through the existing Canvas encoder. These are the only initial formats suitable for quality presets and repeated target-size attempts.
- Confirmed PNG has no quality option; BMP uses a fixed 24-bit encoder; TIFF uses baseline uncompressed UTIF2 output; GIF uses the existing modern-gif path without a generic quality control; SVG wraps embedded PNG; HEIC/HEIF have no output encoder.
- Confirmed that File/Blob and edited-ImageData conversion paths reuse existing output signature and decode/dimension validation. Animated GIF must remain on the File-based path.
- Added `docs/PHASE_6_OPTIMIZATION.md` with the inspected capability matrix, service constraints, and next implementation steps.
- No application code or encoder behavior was changed. No tests, production build, or browser checks were run during this documentation/inspection step.


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


## Entry template

```markdown
### YYYY-MM-DD - Short change title
- Status: In progress / Implemented / Tested / Blocked
- Changes:
  - ...
- Files changed:
  - ...
- Tests performed:
  - ...
- Test results:
  - ...
- Known issues:
  - ...
- Next steps:
  - ...
```

## Important rule

Only record work that actually happened in the repository. Do not mark a feature as implemented or tested based only on a plan, code suggestion, or mockup.


### 2026-11-19 - Initial static GIF first-frame decoder
- Status: Implemented; real-browser verification pending
- Changes:
  - Evaluated browser-compatible GIF parsing options and selected gifuct-js 2.1.2, an MIT-licensed parser/decompressor with a single runtime dependency.
  - Added a GIF decoder adapter that parses logical-screen dimensions and decompresses only the first image frame.
  - Rasterizes the first frame to OffscreenCanvas or HTML Canvas, respecting frame offsets, transparency, and the global background color when applicable.
  - Added dimension and pixel-area limits before allocating the raster canvas.
  - GIF conversion can use the existing Worker path and main-thread fallback.
  - Documented the policy: animated GIF input becomes a still image from its first image frame. Animation, timing, and later frames are not preserved.
  - Kept GIF decoding marked planned in the capability registry until the user completes real-browser verification.
  - Added unit coverage for first-frame rasterization and malformed GIF errors, plus GIF support in the browser decoder test page.
- Files changed:
  - `package.json`, `package-lock.json`
  - `src/js/core/image-decoder.js`, `src/js/core/capability-registry.js`
  - `tests/image-decoder.test.js`, `tests/capability-registry.test.js`
  - `tests/browser-decoder.html`, `tests/browser-decoder.js`
  - `README.md`, `docs/PROJECT_CONTEXT.md`, `docs/TECHNICAL_SPECIFICATION.md`, `docs/DEVELOPMENT_ROADMAP.md`
- Tests performed:
  - Added automated test cases. They have not been run in this environment.
  - Real browser and main-application verification remain pending.
- Test results:
  - No test or production build result is claimed yet.
- Known issues:
  - The browser file preview may still display an animated GIF as provided by the browser; the conversion result is explicitly based on the first image frame.
  - GIF decoding remains unavailable in the capability registry until manual verification passes.
- Next steps:
  - Run npm test and npm run build.
  - Test real static and animated GIF files in the browser decoder page and main application.
  - Verify first-frame selection, transparency, logical dimensions, worker execution, downloads, and ZIP export.


### 2026-11-19 - SVG browser verification completed
- Status: Tested; user-confirmed
- Tests performed:
  - The user ran the SVG test workflow in the real browser and reported that all tests produced the expected results.
  - Safe SVG fixture sanitization and rasterization passed.
  - Main-application conversions from SVG to PNG, JPEG, WebP, BMP, and TIFF passed.
  - Dimension, color, preview, and downloaded output checks passed.
  - The user also verified malformed/unsupported SVG handling and the sanitizer's restricted behavior.
- Test results:
  - SVG decoding is now marked implemented in the capability registry.
  - SVG is included among available input formats.
- Known limitations:
  - Only the sanitizer's documented SVG subset is retained. Unsupported SVG features may be removed before rasterization.
  - SVG decoding runs on the main thread because it uses DOMParser and XMLSerializer.
- Next steps:
  - Continue Phase 4 with static GIF first-frame decoding. Animated GIF preservation remains a separate task.


### 2026-11-19 - Fix GIF decoder module import
- Status: Fixed; local verification pending
- Issue reported:
  - The application remained on the startup skeleton.
  - The browser decoder page did not respond after selecting a GIF.
  - Console error: Cannot destructure property 'parseGIF' of 'gifuct' as it is undefined.
- Root cause:
  - gifuct-js 2.1.2 exposes `parseGIF` and `decompressFrame` as named exports.
  - The initial integration incorrectly imported a default export and destructured the named functions from it.
  - This caused the image decoder module to fail during module initialization, preventing the application entry point and browser decoder test module from loading.
- Fix:
  - Replaced the default import and destructuring with direct named imports:
    `import { parseGIF, decompressFrame } from "gifuct-js";`
- Files changed:
  - `src/js/core/image-decoder.js`
- Tests performed:
  - Confirmed the package's published entry point and source exports expose the functions as named exports.
  - No local npm test, production build, or browser test was run in this environment.
- Next steps:
  - Run `npm test`, `npm run build`, and verify the main app and browser decoder page.


### 2026-11-19 - GIF first-frame decoding verified
- Status: Tested; user-confirmed
- Tests performed:
  - The user confirmed that GIF decoding produced the expected image dimensions in the browser decoder test.
  - The user confirmed that GIF conversion through the main application produced the expected result.
- Test results:
  - GIF first-frame decoding is now marked implemented in the capability registry and available as an input format.
  - Static and animated GIF inputs are converted as still images using the first image frame only.
- Known limitations:
  - Animation playback, frame timing, and later frames are not preserved.
  - Animated GIF output is not implemented.
- Next steps:
  - Define and implement raster-to-SVG output with explicit labeling that the raster image is embedded and is not vectorized.


### 2026-11-19 - Implement raster-to-SVG wrapper output
- Status: Implemented; real-browser verification pending
- Implementation:
  - Added an SVG encoder that converts the decoded source to PNG and embeds it as a base64 data resource inside an SVG image element.
  - Preserved the source pixel dimensions in the SVG width, height, and viewBox.
  - Extended the SVG sanitizer to allow image elements only with bounded base64-encoded PNG data URIs. External image URLs and other data MIME types remain disallowed.
  - Routed SVG output through the main thread because output verification uses DOMParser and XMLSerializer.
  - Added SVG to the output format dropdown, conversion service, capability registry, filename extension handling, and ZIP-compatible result flow.
  - Added automated encoder and capability-registry tests.
  - Labeled the format as an embedded PNG wrapper, not vectorization.
- Known limitations:
  - The SVG contains a raster PNG. It does not create editable vector paths or resolution-independent image detail.
  - Embedded PNG data is limited by the sanitizer to a 64 MiB base64 payload.
  - SVG output is main-thread only.
- Tests performed:
  - Automated tests and production build have not been run in this environment.
  - Real-browser conversion and sanitizer verification are pending user testing.
- Next steps:
  - Run npm test and npm run build, then verify SVG output in the browser with transparent and opaque images, re-decoding, dimensions, individual download, and ZIP export.

### 2026-11-20 - Phase 4 validation and completion
- Status: Complete; CI-validated and user-verified
- Changes:
  - Added the Phase 4 GitHub Actions validation workflow.
  - Upgraded checkout and setup-node actions to v5 to use the Node.js 24 action runtime; the project itself continues to use Node.js 22.
  - Synchronized package-lock.json for gifuct-js and modern-gif dependencies in the phase-4 branch.
  - Corrected pull-request workflow branch filters so PRs targeting main or phase-4 are included.
  - Limited workflow token permissions to contents: read and removed automatic lockfile mutation/push steps; the committed lockfile is validated with npm ci.
  - Updated README, project context, technical specification, and roadmap to reflect completed GIF support and Phase 4 status.
- Tests performed:
  - GitHub Actions completed npm ci, npm test, and npm run build successfully on commit c34d26b.
  - The user confirmed real-browser tests for animated GIF conversion, including timing, looping, transparency, frame order, batch processing, individual downloads, and ZIP export.
- Test results:
  - CI check "validate" completed with success.
  - The user confirmed that the GIF browser checks behaved as expected.
- Known limitations:
  - GIF-to-static conversion uses only the first frame.
  - Animated GIF re-encoding can quantize colors and simplify partial transparency.
  - Animated GIF-to-WebP/APNG is not supported.
  - TIFF decoding uses the first page; baseline TIFF output is uncompressed.
  - Raster-to-SVG embeds PNG data and is not true vectorization.
- Next steps:
  - Begin Phase 5 Image Manipulation on a separate phase-5 branch after Phase 4 PR review/merge.

### 2026-11-20 - Phase 5 and Phase 6 team task allocation
- Status: Planning agreed; implementation not started
- Decisions:
  - The project owner approved a three-person division of work for Phase 5 and Phase 6.
  - `andra-gs` owns Phase 5 Image Transformation and Phase 6 Image Optimization.
  - `Adit1945-web` owns Phase 5 Image Adjustment and Phase 6 Metadata Management.
  - `FarrelPtrv` owns Phase 5 Editor UI and Integration and Phase 6 Export Presets and UI.
  - Phase 6 is defined as Advanced Export and Image Optimization.
  - The former Testing and Release checklist has been moved to Phase 7.
  - Separate feature branches, Pull Requests, code review, ordered integration, and post-merge regression testing are required.
- Documentation updated:
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/PROJECT_CONTEXT.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/CHATGPT_PROJECT_INSTRUCTIONS.md`
  - `README.md`
- Implementation status:
  - No Phase 5 or Phase 6 feature code has been implemented as part of this planning update.
  - No feature branches have been created as part of this planning update.
- Tests performed:
  - Documentation content and GitHub commits were checked after each update.
  - No application tests or production build were run because this change updates planning documentation only.
- Next steps:
  - All three members review the ownership table and detailed tasks.
  - Agree on shared processing APIs, editing state, resource ownership, and error contracts before parallel implementation.
  - Start Phase 5 branches from the latest `main`.


### 2026-11-20 - Documentation synchronization after AGENTS.md rename

- Status: Documentation synchronized; feature implementation unchanged.
- Changes:
  - Established the root-level `AGENTS.md` as the canonical persistent instruction file for ChatGPT coding sessions.
  - Updated README documentation links and team guidance to point to `AGENTS.md` instead of the removed `docs/CHATGPT_PROJECT_INSTRUCTIONS.md` path.
  - Updated the starter prompt so it starts from the current project state and asks each contributor to identify their GitHub username and assigned phase task, rather than incorrectly starting at Phase 0.
  - Synchronized current phase summaries and phase tracking with the completed Phase 4 and planned Phases 5, 6, and 7.
  - Corrected the GIF verification status in the technical specification to match the user's real-browser confirmation on 2026-11-20.
  - Clarified current unsupported GIF and TIFF capabilities in the project context.
- Files changed:
  - `README.md`
  - `AGENTS.md`
  - `docs/PROJECT_CONTEXT.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
  - `docs/STARTER_PROMPT.md`
- Tests performed:
  - Reviewed the current documentation on GitHub and checked cross-file references, phase ownership, branch names, and current status wording.
  - No application tests or production build were run because this update changes documentation only.
- Test results:
  - Documentation references and phase summaries are synchronized.
  - Phase 5 and Phase 6 feature implementation status remains unchanged; no feature branches were created by this documentation update.


### 2026-11-21 - Phase 5 Image Adjustment module implementation
- Status: Implemented; focused unit tests passed; browser and editor verification pending
- Changes:
  - Added the Image Adjuster module on `phase-5-adjustment` using the agreed sRGB ImageData representation and `applyImageAdjustments(imageData, adjustments)` API.
  - Implemented brightness, contrast, saturation, grayscale, sepia, and Gaussian blur with the agreed ranges and defaults.
  - Preserved source immutability, image dimensions, and alpha values. Blur uses premultiplied-alpha sampling and a rolling row cache.
  - Added validation for ImageData, unknown options, invalid types, parameter ranges, and shared image limits.
  - Added focused tests for each adjustment, combined operations, blur behavior, transparency, dimensions, and invalid inputs.
  - Added `docs/PHASE_5_ADJUSTMENT.md` describing algorithms, options, errors, resource ownership, and verification.
- Files changed:
  - `src/js/core/image-adjuster.js`
  - `tests/image-adjuster.test.js`
  - `docs/PHASE_5_ADJUSTMENT.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
- Tests performed:
  - Ran `node --test tests/image-adjuster.test.js` in a local Node test environment.
  - Ran `node --check src/js/core/image-adjuster.js`.
- Test results:
  - All 16 focused Image Adjuster tests passed.
  - Syntax validation passed.
  - The full repository test suite and production build have not been run for this branch update.
- Known issues:
  - Real-image browser verification remains pending.
  - Editor integration and the complete editing-to-conversion workflow remain pending.
- Next steps:
  - Verify the module with representative real images.
  - Coordinate the integration handoff with the Editor UI branch.
  - Run the full repository test suite and production build before preparing the Pull Request.


### 2026-11-21 - Add Image Adjuster real-image browser harness
- Status: Added; browser verification pending
- Changes:
  - Added `tests/browser-adjuster.html`, `tests/browser-adjuster.css`, and `tests/browser-adjuster.js`.
  - The harness uses the existing image decoder, extracts sRGB ImageData, and displays original and adjusted previews.
  - Added controls for brightness, contrast, saturation, blur, grayscale, and sepia, plus Reset.
  - Kept the harness separate from the production editor and conversion flow.
  - Releases the decoded image and temporary staging canvas after extracting source pixels.
- Tests performed:
  - Ran JavaScript syntax validation with `node --check` for the browser harness script in the local Node environment.
  - The real-browser harness has not yet been run with user image files.
- Next steps:
  - Open `http://localhost:5173/tests/browser-adjuster.html` while `npm run dev` is running.
  - Verify each adjustment and representative combinations using real local images.
  - Confirm dimensions and alpha transparency remain unchanged.


### 2026-11-21 - Phase 5 Image Adjustment verification and CI results
- Status: Processing module tested; real-image browser verification and full repository CI passed (user-confirmed browser/local checks and GitHub Actions).
- Verification:
  - The user confirmed that all Image Adjustment features work correctly in the real-image browser harness.
  - The user ran `npm test`: 50 tests passed, 0 failed, 0 cancelled, and 0 skipped.
  - The user ran `npm run build`: Vite production build completed successfully.
  - GitHub Actions for PR #2 completed successfully. Dependency installation, all 50 tests, and the production build passed.
- Build note:
  - Vite reports the existing HEIC-related chunks exceed the 500 kB advisory threshold. This is a bundle-size warning, not a build failure.
- Verification boundaries:
  - These results validate the standalone processing module and its browser harness. They do not validate the integrated editor or the complete editing-to-conversion workflow.
- Remaining work:
  - Integrate the Transformer and Adjuster modules through the Editor UI branch.
  - Run end-to-end browser checks after editor integration.

### 2026-11-21 - User verification of Image Adjuster in browser
- Status: Real-image browser verification passed (user-confirmed); editor integration pending
- User verification:
  - The user reported that the Image Adjustment features are working well in the browser harness.
  - This confirms the six adjustment controls and browser preview workflow at the feature level.
- Documentation:
  - Updated the Phase 5 roadmap to mark real-image browser verification complete for Image Adjustment.
  - Updated the Image Adjustment phase document to record the user-confirmed browser result.
- Verification boundaries:
  - This entry does not claim a new full `npm test` run or production build for the latest branch state.
  - Editor integration and the complete editing-to-conversion workflow remain pending.
- Next steps:
  - Run the full repository test suite and production build on the latest `phase-5-adjustment` branch.
  - Coordinate the processing-module handoff and integration with the Editor UI branch.


### 2026-11-22 - Fix HEIC/TIFF queue thumbnails

- Status: Implemented on `phase-5-editor-ui`; automated and browser verification pending.
- Root cause:
  - The queue's `renderFile()` assigned the original File Object URL directly to an `<img>` element.
  - HEIC/HEIF and TIFF could be decoded by the Editor but were not necessarily displayable by the browser's native image element, so the queue showed only its format fallback.
- Changes:
  - Queue thumbnails now use the shared `decodeImage()` pipeline and rasterize decoded sources to small PNG thumbnail Blobs through a dedicated helper.
  - Added per-item thumbnail Object URL tracking and cleanup for removal, queue clearing, image-load failure, and page unload.
  - Kept the original File Object URL and conversion path unchanged.
  - Added focused unit tests for thumbnail dimensions, aspect ratio, Blob output, invalid inputs, and canvas cleanup.
- Files changed:
  - `src/js/main.js`
  - `src/js/core/image-thumbnail.js`
  - `tests/image-thumbnail.test.js`
  - `docs/PHASE_5_EDITOR_UI.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Focused tests were added but have not been run in this environment.
  - The user subsequently confirmed the full `npm test` and `npm run build` passed on the latest branch state (98/98 tests; production build successful). Real-browser queue/editor checks also passed.
- Next steps:
  - Pull the latest `phase-5-editor-ui` branch, run the full tests and build, then verify queue thumbnails and Editor preview for HEIC, TIFF, PNG, JPEG, and WebP.

### 2026-11-22 - Phase 5 Editor review fixes: decoder preview and empty inputs

- Status: Implemented on `phase-5-editor-ui`; automated and real-browser verification pending.
- Review findings:
  - Editor preview decoding depended on native `<img>` loading, which could prevent decoder-supported HEIC and TIFF files from opening.
  - Empty Crop and Resize fields did not consistently map to the shared nullable-dimension contract.
- Changes:
  - Decoupled source decoding from native `<img>` loading and now call `decodeImage(source.file)` immediately after selection.
  - Generate the original preview from decoded sRGB ImageData through the Canvas-to-PNG preview pipeline.
  - Retain explicit ownership and cleanup for decoded sources, temporary Canvas resources, and Editor-created preview object URLs.
  - Added `src/js/core/editor-input-state.js` for deterministic Crop and Resize input normalization.
  - Empty Crop width/height and Resize width/height now map to `null`; empty Crop X/Y map to `0`.
  - Block Apply when aspect ratio is unlocked and either Resize dimension is missing.
  - Added `tests/editor-input-state.test.js` for Crop clearing, Resize clearing, aspect-ratio resolution, and unlocked resize validation.
- Files changed:
  - `src/js/ui/image-editor.js`
  - `src/js/core/editor-input-state.js`
  - `tests/editor-input-state.test.js`
  - `docs/PHASE_5_EDITOR_UI.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/DEVELOPMENT_LOG.md`
- Tests performed:
  - Test cases have been added, but `npm test` and `npm run build` have not yet been executed for this updated branch state in this environment.
  - Real-browser Editor verification for HEIC, TIFF, PNG, JPEG, and WebP remains pending.
- Next steps:
  - Run `npm test` and `npm run build` on the latest branch commit.
  - Verify real HEIC and TIFF files open in the Editor, then regression-test PNG, JPEG, and WebP.
  - Confirm queue switching, Reset, and resource cleanup in the browser before requesting another review.


### 2026-11-22 - Phase 6 scope and team restructuring
- Status: Planning approved by the project owner; implementation not started.
- Decisions:
  - Re-scoped Phase 6 to two active contributors: `andra-gs` owns the Image Optimization Engine, and `FarrelPtrv` owns Export Presets and UI Integration.
  - Removed Metadata Management from Phase 6 and deferred it to a future backlog item. No owner, branch, API, or delivery date is assigned to that deferred work.
  - Renamed the phase focus to Image Optimization and Export Workflow.
  - Kept Low, Medium, and High quality presets format-aware. A shared numeric quality value must not be treated as equivalent across different encoders.
  - Restricted target-file-size attempts to formats where iterative encoding is technically feasible. The application must report achieved size and must not promise an exact target.
  - Required actual source/output File or Blob size measurement, byte difference, and percentage change.
  - Required export settings to apply to individual downloads and ZIP export, with per-file failure isolation.
  - Defined the initial investigation matrix: JPEG/WebP quality controls and possible target-size attempts; PNG lossless encoder-supported optimization; BMP/TIFF/GIF only where actual encoder capabilities support it; no generic raster quality control for SVG.
  - Phase 6 feature work must wait until Phase 5 post-merge verification on `main` is complete.
  - Updated collaboration instructions so Phase 6 has two feature branches: `phase-6-optimization` and `phase-6-export-ui`.
- Documentation updated:
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `AGENTS.md`
  - `docs/DEVELOPMENT_LOG.md`
- Documentation reviewed and left unchanged:
  - `docs/PROJECT_CONTEXT.md` and `docs/TECHNICAL_SPECIFICATION.md` were reviewed. No implemented product behavior, architecture, or module API changed; this update changes only planned scope and ownership.
- Repository workflow:
  - Created documentation branch `docs/phase-6-two-person-plan` from main commit `940b5f29ae539603df49a87cb15984dc947288a5`.
  - Open Phase 6 feature branches have not been created.
  - PR #4 (`security/xanitizer-analysis`) remains open and is separate from Phase 6 planning.
- Tests:
  - No application tests, browser checks, or production build were run because this change updates planning and collaboration documentation only.
- Next steps:
  - Complete Phase 5 post-merge verification on `main`.
  - Before Phase 6 coding, agree on optimizer API, preset mappings, supported-format capabilities, error behavior, and size-reporting shape.

### 2026-11-23 - Phase 5 post-merge checks reported; Phase 6 kickoff

- Status: Phase 5 is merged into `main`. Phase 6 kickoff is authorized.
- Phase 5 verification reported by the project owner:
  - `npm test` completed successfully after the Phase 5 merge.
  - `npm run dev` was run successfully for local application/browser verification.
  - A separate `npm run build` result was not included in this report and is not claimed here.
- Phase 6 scope and ownership:
  - `andra-gs`: Image Optimization Engine on `phase-6-optimization`.
  - `FarrelPtrv`: Export Presets and UI Integration on `phase-6-export-ui`.
  - `Adit1945-web` has no Phase 6 assignment.
  - Metadata Management remains deferred to a future backlog item with no owner or branch.
- Phase 6 implementation roadmap:
  - Inspect existing encoder capabilities and publish a format/capability matrix.
  - Agree on the optimizer API, preset mapping, target-size behavior, error contract, size-reporting shape, and resource ownership before UI integration.
  - Implement and merge the optimizer processing module first.
  - Farrel then updates the export UI branch from the latest `main`, integrates the real optimizer with individual downloads and ZIP export, and submits the UI PR.
  - Run full automated tests, production build, and browser checks for individual downloads, mixed-format batches, and ZIP integrity after integration.
- Constraints:
  - Quality presets must be mapped to format-specific encoder settings. Equal numeric values must not be assumed to produce equivalent quality across formats.
  - Target file size is best-effort only. Report the actual achieved size and whether the target was reached.
  - Measure actual File/Blob sizes. Do not present estimates as exact output sizes.
  - Preserve the existing local-first architecture, decoders, encoders, conversion service, Worker path, queue, and ZIP behavior.
- Documentation updated:
  - `README.md`
  - `docs/PROJECT_CONTEXT.md`
  - `docs/TECHNICAL_SPECIFICATION.md`
  - `docs/DEVELOPMENT_ROADMAP.md`
  - `docs/DEVELOPMENT_LOG.md`
- `AGENTS.md` was reviewed and already contains the two-person Phase 6 ownership, branch names, and merge order from merged PR #6; no further change was required.
- Repository references:
  - PR #6, which approved the two-person Phase 6 plan, is merged: https://github.com/andra-gs/Images-Format-Converter/pull/6
  - PR #4 (`security/xanitizer-analysis`) remains separate from Phase 6 and is not changed by this work.
- No application code was changed. No tests, browser checks, or production build were run as part of this documentation update.

### 2026-11-23 - Phase 6 optimizer automated checks and browser harness

- Status: Optimizer implementation and automated checks reported successful by the project owner; browser verification pending.
- User-reported verification:
  - `npm test` completed without errors.
  - `npm run build` completed without errors.
  - These checks were reported before the browser harness files in this entry were added. They must be rerun against the latest branch state.
- Changes on `phase-6-optimization`:
  - Added a standalone browser test page at `tests/browser-optimizer.html`.
  - Added matching styles in `tests/browser-optimizer.css`.
  - Added `tests/browser-optimizer.js`, which calls `optimizeImage()` directly and uses the existing `decodeImage()` pipeline to preview the returned output.
  - The harness exposes output-format and optimization-mode selection, JPEG background selection, original/output previews, measured size metrics, target-size status, and output download.
  - The harness is separate from the production UI and does not change Farrel's Export UI ownership.
- Verification still required:
  - Pull the latest `phase-6-optimization` branch.
  - Rerun `npm test` and `npm run build` after adding the harness.
  - Run `npm run dev` and open `http://localhost:5173/tests/browser-optimizer.html`.
  - Test JPEG/WebP Low, Medium, and High presets; target-size reached and not reached; and `none` mode for PNG, BMP, TIFF, GIF, and SVG.
  - Record browser, representative input files, actual output sizes, and any failures.
- No real-browser result is claimed yet.