# Phase 9 API Contract: PDF to Image

Status: **Draft for team review. Not approved for implementation or UI integration yet.**

Owners:
- PDF loading, rendering, validation, limits, and engine contract: Andra (`andra-gs`)
- PDF upload, page selection, preview, output settings, and UI integration: Farrel (`FarrelPtrv`)

Feature branch: `phase-9-pdf-engine`
Target: `main`

## 1. Goal and boundaries

Provide a UI-independent, browser-local engine that loads one PDF, exposes page metadata, and renders requested pages to pixel data for PNG, JPEG, or WebP export.

The engine owns:
- PDF file validation and loading through PDF.js.
- Page count, dimensions, and intrinsic rotation metadata.
- Rendering an individual page at a requested DPI.
- Page, pixel, dimension, and file-size limits.
- Cancellation, typed errors, and PDF.js resource cleanup.
- An adapter result that can be passed to the existing image encoder.

Farrel owns:
- PDF upload and document queue.
- Page thumbnails, selection, and page ordering in the UI.
- Output format, DPI, and JPEG/WebP quality controls.
- Preview presentation, progress display, per-page error presentation, downloads, and ZIP export.

The engine must not import UI modules, manage DOM state, create download Object URLs, or implement a second image encoder. PDF remains in `src/js/documents/`, not in the raster image capability registry.

All PDF bytes and rendered page data remain local. Do not use remote URLs, CDN workers, remote fonts, or conversion APIs at runtime.

## 2. PDF.js evaluation

### Preliminary recommendation

Use the Mozilla-maintained `pdfjs-dist` package as the primary candidate. The current stable release reviewed on 2026-11-28 is `6.5.438`.

- License: Apache-2.0.
- NPM package metadata: no declared runtime dependencies.
- Published modern distribution archive: approximately 6.5 MB.
- Third-party package analysis reports approximately 434 KiB minified and 129.5 KiB minified + gzip for the main minified package measurement. This is not the final Vite bundle size.
- The package declares Node.js `>=22.13.0 || >=24`. Confirm the local and CI Node versions before installation.
- PDF.js provides separate display and core worker modules. The worker must match the display package version. The current API also documents an optional renderer-worker path; evaluate it separately rather than assuming it is required for the first implementation.
- Vite should emit the worker as a local build asset. Do not load it from a CDN.
- PDF.js documents CMaps as required core assets for some documents, plus configurable standard-font, ICC, and WASM asset directories. Their local delivery strategy must be tested and documented.
- The official project documents a modern build and a separate legacy build. Actual browser support must be verified against this application's supported browser matrix.

This is a recommendation, not a completed compatibility approval. Before pinning the dependency, verify:
1. Vite production worker resolution and emitted asset URL.
2. CMap and standard-font asset handling for PDFs that need them.
3. Fonts, Unicode text, embedded fonts, rotated pages, mixed page sizes, and representative real PDFs.
4. Actual production bundle contribution and first-load behavior.
5. Browser compatibility and memory use on representative devices.

Official references:
- PDF.js getting started: https://mozilla.github.io/pdf.js/getting_started/
- PDF.js releases: https://github.com/mozilla/pdf.js/releases
- NPM package: https://www.npmjs.com/package/pdfjs-dist
- License: https://github.com/mozilla/pdf.js/blob/master/LICENSE

## 3. Proposed module boundary

Proposed files:

```text
src/js/documents/pdf-to-image.js
src/js/documents/pdfjs-runtime.js
tests/pdf-to-image.test.js
tests/browser-pdf-to-image.html
tests/browser-pdf-to-image.js
docs/PHASE_9_API_CONTRACT.md
```

`pdfjs-runtime.js` is the only module that imports `pdfjs-dist` and configures its local worker asset. Keep the engine testable by injecting a PDF.js adapter into an internal factory or equivalent seam. Node unit tests must not depend on Vite's `?url` import handling.

Do not create empty files before implementation. The paths above are proposed locations and may change if the existing repository structure requires it.

## 4. Proposed public API

### 4.1 Open a PDF

```js
import { openPdfDocument } from "../documents/pdf-to-image.js";

const document = await openPdfDocument(file, {
  password,
  signal: abortController.signal,
  onProgress(snapshot) {
    // { phase: "loading", loaded, total }
  }
});
```

Input:

| Field | Type | Required | Description |
|---|---|---:|---|
| `file` | `File | Blob` | Yes | A local, non-empty PDF file. |
| `password` | `string` | No | Initial password supplied by the user for a protected PDF. Keep it in memory only. |
| `onPassword` | `(request) => Promise<string | null>` | No | Optional UI callback used when PDF.js requests or rejects a password. The request contains a normalized reason: `required` or `incorrect`. Return a password to retry, or `null` to cancel. |
| `signal` | `AbortSignal` | No | Requests cancellation during loading. |
| `onProgress` | `(snapshot) => void` | No | Receives loading progress. Callback exceptions must not interrupt the engine. |

