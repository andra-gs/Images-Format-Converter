# Phase 5 — Editor UI and Integration

## Ownership

- Owner: `FarrelPtrv`
- Branch: `phase-5-editor-ui`
- Main files: `src/js/ui/image-editor.js`, `src/styles/editor.css`, `src/js/core/image-processing-adapter.js`

## Temporary integration strategy

The editor UI is being built against a placeholder adapter while the Image Transformation and Image Adjustment modules are developed on their own branches. The placeholder advertises every processing capability as unavailable and rejects processing requests with the stable error code `EDITOR_PROCESSING_UNAVAILABLE`.

This keeps UI work independent of unapproved function names, argument shapes, return types, and resource ownership. The Apply action must remain disabled until the real module contracts are agreed and the implementations are integrated.

## Current UI scope

The initial editor scaffold provides:

- Selection of an image already present in the existing file queue.
- Original-image preview and source dimensions.
- Draft controls for resize and aspect ratio, crop coordinates, rotation, horizontal/vertical flip, brightness, contrast, saturation, blur, grayscale, and sepia.
- Reset to the selected source image's dimensions and neutral adjustment values.
- Responsive layout and existing light/dark theme variables.
- Explicit placeholder messaging; draft controls do not claim to modify the preview.

## Integration requirements still open

1. Agree the shared editing state and processing contracts with both module owners.
2. Confirm input/output representation, processing order, error behavior, and resource ownership.
3. Replace the placeholder adapter only after both processing modules are merged into `main`.
4. Connect the edited Blob/File to the existing conversion service without changing decoder/encoder behavior.
5. Enable Apply only after processing and handoff are implemented and tested.

## Verification status

This document describes the implementation scope. It does not claim automated tests, production build, or browser verification have passed.
