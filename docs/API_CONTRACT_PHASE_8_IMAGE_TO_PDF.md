# Phase 8 API Contract: Image to PDF

Status: **Approved contract for implementation**. Farrel has reviewed and approved the API behavior and UI integration boundary. The selected PDF engine is jsPDF, subject to the verification gates in Section 10. This document defines the agreed contract; it does not mean the engine has already been implemented.

Owners:
- Engine, validation, and contract: Andra (`andra-gs`)
- UI, workspace, and integration: Farrel (`FarrelPtrv`)

Branch: `phase-8-image-to-pdf`

## 1. Goal and scope

Provide a UI-independent browser API that:

1. Accepts an ordered list of image Files.
2. Creates one PDF page for each input image.
3. Supports A4, A5, Letter, and Image Size page dimensions.
4. Supports portrait, landscape, and automatic orientation for fixed page presets.
5. Supports uniform or per-side margins.
6. Supports Fit (`contain`) and Fill (`cover`) placement.
7. Reports progress, supports cancellation, and returns typed errors.
8. Returns one validated PDF Blob and page metadata.

All processing remains local in the browser. This feature belongs to the document-processing layer. Do not add PDF to the raster image capability registry or replace the existing image conversion service.

## 2. Module boundary and existing project integration

Proposed engine module:

```text
src/js/documents/image-to-pdf.js
tests/image-to-pdf.test.js
```

The engine must not import UI modules, access DOM elements, manage UI state, create download URLs, or send data to a remote service.

The engine may reuse:
- `validateImageFile(file)` from `src/js/core/file-validator.js`.
- `decodeImage(file, { format })` from `src/js/core/image-decoder.js`.

The existing decoder returns an object containing `source`, `width`, `height`, `format`, and `close()`. The engine owns each decoded result and must call `close()` in a `finally` block.

The decoder's accepted formats remain the source of truth. Do not promise support for a format merely because the PDF library accepts an image encoding. Inputs such as HEIC/HEIF, TIFF, SVG, and GIF must first pass the current project validator and decoder in the target browser. Animated GIF behavior is determined by the existing decoder; this contract creates one PDF page per selected File, not one page per GIF frame.

## 3. Main API

### 3.1 `createImagePdf`

```js
import { createImagePdf } from "../documents/image-to-pdf.js";

const result = await createImagePdf({
  images: [
    { id: "image-1", file: firstFile },
    { id: "image-2", file: secondFile }
  ],
  options: {
    pageSize: "A4",
    orientation: "portrait",
    marginMm: 10,
    fit: "contain",
    background: "white"
  },
  signal: abortController.signal,
  onProgress(progress) {
    console.log(progress);
  }
});
```

Input contract:

| Field | Type | Required | Description |
|---|---|---:|---|
| `images` | `Array<{ id: string, file: File }>` | Yes | Ordered image inputs. Array order becomes PDF page order. |
| `options` | `ImageToPdfOptions` | No | Page and placement settings. The defaults below apply when omitted. |
| `signal` | `AbortSignal` | No | Requests cancellation. |
| `onProgress` | `(progress) => void` | No | Receives progress snapshots. Exceptions thrown by this callback are ignored and must not fail the export. |

Input rules:
- Require at least one image.
- Every item must have a non-empty, unique string `id` and a File-like input accepted by the existing validator.
- Preserve the supplied array order.
- Use `id` to associate progress and errors with the UI queue item.
- Validate file content. Do not trust filename extensions or MIME types alone.
- Do not mutate, replace, or transfer ownership of the original File objects.
- Do not create or retain UI Object URLs.

### 3.2 Options and defaults

`ImageToPdfOptions`:

| Option | Type | Default | Contract |
|---|---|---|---|
| `pageSize` | `"A4" | "A5" | "LETTER" | "IMAGE"` | `"A4"` | Fixed page preset or page dimensions derived from each source image. |
| `orientation` | `"portrait" | "landscape" | "auto"` | `"portrait"` | Applies to A4, A5, and Letter. Auto selects landscape when source width is greater than source height; otherwise portrait. Ignored for Image Size. |
| `marginMm` | `number | { top?: number, right?: number, bottom?: number, left?: number }` | `10` | A number applies to all sides. In an object, an omitted side defaults to 10 mm. |
| `fit` | `"contain" | "cover"` | `"contain"` | Contain shows the full image without changing its aspect ratio. Cover fills the content area and center-crops the source. |
| `background` | `"white" | "transparent"` | `"white"` | White paints a white page background. Transparent does not paint a background and preserves supported source alpha. See Section 10. |