The engine reads the supplied Blob locally and passes its bytes to PDF.js. It must not pass a remote URL to `getDocument()`. If PDF.js requests a password, bridge its `onPassword` callback to the optional `onPassword` UI callback. If no callback is supplied or the user cancels, reject with `PASSWORD_REQUIRED` or `INCORRECT_PASSWORD` as appropriate.

The returned document session:

```js
{
  numPages: 12,
  fingerprint: "optional-pdf-fingerprint",
  async getPageInfo(pageNumber) {},
  async renderPage(pageNumber, { dpi, signal, onProgress } = {}) {},
  async destroy() {}
}
```

Rules:
- `numPages` is the PDF.js page count.
- Page numbers are one-based, matching PDF.js.
- `getPageInfo(pageNumber)` returns `{ pageNumber, widthPt, heightPt, rotation }`.
- Page dimensions use PDF points at scale 1 and include the page's intrinsic rotation.
- `destroy()` is idempotent and releases the PDF.js document/loading task and worker resources owned by this session.
- The caller must call `destroy()` in a `finally` block when the document is no longer needed.
- A document session must reject new work after it has been destroyed.
- Passwords must never be persisted, logged, or transmitted.

### 4.2 Render one page

```js
const rendered = await document.renderPage(1, {
  dpi: 150,
  signal: abortController.signal,
  onProgress(snapshot) {
    // { phase: "rendering", pageNumber: 1 }
  }
});
```

Return shape:

```js
{
  pageNumber: 1,
  dpi: 150,
  width: 1275,
  height: 1650,
  rotation: 0,
  imageData: ImageData
}
```

Rules:
- Default DPI: 150.
- DPI is an explicit output resolution, not a CSS display scale or devicePixelRatio.
- PDF.js uses 72 PDF points per inch. The render scale is `dpi / 72`.
- Output dimensions are the integer pixel dimensions of the resulting viewport.
- Respect the page's intrinsic rotation.
- Render only the requested page. Do not render every page during document loading.
- The engine uses a temporary Canvas, extracts ImageData, then clears and releases the Canvas before returning.
- The returned ImageData belongs to the caller. The UI/integration layer must release references when the page is no longer needed.
- Do not retain all rendered pages in the engine session.
- Rendering cancellation must cancel the active PDF.js render task and reject with `ABORTED`.

### 4.3 Existing image encoder bridge

The proposed integration uses the existing API:

```js
import { convertImageDataToFormat } from "../core/conversion-service.js";

const result = await convertImageDataToFormat(rendered.imageData, "jpeg", {
  quality: 0.85,
  backgroundColor: "#ffffff"
});
```

Supported output values for this workflow:
- `"png"`: no quality option.
- `"jpeg"`: quality from 0 to 1; composite transparent pixels onto white.
- `"webp"`: quality from 0 to 1; verify the actual browser MIME type.

The existing conversion service validates the output signature, MIME type, decoded output, and dimensions. Do not duplicate that validation in the PDF engine.

The existing optimizer accepts a File/Blob or an object containing an original File/Blob and ImageData. A PDF page does not have an original image File. Do not pass the whole PDF Blob as the optimizer's source because its byte size is not a meaningful per-page raster source-size metric. A page-specific optimizer adapter may be proposed later if it can use the rendered page's actual raster representation and preserve accurate size reporting. Target-size optimization is therefore outside this initial contract.

## 5. Resolution and resource limits

The following are conservative proposed starting limits. They must be confirmed with real-browser memory tests before being treated as final production limits.

| Limit | Proposed value |
|---|---:|
| PDF input size | 50 MiB per file |
| Maximum page count | 100 pages |
| Default output resolution | 150 DPI |
| Minimum requested DPI | 72 |
| Maximum requested DPI | 600, subject to pixel limits |
| Maximum output dimension | 8,192 px per side |
| Maximum pixels per rendered page | 16 megapixels |
| Maximum total pixels in one export job | 100 megapixels |
| Concurrent page renders | 1 |

Validation must calculate the output viewport dimensions before allocating a Canvas. Reject a page if the requested DPI exceeds any dimension or pixel limit. Do not silently reduce the user's requested DPI.

Process selected pages sequentially. The UI may queue multiple PDF files, but the initial engine contract does not permit concurrent full-resolution page renders. Do not retain rendered ImageData after the page has been encoded or downloaded.

These limits are not guarantees that every device can safely reach the maximum. Adjust them only after representative desktop and mobile memory testing.

## 6. Page selection and batch behavior

The engine opens one PDF document at a time and renders one requested page per call. It does not own the UI's page-selection model or batch queue.

Farrel may provide a list of selected one-based page numbers and call `renderPage()` sequentially. The UI is responsible for preserving the user's selected order, displaying page-level progress, isolating per-page failures, and continuing or stopping according to the agreed UI behavior.

The engine rejects page numbers that are not integers or fall outside `1..numPages`.

## 7. Progress and cancellation

