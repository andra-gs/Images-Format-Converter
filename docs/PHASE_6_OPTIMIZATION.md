# Phase 6 Image Optimization Engine

Status: Complete and merged into `main` through PR #7. The optimizer is integrated into the production Export UI through PR #9. PR #9 reports 156/156 automated tests passing, a successful production build, passing GitHub Actions, and successful integrated browser checks. Optimizer behavior and the production export workflow have been verified through contributor-reported real-browser checks. The standalone harness remains available for focused regression testing.

## 1. Scope

The optimizer must reuse `conversion-service.js` and `image-encoder.js`. It must not introduce a second decoder, encoder, or validation pipeline. Processing remains local in the browser.

Inspected on `main` at commit `247b803b824b68cabf59eb7a5cf019ab314135d2`:

- `src/js/core/image-encoder.js`
- `src/js/core/conversion-service.js`
- `src/js/core/capability-registry.js`
- `src/js/core/animated-gif.js`
- `docs/PHASE_6_OPTIMIZATION_API.md`

## 2. Confirmed encoder capabilities

| Output format | Existing encoder path | Meaningful quality setting | Target-size attempts | Decision |
|---|---|---:|---:|---|
| JPEG | Canvas `toBlob()` / OffscreenCanvas `convertToBlob()` | Yes, quality 0–1 | Feasible through repeated quality encoding | Presets and best-effort target-size |
| WebP | Canvas `toBlob()` / OffscreenCanvas `convertToBlob()` | Yes, quality 0–1 | Feasible through repeated quality encoding | Presets and best-effort target-size |
| PNG | Canvas encoder | No. The encoder does not pass a quality option for PNG | No | Mode `none` |
| BMP | Dedicated 24-bit encoder, bottom-up BGR rows with 4-byte alignment | No | No | Mode `none` |
| TIFF | UTIF2 `encodeImage()`, baseline uncompressed RGBA output | No compression/quality option is exposed | No | Mode `none` |
| GIF | `modern-gif` encoder; current path uses `maxColors: 255` and preserves frame timing/loop metadata where available | No generic quality option is exposed by the conversion service | No | Mode `none` |
| SVG | SVG wrapper containing an embedded PNG data resource | No SVG quality option; embedded PNG is generated through the PNG path | No | Mode `none` |
| HEIC / HEIF | No output encoder in the current capability registry | Not applicable | Not applicable | Input only; reject as output |

The JPEG and WebP encoder validates the returned Blob MIME type against the requested type. If the browser cannot produce the requested MIME type, encoding fails rather than silently returning a different format.

JPEG composites transparent pixels against the configured background color. BMP composites transparency onto white. PNG and WebP retain alpha through their existing paths. TIFF currently writes uncompressed RGBA pixels. GIF behavior is frame-aware and must remain on the existing File-based path for animated sources.

## 3. Existing service interfaces and constraints

The conversion service exposes:

- `convertImageToJpeg(file, { quality, backgroundColor })`
- `convertImageToWebp(file, { quality })`
- `convertImageToPng(file)`
- `convertImageToBmp(file)`
- `convertImageToTiff(file)`
- `convertImageToSvg(file)`
- `convertImageToGif(file)`
- `convertImageDataToFormat(imageData, format, options)` for edited ImageData in PNG, JPEG, WebP, BMP, TIFF, and SVG.

The File/Blob conversion service runs the existing decode → encode → signature check → decode output → dimension check sequence. The edited-ImageData entry point reuses the same encoder and validation sequence, and is main-thread-only.

Important constraints:

- Animated GIF must use the File-based GIF conversion path. The edited-ImageData conversion entry point does not support GIF.
- GIF conversion does not accept quality options.
- JPEG and WebP quality values are passed to the browser encoder; their scales are format-specific and must not be described as visually equivalent.
- The conversion service does not expose AbortSignal cancellation for an active conversion or Worker request.
- The optimizer must measure actual `Blob.size` values and return the validated Blob and service-reported dimensions.
- A target-size result is best-effort. Browser encoders may produce non-monotonic size changes across quality values, so each candidate must be measured and validated.

## 4. Initial capability policy

Only JPEG and WebP support `preset` and `target-size` modes in the first implementation.

Preset mapping remains the approved proposal:

| Preset | JPEG quality | WebP quality |
|---|---:|---:|
| Low | 0.55 | 0.55 |
| Medium | 0.75 | 0.75 |
| High | 0.90 | 0.90 |

These are initial encoder quality values, not a guarantee that JPEG and WebP produce equivalent visual quality at the same number.

Target-size mode remains limited to JPEG and WebP, with the agreed initial bounds of quality 0.10–0.95 and at most 7 encoding attempts. The algorithm must prefer the valid candidate closest to the requested size without exceeding it. If no candidate fits, it returns the smallest valid candidate and reports `targetReached: false`. Exact target size is not guaranteed.

All other implemented output formats accept only `optimization: { mode: "none" }`. HEIC and HEIF are rejected as output formats.

## 5. Initial implementation and automated verification