Validation rules:
- Reject unknown option values and non-finite numbers.
- Reject negative margins.
- Reject margins that leave no usable page content area.
- Do not silently replace invalid settings with defaults. Defaults apply only when a value is omitted.
- The UI must not expose a transparency control until the transparency verification gate in Section 10 passes. Until then, the engine must accept only `background: "white"` in the production workflow and reject `"transparent"` with `UNSUPPORTED_TRANSPARENCY`.

### 3.3 Fixed page dimensions

PDF dimensions use points, where 1 point = 1/72 inch.

| Preset | Portrait (pt) | Landscape (pt) |
|---|---:|---:|
| A4 | 595.28 × 841.89 | 841.89 × 595.28 |
| A5 | 419.53 × 595.28 | 595.28 × 419.53 |
| Letter | 612 × 792 | 792 × 612 |

The page layout helper and PDF writer must use these same dimensions. Do not independently recalculate preset dimensions in the UI or writer.

### 3.4 Image Size reference density and dimension limits

Image Size derives each page from its source pixel dimensions at a fixed reference density of **96 pixels per inch (PPI)**:

`pageWidthPt = sourceWidthPx × 72 / 96`

`pageHeightPt = sourceHeightPx × 72 / 96`

This is equivalent to 0.75 PDF points per source pixel. The page retains the source aspect ratio. Margins are measured inward from the derived page edges and affect the usable content area.

Initial safety limits:

| Limit | Maximum |
|---|---:|
| Input file size | 25 MiB per image |
| Combined input file size | 100 MiB per export |
| Page count | 50 pages |
| Source dimension | 19,200 px per side |
| Decoded pixels | 20 megapixels per image |
| Combined decoded pixels | 100 megapixels per export |
| PDF page width or height | 14,400 pt per side |

For Image Size, reject a source if either derived page dimension exceeds 14,400 pt. Do not silently downscale the page dimensions. The source dimension and pixel-count limits also apply.

These are conservative initial application limits, not a claim that every browser/device can safely process the maximum values simultaneously. Keep them centralized as named constants so they can be adjusted after real-device memory and performance testing. Enforce limits before expensive decoding whenever file metadata or safe header inspection makes that possible, then verify actual decoded dimensions.

## 4. Return value

```js
{
  blob: pdfBlob, // Blob with type "application/pdf"
  filename: "converted.pdf",
  pageCount: 2,
  pages: [
    {
      index: 0,
      sourceId: "image-1",
      sourceName: "photo-a.png",
      sourceWidth: 1920,
      sourceHeight: 1080,
      pageWidthPt: 841.89,
      pageHeightPt: 595.28
    }
  ],
  warnings: []
}
```

Rules:
- `blob` is the generated PDF and is owned by the caller.
- `pageCount` must equal `pages.length`.
- `index` is zero-based and follows input order.
- Page dimensions use PDF points.
- The engine returns a Blob, not an Object URL.
- Farrel creates and revokes preview/download Object URLs in the UI layer.
- Do not return decoded ImageBitmap, Canvas, or other temporary resources.
- Farrel owns the download filename for this first release. The engine's `filename` is a stable default value.

## 5. Page layout and preview contract

The engine exports one pure helper:

```js
import { calculateImagePdfPageLayout } from "../documents/image-to-pdf.js";

const layout = calculateImagePdfPageLayout({
  imageWidth: 1920,
  imageHeight: 1080,
  options: {
    pageSize: "A4",
    orientation: "landscape",
    marginMm: 10,
    fit: "contain"
  }
});
```

Return shape:

```js
{
  pageWidthPt: 841.89,
  pageHeightPt: 595.28,
  contentRect: {
    x: 28.35,
    y: 28.35,
    width: 785.19,
    height: 538.58
  },
  imageRect: {
    x: 28.35,
    y: 164.74,
    width: 785.19,
    height: 266.00
  },
  crop: null
}
```

Contract:
- All coordinates and dimensions use PDF points.
- Coordinate origin is the **top-left** of the page. Positive x moves right; positive y moves down.
- `contentRect` is the usable page area after margins.
- For `contain`, `imageRect` is the largest rectangle inside `contentRect` that preserves the full source aspect ratio. `crop` is `null`.
- For `cover`, `imageRect` equals `contentRect`. `crop` describes the centered source rectangle to use, in source-image pixel coordinates: `{ x, y, width, height }`.
- The helper validates dimensions and layout options and throws the same typed option/limit errors as the engine.
- The helper must be deterministic and independent of jsPDF.

