import test from "node:test";
import assert from "node:assert/strict";
import { encodeImage } from "../src/js/core/image-encoder.js";

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

test("encodes PNG through OffscreenCanvas", async (t) => {
  let drawArguments;
  const output = new Blob(["png-output"], { type: "image/png" });

  class FakeOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }

    getContext(type) {
      assert.equal(type, "2d");
      return {
        drawImage(...args) {
          drawArguments = args;
        }
      };
    }

    async convertToBlob(options) {
      assert.deepEqual(options, { type: "image/png" });
      return output;
    }
  }

  mockGlobal(t, "OffscreenCanvas", FakeOffscreenCanvas);

  const source = { width: 320, height: 240 };
  const result = await encodeImage({ source, width: 320, height: 240 });

  assert.equal(result, output);
  assert.deepEqual(drawArguments, [source, 0, 0, 320, 240]);
});

test("encodes JPEG with quality and an explicit background through OffscreenCanvas", async (t) => {
  const calls = [];
  const output = new Blob(["jpeg-output"], { type: "image/jpeg" });

  class FakeOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }

    getContext(type) {
      assert.equal(type, "2d");
      return {
        fillStyle: "",
        fillRect(...args) {
          calls.push(["fillRect", this.fillStyle, ...args]);
        },
        drawImage(...args) {
          calls.push(["drawImage", ...args]);
        }
      };
    }

    async convertToBlob(options) {
      assert.deepEqual(options, { type: "image/jpeg", quality: 0.7 });
      return output;
    }
  }

  mockGlobal(t, "OffscreenCanvas", FakeOffscreenCanvas);

  const source = { id: "decoded-source" };
  const result = await encodeImage(
    { source, width: 320, height: 240 },
    { format: "jpeg", quality: 0.7, backgroundColor: "#123456" }
  );

  assert.equal(result, output);
  assert.deepEqual(calls[0], ["fillRect", "#123456", 0, 0, 320, 240]);
  assert.deepEqual(calls[1], ["drawImage", source, 0, 0, 320, 240]);
});

test("falls back to HTML canvas when OffscreenCanvas is unavailable", async (t) => {
  let drawArguments;
  let requestedMime;
  const output = new Blob(["fallback-png"], { type: "image/png" });
  const canvas = {
    width: 0,
    height: 0,
    getContext(type) {
      assert.equal(type, "2d");
      return {
        drawImage(...args) {
          drawArguments = args;
        }
      };
    },
    toBlob(callback, mime) {
      requestedMime = mime;
      callback(output);
    }
  };

  mockGlobal(t, "OffscreenCanvas", undefined);
  mockGlobal(t, "document", {
    createElement(tagName) {
      assert.equal(tagName, "canvas");
      return canvas;
    }
  });

  const source = { width: 800, height: 600 };
  const result = await encodeImage({ source, width: 800, height: 600 });

  assert.equal(canvas.width, 800);
  assert.equal(canvas.height, 600);
  assert.equal(requestedMime, "image/png");
  assert.equal(result, output);
  assert.deepEqual(drawArguments, [source, 0, 0, 800, 600]);
});

test("falls back to HTML canvas for JPEG and passes quality and background", async (t) => {
  const calls = [];
  let requestedMime;
  let requestedQuality;
  const output = new Blob(["fallback-jpeg"], { type: "image/jpeg" });
  const canvas = {
    width: 0,
    height: 0,
    getContext() {
      return {
        fillStyle: "",
        fillRect(...args) {
          calls.push(["fillRect", this.fillStyle, ...args]);
        },
        drawImage(...args) {
          calls.push(["drawImage", ...args]);
        }
      };
    },
    toBlob(callback, mime, quality) {
      requestedMime = mime;
      requestedQuality = quality;
      callback(output);
    }
  };

  mockGlobal(t, "OffscreenCanvas", undefined);
  mockGlobal(t, "document", {
    createElement() {
      return canvas;
    }
  });

  const result = await encodeImage(
    { source: {}, width: 64, height: 48 },
    { format: "jpeg", quality: 0.6, backgroundColor: "#abcdef" }
  );

  assert.equal(result, output);
  assert.equal(canvas.width, 64);
  assert.equal(canvas.height, 48);
  assert.equal(requestedMime, "image/jpeg");
  assert.equal(requestedQuality, 0.6);
  assert.deepEqual(calls[0], ["fillRect", "#abcdef", 0, 0, 64, 48]);
  assert.deepEqual(calls[1], ["drawImage", {}, 0, 0, 64, 48]);
});

