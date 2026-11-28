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

## Verification plan

### Automated
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Confirm focused production-layout tests cover fixed presets, auto orientation, Image Size, per-side margins, contain/cover, invalid dimensions, transparency gating, and invalid options.

### Browser — desktop and mobile widths
- [ ] Switch between Image Format Converter and Images to PDF; confirm only the selected workspace is visible and both queues retain their state.
- [ ] Add one image and multiple images using the file picker.
- [ ] Add images using drag-and-drop.
- [ ] Confirm thumbnails, file names, sizes, and page count.
- [ ] Reorder pages up and down; verify the selected preview follows the selected queue item.
- [ ] Remove one image and clear the full queue; verify the remaining page order and previews.
- [ ] Verify A4, A5, Letter, and Image Size previews.
- [ ] Verify portrait, landscape, and auto orientation; confirm orientation is disabled for Image Size.
- [ ] Verify Fit and Fill previews for landscape and portrait sources.
- [ ] Verify uniform margins and individual top/right/bottom/left margins.
- [ ] Verify invalid margins produce a clear preview error and can be corrected.
- [ ] Verify the pre-export Layout Preview is clearly labelled as an approximation, not the final PDF.
- [ ] Switch A4/A5/Letter between Portrait and Landscape; the page outline must visibly change from taller-than-wide to wider-than-tall. Confirm Auto follows each source image's aspect ratio.
- [ ] Verify the Generated PDF Preview empty state is visible before a real export.
- [ ] After engine integration, generate a PDF and verify the embedded viewer displays the actual multi-page document.
- [ ] After engine integration, verify PDF page navigation, zoom, Download PDF, filename, and output page count.
- [ ] Verify replacing a generated PDF revokes the previous Object URL.
- [ ] Verify Clear generated PDF, Clear All, and page unload revoke the generated PDF Object URL.
- [ ] Generate PDFs from one image and a multi-image queue; verify the embedded viewer shows the actual PDF pages.
- [ ] Cancel a running export and verify the cancelled state and absence of a partial PDF.
- [ ] Trigger a failing image and verify the correct queue item is identified by its stable ID.
- [ ] Verify no transparency control is shown.
- [ ] Verify light/dark themes, keyboard focus, accessible labels, and responsive layout.
- [ ] Confirm the PDF is generated locally and the download contains a valid PDF document.
- [ ] Confirm existing image conversion, Editor, and export optimization workflows remain unaffected.

## Current status

- The UI foundation, top-level workspace selector, real engine integration, generated-PDF viewer, and download path are committed to `phase-8-pdf-ui`.
- The UI calls the production engine merged into `main` through PR #13 and no longer imports or ships the mock module.
- Focused layout tests now import the production layout helper.
- Automated tests, production build, and browser QA have not yet been rerun after this integration. Do not open the final UI PR until these checks pass.
- Real-file browser verification remains required for multi-page output, PDF navigation/download, cancellation, failure identification at the UI boundary, and Object URL cleanup.
