# Phase 8 — Image to PDF UI

## Ownership and branch

- Owner: `FarrelPtrv`
- Branch: `phase-8-pdf-ui`
- Base: `main` at kickoff commit `098bc6c23d0d544c10d9b09e373f211bc719ee03`
- UI module: `src/js/ui/image-to-pdf-panel.js`
- Contract mock: `src/js/ui/image-to-pdf-mock.js`
- Stylesheet: `src/styles/image-to-pdf.css`
- Focused tests: `tests/image-to-pdf-ui-mock.test.js`

## Shared API contract

The UI follows the approved `docs/API_CONTRACT_PHASE_8_IMAGE_TO_PDF.md` contract on Andra's `phase-8-image-to-pdf` branch. The approved public functions are:

- `calculateImagePdfPageLayout({ imageWidth, imageHeight, options })`
- `createImagePdf({ images, options, signal, onProgress })`

The UI mock is intentionally isolated in its own module. It does not import jsPDF, decode image content for PDF composition, or produce a PDF document. The mock returns an explicit mock result so the UI can be developed without implying that export is already functional.

## Implemented UI scope

- Dedicated Image to PDF workspace mounted separately from the existing image conversion workflow.
- Multiple image selection and drag-and-drop.
- Stable queue IDs, local thumbnails, file names, and file sizes.
- Remove, clear, and move-up/move-down controls for page ordering.
- A pre-export **Layout Preview** for the selected source image. This is explicitly an approximation and must never be described as a generated PDF page.
- A4, A5, Letter, and Image Size (96 PPI) controls.
- Portrait, landscape, and auto orientation for fixed page presets; disabled for Image Size.
- Fit (`contain`) and Fill (`cover`) settings.
- Uniform margin and per-side margin controls.
- White page background only. Transparency is intentionally not exposed before the contract's two-viewer verification gate passes.
- Preview geometry is requested from the mock `calculateImagePdfPageLayout()` function. The UI maps its returned page and image rectangles to CSS positioning; it does not implement a second Fit/Fill layout calculation.
- A separate **Generated PDF Preview** area with a real PDF viewer (`iframe`), output metadata, Download PDF, and Clear generated PDF controls. It accepts only a non-empty `application/pdf` Blob returned by `createImagePdf()`; it never renders source thumbnails as if they were a PDF.
- Generated PDF Object URL lifecycle: revoke the previous result before replacing it, on Clear generated PDF, on Clear All, and on page unload.
- Mock validation/decoding/composition/finalization progress, cancellation through `AbortController`, and error/status presentation.
- Thumbnail Object URLs are revoked when queue entries are removed, cleared, or the page unloads. Temporary decoded resources are closed immediately after thumbnail creation.

## Explicit mock boundary

The current export action remains a temporary mock. It simulates the contract lifecycle and progress events but does not create a PDF Blob. The Generated PDF Preview therefore remains in its honest empty state; no fake PDF or download is offered. The viewer/download path is wired to accept the real engine result once integration occurs.

After Andra's engine PR is merged into `main`, update this branch from latest `main`, replace the mock import with the approved engine module, and verify that the returned Blob opens in the embedded PDF viewer and downloads correctly. Verify multi-page navigation in the browser PDF viewer and URL cleanup. Do not import jsPDF into this UI module.

## Verification plan

### Automated
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Confirm focused layout mock tests cover fixed presets, auto orientation, Image Size, per-side margins, contain/cover, invalid dimensions, and page limits.

### Browser — desktop and mobile widths
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
- [ ] While still on the mock, verify the mock does not populate the PDF viewer or expose a download.
- [ ] Cancel a running mock export and verify the cancelled state.
- [ ] Verify no transparency control is shown.
- [ ] Verify light/dark themes, keyboard focus, accessible labels, and responsive layout.
- [ ] Confirm the mock does not create or download a PDF.
- [ ] Confirm existing image conversion, Editor, and export optimization workflows remain unaffected.

## Current status

UI foundation and isolated mock have been committed to this feature branch. Automated tests, production build, and browser checks have **not** been run in this environment. Real PDF generation and download remain blocked on Andra's engine implementation and merge to `main`. Browser QA for the real PDF viewer is explicitly deferred until the engine returns an actual PDF Blob.
