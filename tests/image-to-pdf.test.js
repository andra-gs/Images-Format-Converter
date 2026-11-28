import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateImagePdfPageLayout,
  createImagePdf,
  ImageToPdfError
} from "../src/js/documents/image-to-pdf.js";

const PNG_BYTES = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=="),
  (character) => character.charCodeAt(0)
);

function mockGlobal(t, key, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  });
}

function makeImage(name = "pixel.png") {
  const file = new Blob([PNG_BYTES], { type: "image/png" });
  Object.defineProperty(file, "name", { configurable: true, value: name });
  return file;
}

function mockImagePipeline(t, { width = 640, height = 480, encodeError = null, dimensionsForFile = null } = {}) {
  let closeCalls = 0;
  let drawCalls = 0;

  mockGlobal(t, "createImageBitmap", async (file) => ({
    ...(dimensionsForFile ? dimensionsForFile(file) : { width, height }),
    close() {
      closeCalls += 1;
    }
  }));

  class FakeOffscreenCanvas {
    constructor(canvasWidth, canvasHeight) {
      this.width = canvasWidth;
      this.height = canvasHeight;
      this.context = {
        drawImage() {
          drawCalls += 1;
        }
      };
    }

    getContext(type) {
      assert.equal(type, "2d");
      return this.context;
    }

    async convertToBlob({ type }) {
      if (encodeError) throw encodeError;
      assert.equal(type, "image/png");
      return new Blob([PNG_BYTES], { type: "image/png" });
    }
  }

  mockGlobal(t, "OffscreenCanvas", FakeOffscreenCanvas);
  return {
    get closeCalls() { return closeCalls; },
    get drawCalls() { return drawCalls; }
  };
}

test("A4 portrait layout uses 10 mm margins and preserves the full source", () => {
  const layout = calculateImagePdfPageLayout({
    imageWidth: 1600,
    imageHeight: 1200
  });

  assert.equal(layout.pageWidthPt, 595.28);
  assert.equal(layout.pageHeightPt, 841.89);
  assert.ok(Math.abs(layout.contentRect.x - 28.3464567) < 0.001);
  assert.equal(layout.crop, null);
  assert.ok(layout.imageRect.width <= layout.contentRect.width);
  assert.ok(layout.imageRect.height <= layout.contentRect.height);
});

test("auto orientation follows source aspect ratio and Image Size uses 96 PPI", () => {
  const landscape = calculateImagePdfPageLayout({
    imageWidth: 1600,
    imageHeight: 900,
    options: { pageSize: "A5", orientation: "auto" }
  });
  const imageSize = calculateImagePdfPageLayout({
    imageWidth: 1920,
    imageHeight: 1080,
    options: { pageSize: "IMAGE", marginMm: 0 }
  });

  assert.ok(landscape.pageWidthPt > landscape.pageHeightPt);
  assert.equal(imageSize.pageWidthPt, 1440);
  assert.equal(imageSize.pageHeightPt, 810);
});

test("per-side margins are converted to points", () => {
  const layout = calculateImagePdfPageLayout({
    imageWidth: 1200,
    imageHeight: 1600,
    options: {
      marginMm: { top: 5, right: 10, bottom: 15, left: 20 }
    }
  });

  assert.ok(Math.abs(layout.contentRect.x - 20 * 72 / 25.4) < 0.001);
  assert.ok(Math.abs(layout.contentRect.y - 5 * 72 / 25.4) < 0.001);
  assert.ok(layout.contentRect.width < layout.pageWidthPt);
  assert.ok(layout.contentRect.height < layout.pageHeightPt);
});

test("contain returns no crop and cover returns a centered source crop", () => {
  const contain = calculateImagePdfPageLayout({
    imageWidth: 2400,
    imageHeight: 800,
    options: { fit: "contain" }
  });
  const cover = calculateImagePdfPageLayout({
    imageWidth: 2400,
    imageHeight: 800,
    options: { fit: "cover" }
  });

  assert.equal(contain.crop, null);
  assert.deepEqual(cover.imageRect, cover.contentRect);
  assert.ok(cover.crop.x > 0);
  assert.equal(cover.crop.y, 0);
  assert.equal(cover.crop.height, 800);
});

test("invalid dimensions, margins, and unsupported transparency return typed errors", () => {
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
      imageWidth: 100,
      imageHeight: 100,
      options: { background: "transparent" }
    }),
    (error) => error.code === "UNSUPPORTED_TRANSPARENCY"
  );
});