test("falls back to HTML canvas when OffscreenCanvas returns the wrong MIME type", async (t) => {
  const fallbackOutput = new Blob(["jpeg-fallback"], { type: "image/jpeg" });

  class WrongMimeOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }

    getContext() {
      return { fillRect() {}, drawImage() {} };
    }

    async convertToBlob() {
      return new Blob(["png-instead"], { type: "image/png" });
    }
  }

  const fallbackCanvas = {
    width: 0,
    height: 0,
    getContext() {
      return { fillRect() {}, drawImage() {} };
    },
    toBlob(callback) {
      callback(fallbackOutput);
    }
  };

  mockGlobal(t, "OffscreenCanvas", WrongMimeOffscreenCanvas);
  mockGlobal(t, "document", {
    createElement() {
      return fallbackCanvas;
    }
  });

  const result = await encodeImage(
    { source: {}, width: 20, height: 20 },
    { format: "jpeg" }
  );

  assert.equal(result, fallbackOutput);
});

test("rejects unsupported output formats", async () => {
  await assert.rejects(
    encodeImage({ source: {}, width: 10, height: 10 }, { format: "avif" }),
    /Only PNG, JPEG, WebP, and BMP encoding are currently implemented/
  );
});

test("rejects invalid decoded image input", async () => {
  await assert.rejects(encodeImage(null), /valid decoded image result/);
  await assert.rejects(
    encodeImage({ source: {}, width: 0, height: 10 }),
    /invalid dimensions/
  );
});

test("rejects invalid JPEG quality and background settings", async () => {
  const image = { source: {}, width: 10, height: 10 };

  await assert.rejects(
    encodeImage(image, { format: "jpeg", quality: 1.5 }),
    /JPEG quality must be a number between 0 and 1/
  );
  await assert.rejects(
    encodeImage(image, { format: "jpeg", backgroundColor: "" }),
    /valid JPEG background color/
  );
});

test("falls back to HTML canvas when OffscreenCanvas returns an empty PNG Blob", async (t) => {
  class EmptyOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }

    getContext() {
      return { drawImage() {} };
    }

    async convertToBlob() {
      return new Blob([]);
    }
  }

  mockGlobal(t, "OffscreenCanvas", EmptyOffscreenCanvas);
  mockGlobal(t, "document", {
    createElement() {
      return {
        width: 0,
        height: 0,
        getContext() {
          return { drawImage() {} };
        },
        toBlob(callback) {
          callback(new Blob(["png"], { type: "image/png" }));
        }
      };
    }
  });

  const result = await encodeImage({ source: {}, width: 10, height: 10 });
  assert.equal(result.type, "image/png");
});

test("rejects empty JPEG output", async (t) => {
  mockGlobal(t, "OffscreenCanvas", undefined);
  mockGlobal(t, "document", {
    createElement() {
      return {
        width: 0,
        height: 0,
        getContext() {
          return { fillRect() {}, drawImage() {} };
        },
        toBlob(callback) {
          callback(null);
        }
      };
    }
  });

  await assert.rejects(
    encodeImage({ source: {}, width: 10, height: 10 }, { format: "jpeg" }),
    /JPEG encoding failed/
  );
});


test("encodes WebP with quality through OffscreenCanvas", async (t) => {
  let optionsReceived;
  const output = new Blob(["webp-output"], { type: "image/webp" });

  class FakeOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }

    getContext(type) {
      assert.equal(type, "2d");
      return { drawImage() {} };
    }

    async convertToBlob(options) {
      optionsReceived = options;
      return output;
    }
  }

  mockGlobal(t, "OffscreenCanvas", FakeOffscreenCanvas);

  const result = await encodeImage(
    { source: {}, width: 320, height: 240 },
    { format: "webp", quality: 0.65 }
  );

  assert.equal(result, output);
  assert.deepEqual(optionsReceived, { type: "image/webp", quality: 0.65 });
});

