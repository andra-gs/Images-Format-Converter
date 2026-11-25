# Phase 5: Image Adjustment

## Ownership and branch

- Assigned owner: `Adit1945-web`
- Branch: `phase-5-adjustment`
- Module: `src/js/core/image-adjuster.js`
- Tests: `tests/image-adjuster.test.js`

This implementation is being developed on the assigned feature branch under the project owner's direction. The task ownership table remains unchanged.

## Shared image representation

The module accepts the shared sRGB ImageData-shaped structure:

```javascript
{
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colorSpace: "srgb"
}
```

The input is never mutated. The module returns a newly allocated pixel buffer in `{ imageData, width, height }`. The caller owns the returned buffer. Width, height, and the alpha channel remain unchanged. The implementation uses typed arrays only and does not depend on Canvas, DOM, ImageBitmap, Blob, or UI state.

## Public API

```javascript
applyImageAdjustments(imageData, adjustments)
```

Defaults and ranges:

| Option | Minimum | Maximum | Default | Meaning |
|---|---:|---:|---:|---|
| `brightness` | -100 | 100 | 0 | Additive brightness percentage. Each unit maps to 2.55 channel values. |
| `contrast` | -100 | 100 | 0 | Contrast around middle gray (127.5). Factor is `(1 + contrast / 100)²`. |
| `saturation` | 0 | 200 | 100 | Saturation percentage based on sRGB luminance weights. |
| `grayscale` | `false` | `true` | `false` | Replace RGB with sRGB luminance. |
| `sepia` | `false` | `true` | `false` | Apply the standard sepia color matrix. |
| `blur` | 0 | 20 | 0 | Gaussian blur support radius in integer pixels. |

Unknown properties are rejected. Numeric values must be finite and within their documented range. Out-of-range values are rejected rather than clamped. `blur` must be an integer.

## Processing order

1. Brightness
2. Contrast
3. Saturation
4. Grayscale
5. Sepia
6. Gaussian blur

If grayscale and sepia are both enabled, sepia is applied to the grayscale result. RGB channels are clamped to 0–255. Alpha is copied unchanged from the corresponding source pixel, including when blur is enabled.

## Algorithms

- Brightness adds `brightness × 2.55` to each RGB channel.
- Contrast uses middle gray 127.5 and factor `(1 + contrast / 100)²`.
- Saturation and grayscale use sRGB luminance weights: 0.2126 red, 0.7152 green, and 0.0722 blue.
- Sepia uses the matrix coefficients 0.393/0.769/0.189, 0.349/0.686/0.168, and 0.272/0.534/0.131.
- Blur uses a separable Gaussian kernel. Sigma is `max(radius / 2, 0.5)`, and the kernel spans `-radius` through `+radius`. Edge samples extend the nearest edge pixel. RGB samples use premultiplied-alpha weighting to reduce color fringes. The original alpha channel is preserved exactly.
- Blur uses a rolling cache of horizontal rows rather than allocating a full-size intermediate image.

## Validation and errors

- Invalid ImageData structure, pixel type, buffer length, or color space throws `TypeError` with code `INVALID_IMAGE_DATA`.
- Invalid adjustment object, unknown properties, wrong value types, or non-finite values throw `TypeError` with code `INVALID_ADJUSTMENT_OPTIONS`.
- Out-of-range numeric values and non-integer blur radii throw `RangeError` with code `INVALID_ADJUSTMENT_OPTIONS`.
- Source dimensions above 16,384 pixels per side or 40,000,000 total pixels throw `RangeError` with code `IMAGE_DIMENSIONS_EXCEEDED`.
- Unexpected pixel-processing failures are wrapped in `ImageProcessingError` with code `IMAGE_PROCESSING_FAILED` and the original error as `cause`.

## Execution and resource ownership

The implementation is synchronous and Worker-compatible. It uses typed arrays and no browser-specific APIs. The source buffer remains caller-owned and unchanged. The returned buffer is caller-owned. Temporary blur row buffers are local to the call and become eligible for garbage collection when processing finishes or throws.

## Verification

The focused Node test suite contains 16 tests covering defaults, input immutability, brightness, contrast, saturation, grayscale, sepia, combined adjustments, Gaussian blur, multi-row blur, alpha preservation, transparent-edge sampling, dimensions, invalid input, option boundaries, and shared image limits.

Run the focused tests with:

```bash
node --test tests/image-adjuster.test.js
```

A real-image browser harness is available at `/tests/browser-adjuster.html`. It decodes a selected local image with the existing decoder, copies its pixels into sRGB ImageData, applies the selected adjustments, and displays original and adjusted previews. It also exposes Reset and releases the temporary decoder and staging-canvas resources.

The focused tests passed locally in the Node test environment, and the user confirmed that the adjustment features work correctly in the real-image browser harness. At this checkpoint, Editor integration was still pending. It was subsequently completed and verified through PR #5, as recorded in the Integrated Phase 5 status section below.

## Integrated Phase 5 status (2026-11-25)

The Image Adjuster was integrated with the Image Transformer and Editor through PR #5, merged into `main` on 2026-11-22. The PR reported 98 passing automated tests, a successful production build, and real-browser verification of the integrated Editor flow. The project owner also reported post-merge `npm test` and `npm run dev` checks passing on 2026-11-23. The standalone adjustment module and its editor integration are complete. Broader cross-browser and release QA remain in Phase 7.
