# Phase 6 Image Optimization API Proposal

**Status:** Proposed shared contract, approved by the project owner for implementation planning.  
**Owners:** `andra-gs` (optimizer), `FarrelPtrv` (export UI).  
**Implementation status:** Not implemented. This document defines the contract to use before feature coding and integration.

## 1. Purpose and boundaries

The Image Optimization Engine provides one public API for format-aware export settings, quality presets, optional target-size attempts, actual size measurements, and output validation.

It must reuse the existing conversion service and encoder. It must not introduce a second decoder, encoder, conversion pipeline, backend, or external conversion API. All image processing remains local in the browser.

The optimizer owns optimization policy. The Export UI owns controls, presentation, per-file orchestration, individual downloads, and ZIP export.

## 2. Existing conversion paths to reuse

The current `src/js/core/conversion-service.js` exposes:

- `convertImageToPng(file)`
- `convertImageToJpeg(file, { quality, backgroundColor })`
- `convertImageToWebp(file, { quality })`
- `convertImageToBmp(file)`
- `convertImageToTiff(file)`
- `convertImageToSvg(file)`
- `convertImageToGif(file)`
- `convertImageDataToFormat(imageData, format, options)` for edited ImageData, supporting PNG, JPEG, WebP, BMP, TIFF, and SVG.

These service paths already encode and validate output signatures, decode the generated output again, and check dimensions. The optimizer must use these paths rather than calling `encodeImage()` directly or implementing parallel validation.

Animated GIF must continue through the existing File-based GIF path. Do not route edited ImageData to GIF because the current edited-ImageData service does not support GIF and the File-based GIF path preserves animated GIF behavior.

## 3. Public API

Implement the following named export in `src/js/core/image-optimizer.js`:

```js
export async function optimizeImage(source, options)
```

### 3.1 Source argument

For an unedited image, pass a `File` or `Blob`.

For an edited image, pass an object containing the original file and the current edited ImageData:

```js
{
  file: File,
  imageData: ImageData
}
```

The original file remains the source of truth for `sourceBytes`. The optimizer must not mutate the File, Blob, or ImageData supplied by the caller.

This dual input supports both the existing File/Blob conversion flow and the Editor's existing `convertImageDataToFormat()` handoff. Do not silently ignore edited pixels and convert the original file instead.

### 3.2 Options

```js
{
  format: "webp",
  optimization: {
    mode: "preset",
    preset: "medium"
  },
  backgroundColor: "#ffffff"
}
```

| Property | Type | Required | Description |
|---|---|---:|---|
| `format` | string | Yes | Output format: `png`, `jpeg`, `webp`, `bmp`, `tiff`, `svg`, or `gif`, subject to existing conversion support |
| `optimization.mode` | string | Yes | `none`, `preset`, or `target-size` |
| `optimization.preset` | string | For preset mode | `low`, `medium`, or `high` |
| `optimization.targetBytes` | number | For target-size mode | Positive target size in bytes |
| `backgroundColor` | string | No | JPEG background color; defaults to `#ffffff` |

Unknown properties must be rejected. Preset and target-size settings are mutually exclusive. The `optimization` object is required so the caller must explicitly select a mode.

### 3.3 Examples

Preset:

```js
const result = await optimizeImage(file, {
  format: "webp",
  optimization: { mode: "preset", preset: "high" }
});
```

Target size:

```js
const result = await optimizeImage(file, {
  format: "jpeg",
  optimization: {
    mode: "target-size",
    targetBytes: 500 * 1024
  }
});
```

No optimization:

```js
const result = await optimizeImage(file, {
  format: "png",
  optimization: { mode: "none" }
});
```

Edited ImageData:

```js
const result = await optimizeImage(
  { file: originalFile, imageData: editedImageData },
  {
    format: "webp",
    optimization: { mode: "preset", preset: "medium" }
  }
);
```

## 4. Initial format capability matrix

The UI must expose only capabilities implemented and verified by the optimizer. This is the initial plan, not a claim that all entries are already implemented.

| Output format | Quality presets | Target-size attempts | Initial behavior |
|---|---:|---:|---|
| JPEG | Yes | Yes | Uses existing JPEG Canvas encoder quality option |
| WebP | Yes | Yes | Uses existing WebP Canvas encoder quality option |
| PNG | No | No | Existing PNG encoder; mode `none` |
| BMP | No | No | Existing 24-bit encoder; mode `none` |
| TIFF | No | No | Existing baseline uncompressed encoder; mode `none` |
| GIF | No | No | Existing GIF conversion path; mode `none` |
| SVG | No | No | Existing SVG wrapper with embedded PNG; mode `none` |

HEIC/HEIF are input formats only in the current project and are not valid output formats for this API.

PNG lossless optimization or any additional format capability must not be exposed unless a real implementation is added and verified.

## 5. Preset mapping

Initial proposed quality values for JPEG and WebP:

| Preset | Encoder quality |
|---|---:|
| Low | 0.55 |
| Medium | 0.75 |
| High | 0.90 |

These are starting values, not universal visual-quality guarantees. JPEG and WebP quality scales are format-specific and must not be described as visually equivalent.

The mapping must live in the optimizer module, not in the UI. Tests must verify the exact quality value passed to the existing conversion service.

