# Phase 8 — Image to PDF UI

## Ownership and branch

- Owner: `FarrelPtrv`
- Branch: `phase-8-pdf-ui`
- Base: `main` at kickoff commit `098bc6c23d0d544c10d9b09e373f211bc719ee03`
- UI module: `src/js/ui/image-to-pdf-panel.js`
- Production engine: `src/js/documents/image-to-pdf.js`
- Stylesheet: `src/styles/image-to-pdf.css`
- Focused layout tests: `tests/image-to-pdf-ui-layout.test.js`

## Shared API contract

The UI is integrated with the production engine in `src/js/documents/image-to-pdf.js`, using the API defined in `docs/API_CONTRACT_PHASE_8_IMAGE_TO_PDF.md`. The public functions are:

- `calculateImagePdfPageLayout({ imageWidth, imageHeight, options })`
- `createImagePdf({ images, options, signal, onProgress })`

The UI imports `calculateImagePdfPageLayout()` and `createImagePdf()` from the document engine. jsPDF remains isolated inside the engine; the UI does not import the PDF library or duplicate image decoding/composition.

## Implemented UI scope

- Dedicated Image to PDF workspace mounted separately from the existing image conversion workflow.
- A top-level mode selector lets users switch between **Image Format Converter** and **Images to PDF**. Only the selected workspace is shown; switching modes preserves each workspace's current queue and settings.
- Multiple image selection and drag-and-drop.
- Stable queue IDs, local thumbnails, file names, and file sizes.
- Remove, clear, and move-up/move-down controls for page ordering.
- A pre-export **Layout Preview** for the selected source image. This is explicitly an approximation and must never be described as a generated PDF page.
- A4, A5, Letter, and Image Size (96 PPI) controls.
- Portrait, landscape, and auto orientation for fixed page presets; disabled for Image Size.
- Fit (`contain`) and Fill (`cover`) settings.
- Uniform margin and per-side margin controls.
- White page background only. Transparency is intentionally not exposed before the contract's two-viewer verification gate passes.
- Preview geometry is requested from the production `calculateImagePdfPageLayout()` function. The UI maps its returned page and image rectangles to CSS positioning; it does not implement a second Fit/Fill layout calculation.
- A separate **Generated PDF Preview** area with a real PDF viewer (`iframe`), output metadata, Download PDF, and Clear generated PDF controls. It accepts only a non-empty `application/pdf` Blob returned by `createImagePdf()`; it never renders source thumbnails as if they were a PDF.
- Generated PDF Object URL lifecycle: revoke the previous result before replacing it, on Clear generated PDF, on Clear All, and on page unload.
- Real engine validation/decoding/composition/finalization progress, cancellation through `AbortController`, and typed error/status presentation. Failed queue entries are identified by stable `imageId`, with `imageIndex` as a fallback.
- Thumbnail Object URLs are revoked when queue entries are removed, cleared, or the page unloads. Temporary decoded resources are closed immediately after thumbnail creation.

## Production engine integration

The UI now calls the real `createImagePdf()` engine with the ordered `{ id, file }` queue, the approved page options, an `AbortSignal`, and an `onProgress` callback. A successful result must contain the engine's non-empty `application/pdf` Blob; the UI then creates the preview/download Object URL and displays page count, filename, and file size. The UI revokes the previous PDF URL before replacement and on explicit clear, Clear All, and page unload.

The UI does not import jsPDF. The engine remains responsible for validation, decoding, page composition, output validation, and typed failures. The UI resolves a failed queue item by `imageId` first and falls back to `imageIndex`.

## Verification results

### Automated checks
- [x] `npm test` — the owner reported **180/180 tests passed**, with 0 failures and 0 cancelled tests.
- [x] `npm run build` — the owner reported a successful production build.
- [x] Focused UI layout tests use the production `calculateImagePdfPageLayout()` helper from the document engine.

### Browser checks
- [x] The owner reported that the Phase 8 integration browser checks completed successfully.
- [x] The integrated workflow was checked with the real PDF engine, including generated PDF preview and download.
- [x] Workspace switching, queue behavior, page settings, progress/cancellation, and error handling were reported as behaving as expected.
- [x] Existing image conversion and Editor workflows were reported unaffected.

The browser results above are contributor-reported verification, not an independently repeated test run in this documentation commit.

## Current status

- The production engine is merged into `main` through PR #13.
- The `phase-8-pdf-ui` branch imports the production engine directly; the mock implementation and mock test have been removed.
- Generated PDF preview and download use the non-empty `application/pdf` Blob returned by `createImagePdf()`. No fake PDF or mock download is used.
- The owner-reported automated test suite (180/180), production build, and integrated browser checks have passed.
- The final UI integration PR is the remaining collaboration/review step. Do not merge directly into `main`; the PR is for review and merge by the repository maintainer.
- Transparent background remains unavailable until its separate verification gate passes.
