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

## Remaining integration work

1. Integrate the Transformer and Adjuster after their PRs are merged into `main`.
2. Coordinate the edited-pixel handoff with the existing conversion service. It currently accepts File/Blob inputs and performs its own decoding and output validation; the final route must preserve the edits and retain output signature/dimension checks.
3. Add preview updates and Apply handoff using the processed result.
4. Add full UI/integration tests, then run `npm test`, `npm run build`, and browser checks with real images.
5. Update this document and the development log with verified results.

## Verification status

The adapter and test source have been updated on this branch. Automated tests, production build, and browser verification have not yet been run in this environment. Do not treat the editor integration as complete until those checks pass and the real processing modules are integrated.
