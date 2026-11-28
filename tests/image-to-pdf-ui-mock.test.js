import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateImagePdfPageLayout,
  ImageToPdfError
} from "../src/js/ui/image-to-pdf-mock.js";

test("A4 portrait preview uses the approved point dimensions and 10 mm margins", () => {
  const layout = calculateImagePdfPageLayout({
    imageWidth: 1600,
    imageHeight: 1200,
    options: { pageSize: "A4", orientation: "portrait", marginMm: 10, fit: "contain" }
  });

  assert.equal(layout.pageWidthPt, 595.28);
  assert.equal(layout.pageHeightPt, 841.89);
  assert.ok(Math.abs(layout.contentRect.x - 28.3464567) < 0.001);
  assert.equal(layout.crop, null);
  assert.ok(layout.imageRect.width <= layout.contentRect.width);
  assert.ok(layout.imageRect.height <= layout.contentRect.height);
});

test("fixed page orientation auto follows the source image aspect ratio", () => {
  const landscape = calculateImagePdfPageLayout({
    imageWidth: 1600,
    imageHeight: 900,
    options: { pageSize: "A5", orientation: "auto" }
  });
  const portrait = calculateImagePdfPageLayout({
    imageWidth: 900,
    imageHeight: 1600,
    options: { pageSize: "A5", orientation: "auto" }
  });

  assert.ok(landscape.pageWidthPt > landscape.pageHeightPt);
  assert.ok(portrait.pageHeightPt > portrait.pageWidthPt);
});

test("Image Size derives page dimensions at 96 PPI", () => {
  const layout = calculateImagePdfPageLayout({
    imageWidth: 1920,
    imageHeight: 1080,
    options: { pageSize: "IMAGE", marginMm: 0 }
  });

  assert.equal(layout.pageWidthPt, 1440);
  assert.equal(layout.pageHeightPt, 810);
});

test("per-side margins are converted to points and reduce the content area", () => {
  const layout = calculateImagePdfPageLayout({
    imageWidth: 1200,
    imageHeight: 1600,
    options: {
      pageSize: "A4",
      marginMm: { top: 5, right: 10, bottom: 15, left: 20 }
    }
  });

  assert.ok(Math.abs(layout.contentRect.x - 20 * 72 / 25.4) < 0.001);
  assert.ok(Math.abs(layout.contentRect.y - 5 * 72 / 25.4) < 0.001);
  assert.ok(layout.contentRect.width < layout.pageWidthPt);
  assert.ok(layout.contentRect.height < layout.pageHeightPt);
});

test("Fit keeps the full source image while Fill returns a centered crop", () => {
  const contain = calculateImagePdfPageLayout({
    imageWidth: 2400,
    imageHeight: 800,
    options: { pageSize: "A4", orientation: "portrait", fit: "contain" }
  });
  const cover = calculateImagePdfPageLayout({
    imageWidth: 2400,
    imageHeight: 800,
    options: { pageSize: "A4", orientation: "portrait", fit: "cover" }
  });

  assert.equal(contain.crop, null);
  assert.deepEqual(cover.imageRect, cover.contentRect);
  assert.ok(cover.crop);
  assert.ok(cover.crop.x > 0);
  assert.equal(cover.crop.y, 0);
  assert.equal(cover.crop.height, 800);
});

test("invalid image dimensions, negative margins, and excessive Image Size are rejected", () => {
  assert.throws(
    () => calculateImagePdfPageLayout({ imageWidth: 0, imageHeight: 100 }),
    (error) => error instanceof ImageToPdfError && error.code === "INVALID_INPUT"
  );
  assert.throws(
    () => calculateImagePdfPageLayout({
      imageWidth: 100,
      imageHeight: 100,
      options: { marginMm: -1 }
    }),
    (error) => error.code === "INVALID_OPTIONS"
  );
  assert.throws(
    () => calculateImagePdfPageLayout({
      imageWidth: 20000,
      imageHeight: 100,
      options: { pageSize: "IMAGE", marginMm: 0 }
    }),
    (error) => error.code === "LIMIT_EXCEEDED"
  );
});

test("margins that consume the full page are rejected", () => {
  assert.throws(
    () => calculateImagePdfPageLayout({
      imageWidth: 100,
      imageHeight: 100,
      options: { pageSize: "A5", marginMm: 500 }
    }),
    (error) => error.code === "INVALID_OPTIONS"
  );
});

test("unsupported transparency and unknown options are rejected by the UI mock", () => {
  assert.throws(
    () => calculateImagePdfPageLayout({
      imageWidth: 100,
      imageHeight: 100,
      options: { background: "transparent" }
    }),
    (error) => error.code === "INVALID_OPTIONS"
  );
  assert.throws(
    () => calculateImagePdfPageLayout({
      imageWidth: 100,
      imageHeight: 100,
      options: { pageSize: "A4", undocumentedSetting: true }
    }),
    (error) => error.code === "INVALID_OPTIONS"
  );
});


test("forced landscape orientation swaps A4 page dimensions", () => {
  const layout = calculateImagePdfPageLayout({
    imageWidth: 1200,
    imageHeight: 1600,
    options: { pageSize: "A4", orientation: "landscape" }
  });

  assert.equal(layout.pageWidthPt, 841.89);
  assert.equal(layout.pageHeightPt, 595.28);
  assert.ok(layout.pageWidthPt / layout.pageHeightPt > 1);
});

test("forced portrait orientation keeps A4 page dimensions upright", () => {
  const layout = calculateImagePdfPageLayout({
    imageWidth: 1600,
    imageHeight: 900,
    options: { pageSize: "A4", orientation: "portrait" }
  });

  assert.equal(layout.pageWidthPt, 595.28);
  assert.equal(layout.pageHeightPt, 841.89);
  assert.ok(layout.pageWidthPt / layout.pageHeightPt < 1);
});