**Single source of truth:** `calculateImagePdfPageLayout()` is the only authority for page dimensions, margins, contain scaling, cover cropping, and destination coordinates. The preview UI must render from its returned geometry. The PDF writer must consume the same returned geometry and crop values. Neither the UI nor the writer may implement a second Fit/Fill calculation. The writer may only adapt coordinate orientation to the PDF library; it must not change the calculated geometry.

For `cover`, the implementation may crop through a temporary canvas or an equivalent clipping operation. The crop must match the helper's `crop` rectangle exactly.

## 6. Progress and cancellation

Progress shape:

```js
{
  phase: "decoding", // "validating" | "decoding" | "composing" | "finalizing"
  completed: 1,
  total: 2,
  currentIndex: 0,
  currentId: "image-1",
  currentName: "photo-a.png"
}
```

Rules:
- `completed` and `total` are non-negative integers. `total` is the input page count.
- `completed` counts completed image items in the current phase. It resets when the phase changes.
- `currentIndex` is zero-based and may be `null` during finalization or when no specific image is active.
- `currentId` and `currentName` are `null` when there is no current image.
- Progress is a snapshot, not a promise of a linear percentage. The UI may show an indeterminate state during finalization.
- Check `signal.aborted` before work starts and between validation, decoding, composition, and serialization/output-validation steps.
- Reject cancellation with `ImageToPdfError` code `ABORTED`.
- Browser decoding, canvas encoding, and jsPDF serialization are not guaranteed to be interruptible mid-operation. Cancellation takes effect at the next safe checkpoint. Do not start the next image/page after cancellation is observed.
- Do not report successful completion or 100% until serialization and output validation have succeeded.
- Exceptions thrown by `onProgress` must be swallowed so UI callback code cannot corrupt the engine operation.

## 7. Error contract and failure behavior

Errors are instances of `ImageToPdfError` with this public shape:

```js
{
  name: "ImageToPdfError",
  code: "IMAGE_DECODE_FAILED",
  message: "The selected image could not be decoded.",
  imageId: "image-2",
  imageIndex: 1,
  cause: originalError
}
```

`imageId` and `imageIndex` are present whenever the failure belongs to a specific input. They are `null` for errors unrelated to a particular image. Preserve the original exception as `cause` for debugging. Do not show raw stack traces in user-facing UI.

| Code | Meaning |
|---|---|
| `INVALID_INPUT` | Missing/empty image list, duplicate or invalid ID, invalid item, or unsupported input shape. |
| `INVALID_IMAGE` | Empty, malformed, or unsupported image file. |
| `IMAGE_DECODE_FAILED` | Existing project decoder cannot decode the selected file. |
| `INVALID_OPTIONS` | Invalid page preset, orientation, fit, background, or margin values. |
| `LIMIT_EXCEEDED` | Input size, page count, source dimension, pixel, or page-dimension limit exceeded. |
| `PDF_GENERATION_FAILED` | Page composition, image embedding, or PDF serialization failed. |
| `PDF_VALIDATION_FAILED` | Output is empty, has an invalid PDF signature, has a mismatched page count, or fails another required output check. |
| `ABORTED` | Caller cancelled the operation. |
| `UNSUPPORTED_TRANSPARENCY` | Transparency has not passed the required verification or cannot be preserved for the requested source/operation. |

**Fail-fast is mandatory.** If any image fails validation, decoding, composition, or embedding:
- Abort the entire export.
- Reject with a typed error.
- Include the failed image's `imageId` and zero-based `imageIndex`.
- Do not omit the failed page.
- Do not return a partial PDF Blob.
- Release all resources acquired for earlier pages and the failing page.

The UI identifies the failed queue item and lets the user remove or replace it before retrying.

## 8. Resource ownership, memory, and privacy

- All file reads, decoding, canvas work, PDF composition, and serialization happen locally in the browser.
- Never send source image bytes, thumbnails, generated pages, or PDF data to a remote API.
- The engine owns each decoded image resource and calls `close()` in `finally`.
- Release temporary canvases, ImageBitmap objects, typed arrays, PNG buffers, and library-specific temporary buffers as soon as possible.
- Clear temporary canvas dimensions when the canvas is no longer needed.
- Decode, compose, and release one image at a time. Do not retain all full-resolution decoded sources simultaneously.
- The PDF library necessarily retains enough embedded image/document data to serialize the complete output. The input and total-pixel limits therefore remain mandatory even with sequential decoding.
- Do not retain source File references after the operation completes.
- The caller owns the returned PDF Blob and any Object URLs it creates.
- Cancellation and all error paths use the same cleanup path.

