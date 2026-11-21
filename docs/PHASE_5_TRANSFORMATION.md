# Phase 5 — Image Transformation

## Ownership and branch

- Owner: `andra-gs`
- Branch: `phase-5-transformation`
- Implementation: `src/js/core/image-transformer.js`
- Tests: `tests/image-transformer.test.js`

## Shared representation

The module accepts the agreed sRGB ImageData-shaped structure:

```javascript
{
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colorSpace: "srgb"
}
```

The module never mutates the input. It allocates one output pixel buffer and returns a new ImageData-shaped value in `{ imageData, width, height }`. The caller owns the returned buffer. No Canvas, DOM, ImageBitmap, Blob, or decoder resource is created by this module.

## Public API

```javascript
applyImageTransformations(imageData, transformations)
```

Defaults:

```javascript
{
  resize: { width: null, height: null, keepAspectRatio: true },
  crop: { x: 0, y: 0, width: null, height: null },
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false
}
```

### Resize

- Width and height use integer pixels.
- Both dimensions `null` preserve the cropped image dimensions.
- With aspect ratio locked, one provided dimension calculates the other.
- With both dimensions provided and aspect ratio locked, the image is fitted proportionally inside those bounds.
- With aspect ratio unlocked, both dimensions must be provided and are used exactly.

### Crop

- Coordinates use integer pixels relative to the original source image.
- Crop occurs before resize.
- `width: null` and/or `height: null` extend to the remaining right/bottom edge from the crop origin.
- The crop rectangle must remain inside the source image.

### Rotation and flip

- Rotation accepts `0`, `90`, `180`, or `270` degrees clockwise.
- Rotations of 90 and 270 degrees swap output width and height.
- Horizontal and vertical flips accept booleans and occur after rotation.

Processing order is Crop → Resize → Rotation → Flip.

## Pixel interpolation

Resizing uses bilinear interpolation. Color channels are interpolated with premultiplied alpha to reduce color fringes around transparent pixels. This may change individual pixel values during resizing, which is expected. Crop, right-angle rotation, and flips preserve source pixel values when no resize interpolation is needed.

## Validation and errors

- Invalid ImageData structure, pixel type, buffer length, or color space throws `TypeError` with code `INVALID_IMAGE_DATA`.
- Invalid transformation properties or parameter types/values throw `TypeError` or `RangeError` with code `INVALID_TRANSFORM_OPTIONS`.
- Crop coordinates or bounds outside the source throw `RangeError` with code `INVALID_CROP_BOUNDS`.
- Excessive source, crop, resized, or final dimensions throw `RangeError` with code `IMAGE_DIMENSIONS_EXCEEDED`.
- Unknown option properties are rejected.

Limits apply to source, crop, resized, and final dimensions:

- Maximum width or height: 16,384 pixels.
- Maximum pixel count: 40,000,000 pixels.

## Execution and resource ownership

The implementation is synchronous and uses typed-array operations only. It does not depend on browser DOM APIs and can run on the main thread or in a Web Worker. It computes the final output directly from the source rather than allocating separate crop and resize buffers. The source buffer remains caller-owned and unchanged. The returned ImageData buffer is caller-owned and becomes eligible for garbage collection when no longer referenced.

## Verification

Focused tests cover identity output, input immutability, crop boundaries and null dimensions, resize modes, aspect-ratio calculations, all supported rotations, both flips, operation order, alpha-aware interpolation, invalid inputs/options, and dimension limits.

Test command used during initial implementation:

```bash
node --test tests/image-transformer.test.js
```

The focused test suite contains 16 tests. On 2026-11-21, the user ran the full repository suite and reported 50 tests passed with no failures, followed by a successful Vite production build. The build emitted a warning about the size of the existing HEIC chunks, but completed successfully.

A real-image browser harness is available at `/tests/browser-transformer.html`. It uses the existing decoder, converts the decoded source to sRGB ImageData through Canvas, and exercises identity, crop, resize, rotation, flips, and a combined operation. It displays original and transformed previews with dimensions. The user ran the harness with real image files on 2026-11-21 and confirmed that the results matched expectations. Together with the 50 passing repository tests and successful production build reported by the user, standalone Image Transformer verification is complete. This does not yet verify integration inside the editor or the complete editing-to-conversion workflow.