test("margins that consume the page and excessive Image Size are rejected", () => {
  assert.throws(
    () => calculateImagePdfPageLayout({
      imageWidth: 100,
      imageHeight: 100,
      options: { marginMm: 500 }
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

test("creates a valid multi-page PDF and reports ordered page metadata", async (t) => {
  const pipeline = mockImagePipeline(t);
  const progress = [];
  let result;
  try {
    result = await createImagePdf({
      images: [
        { id: "first", file: makeImage("first.png") },
        { id: "second", file: makeImage("second.png") }
      ],
      options: { pageSize: "A4", orientation: "auto", fit: "contain" },
      onProgress: (snapshot) => progress.push(snapshot)
    });
  } catch (error) {
    throw error;
  }

  assert.equal(result.blob.type, "application/pdf");
  assert.ok(result.blob.size > 0);
  assert.equal(result.pageCount, 2);
  assert.deepEqual(result.pages.map((page) => page.sourceId), ["first", "second"]);
  assert.deepEqual(result.pages.map((page) => page.index), [0, 1]);
  assert.equal(pipeline.closeCalls, 2);
  assert.equal(pipeline.drawCalls, 2);
  assert.ok(progress.some((snapshot) => snapshot.phase === "validating"));
  assert.ok(progress.some((snapshot) => snapshot.phase === "decoding"));
  assert.ok(progress.some((snapshot) => snapshot.phase === "composing"));
  assert.deepEqual(
    progress.filter((snapshot) => snapshot.phase === "validating").map((snapshot) => snapshot.completed),
    [0, 1, 1, 2]
  );
  assert.deepEqual(
    progress.filter((snapshot) => snapshot.phase === "decoding").map((snapshot) => snapshot.completed),
    [0, 1, 1, 2]
  );
  assert.deepEqual(
    progress.filter((snapshot) => snapshot.phase === "composing").map((snapshot) => snapshot.completed),
    [0, 1, 1, 2]
  );
  assert.equal(progress.at(-1).phase, "finalizing");
});


test("auto orientation creates pages with matching mixed page dimensions", async (t) => {
  mockImagePipeline(t, {
    dimensionsForFile: (file) => file.name === "wide.png"
      ? { width: 1200, height: 600 }
      : { width: 600, height: 1200 }
  });

  const result = await createImagePdf({
    images: [
      { id: "wide", file: makeImage("wide.png") },
      { id: "tall", file: makeImage("tall.png") }
    ],
    options: { pageSize: "A4", orientation: "auto" }
  });

  assert.ok(result.pages[0].pageWidthPt > result.pages[0].pageHeightPt);
  assert.ok(result.pages[1].pageHeightPt > result.pages[1].pageWidthPt);
});

test("fail-fast identifies the first invalid image and does not decode later files", async (t) => {
  let decodeCalls = 0;
  mockGlobal(t, "createImageBitmap", async () => {
    decodeCalls += 1;
    return { width: 1, height: 1, close() {} };
  });
  mockGlobal(t, "OffscreenCanvas", class {});

  const invalid = new Blob(["not an image"], { type: "text/plain" });
  Object.defineProperty(invalid, "name", { value: "broken.txt" });

  await assert.rejects(
    createImagePdf({
      images: [
        { id: "good", file: makeImage("good.png") },
        { id: "bad", file: invalid }
      ]
    }),
    (error) => error.code === "INVALID_IMAGE" && error.imageId === "bad" && error.imageIndex === 1
  );
  assert.equal(decodeCalls, 0);
});


test("decode failures identify the failing image and its queue index", async (t) => {
  mockGlobal(t, "createImageBitmap", async () => {
    throw new Error("Native image decoder failed.");
  });
  mockGlobal(t, "Image", undefined);

  await assert.rejects(
    createImagePdf({
      images: [{ id: "decode-failure", file: makeImage("broken.png") }]
    }),
    (error) => error.code === "IMAGE_DECODE_FAILED" &&
      error.imageId === "decode-failure" &&
      error.imageIndex === 0
  );
});

test("cancellation after decoding releases the decoded resource", async (t) => {
  const pipeline = mockImagePipeline(t);
  const controller = new AbortController();

  await assert.rejects(
    createImagePdf({
      images: [{ id: "cancel-after-decode", file: makeImage() }],
      signal: controller.signal,
      onProgress(snapshot) {
        if (snapshot.phase === "decoding" && snapshot.completed === 1) {
          controller.abort();
        }
      }
    }),
    (error) => error.code === "ABORTED"
  );

  assert.equal(pipeline.closeCalls, 1);
});

test("cancellation before processing returns ABORTED", async () => {
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    createImagePdf({
      images: [{ id: "one", file: makeImage() }],
      signal: controller.signal
    }),
    (error) => error.code === "ABORTED"
  );
});

test("decoded resources are released when page image encoding fails", async (t) => {
  const pipeline = mockImagePipeline(t, { encodeError: new Error("Canvas encoding failed") });

  await assert.rejects(
    createImagePdf({
      images: [{ id: "one", file: makeImage() }]
    }),
    (error) => error.code === "PDF_GENERATION_FAILED" && error.imageId === "one" && error.imageIndex === 0
  );
  assert.equal(pipeline.closeCalls, 1);
});

test("progress callback exceptions do not interrupt PDF generation", async (t) => {
  mockImagePipeline(t);
  let result;
  try {
    result = await createImagePdf({
      images: [{ id: "one", file: makeImage() }],
      onProgress() {
        throw new Error("UI callback failed");
      }
    });
  } catch (error) {
    throw error;
  }

  assert.equal(result.pageCount, 1);
  assert.equal(result.blob.type, "application/pdf");
});