## 9. Output validation

Before returning success:
- Confirm the result is a non-empty Blob.
- Confirm the Blob MIME type is `application/pdf`.
- Inspect the PDF header/signature rather than trusting MIME type alone.
- Confirm the generated page count matches the number of input images.
- Confirm metadata page count and actual serialized page count agree using a reliable local check.
- Verify representative outputs in independent PDF viewers during real-file testing.

Do not add another large PDF dependency solely for a superficial signature check. Use jsPDF's available document/output information plus a lightweight local structural check where needed.

## 10. PDF library evaluation and decision

Evaluation date: 2026-11-28.

### 10.1 Comparison

| Criterion | pdf-lib | jsPDF |
|---|---|---|
| Current package version reviewed | 1.17.1 | 4.2.1 |
| Primary fit | General PDF creation and modification, including page operations and forms | Client-side PDF creation with direct image placement and page layout APIs |
| Browser compatibility | Designed for modern JavaScript environments; project documentation lists browser testing | Provides browser builds and ES module entry points; designed for client-side PDF generation |
| Image input | `embedJpg()` and `embedPng()` accept byte arrays/ArrayBuffers | `addImage()` accepts Canvas, typed image data, and RGBA data |
| Page sizing | Custom page dimensions through PDF page APIs | Preset and custom page dimensions through constructor/page APIs |
| Transparency evidence | PNG embedder writes an alpha soft mask (`SMask`) when PNG alpha exists | PNG image pipeline writes an `SMask` when parsed image data has an alpha mask; RGBA input is also supported |
| Bundle size reference | 419 kB minified; 173.3 kB minified + gzip | 394.3 kB minified; 126.7 kB minified + gzip |
| Licensing | MIT | MIT |
| Maintenance signal | npm version 1.17.1 is an older release; the package page reviewed reports it was published several years ago | npm version 4.2.1 is a newer release; the npm page reviewed lists MIT and a 2026 release |
| Memory considerations | Builds a document object and serializes the completed document to bytes; embedded image/document data remains in memory until save | Builds a document object and serializes the completed document; embedded image/document data remains in memory until output |
| Best fit for this phase | More useful if the project needs broader PDF modification and page manipulation | Better match for image-to-PDF generation with direct image placement and custom page geometry |

Bundle figures are third-party Bundlephobia measurements for the package versions shown, not measurements from this repository's Vite production build. Actual shipped size depends on import paths, tree-shaking, Vite output, and compression.

Neither library removes the browser's memory constraints. Both retain the PDF document and embedded image data until serialization. Sequential decoding limits simultaneous decoded-source memory, but does not make the final document generation streaming or constant-memory.

### 10.2 Decision: use jsPDF

Use **jsPDF 4.2.1** as the Phase 8 PDF generation engine.

Reasons:
1. The task is image-to-PDF creation, which maps directly to jsPDF's page and `addImage()` APIs.
2. Its reviewed minified + gzip package measurement is smaller than pdf-lib's measurement.
3. It provides browser-focused builds and accepts canvas/image data suitable for the current browser decoder pipeline.
4. The reviewed package release is newer and shows a stronger recent maintenance signal than pdf-lib 1.17.1.
5. Both candidates use MIT licensing, so licensing does not distinguish them for this project.

Do not add both libraries. Do not add jsPDF to the UI layer. Import it only from the document engine module. Pin the selected version in the package manifest/lockfile when implementation begins, and verify the production Vite chunk impact after installation.

### 10.3 Transparency behavior and verification gate

The library source provides technical support for alpha:
- jsPDF's PNG embedding code emits a PDF soft mask (`SMask`) when the parsed image has an alpha mask.
- Its public `addImage()` API accepts PNG data and RGBA data.

The agreed contract behavior is:
- Default `background: "white"`: paint an explicit white page background before drawing the image.
- Optional `background: "transparent"`: do not paint a page background; preserve alpha in source pixels when the input normalization and jsPDF path retain it.
- JPEG and other sources without alpha remain opaque.
- A PDF page with no painted background is not the same as a guaranteed transparent page in every viewer or print workflow. The feature means source-image alpha is retained; viewers may display unpainted page areas as white.
- Do not expose the transparent option in production UI until a real generated PDF containing semi-transparent and fully transparent pixels passes verification in at least two independent PDF viewers. Include a fixture with a checkerboard/background behind the transparent source to detect incorrect flattening.
- If the test fails or behaves inconsistently, keep white as the only supported option and reject transparent mode with `UNSUPPORTED_TRANSPARENCY`. Do not present a non-working control.

