import test from "node:test";
import assert from "node:assert/strict";
import {
  IMAGE_OPTIMIZATION_CAPABILITIES,
  optimizeImage
} from "../src/js/core/image-optimizer.js";

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

const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
]);

function createEncodedBlob(type, requestedSize = 256, { invalidSignature = false } = {}) {
  const size = Math.max(requestedSize, 32);
  let header;

  if (invalidSignature) {
    header = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
  } else if (type === "image/jpeg") {
    header = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  } else if (type === "image/webp") {
    header = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50
    ]);
  } else {
    header = PNG_SIGNATURE;
  }

  const bytes = new Uint8Array(size);
  bytes.set(header);
  return new Blob([bytes], { type });
}

function createSvgDomParserMock() {
  return class {
    parseFromString(source) {
      const rootMatch = source.match(/<svg\b([^>]*)>/i);
      const attributes = [];
      if (rootMatch) {
        for (const match of rootMatch[1].matchAll(/([^\s=]+)\s*=\s*(["'])(.*?)\2/g)) {
          attributes.push({ name: match[1], value: match[3] });
        }
      }
      const root = {
        localName: "svg",
        namespaceURI: "http://www.w3.org/2000/svg",
        attributes,
        childNodes: [],
        getAttribute(name) { return attributes.find((attribute) => attribute.name === name)?.value ?? null; },
        setAttribute(name, value) {
          const existing = attributes.find((attribute) => attribute.name === name);
          if (existing) existing.value = String(value);
          else attributes.push({ name, value: String(value) });
        },
        removeAttribute(name) {
          const index = attributes.findIndex((attribute) => attribute.name === name);
          if (index >= 0) attributes.splice(index, 1);
        },
        removeAttributeNode(attribute) {
          const index = attributes.indexOf(attribute);
          if (index >= 0) attributes.splice(index, 1);
        }
      };
      return { documentElement: root, querySelector() { return null; } };
    }
  };
}

function createSvgXmlSerializerMock() {
  return class {
    serializeToString(root) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="' + root.getAttribute("width") + '" height="' + root.getAttribute("height") + '"></svg>';
    }
  };
}

function setupBrowserMocks(t, { sizeForQuality, invalidSignature = false } = {}) {
  const encodeCalls = [];
  const bitmaps = [];

  class FakeOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }

    getContext() {
      return {
        fillStyle: "#ffffff",
        fillRect() {},
        drawImage() {},
        clearRect() {},
        getImageData: (x, y, width, height) => ({
          data: new Uint8ClampedArray(width * height * 4).fill(255),
          width,
          height
        }),
        createImageData: (width, height) => ({
          data: new Uint8ClampedArray(width * height * 4),
          width,
          height
        }),
        putImageData() {}
      };
    }

    async convertToBlob(options) {
      encodeCalls.push(options);
      const size = sizeForQuality
        ? sizeForQuality(options.quality)
        : 256;
      return createEncodedBlob(options.type, size, { invalidSignature });
    }
  }

  mockGlobal(t, "OffscreenCanvas", FakeOffscreenCanvas);
  // Minimal SVG DOM shims exercise the optimizer flow in Node. Real SVG parsing
  // and sanitization remain covered by browser validation.
  mockGlobal(t, "DOMParser", createSvgDomParserMock());
  mockGlobal(t, "XMLSerializer", createSvgXmlSerializerMock());
  mockGlobal(t, "createImageBitmap", async () => {
    const bitmap = {
      width: 2,
      height: 2,
      close() {
        bitmap.closed = true;
      }
    };
    bitmaps.push(bitmap);
    return bitmap;
  });

  return { encodeCalls, bitmaps };
}

function createSource() {
  return new Blob([PNG_SIGNATURE, new Uint8Array(24)], { type: "image/png" });
}

test("exposes the agreed format capability matrix and quality settings", () => {
  assert.deepEqual(
    Object.keys(IMAGE_OPTIMIZATION_CAPABILITIES.formats),
    ["jpeg", "webp", "png", "bmp", "tiff", "gif", "svg"]
  );
  assert.equal(IMAGE_OPTIMIZATION_CAPABILITIES.formats.jpeg.presets, true);
  assert.equal(IMAGE_OPTIMIZATION_CAPABILITIES.formats.webp.targetSize, true);
  assert.equal(IMAGE_OPTIMIZATION_CAPABILITIES.formats.png.presets, false);
  assert.deepEqual(IMAGE_OPTIMIZATION_CAPABILITIES.presets, {
    low: 0.55,
    medium: 0.75,
    high: 0.9
  });
  assert.equal(IMAGE_OPTIMIZATION_CAPABILITIES.targetSize.maxAttempts, 7);
});

