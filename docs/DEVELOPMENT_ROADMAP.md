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
- [ ] File validation (implemented; manual verification pending).
- [ ] Image format signature detection (implemented; manual verification pending).
- [x] Capability registry separating input decoding from output encoding (automated tests passed; user-confirmed).
- [x] Browser image decoding for PNG, JPEG, WebP, and BMP (user-confirmed successful real-file tests).
- [x] PNG output (encoder, conversion service, and UI flow; user verified PNG, JPEG, WebP, and BMP inputs convert successfully, output opens as PNG, dimensions and PNG transparency are preserved, filenames use .png, downloads work, and multiple files convert independently).
- [x] JPEG output (encoder, conversion service, quality control, white compositing for transparency, and main-interface download; user verified real-file conversion).
- [x] WebP output (encoder, conversion service, quality control, and main-interface download; user verified PNG, JPEG, WebP, and BMP inputs, transparency, MIME type, dimensions, preview, download, and unsupported-browser error handling).
- [ ] BMP encoder.
- [x] Blob result generation for PNG output.
- [x] PNG output validation by reopening/decoding and checking dimensions.
- [x] Individual PNG download.
- [x] Per-file conversion error results.

Deliverable: reliable local conversion for implemented and tested formats.

## Phase 3: Batch processing

Tasks:
- [ ] Multiple-file queue.
- [ ] Queue state management.
- [ ] Per-file progress/status.
- [ ] Web Worker processing.
- [ ] OffscreenCanvas feature detection and fallback.
- [ ] Concurrency limits.
- [ ] Cancellation where practical.
- [ ] Quality adjustment for supported lossy formats.
- [ ] ZIP download using JSZip.
- [ ] Resource cleanup.

Deliverable: batch conversion without freezing the UI under normal test loads.

## Phase 4: Advanced format support

Tasks:
- [ ] Evaluate and integrate HEIC/HEIF decoder.
- [ ] Test HEIC and HEIF fixtures.
- [ ] Integrate TIFF decoding.
- [ ] Evaluate TIFF encoder separately.
- [ ] Implement safe SVG rasterization.
- [ ] Define and implement raster-to-SVG behavior with clear labeling.
- [ ] Implement static GIF conversion.
- [ ] Evaluate animated GIF decoder and encoder.
- [ ] Implement animated GIF frame/timing handling if feasible.
- [ ] Add format-specific error messages and compatibility notes.

Deliverable: tested advanced-format pipelines. Do not claim untested variants are supported.

## Phase 5: Image manipulation

Tasks:
- [ ] Resize dimensions.
- [ ] Maintain or unlock aspect ratio.
- [ ] Compression controls.
- [ ] Rotation.
- [ ] JPEG background selection.
- [ ] Before/after comparison.
- [ ] Metadata viewer.
- [ ] Define metadata stripping/preservation behavior.

Deliverable: additional image manipulation features.

## Phase 6: Testing and release

Tasks:
- [ ] Cross-browser testing.
- [ ] Mobile layout testing.
- [ ] Large-image and memory testing.
- [ ] Security review, especially SVG handling.
- [ ] Validate all advertised conversion paths.
- [ ] Verify no image upload/network transfer occurs.
- [ ] Check production build.
- [ ] Complete README installation and usage instructions.
- [ ] Add screenshots and supported-format matrix.
- [ ] Tag release `v1.0.0` when release criteria are met.

Deliverable: documented and tested GitHub release.

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

Do not mark a phase complete based on appearance alone. A feature must work with real files and pass relevant tests. Update `DEVELOPMENT_LOG.md` as work progresses.
