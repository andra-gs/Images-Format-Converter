# Phase 6 Optimizer Integration Checklist

**Branch:** `phase-6-export-ui`  
**UI owner:** `FarrelPtrv`  
**Optimizer owner:** `andra-gs`  
**Status:** Preparation only. Production integration must wait until the optimizer changes are merged into `main`.

This checklist is the handoff and verification plan for connecting the Export UI adapter to the real Image Optimization Engine. It does not authorize changes to the shared conversion service, Queue orchestration, or ZIP exporter beyond the agreed Phase 6 scope.

## 1. Integration gate

- [ ] Andra confirms the optimizer implementation is ready for review.
- [ ] Optimizer PR is opened and reviewed.
- [ ] Optimizer PR is merged into `main`.
- [ ] `phase-6-export-ui` is updated from the latest `main`.
- [ ] The API contract is checked against the merged implementation.
- [ ] Any contract differences are agreed with Andra before adapter changes.

Do not connect the production UI to an unmerged optimizer branch.

## 2. API and adapter compatibility

- [ ] Named export `optimizeImage(source, options)` is available.
- [ ] Named export `IMAGE_OPTIMIZATION_CAPABILITIES` is available if used for capability gating.
- [ ] File and Blob sources are accepted.
- [ ] Edited source shape `{ file, imageData }` uses the edited pixels.
- [ ] Original File/Blob size remains the source of truth for `sourceBytes`.
- [ ] Optimizer does not mutate caller-owned File, Blob, or ImageData.
- [ ] Result includes a non-empty Blob, format, MIME type, dimensions, size metrics, optimization metadata, and passed validation status.
- [ ] Stable error codes match the agreed contract.
- [ ] Adapter validates actual optimizer metadata without duplicating preset mapping or target-size search.

## 3. Format and preset scenarios

- [ ] JPEG + None.
- [ ] JPEG + Low preset (optimizer reports quality 0.55).
- [ ] JPEG + Medium preset (optimizer reports quality 0.75).
- [ ] JPEG + High preset (optimizer reports quality 0.90).
- [ ] WebP + None.
- [ ] WebP + Low preset (optimizer reports quality 0.55).
- [ ] WebP + Medium preset (optimizer reports quality 0.75).
- [ ] WebP + High preset (optimizer reports quality 0.90).
- [ ] PNG, BMP, TIFF, GIF, and SVG accept only None mode.
- [ ] Unsupported format/mode combinations return the expected stable error.

Preset mapping belongs to the optimizer. The Export UI and adapter must not independently map Low/Medium/High to encoder quality.

## 4. Target Size scenarios

- [ ] JPEG target-size request passes `targetBytes` in bytes.
- [ ] WebP target-size request passes `targetBytes` in bytes.
- [ ] Quality metadata is within 0.10–0.95.
- [ ] Attempt count is an integer from 1 through 7.
- [ ] Target reached is reported as a boolean.
- [ ] Target reached successfully: UI reports actual output size and reached status.
- [ ] Target not reached: valid best-effort output is still displayed with a clear not-reached status.
- [ ] Invalid target values produce the agreed target-size error.
- [ ] Unsupported formats reject target-size mode.

## 5. Result metrics and output validation

- [ ] `sourceBytes` equals the original source file/blob size.
- [ ] `outputBytes` equals the returned Blob size.
- [ ] `differenceBytes` equals source bytes minus output bytes.
- [ ] `reductionPercent` matches the contract calculation.
- [ ] Output growth (negative reduction) is displayed correctly.
- [ ] Output format and MIME type match.
- [ ] Width and height come from the optimizer result.
- [ ] Invalid Blob, MIME, dimensions, size metrics, or validation metadata are rejected by the adapter.

## 6. Export workflow and regression

- [x] Individual download applies the selected file's settings (existing regression check).
- [x] Edited images export the current edited ImageData (existing regression check).
- [x] Unedited images export the original File/Blob source (existing regression check).
- [x] Per-file settings remain independent (existing browser UI check).
- [x] ZIP export applies each file's own settings (existing regression check).
- [x] One image failure does not prevent other images from exporting (existing regression check).
- [x] Existing JPEG-to-PNG conversion still works.
- [x] Existing PNG-to-JPEG conversion still works.
- [x] Existing WebP-to-PNG conversion still works.
- [x] Batch conversion still works.
- [x] Editor open/edit workflow still works.
- [x] Existing individual download and ZIP behavior remains intact.

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
- [ ] A candidate encoding failure does not become a successful candidate.
- [ ] If every target-size candidate fails, the optimizer rejects the request.
- [ ] Target reached and target not reached behavior use actual encoded outputs.
- [ ] Actual conversion output can be reopened and decoded by the browser.

## 8. Verification commands and evidence

Run after integration changes:

```bash
npm test
npm run build
npm run dev
```

Latest user-reported local verification on the Export UI branch:
- [x] `npm test` passed (test count not recorded).
- [x] `npm run build` succeeded.
- [x] Browser mock harness opened and all 11 scenarios passed.
- [x] Browser Console had no unexplained errors after the favicon 404 was identified as a missing non-critical resource.
- [x] Manual regression checklist completed.

For the real optimizer integration, still required:
- [ ] Automated tests rerun after optimizer merge and integration.
- [ ] Production build rerun after optimizer merge and integration.
- [ ] Real-browser tests run against the actual optimizer, not the mock.
- [ ] Results and any deviations are recorded in the Phase 6 development log.

## 9. Scope boundaries

- Do not change the shared conversion service without explicit coordination with Andra.
- Do not redesign Queue orchestration.
- Do not rewrite ZIP export orchestration outside the agreed per-file integration points.
- Do not add a manual Image Quality slider.
- Do not implement encoder quality mapping or target-size search in the UI.
- Do not merge `phase-6-export-ui` into `main` without explicit approval.