This is a source-code-backed capability assessment, not a claim that the runtime fixture test has already passed. The verification gate remains open until the implementation and real-file tests are complete.

### 10.4 Required implementation verification

Before merging the engine PR:
- Verify supported browser versions used by the project, including the target mobile browser.
- Measure actual Vite production chunk contribution after installation.
- Test small, typical, and near-limit image batches on desktop and mobile-class hardware.
- Record peak memory behavior where measurable, serialization time, and cancellation response time.
- Test PNG alpha, fully transparent pixels, semi-transparent edges, and white background behavior in independent PDF viewers.
- Confirm MIT license notice handling in the dependency/package distribution.
- Run the existing test suite and production build.

## 11. Responsibilities and integration sequence

### Farrel: UI

Farrel owns:
1. Ordered image queue with stable IDs.
2. Add, remove, and reorder interactions.
3. Thumbnails and source filenames.
4. Page size, orientation, margin, Fit/Fill, and background controls.
5. Page preview rendered from `calculateImagePdfPageLayout()`.
6. Export initiation and progress presentation.
7. Cancel action using `AbortController`.
8. Error presentation associated with the failed image.
9. Download and preview URL creation/revocation.
10. Local-only document workflow.

Farrel must not:
- Import jsPDF directly into UI code.
- Reimplement image decoding, page geometry, Fit/Fill calculations, or PDF composition.
- Modify the existing image conversion service or raster capability registry to add PDF.
- Show the transparency control before its verification gate passes.
- Treat a preview mock as proof that PDF generation works.

### Andra: engine

Andra owns:
1. Add jsPDF to the document engine only.
2. Implement input validation, limits, and page geometry.
3. Implement sequential decode, placement, PDF generation, and output validation.
4. Implement progress, cancellation checkpoints, fail-fast errors, and cleanup.
5. Add automated tests for page presets, orientation, Image Size, margins, contain/cover, invalid inputs, fail-fast behavior, cancellation, and resource cleanup.
6. Add transparency tests and enable the option only if the gate passes.
7. Verify real files and generated PDFs in independent viewers.
8. Update the technical specification and development log after implementation decisions and tests are confirmed.

### Integration sequence

- Farrel may continue UI development on `phase-8-pdf-ui` against this approved contract and mock implementation.
- Andra develops and tests the engine on `phase-8-image-to-pdf`.
- The engine PR must be reviewed and merged into `main` first.
- Farrel updates the UI branch from the latest `main`, replaces the mock with the merged engine API, and opens the UI integration PR.
- Do not merge the UI integration before the engine PR is merged.
- No architecture or dependency changes outside this contract without discussion.

## 12. Status and change control

- [x] Phase 8 engine branch created from the latest `main`.
- [x] Initial API proposal drafted.
- [x] Farrel reviewed and approved the API behavior and responsibility split.
- [x] Page size, fail-fast, Fit/Fill, margins, and default background decisions recorded.
- [x] Reference density and initial safety limits defined.
- [x] Shared page-layout source of truth defined.
- [x] pdf-lib and jsPDF evaluated.
- [x] jsPDF selected as the Phase 8 engine.
- [x] Transparency behavior and verification gate documented.
- [x] Initial engine module and automated tests implemented on `phase-8-image-to-pdf`.
- [x] Manual browser QA harness and verification checklist added.
- [ ] Verify transparency in real generated PDFs.
- [ ] Measure actual production bundle and memory behavior.
- [ ] Complete real-browser QA with representative files and independent PDF viewers, then open/merge the engine PR to `main`.
- [ ] Integrate Farrel's UI branch after the engine merge.

jsPDF 4.2.1 is pinned and the initial engine module and automated tests are implemented on `phase-8-image-to-pdf`. GitHub Actions has passed `npm ci`, `npm test`, and `npm run build`. Real-browser output checks, independent PDF viewer verification, transparency tests, and actual bundle/memory measurements remain pending. No PDF feature has been merged into `main` yet.

Any change to the public API, defaults, progress semantics, error shape, limits, or resource ownership must be discussed and agreed by Andra and Farrel before implementation or integration changes.
