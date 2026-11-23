# Phase 6 — Export Presets and UI Integration

## Ownership and branch

- Owner: `FarrelPtrv`
- Branch: `phase-6-export-ui`
- Base: `main` at kickoff commit `eaa1c2db0361810aa0b522154c4ad522b4583cd2`
- Main UI module: `src/js/ui/export-panel.js`
- Stylesheet: `src/styles/export-panel.css`
- Focused tests: `tests/export-panel.test.js`

## Current status

The approved API contract has been read. An isolated Export Settings module, responsive styles, and focused contract tests have been added on this branch. The Export Optimization panel is now mounted in Conversion Settings and creates independent controls for each queued file. Format changes refresh each control’s capability state. The controls currently store UI settings only; production conversion/download/ZIP behavior remains unchanged while real optimization waits for Andra’s optimizer PR to merge.

## Scope

Implement the Export Settings interface and, after the optimizer contract and optimizer PR are integrated into `main`, connect it to individual downloads and ZIP export.

The interface is expected to support:

- Low, Medium, and High presets only where the selected output format has an agreed optimizer mapping.
- Format-specific quality controls only where the selected encoder supports them.
- Target output size only where the agreed optimizer contract supports iterative attempts.
- Original source size, actual exported size, byte difference, and percentage reduction/increase.
- Clear unavailable, loading, and per-file error states.
- Light/dark themes, responsive layout, and keyboard accessibility.

## Initial repository findings

- The application uses Vanilla JavaScript ES modules, HTML, plain CSS, and Vite.
- Existing conversion settings currently contain a single quality slider in `index.html`; `src/js/main.js` reads it and passes quality only to JPEG and WebP conversion.
- Existing conversion orchestration is in `src/js/main.js`. It iterates selected queue entries and stores completed results in `conversionResults`.
- Individual result rendering creates a download link from the already-generated result Blob.
- ZIP export currently iterates successful `conversionResults` and adds their existing Blobs to JSZip. ZIP generation uses STORE compression and has per-archive error reporting.
- The current conversion service exposes separate File-based and edited-ImageData conversion entry points and validates generated output. It is shared code and is outside the initial UI-only change boundary.
- Existing theme tokens and responsive rules are defined in the shared stylesheets. New panel styles should use those tokens rather than introducing a separate theme system.
- At kickoff, `src/js/ui/export-panel.js`, `src/styles/export-panel.css`, `tests/export-panel.test.js`, and `src/js/core/image-optimizer.js` are not present on `main`.

## Integration boundaries

- Do not create a competing optimizer API or infer the optimizer's input/output object shape.
- A temporary mock contract may be used to build and test presentation behavior only. Keep it isolated from production conversion and download paths.
- Do not integrate real optimization until `andra-gs`'s optimizer PR is merged into `main` and the API is agreed.
- Do not modify `src/js/core/conversion-service.js`, queue orchestration, or ZIP orchestration without explicit coordination with the project owner.
- After the optimizer is merged, update this branch from the latest `main` before implementing real individual-download and ZIP integration.
- Preserve per-file failure isolation: an optimization failure for one file must not prevent other successful files from being exported.

## Approved optimizer contract

The shared contract is documented in [`PHASE_6_OPTIMIZATION_API.md`](./PHASE_6_OPTIMIZATION_API.md) on `main` and was read on 2026-11-23. The required API is `optimizeImage(source, options)`. UI options use `{ format, optimization: { mode } }`, with `preset` values `low`, `medium`, `high` or `targetBytes` for `target-size`. Sources are `File`/`Blob` or `{ file, imageData }` for edited content. Successful results provide `blob`, `format`, `mimeType`, dimensions, actual `size` metrics, optimization metadata, and validation status.

UI rules: presets and target-size are available only for JPEG/WebP; other output formats use `mode: "none"`. The UI must not duplicate encoder quality mapping or optimization algorithms. Result metrics must come from the optimizer’s actual `result.size` fields. GIF remains File-based so animation is preserved. Per-file settings must be retained for ZIP export, and each file’s failure must be isolated.

## Optimizer contract — implementation gate

The following decisions must be agreed with `andra-gs` before the mock is treated as an integration contract:

1. Optimizer function name, module export, and call signature.
2. How the source is represented (original File, converted Blob/result, or edited image result).
3. How output format and current conversion options are supplied.
4. Preset identifiers and format-specific mapping/capability response.
5. Quality control ranges and units for each supported encoder.
6. Target-size units, supported formats, iteration limits, and behavior when the target cannot be reached.
7. Result shape for the final Blob and actual source/output size metrics.
8. Error types, cancellation behavior, and per-file failure semantics.
9. Resource ownership and cleanup responsibilities.
10. Whether optimization runs on the main thread or through the existing Worker path.

The contract is now agreed. A mock optimizer is used only in focused tests to verify source/options handoff and result validation. It is not connected to production conversion, individual downloads, or ZIP export. Real integration remains gated on Andra’s optimizer PR being merged into `main`.

## Initial format expectations (subject to optimizer verification)