test("falls back to HTML canvas for WebP and passes quality", async (t) => {
  let requestedMime;
  let requestedQuality;
  const output = new Blob(["webp-fallback"], { type: "image/webp" });
  const canvas = {
    width: 0,
    height: 0,
    getContext() {
      return { drawImage() {} };
    },
    toBlob(callback, mime, quality) {
      requestedMime = mime;
      requestedQuality = quality;
      callback(output);
    }
  };

  mockGlobal(t, "OffscreenCanvas", undefined);
  mockGlobal(t, "document", {
    createElement() {
      return canvas;
    }
  });

  const result = await encodeImage(
    { source: {}, width: 80, height: 60 },
    { format: "webp", quality: 0.55 }
  );

  assert.equal(result, output);
  assert.equal(requestedMime, "image/webp");
  assert.equal(requestedQuality, 0.55);
});

test("rejects a WebP request when the browser returns PNG instead", async (t) => {
  mockGlobal(t, "OffscreenCanvas", undefined);
  mockGlobal(t, "document", {
    createElement() {
      return {
        width: 0,
        height: 0,
        getContext() {
          return { drawImage() {} };
        },
        toBlob(callback) {
          callback(new Blob(["png-fallback"], { type: "image/png" }));
        }
      };
    }
  });

  await assert.rejects(
    encodeImage({ source: {}, width: 10, height: 10 }, { format: "webp" }),
    /unexpected output MIME type/
  );
});

test("rejects invalid WebP quality", async () => {
  await assert.rejects(
    encodeImage(
      { source: {}, width: 10, height: 10 },
      { format: "webp", quality: 1.5 }
    ),
    /WEBP quality must be a number between 0 and 1/
  );
});


test("encodes a 24-bit BMP with BGR pixels, row padding, and white alpha compositing", async (t) => {
  const imageData = {
    data: new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 0, 255, 0
    ])
  };

  class FakeOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }

    getContext(type) {
      assert.equal(type, "2d");
      return {
        drawImage() {},
        getImageData(x, y, width, height) {
          assert.deepEqual([x, y, width, height], [0, 0, 2, 1]);
          return imageData;
        }
      };
    }
  }

  mockGlobal(t, "OffscreenCanvas", FakeOffscreenCanvas);

  const result = await encodeImage(
    { source: {}, width: 2, height: 1 },
    { format: "bmp" }
  );

  assert.equal(result.type, "image/bmp");
  assert.equal(result.size, 62);

  const bytes = new Uint8Array(await result.arrayBuffer());
  const view = new DataView(bytes.buffer);

  assert.equal(view.getUint8(0), 0x42);
  assert.equal(view.getUint8(1), 0x4d);
  assert.equal(view.getUint32(2, true), 62);
  assert.equal(view.getUint32(10, true), 54);
  assert.equal(view.getInt32(18, true), 2);
  assert.equal(view.getInt32(22, true), 1);
  assert.equal(view.getUint16(28, true), 24);
  assert.deepEqual([...bytes.slice(54)], [
    0, 0, 255,
    255, 255, 255,
    0, 0
  ]);
});

test("encodes BMP through HTML Canvas when OffscreenCanvas is unavailable", async (t) => {
  const canvas = {
    width: 0,
    height: 0,
    getContext(type) {
      assert.equal(type, "2d");
      return {
        drawImage() {},
        getImageData() {
          return { data: new Uint8ClampedArray([12, 34, 56, 255]) };
        }
      };
    }
  };

  mockGlobal(t, "OffscreenCanvas", undefined);
  mockGlobal(t, "document", {
    createElement(tagName) {
      assert.equal(tagName, "canvas");
      return canvas;
    }
  });

  const result = await encodeImage(
    { source: {}, width: 1, height: 1 },
    { format: "bmp" }
  );

  assert.equal(result.type, "image/bmp");
  assert.equal(canvas.width, 1);
  assert.equal(canvas.height, 1);
  const bytes = new Uint8Array(await result.arrayBuffer());
  assert.deepEqual([...bytes.slice(54, 58)], [56, 34, 12, 0]);
});