test("rejects invalid sources and empty blobs", async () => {
  await assert.rejects(optimizeImage(null, {
    format: "png",
    optimization: { mode: "none" }
  }), TypeError);

  await assert.rejects(optimizeImage(new Blob([]), {
    format: "png",
    optimization: { mode: "none" }
  }), /non-empty File or Blob/);

  await assert.rejects(optimizeImage({
    file: createSource(),
    imageData: { data: new Uint8ClampedArray(4), width: 2, height: 2, colorSpace: "srgb" }
  }, {
    format: "png",
    optimization: { mode: "none" }
  }), /pixel data length does not match/);
});

test("rejects unknown options, missing mode, and invalid target sizes", async () => {
  const source = createSource();

  await assert.rejects(optimizeImage(source, {
    format: "png",
    optimization: { mode: "none", quality: 0.5 }
  }), (error) => error.code === "INVALID_OPTIMIZATION_OPTIONS");

  await assert.rejects(optimizeImage(source, {
    format: "png",
    optimization: { mode: "none" },
    extra: true
  }), (error) => error.code === "INVALID_OPTIMIZATION_OPTIONS");

  await assert.rejects(optimizeImage(source, {
    format: "jpeg",
    optimization: { mode: "target-size", targetBytes: 0 }
  }), (error) => error.code === "TARGET_SIZE_INVALID");

  await assert.rejects(optimizeImage(source, {
    format: "jpeg",
    optimization: { mode: "target-size", targetBytes: Number.NaN }
  }), (error) => error.code === "TARGET_SIZE_INVALID");
});

test("rejects unsupported output formats and optimization modes", async () => {
  const source = createSource();

  await assert.rejects(optimizeImage(source, {
    format: "heic",
    optimization: { mode: "none" }
  }), (error) => error.code === "UNSUPPORTED_OUTPUT_FORMAT");

  await assert.rejects(optimizeImage(source, {
    format: "png",
    optimization: { mode: "preset", preset: "medium" }
  }), (error) => error.code === "UNSUPPORTED_OPTIMIZATION");

  await assert.rejects(optimizeImage(source, {
    format: "bmp",
    optimization: { mode: "target-size", targetBytes: 1000 }
  }), (error) => error.code === "UNSUPPORTED_OPTIMIZATION");
});

test("rejects edited ImageData for GIF rather than discarding edits", async () => {
  const source = createSource();
  const imageData = {
    data: new Uint8ClampedArray(2 * 2 * 4),
    width: 2,
    height: 2,
    colorSpace: "srgb"
  };

  await assert.rejects(optimizeImage({ file: source, imageData }, {
    format: "gif",
    optimization: { mode: "none" }
  }), (error) => error.code === "UNSUPPORTED_OUTPUT_FORMAT");
});

for (const format of ["png", "jpeg", "webp", "bmp", "tiff", "svg", "gif"]) {
  test(`converts ${format.toUpperCase()} in none mode and reports actual size metrics`, async (t) => {
    setupBrowserMocks(t);
    const source = createSource();

    const result = await optimizeImage(source, {
      format,
      optimization: { mode: "none" }
    });

    assert.equal(result.format, format);
    assert.equal(result.mimeType, {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
      bmp: "image/bmp",
      tiff: "image/tiff",
      svg: "image/svg+xml",
      gif: "image/gif"
    }[format]);
    assert.ok(result.blob instanceof Blob);
    assert.ok(result.blob.size > 0);
    assert.equal(result.size.sourceBytes, source.size);
    assert.equal(result.size.outputBytes, result.blob.size);
    assert.equal(result.size.differenceBytes, source.size - result.blob.size);
    assert.equal(result.optimization.mode, "none");
    assert.equal(result.optimization.quality, null);
    assert.equal(result.optimization.attempts, 1);
    assert.equal(result.validation.status, "passed");
    assert.equal(result.width, 2);
    assert.equal(result.height, 2);
  });
}

for (const [preset, quality] of [["low", 0.55], ["medium", 0.75], ["high", 0.9]]) {
  test(`maps JPEG ${preset} preset to quality ${quality}`, async (t) => {
    const mocks = setupBrowserMocks(t);
    const result = await optimizeImage(createSource(), {
      format: "jpeg",
      optimization: { mode: "preset", preset }
    });

    assert.ok(mocks.encodeCalls.some((call) => call.quality === quality));
    assert.equal(result.optimization.preset, preset);
    assert.equal(result.optimization.quality, quality);
    assert.equal(result.optimization.attempts, 1);
  });

  test(`maps WebP ${preset} preset to quality ${quality}`, async (t) => {
    const mocks = setupBrowserMocks(t);
    const result = await optimizeImage(createSource(), {
      format: "webp",
      optimization: { mode: "preset", preset }
    });

    assert.ok(mocks.encodeCalls.some((call) => call.quality === quality));
    assert.equal(result.optimization.preset, preset);
    assert.equal(result.optimization.quality, quality);
  });
}