1. Implement `src/js/core/image-optimizer.js` using the agreed API in [PHASE_6_OPTIMIZATION_API.md](./PHASE_6_OPTIMIZATION_API.md).
2. Add focused tests for option validation, capability checks, preset mapping, target-size attempt bounds and selection, actual size metrics, source immutability, and output validation.
3. Test JPEG and WebP output using representative photos, graphics, and transparency cases in supported browsers.
4. Run `npm test`, `npm run build`, and browser checks before opening the processing PR.
5. Update this document with measured behavior and any browser-specific limitations.

No application code or encoder behavior was changed during the inspection step.

## 6. Initial implementation added

The first implementation is in `src/js/core/image-optimizer.js`.

Implemented behavior:

- Public API: `optimizeImage(source, options)`.
- Exported frozen capability/configuration snapshot: `IMAGE_OPTIMIZATION_CAPABILITIES`.
- Accepts a non-empty File/Blob or `{ file, imageData }` for edited content.
- Rejects unknown option keys, missing modes, invalid presets, invalid target sizes, unsupported output formats, and unsupported optimization modes with stable error codes.
- Uses the existing File/Blob conversion service for original sources and `convertImageDataToFormat()` for edited ImageData.
- Keeps GIF on the File-based path so animated GIF behavior remains intact. Edited ImageData to GIF is rejected rather than silently exporting the original pixels.
- JPEG and WebP presets map to Low 0.55, Medium 0.75, and High 0.90.
- Target-size mode measures seven independently encoded quality candidates in the 0.10–0.95 range. Each candidate is accepted only after the existing conversion service completes output validation. Failed candidates are skipped; all-candidate failure rejects the request.
- Chooses the valid output closest to the requested target without exceeding it. If no candidate fits, returns the smallest valid candidate and sets `targetReached: false`.
- Reports actual source/output Blob sizes, byte difference, percentage reduction/increase, MIME type, dimensions, attempts, and validation status.
- Does not mutate the original File/Blob or edited ImageData.

Focused tests were added in `tests/image-optimizer.test.js` for validation, capability policy, format conversion paths, preset mapping, target-size selection, failed candidates, output signature validation, edited ImageData immutability, and size metrics.

Validation status:

- The optimizer implementation and focused tests were merged through PR #7.
- PR #9 reports the integrated suite passed: 156/156 tests, 0 failures.
- PR #9 reports a successful production build and passing GitHub Actions. Vite emitted its existing non-fatal chunk-size advisory for the HEIC-related bundles (~3.2 MB each).
- Contributor-reported real-browser checks passed for JPEG/WebP presets, Target Size reached/not-reached, unsupported formats in `none` mode, animated GIF preservation, edited ImageData, mixed-format batches, per-file failures, individual downloads, ZIP Blob reuse, and existing conversion/Editor regressions.
- The standalone harness remains available for future regression testing. The target-size search remains best-effort and uses actual validated Blob sizes; exact target size is not guaranteed.
- These results were reported in PR #9 and were not independently rerun during this documentation-only update.

## 7. Browser test harness

A standalone browser harness is available at:

- `tests/browser-optimizer.html`
- `tests/browser-optimizer.css`
- `tests/browser-optimizer.js`

The harness imports `optimizeImage()` directly. It does not depend on the production Export UI and does not change the application interface.

It supports local source-file selection, output-format selection, capability-aware optimization mode selection, JPEG background selection, original/output previews, measured size metrics, target-size result reporting, and download of the validated output Blob. The preview decodes the returned Blob through the existing `decodeImage()` path. GIF preview displays the first frame; the downloaded Blob remains the complete output returned by the conversion service.

Run `npm run dev` and open:

`http://localhost:5173/tests/browser-optimizer.html`

The harness was included in the merged optimizer implementation. The contributor reports that the optimizer and integrated browser scenarios were verified with real files. Continue using this harness for focused optimizer regression checks when the optimizer changes.

## 8. Merged production integration and verification (2026-11-25)

The optimizer was merged through PR #7. Farrel integrated it into the production export flow, and PR #9 merged that integration into `main`.

The integrated application now:
- Applies per-file Low/Medium/High presets and best-effort Target Size for JPEG/WebP.
- Uses `mode: none` for PNG, BMP, TIFF, GIF, and SVG.
- Passes edited images as `{ file, imageData }` and keeps animated GIF on the original File-based path.
- Retains sequential queue processing, progress, between-file cancellation checks, and per-file failure isolation.
- Stores the validated output Blob once and reuses it for individual download and ZIP export.
- Displays actual source/output sizes, byte difference, percentage change, MIME type, and Target Size status.

PR #9 verification report: 156/156 tests passed, production build succeeded, GitHub Actions passed, and integrated browser checks were completed successfully. The build still emits a non-fatal Vite chunk-size advisory for the HEIC-related bundles (~3.2 MB each).

## Stable release status (2026-11-26)

The optimizer implementation described here is included in the published stable release [`v1.0.0`](https://github.com/andra-gs/Images-Format-Converter/releases/tag/v1.0.0). Release verification is summarized in the [Development Log](./DEVELOPMENT_LOG.md).