The project roadmap currently identifies JPEG and WebP as candidates for lossy quality controls and feasible target-size attempts; PNG may expose lossless encoder-supported optimization; BMP and baseline TIFF currently have no meaningful quality control; GIF must follow verified encoder capabilities; SVG remains an embedded-PNG wrapper and must not be presented as vector optimization. Final controls must follow the merged optimizer capability matrix and browser checks.

## Verification plan

- Focused unit tests for preset selection, capability-dependent visibility, format-specific controls, size formatting and calculations, loading/error states, and keyboard-accessible interaction.
- Integration tests after the optimizer is merged for individual downloads and ZIP export, including mixed-format batches and isolated per-file failures.
- Browser checks in light and dark themes at desktop and mobile widths.
- Regression checks for conversion queue, Editor Phase 5, individual downloads, ZIP extraction, and output integrity.
- Run `npm test`, `npm run build`, and browser checks on the final integrated branch before opening a PR.

## Progress log

### 2026-11-23 — Phase 6 kickoff and repository inspection

- Confirmed Phase 5 has been merged into `main`; project owner reports post-merge `npm test` and `npm run dev` checks passed. A separate post-merge production build result was not included in the kickoff report.
- Read `AGENTS.md`, `docs/DEVELOPMENT_ROADMAP.md`, `docs/PROJECT_CONTEXT.md`, and `docs/TECHNICAL_SPECIFICATION.md` on `main`.
- Inspected the existing conversion settings, per-file result/download flow, ZIP generation, shared styles, and current conversion-service entry points.
- Created `phase-6-export-ui` from the latest `main` commit.
- No application code, shared conversion/queue/ZIP files, or optimizer API have been changed.
- Next: agree on the optimizer contract with `andra-gs`, then implement the Export Settings presentation against an isolated temporary mock.


### 2026-11-23 — Approved API contract and isolated Export UI foundation

- Read and adopted `docs/PHASE_6_OPTIMIZATION_API.md` from `main`.
- Added `src/js/ui/export-panel.js` with per-file settings control construction, JPEG/WebP capability gating, agreed options mapping, and actual-result size metric validation.
- Added `src/styles/export-panel.css` and imported it from the stylesheet entry point.
- Added `tests/export-panel.test.js` covering preset identifiers, target-size bytes, unsupported formats, invalid settings, measured metrics, larger outputs, and a mock `optimizeImage(source, options)` handoff.
- Mock optimizer use is test-only. The production conversion flow is not yet connected, and no encoder, compression, or preset quality mapping was added to the UI.
- The optimizer branch/PR is not present in the repository branch search at the time of this check. Real API integration remains blocked until Andra’s optimizer PR is merged into `main`.
- Automated tests and build have not been run in this environment; local validation is still required.


### 2026-11-23 — Stage 1: Mount Export Optimization UI

- Added an Export Optimization section to the Conversion Settings panel.
- Mounted the existing per-file controls from `src/js/ui/export-panel.js` for every newly queued image.
- Added independent maps for each file’s control instance and selected settings.
- Updated each control when the global output format changes, so JPEG/WebP-only options remain unavailable for other formats.
- Removed per-file control state and DOM when a file is removed; cleared all export controls when the queue is cleared.
- Added responsive section styling using the existing theme tokens.
- The controls do not affect conversion, individual downloads, or ZIP export in this stage.
- Local automated tests, production build, and browser verification are still required after pulling the branch.


### 2026-11-23 — Fix Export Optimization control UI

- Grouped each field label with its corresponding input so the label no longer occupies a separate grid column from its control.
- Refresh control visibility immediately after optimization mode changes. This fixes the preset/target-size field remaining hidden after selecting its mode.
- Conversion, download, ZIP, and optimizer behavior remain unchanged.
- Browser retest is required after pulling this update.


### 2026-11-23 — Stage 2: API integration preparation

- Re-read the approved shared API contract on `main`. It specifies `optimizeImage(source, options)`, File/Blob and edited `{ file, imageData }` sources, explicit optimization modes, validated Blob output, actual size metrics, and stable error codes.
- Added `src/js/ui/export-optimizer-adapter.js` as a UI-owned boundary. It validates source shape, requested format/mode, returned Blob, format/MIME agreement, dimensions, validation status, and consistency of actual source/output byte measurements.
- Added `tests/export-optimizer-adapter.test.js` for exact argument handoff, edited ImageData source handoff, invalid inputs, unsupported modes, mismatched results, size consistency, and negative size reduction.
- Re-exported the adapter from `export-panel.js` so existing focused tests retain their import path.
- The adapter does not import or implement the optimizer, encode images, map presets to quality values, perform target-size search, or connect to production conversion/download/ZIP flows.
- The existing Image Quality slider remains unresolved against the shared optimizer contract; no behavior or contract change was made. Confirm with `andra-gs` before production integration.
- No changes were made to the shared conversion service, Editor, Queue, or ZIP orchestration.
- Validation status: GitHub file changes were committed, but automated tests, production build, and browser checks have not been run in this environment. Local verification is required after pulling the branch.
