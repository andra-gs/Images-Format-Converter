# Phase 6 Export Adapter Metadata Validation

**Branch:** `phase-6-export-ui`  
**Owner:** `FarrelPtrv`  
**Boundary:** Export UI adapter only. The Image Optimization Engine and production integration are not modified.

## Required metadata

The adapter requires these six own properties on `result.optimization`:

- `mode`
- `preset`
- `quality`
- `targetBytes`
- `targetReached`
- `attempts`

Missing fields, non-object values, and arrays are rejected.

## Mode consistency

| Mode | preset | quality | targetBytes | targetReached | attempts |
|---|---|---|---|---|---|
| `none` | `null` | `null` | `null` | `null` | exactly 1 |
| `preset` | requested `low`, `medium`, or `high` | finite number from 0 to 1 | `null` | `null` | exactly 1 |
| `target-size` | `null` | finite number from 0.10 to 0.95 | equals positive requested bytes | boolean | integer from 1 to 7 |

Preset and target-size modes are supported only for JPEG and WebP. Other supported output formats must use `none`.

## Ownership boundary

The adapter validates structure, types, ranges, requested-mode consistency, and output-format compatibility. It does not map Low/Medium/High to encoder quality values and does not implement target-size search. Both remain the responsibility of Andra's Image Optimization Engine.

Manual Image Quality is not part of the agreed API and is not connected.

## Verification

New automated coverage added:

- Every required metadata property must be present as an own property.
- Non-object metadata and arrays are rejected.

Existing adapter tests continue to cover mode/preset consistency, quality ranges, target-size bounds, attempt limits, format restrictions, and independent per-file failures.

## Latest local verification (2026-11-24)

User-reported results after the adapter error-message correction (commit `be0530d`):

- [x] `npm test`: **131/131 tests passed, 0 failed**.
- [x] `npm run build`: succeeded.

The previously failing metadata validation tests now pass with the adapter's incomplete-metadata message matching the test expectations. These results were reported by the user after running the commands locally; this documentation update does not itself execute the test suite or build.