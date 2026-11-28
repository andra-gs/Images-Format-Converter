# Phase 8 Engine Browser QA

This checklist is for the Image to PDF engine on branch `phase-8-image-to-pdf`. It is not a release sign-off. Record actual results before marking Phase 8 complete.

## Run the browser harness

1. Check out `phase-8-image-to-pdf`.
2. Run `npm ci`.
3. Run `npm run dev`.
4. Open `http://localhost:5173/tests/browser-image-to-pdf.html`.
5. Select representative image files and generate a PDF.
6. Open the generated PDF in the embedded preview and download it for independent viewer checks.

The harness uses the production `createImagePdf()` API. All processing stays in the browser.

## Required checks

- [ ] One PNG creates a one-page PDF.
- [ ] Multiple mixed-format images create pages in the same order as the selected files.
- [ ] A4, A5, Letter, and Image Size produce the expected physical page dimensions.
- [ ] Image Size uses 96 PPI and preserves source aspect ratio.
- [ ] Auto orientation creates portrait and landscape pages according to each source image.
- [ ] Uniform margins are applied equally to all sides.
- [ ] Fit / Contain shows the complete image without distortion.
- [ ] Fill / Cover crops from the center and fills the content area.
- [ ] Mixed portrait and landscape inputs produce correct individual page sizes.
- [ ] Invalid or unsupported image input stops the entire export and identifies its queue item.
- [ ] Cancel stops at the next safe checkpoint and releases decoded resources.
- [ ] Generated PDF opens in at least two independent PDF viewers.
- [ ] Page count, page order, page dimensions, and visual placement match the selected settings.
- [ ] Verify the result in a desktop browser and a mobile-class browser/device.
- [ ] Test small, typical, and near-limit batches. Record generation time, observed memory behavior, and any browser instability.

## Format coverage

Test each format only where the existing project validator and decoder support it in the target browser:

- [ ] PNG
- [ ] JPEG
- [ ] WebP
- [ ] BMP
- [ ] HEIC / HEIF
- [ ] TIFF (the existing decoder renders the first TIFF page)
- [ ] SVG (sanitized and rasterized)
- [ ] GIF (the existing decoder renders the first frame)

## Transparency gate

Transparent output is intentionally disabled. Do not add a UI option until the following checks pass:

- [ ] Semi-transparent PNG edges retain their alpha behavior in the generated PDF.
- [ ] Fully transparent pixels do not become opaque black or another unexpected color.
- [ ] A transparent source is inspected in at least two independent PDF viewers.
- [ ] The PDF's unpainted page areas behave consistently with the documented viewer/print limitations.

If any test fails or viewer behavior is inconsistent, keep white as the only supported page background and record the limitation.

## Result record

Record:
- Browser and version
- Operating system and device class
- Source formats, dimensions, and file sizes
- Page settings used
- PDF file size and page count
- Independent PDF viewers used
- Pass/fail result and screenshots for visual discrepancies
- Observed memory/performance issues

Do not mark the engine as fully verified until the required checks have actual results.
