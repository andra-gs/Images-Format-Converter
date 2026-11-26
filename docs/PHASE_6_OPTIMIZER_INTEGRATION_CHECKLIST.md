# Phase 6 Optimizer Integration Checklist

**Branch:** `phase-6-export-ui`  
**UI owner:** `FarrelPtrv`  
**Optimizer owner:** `andra-gs`  
**Status:** Complete and merged into `main` through PR #9. All integration checklist items below were reported as completed; PR #9 records 156/156 tests passing, a successful production build, passing GitHub Actions, and successful integrated browser checks.

This checklist is the handoff and verification plan for connecting the Export UI adapter to the real Image Optimization Engine. It does not authorize changes to the shared conversion service, Queue orchestration, or ZIP exporter beyond the agreed Phase 6 scope.

## 1. Integration gate

- [x] Andra confirms the optimizer implementation is ready for integration.
- [x] Optimizer PR #7 is merged into `main`.
- [x] `phase-6-export-ui` contains the optimizer source, tests, harness, and approved API contract.
- [x] Git ancestry synchronized: `main` is an ancestor of `phase-6-export-ui` after merge commit `82f7420`.
- [x] The API contract was checked against the merged implementation; no contract change was required.

Do not connect the production UI to an unmerged optimizer branch.

## 2. API and adapter compatibility

- [x] Named export `optimizeImage(source, options)` is available.
- [x] Named export `IMAGE_OPTIMIZATION_CAPABILITIES` is available if used for capability gating.
- [x] File and Blob sources are accepted.
- [x] Edited source shape `{ file, imageData }` uses the edited pixels.
- [x] Original File/Blob size remains the source of truth for `sourceBytes`.
- [x] Optimizer does not mutate caller-owned File, Blob, or ImageData.
- [x] Result includes a non-empty Blob, format, MIME type, dimensions, size metrics, optimization metadata, and passed validation status.
- [x] Stable error codes match the agreed contract.
- [x] Adapter requires all six optimization metadata fields as own properties and rejects non-object/incomplete metadata.
- [x] Adapter validates mode, preset, quality, targetBytes, targetReached, and attempts types/ranges against the requested mode.
- [x] Adapter accepts preset quality only as a finite 0–1 number without duplicating Low/Medium/High mapping.
- [x] Adapter validates target-size quality within 0.10–0.95 and attempts within 1–7.
- [x] Adapter rejects optimization modes for output formats other than JPEG/WebP.
- [x] Adapter validates actual optimizer metadata without duplicating preset mapping or target-size search.

Detailed Export UI metadata validation rules are recorded in [`PHASE_6_EXPORT_ADAPTER_VALIDATION.md`](./PHASE_6_EXPORT_ADAPTER_VALIDATION.md).

## 3. Format and preset scenarios

- [x] JPEG + None.
- [x] JPEG + Low preset (optimizer reports quality 0.55).
- [x] JPEG + Medium preset (optimizer reports quality 0.75).
- [x] JPEG + High preset (optimizer reports quality 0.90).
- [x] WebP + None.
- [x] WebP + Low preset (optimizer reports quality 0.55).
- [x] WebP + Medium preset (optimizer reports quality 0.75).
- [x] WebP + High preset (optimizer reports quality 0.90).
- [x] PNG, BMP, TIFF, GIF, and SVG accept only None mode.
- [x] Unsupported format/mode combinations return the expected stable error.

Preset mapping belongs to the optimizer. The Export UI and adapter must not independently map Low/Medium/High to encoder quality.

## 4. Target Size scenarios

- [x] JPEG target-size request passes `targetBytes` in bytes.
- [x] WebP target-size request passes `targetBytes` in bytes.
- [x] Quality metadata is within 0.10–0.95.
- [x] Attempt count is an integer from 1 through 7.
- [x] Target reached is reported as a boolean.
- [x] Target reached successfully: UI reports actual output size and reached status.
- [x] Target not reached: valid best-effort output is still displayed with a clear not-reached status.
- [x] Invalid target values produce the agreed target-size error.
- [x] Unsupported formats reject target-size mode.

## 5. Result metrics and output validation

- [x] `sourceBytes` equals the original source file/blob size.
- [x] `outputBytes` equals the returned Blob size.
- [x] `differenceBytes` equals source bytes minus output bytes.
- [x] `reductionPercent` matches the contract calculation.
- [x] Output growth (negative reduction) is displayed correctly.
- [x] Output format and MIME type match.
- [x] Width and height come from the optimizer result.
- [x] Invalid Blob, MIME, dimensions, size metrics, or validation metadata are rejected by the adapter.

## 6. Production integration implementation