## 6. Target-size algorithm

Target-size mode is initially available only for JPEG and WebP.

Proposed initial search configuration:

- Minimum quality: `0.10`.
- Maximum quality: `0.95`.
- Maximum encoding attempts: `7`.
- Measure each candidate using the actual returned `Blob.size`.
- Keep the valid candidate closest to the requested target without exceeding it, if any candidate meets that condition.
- If no candidate is at or below target, return the smallest valid candidate and report that the target was not reached.
- Never claim an exact target-size guarantee.

The implementation should use a bounded search over quality values. Do not assume every encoder/browser produces a perfectly monotonic size curve. Every candidate must pass the existing conversion service validation before it can be considered.

Target-size search is best-effort. The returned result must report the achieved size, target size, whether the target was reached, and number of attempts.

## 7. Return value

Successful calls return:

```js
{
  blob: Blob,
  format: "webp",
  mimeType: "image/webp",
  width: 1920,
  height: 1080,

  size: {
    sourceBytes: 2048000,
    outputBytes: 512000,
    differenceBytes: 1536000,
    reductionPercent: 75
  },

  optimization: {
    mode: "preset",
    preset: "medium",
    quality: 0.75,
    targetBytes: null,
    targetReached: null,
    attempts: 1
  },

  validation: {
    status: "passed"
  }
}
```

Rules:

- `blob` is the validated output Blob and is owned by the caller.
- `sourceBytes` is the original source File/Blob size, including when edited ImageData is supplied.
- `outputBytes` is the actual output Blob size.
- `differenceBytes = sourceBytes - outputBytes`.
- `reductionPercent = (differenceBytes / sourceBytes) * 100`.
- A negative `reductionPercent` is valid and means the output is larger.
- For `mode: "none"`, preset and quality are `null`; target fields are `null`; attempts is `1`.
- For target-size mode, `targetBytes` is the requested target and `targetReached` is a boolean.
- `validation.status` is `"passed"` only after the existing conversion service returns successfully. A failed validation rejects the call.
- The service result dimensions must be propagated. Do not infer dimensions from file names or UI state.

## 8. Error behavior

The optimizer should reject invalid or unsupported requests with stable error codes:

| Code | Meaning |
|---|---|
| `INVALID_OPTIMIZATION_OPTIONS` | Missing, malformed, or unknown configuration |
| `UNSUPPORTED_OPTIMIZATION` | Requested preset or target-size mode is unsupported for the selected format |
| `UNSUPPORTED_OUTPUT_FORMAT` | The existing conversion service cannot produce the requested output |
| `TARGET_SIZE_INVALID` | Target size is not a finite positive number |
| `ENCODING_FAILED` | Existing conversion/encoding path failed |
| `OUTPUT_VALIDATION_FAILED` | Output validation failed |

Preserve the original error as `cause` when wrapping an encoder or validation error. Do not turn a failed candidate into a successful result. If all target-size attempts fail validation or encoding, reject the call.

The current conversion service does not expose AbortSignal cancellation for its active conversion requests. Do not advertise full cancellation support in this API until the service/Worker contract is extended. A later implementation may check cancellation between target-size attempts, but that does not cancel an encoding already in progress.

## 9. Ownership and integration

### andra-gs

Owns:

- `src/js/core/image-optimizer.js`
- `tests/image-optimizer.test.js`
- `docs/PHASE_6_OPTIMIZATION.md`

Responsible for capability mapping, preset mapping, target-size search, source/output size calculations, validation handoff, error behavior, and optimizer tests.

### FarrelPtrv

Owns:

- `src/js/ui/export-panel.js`
- `src/styles/export-panel.css`
- `tests/export-panel.test.js`
- `docs/PHASE_6_EXPORT_UI.md`

Responsible for the export settings UI, displaying supported controls and actual size results, passing the agreed API options, individual downloads, ZIP integration, and per-file failure isolation.

Farrel may build UI against a temporary mock matching this exact contract while the optimizer is in progress. Do not create a competing API or duplicate preset/target-size logic in the UI.

Shared conversion-service, queue, and ZIP changes require coordination before editing.

## 10. Required tests

The optimizer implementation must cover:

- Valid and invalid source arguments.
- Every supported output format in `none` mode.
- JPEG/WebP preset-to-quality mapping.
- Rejection of presets for formats without quality control.
- Rejection of target-size mode for unsupported formats.
- Target reached and target not reached.
- Attempt limit and bounded quality values.
- Candidate encoding/validation failures.
- Actual source/output byte measurements.
- Positive, zero, and negative size differences.
- Edited ImageData handoff without falling back to the original unedited File.
- Source File/Blob/ImageData immutability.
- MIME/signature and decode/dimension validation through the existing service.
- Invalid values and unknown options.

Before opening the optimizer PR, run `npm test`, `npm run build`, and relevant real-browser tests. Record actual results; do not mark planned checks as complete.

## 11. Decisions to confirm during implementation

The project owner has approved this proposal as the shared implementation baseline. The following values remain tunable based on test evidence:

- Preset mapping: 0.55 / 0.75 / 0.90.
- Target-size quality range: 0.10–0.95.
- Maximum target-size attempts: 7.

If implementation evidence requires a change, update this document and notify the UI owner before changing the shared contract.
