import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePdfRasterDimensions,
  PDF_RASTER_DEFAULT_LIMITS
} from "../src/js/documents/pdf-raster-geometry.js";

test("converts PDF points to pixels at the requested DPI", () => {
  const result = calculatePdfRasterDimensions({
    widthPt: 612,
    heightPt: 792,
    dpi: 150
  });

  assert.equal(result.width, 1275);
  assert.equal(result.height, 1650);
  assert.equal(result.pixels, 1275 * 1650);
  assert.equal(result.scale, 150 / 72);
});

test("uses 150 DPI by default and rounds fractional pixel dimensions upward", () => {
  const result = calculatePdfRasterDimensions({
    widthPt: 100,
    heightPt: 200
  });

  assert.equal(result.dpi, 150);
  assert.equal(result.width, Math.ceil(100 * 150 / 72));
  assert.equal(result.height, Math.ceil(200 * 150 / 72));
});

test("accepts rotated viewport dimensions without applying rotation twice", () => {
  const result = calculatePdfRasterDimensions({
    widthPt: 792,
    heightPt: 612,
    dpi: 72
  });

  assert.equal(result.width, 792);
  assert.equal(result.height, 612);
});

test("rejects invalid page dimensions and DPI", () => {
  for (const input of [
    { widthPt: 0, heightPt: 100 },
    { widthPt: 100, heightPt: -1 },
    { widthPt: Number.NaN, heightPt: 100 },
    { widthPt: 100, heightPt: 100, dpi: 0 },
    { widthPt: 100, heightPt: 100, dpi: 601 }
  ]) {
    assert.throws(() => calculatePdfRasterDimensions(input), RangeError);
  }
});

test("rejects output dimensions above the configured maximum", () => {
  assert.throws(
    () => calculatePdfRasterDimensions({
      widthPt: 5000,
      heightPt: 500,
      dpi: 150
    }),
    /maximum output dimension/
  );
});

test("rejects output pixel counts above the configured maximum", () => {
  assert.throws(
    () => calculatePdfRasterDimensions({
      widthPt: 2000,
      heightPt: 2000,
      dpi: 150,
      limits: {
        maxDimension: 8192,
        maxPixels: 1_000_000
      }
    }),
    /maximum pixel count/
  );
});

test("supports stricter caller-provided limits", () => {
  const result = calculatePdfRasterDimensions({
    widthPt: 100,
    heightPt: 100,
    dpi: 72,
    limits: {
      minDpi: 72,
      maxDpi: 144,
      maxDimension: 200,
      maxPixels: 40_000
    }
  });

  assert.equal(result.width, 100);
  assert.equal(result.height, 100);
  assert.equal(result.pixels, 10_000);
});

test("exports provisional default limits without allowing mutation", () => {
  assert.deepEqual(PDF_RASTER_DEFAULT_LIMITS, {
    minDpi: 72,
    maxDpi: 600,
    maxDimension: 8192,
    maxPixels: 16_000_000
  });
  assert.equal(Object.isFrozen(PDF_RASTER_DEFAULT_LIMITS), true);
});