The following wiring is now present in `src/js/main.js`:
- [x] Import the real `optimizeImage()` and use the existing adapter boundary.
- [x] Build options from each file's own Export Settings.
- [x] Pass the original `entry.file` for unedited images.
- [x] Pass `{ file: entry.file, imageData }` for edited images.
- [x] Route unsupported optimization formats through explicit `mode: "none"`.
- [x] Keep the existing sequential `for...of` queue and await one file at a time.
- [x] Keep per-file try/catch so one failed export does not stop later files.
- [x] Preserve cancellation checks between files and existing progress updates.
- [x] Store the validated optimizer Blob in `conversionResults`.
- [x] Individual download links use the stored Blob.
- [x] ZIP packages stored result Blobs and does not invoke the optimizer again.
- [x] Display original size, output size, byte difference, percentage change, MIME type, and Target Size reached/not-reached status.
- [x] Keep animated GIF on the original File-based optimizer path; edited ImageData to GIF remains unsupported.

### Integrated regression verification — completed (PR #9 report)
- [x] Individual JPEG/WebP exports with each preset.
- [x] JPEG/WebP Target Size reached and not reached.
- [x] PNG, BMP, TIFF, SVG in None mode.
- [x] GIF-to-GIF retains animation.
- [x] Edited image exports use current edited pixels.
- [x] Mixed-format batch, per-file settings, and failure isolation.
- [x] Individual downloads open with the correct extension and MIME type.
- [x] ZIP contains the exact already-optimized Blobs, with no second optimization.
- [x] Existing conversion, Editor, queue progress, cancellation, and error states remain functional.

## 7. Mock harness scope (pre-integration)

The separate Export UI mock harness checks adapter/UI behavior only. It does not verify the optimizer's internal encoder, candidate search algorithm, or real conversion-service validation.

The browser mock harness currently contains 11 scenarios. User-reported latest local browser run: all 11 passed.
- [x] Exact source/options forwarding.
- [x] Low, Medium, and High preset metadata.
- [x] Rejection of mismatched preset metadata.
- [x] Target Size quality boundaries and out-of-range rejection.
- [x] Best-effort metadata when target is not reached.
- [x] Unsupported format fallback to None.
- [x] Propagation of an optimizer encoding error.
- [x] Isolation when every file in an independent batch fails.
- [x] Reopening a valid returned PNG Blob with the browser image decoder.
- [x] Isolation when one file fails and another succeeds.
- [x] UI control behavior and format switching.

When the real optimizer is available, separately verify its internal candidate behavior:
- [x] A candidate encoding failure does not become a successful candidate.
- [x] If every target-size candidate fails, the optimizer rejects the request.
- [x] Target reached and target not reached behavior use actual encoded outputs.
- [x] Actual conversion output can be reopened and decoded by the browser.

## 8. Verification commands and evidence

Run after integration changes:

```bash
npm test
npm run build
npm run dev
```

Latest user-reported local verification on the Export UI branch (2026-11-24):
- [x] `npm test` passed: **131/131 tests passed, 0 failed**.
- [x] `npm run build` succeeded.
- [x] Browser mock harness opened and all 11 scenarios passed (earlier recorded run).
- [x] Browser Console had no unexplained errors after the favicon 404 was identified as a missing non-critical resource (earlier recorded run).
- [x] Manual regression checklist completed (earlier recorded run).

The 131/131 result includes the metadata validation regression tests after the adapter error-message correction in commit `be0530d`. These are user-reported local results; the repository changes were not executed by GitHub during documentation updates.

Final integrated verification was reported in PR #9: `npm test` passed 156/156, `npm run build` succeeded, GitHub Actions passed, and the contributor completed real-browser checks against the actual optimizer and production Export UI. The earlier pending checklist is superseded by this final result. The build continues to emit a non-fatal Vite chunk-size advisory for HEIC-related bundles (~3.2 MB each).

## 9. Scope boundaries

- Do not change the shared conversion service without explicit coordination with Andra.
- Do not redesign Queue orchestration.
- Do not rewrite ZIP export orchestration outside the agreed per-file integration points.
- Do not add a manual Image Quality slider.
- Do not implement encoder quality mapping or target-size search in the UI.
- Do not merge `phase-6-export-ui` into `main` without explicit approval.

## 10. Final merge record — 2026-11-25

- Optimizer PR #7: merged into `main`.
- Export UI integration PR #9: merged into `main`.
- Merge commit for PR #9: `17bb59628660d31bad64bb16eebb5337d9bf44a6`.
- Automated tests: 156/156 passed, 0 failed.
- Production build: successful.
- GitHub Actions: all checks passed.
- Browser verification: contributor-reported successful for all integrated scenarios listed in the checklist.

The test/build/browser results were reported by the contributor in PR #9; they were not independently rerun during this documentation-only update.

## Stable release status (2026-11-26)

The integration described in this checklist was completed and included in the published stable release [`v1.0.0`](https://github.com/andra-gs/Images-Format-Converter/releases/tag/v1.0.0). This checklist is retained as the historical integration record.
