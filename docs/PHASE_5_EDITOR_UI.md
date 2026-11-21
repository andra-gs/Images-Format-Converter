# Phase 5 — Editor UI and Integration

## Ownership

- Owner: `FarrelPtrv`
- Branch: `phase-5-editor-ui`
- Main files: `src/js/ui/image-editor.js`, `src/styles/editor.css`, `src/js/core/image-processing-adapter.js`

## Agreed shared processing contract

The team has agreed to use an sRGB ImageData-shaped value between the processing modules:

```javascript
{
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colorSpace: "srgb"
}
```

Both processing modules must leave their input unchanged and return a new result in the shape `{ imageData, width, height }`, with dimensions matching the returned pixel buffer.

- Transformer API: `applyImageTransformations(imageData, transformations)`
- Adjuster API: `applyImageAdjustments(imageData, adjustments)`
- Pipeline: Decode → ImageData adapter → Transform → Adjust → Canvas/encoder adapter → existing conversion service.
- Shared state: `{ transformations, adjustments }`.
- Maximum dimensions: 16,384 pixels per side and 40,000,000 total pixels, including intermediate allocations.
- Cancellation: AbortSignal; cancellation is reported as AbortError.
- Resource ownership: the decoder result belongs to the caller; processing modules do not mutate input; each module cleans up its temporary resources; returned ImageData belongs to the caller.

The full parameter defaults, ranges, processing order, validation, and error contract are recorded in `docs/TECHNICAL_SPECIFICATION.md`.

## Current implementation prepared on this branch

- Editor controls use the agreed nested shared state: `transformations` and `adjustments`.
- `image-processing-adapter.js` validates dimensions and ImageData structure, copies decoder pixels into an owned sRGB buffer, releases its temporary canvas, and can create a caller-owned Canvas result from ImageData.
- The adapter accepts the Transformer and Adjuster functions through dependency injection. This avoids importing modules that have not yet been merged.
- The adapter executes Transform before Adjust, validates each module's `{ imageData, width, height }` result, and checks AbortSignal between stages.
- Until both processing modules are supplied, all capabilities remain unavailable and processing rejects with `EDITOR_PROCESSING_UNAVAILABLE`.
- Apply remains disabled. The original preview remains read-only; draft controls do not claim to change image pixels.

## Verification completed — 2026-11-21

The user ran the following checks locally on the `phase-5-editor-ui` branch and reported the results:

### Automated tests

Command: `npm test`

- Tests: 47
- Passed: 47
- Failed: 0
- Cancelled: 0
- Skipped: 0
- Todo: 0

All 47 available automated tests passed, including adapter validation, ImageData copying, canvas cleanup, injected Transform → Adjust order, output validation, cancellation, and error handling.

### Production build

Command: `npm run build`

- Result: successful; Vite completed the production build in 5.05 seconds.
- Vite transformed 2,163 modules.
- Warning: some minified chunks exceed 500 kB. The largest reported HEIC-related chunks are approximately 3.23 MB each before gzip. This is a bundle-size optimization warning, not a build failure.

### Manual browser checks

The user reported all six checks passing:

| Check | Reported result |
|---|---|
| Application page opens without errors | Passed |
| Existing converter features continue working | Passed |
| Editor panel appears without breaking layout | Passed |
| Editor sliders, inputs, buttons, and choices are usable | Passed |
| Apply remains disabled | Expected state confirmed |
| Browser console has no red errors | Passed |

These results are user-reported local checks; they were not independently executed in this environment.

## Remaining integration work

1. Integrate the Transformer and Adjuster after their PRs are merged into `main`.
2. Coordinate the edited-pixel handoff with the existing conversion service. It currently accepts File/Blob inputs and performs its own decoding and output validation; the final route must preserve the edits and retain output signature/dimension checks.
3. Add preview updates and Apply handoff using the processed result.
4. Add full UI/integration tests and rerun `npm test`, `npm run build`, and browser checks with real images after module integration.
5. Consider optimizing the oversized HEIC-related production chunks separately; the current warning does not fail the build.

## Current status

The editor scaffold, adapter preparation, automated test suite, production build, and reported manual browser checks are verified for the current branch state. Phase 5 is **not complete**: real Transformer/Adjuster integration, edited-pixel conversion handoff, live preview updates, and enabling Apply remain pending.

## Edited-pixel conversion handoff — implementation in progress

A dedicated service entry point has been added:

```javascript
convertImageDataToFormat(imageData, format, options)
```

It converts the edited sRGB ImageData into a temporary Canvas-backed source and reuses the existing encoder. The shared validation path checks the generated output signature, decodes the output again, and verifies its dimensions. Temporary Canvas and verification-decoder resources are released; the input ImageData and returned Blob remain caller-owned.

Supported edited-image formats are PNG, JPEG, WebP, BMP, TIFF, and SVG. Animated GIF remains on the existing File-based path and is not yet supported by the edited-ImageData entry point. The new entry point is main-thread-only; existing File/Blob Worker routing is unchanged.

A new test file, `tests/edited-image-conversion.test.js`, covers the edited-pixel handoff, output dimension verification, invalid ImageData rejection, and the explicit GIF limitation. These tests have been added but have **not yet been run locally**. The earlier 47/47 result applies to the previous branch state and does not include these new tests.