test("target-size mode samples at most seven quality values and selects the closest size under target", async (t) => {
  const mocks = setupBrowserMocks(t, {
    sizeForQuality: (quality = 0.85) => Math.round(100 + quality * 1000)
  });
  const source = createSource();

  const result = await optimizeImage(source, {
    format: "jpeg",
    optimization: { mode: "target-size", targetBytes: 600 }
  });

  assert.equal(mocks.encodeCalls.length, 7);
  assert.ok(mocks.encodeCalls.length <= IMAGE_OPTIMIZATION_CAPABILITIES.targetSize.maxAttempts);
  assert.equal(result.optimization.mode, "target-size");
  assert.equal(result.optimization.targetBytes, 600);
  assert.equal(result.optimization.targetReached, true);
  assert.equal(result.optimization.attempts, 7);
  assert.ok(result.blob.size <= 600);
  assert.equal(result.blob.size, 519);
});

test("target-size mode returns the smallest valid candidate when no candidate reaches target", async (t) => {
  setupBrowserMocks(t, {
    sizeForQuality: (quality = 0.85) => Math.round(100 + quality * 1000)
  });

  const result = await optimizeImage(createSource(), {
    format: "webp",
    optimization: { mode: "target-size", targetBytes: 50 }
  });

  assert.equal(result.optimization.targetReached, false);
  assert.equal(result.blob.size, 200);
});

test("target-size mode continues after an individual encoding attempt fails", async (t) => {
  const calls = [];
  class FailingCandidateCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
    getContext() {
      return { fillStyle: "", fillRect() {}, drawImage() {} };
    }
    async convertToBlob(options) {
      calls.push(options.quality);
      if (options.quality === 0.525) throw new Error("simulated encoder failure");
      return createEncodedBlob(options.type, Math.round(100 + options.quality * 1000));
    }
  }
  mockGlobal(t, "OffscreenCanvas", FailingCandidateCanvas);
  mockGlobal(t, "createImageBitmap", async () => ({ width: 2, height: 2, close() {} }));

  const result = await optimizeImage(createSource(), {
    format: "jpeg",
    optimization: { mode: "target-size", targetBytes: 600 }
  });

  assert.equal(calls.length, 7);
  assert.ok(result.blob.size > 0);
  assert.equal(result.optimization.attempts, 7);
});

test("rejects target-size mode when every encoding attempt fails", async (t) => {
  class FailingCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
    getContext() {
      return { fillStyle: "", fillRect() {}, drawImage() {} };
    }
    async convertToBlob() {
      throw new Error("simulated encoder failure");
    }
  }
  mockGlobal(t, "OffscreenCanvas", FailingCanvas);
  mockGlobal(t, "createImageBitmap", async () => ({ width: 2, height: 2, close() {} }));

  await assert.rejects(optimizeImage(createSource(), {
    format: "jpeg",
    optimization: { mode: "target-size", targetBytes: 500 }
  }), (error) => error.code === "ENCODING_FAILED");
});

test("reports output signature validation failures with a stable error code", async (t) => {
  setupBrowserMocks(t, { invalidSignature: true });

  await assert.rejects(optimizeImage(createSource(), {
    format: "jpeg",
    optimization: { mode: "preset", preset: "medium" }
  }), (error) => error.code === "OUTPUT_VALIDATION_FAILED");
});

test("uses edited ImageData and leaves its pixel buffer unchanged", async (t) => {
  setupBrowserMocks(t);
  const file = createSource();
  const data = new Uint8ClampedArray([
    10, 20, 30, 255,
    40, 50, 60, 128,
    70, 80, 90, 255,
    100, 110, 120, 0
  ]);
  const original = [...data];
  const imageData = { data, width: 2, height: 2, colorSpace: "srgb" };

  const result = await optimizeImage({ file, imageData }, {
    format: "webp",
    optimization: { mode: "preset", preset: "medium" }
  });

  assert.equal(result.format, "webp");
  assert.deepEqual([...imageData.data], original);
  assert.equal(result.size.sourceBytes, file.size);
});

test("reports output growth as a negative reduction percentage", async (t) => {
  setupBrowserMocks(t);
  const source = createSource();

  const result = await optimizeImage(source, {
    format: "png",
    optimization: { mode: "none" }
  });

  assert.equal(result.size.differenceBytes, source.size - result.blob.size);
  assert.equal(result.size.reductionPercent,
    ((source.size - result.blob.size) / source.size) * 100);
});