Proposed progress snapshots:

Loading:
```js
{ phase: "loading", loaded: 1024, total: 4096 }
```

Rendering:
```js
{ phase: "rendering", pageNumber: 3 }
```

Rules:
- Progress is informational and may be indeterminate when PDF.js does not expose a reliable total.
- Check cancellation before reading, after reading, before page retrieval, before rendering, and after the render task settles.
- Attach the AbortSignal to the active loading/rendering operation and clean up event listeners after completion.
- Use PDF.js loading-task destruction and render-task cancellation where supported.
- Cancellation rejects with a typed `PdfToImageError` using code `ABORTED`.
- Do not report a page as complete until rendering and ImageData extraction succeed.
- Swallow exceptions thrown by progress callbacks.

## 8. Error contract

Errors are instances of `PdfToImageError`:

```js
{
  name: "PdfToImageError",
  code: "INVALID_PDF",
  message: "The selected file is not a valid PDF.",
  pageNumber: null,
  cause: originalError
}
```

Proposed codes:

| Code | Meaning |
|---|---|
| `INVALID_INPUT` | Missing, empty, or invalid File/Blob input. |
| `INVALID_PDF` | Invalid PDF signature, malformed structure, or PDF.js could not parse the document. |
| `PASSWORD_REQUIRED` | The PDF is encrypted and requires a password. |
| `INCORRECT_PASSWORD` | The supplied password is incorrect. |
| `UNSUPPORTED_PDF` | A required PDF feature cannot be rendered by the selected PDF.js configuration. |
| `INVALID_PAGE` | Page number is not an integer or is outside the document range. |
| `INVALID_OPTIONS` | Invalid DPI or unsupported render options. |
| `LIMIT_EXCEEDED` | File size, page count, output dimension, page pixel, or total pixel limit exceeded. |
| `RENDER_FAILED` | PDF.js failed to render the requested page. |
| `IMAGE_EXPORT_FAILED` | The rendered page could not be encoded or validated by the existing image pipeline. |
| `ABORTED` | The caller cancelled loading or rendering. |

Map PDF.js password exceptions to the password-specific codes. Keep the original exception as `cause`. Do not expose stack traces or internal PDF object data in the UI.

A malformed or unsupported page should identify its one-based `pageNumber` when known. A page failure must not leak its Canvas or prevent the document session from being destroyed.

## 9. Resource ownership and privacy

- The engine owns the PDF.js loading task, PDF document proxy, render tasks, and temporary rendering Canvas.
- The engine destroys the PDF.js document and clears temporary Canvas dimensions on success, error, and cancellation.
- The caller owns returned ImageData and must release references after use.
- The caller owns generated output Blobs and any Object URLs.
- Do not retain every page's ImageData or Canvas in the document session.
- Do not persist passwords or document contents.
- No PDF bytes, rendered pixels, extracted text, metadata, fonts, or page images may be sent to remote services.
- Keep the worker and any required CMap/font assets local to the application build.

## 10. Test and acceptance plan

Automated tests:
- Empty/non-Blob input and invalid PDF header.
- Valid PDF load and page count.
- Page metadata for portrait, landscape, mixed-size, and intrinsically rotated pages.
- Page-number validation.
- DPI-to-pixel calculations and dimension/pixel boundaries.
- Correct page selection and render order.
- Password required and incorrect password mapping.
- Malformed and unsupported PDF failures.
- Cancellation during load and render.
- Progress callback exceptions.
- Temporary Canvas cleanup on success and every failure path.
- Document session destruction and idempotency.
- Adapter output format, MIME/signature validation, and dimensions through the existing image conversion service.

Real-PDF browser fixtures:
- Simple text and vector shapes.
- Embedded fonts and standard fonts.
- Unicode text, including Indonesian characters and a CJK/CID-font sample.
- Scanned/image-only PDF.
- Mixed page sizes and page rotations.
- Transparent or unusual page content where applicable.
- Password-protected PDF.
- Corrupt/truncated PDF.
- Large page count and high-resolution pages.

Acceptance gate:
- Selected pages render in correct order, orientation, and dimensions.
- PNG, JPEG, and WebP outputs open in independent image viewers.
- The worker and any font/CMap assets load from local build assets.
- No document bytes are sent over the network.
- Sequential rendering stays within the documented limits and releases resources.
- Automated tests, real-browser tests, and production build pass.

## 11. Decisions requiring team review

1. Confirm the proposed public API and ownership boundary.
2. Confirm initial file/page/DPI/pixel limits after a real-device memory test.
3. Confirm the PDF.js core worker, optional renderer worker, and CMap/standard-font/ICC/WASM asset strategy.
4. Confirm the UI password-entry/retry flow and the `onPassword` callback contract.
5. Confirm whether page-level quality presets/target-size optimization should be a later adapter or remain outside Phase 9.

Until these points are reviewed, this document remains a draft. Do not treat the API as approved and do not begin UI integration against it.
