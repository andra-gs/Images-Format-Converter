# Phase 5 — Editor UI and Integration

## Ownership

- Owner: `FarrelPtrv`
- Branch: `phase-5-editor-ui`
- Main files: `src/js/ui/image-editor.js`, `src/styles/editor.css`, `src/js/core/image-processing-adapter.js`

## Shared processing contract

The editor uses an sRGB ImageData representation:

```javascript
{
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colorSpace: "srgb"
}
```

The processing pipeline is:

`File → Decoder → ImageData adapter → Transformer → Adjuster → edited ImageData → conversion service`

- Transformer API: `applyImageTransformations(imageData, transformations)`
- Adjuster API: `applyImageAdjustments(imageData, adjustments)`
- Both modules return `{ imageData, width, height }` and do not mutate their input.
- Shared editor state: `{ transformations, adjustments }`.
- Limits: 16,384 pixels per side and 40,000,000 total pixels, including intermediate allocations.
- Cancellation is coordinated with AbortSignal.
- The original queued File remains owned by the Queue; edited pixels are held separately and passed to the edited-image conversion entry point.

The complete parameter ranges, processing order, validation, errors, and resource-ownership rules are documented in `docs/TECHNICAL_SPECIFICATION.md`.

## Implementation completed on `phase-5-editor-ui`

- Editor workspace and editing controls are implemented.
- Queue-to-Editor communication uses the `ifc:queue-change` Custom Event and queue snapshots; the Editor does not depend on Queue DOM mutations.
- The selected queued File is decoded for editing and adapted into an owned sRGB ImageData buffer.
- The processing adapter runs Transformer before Adjuster, validates returned dimensions and buffers, checks cancellation between stages, and propagates processing errors.
- Apply runs the processing pipeline and updates the processed preview. Reset restores the initial editing state and preview without unnecessarily reloading the decoder.
- The edited ImageData is kept separate from the original File and is handed to the existing conversion flow.
- PNG, JPEG, WebP, BMP, TIFF, and SVG use `convertImageDataToFormat()` for edited-pixel export.
- Animated GIF remains on the existing File-based conversion path to preserve animation; edited-ImageData GIF export is not supported by the current entry point.
- Existing File/Blob conversion and Worker orchestration remain in place for the original-image path.

## Verification — 2026-11-22

All results below were run locally by the user on `phase-5-editor-ui` and reported in the project conversation.

### Automated tests

Command: `npm test`

- Tests: 86
- Passed: 86
- Failed: 0
- Cancelled: 0
- Skipped: 0
- Todo: 0

Coverage includes the conversion service, edited-ImageData output validation, queue event bridge, decoder, encoder, adapter, Transformer, and Adjuster.

### Production build

Command: `npm run build`

- Result: successful.
- Vite transformed 2,166 modules.
- Build completed in 5.57 seconds.
- Vite emitted a warning that some minified chunks exceed 500 kB. The two HEIC-related chunks are approximately 3.23 MB each before gzip. This is a bundle-size optimization warning, not a build failure.

### Manual browser integration and regression check

The user confirmed:

- Editor successfully processes an image and produces the expected result.
- The existing conversion features continue to work and were not broken by Editor integration.

These are user-reported manual results; they were not independently executed in this environment. The earlier queue-preview selection checks were also user-confirmed: selecting the first image, switching to the second, and returning to the first all displayed the corresponding preview without new Console errors.

## Current status

The Editor processing and edited-image conversion workflow is implemented and has passed the user's reported local automated tests, production build, and browser integration/regression checks on this feature branch.

Phase 5 is ready for final branch review and a Pull Request to `main`. It is not considered officially complete until the PR is reviewed and merged, followed by the agreed post-merge verification. Phase 6 must not begin before that integration is complete.

## Known limitations and follow-up

- Animated GIF export from edited ImageData is not supported by the current edited-pixel conversion entry point. The existing File-based animated GIF route is preserved.
- HEIC-related production chunks remain large; optimization is a separate follow-up and did not block the successful build.
- Cross-browser, mobile, accessibility, and broader release-readiness checks remain part of the project's later QA/release work.
