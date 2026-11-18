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

test("rejects unsupported output formats", async () => {
  await assert.rejects(
    encodeImage({ source: {}, width: 10, height: 10 }, { format: "jpeg" }),
    /Only PNG encoding is currently implemented/
  );
});

test("rejects invalid decoded image input", async () => {
  await assert.rejects(encodeImage(null), /valid decoded image result/);
  await assert.rejects(
    encodeImage({ source: {}, width: 0, height: 10 }),
    /invalid dimensions/
  );
});

test("rejects empty PNG output", async (t) => {
  class FakeOffscreenCanvas {
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

  mockGlobal(t, "OffscreenCanvas", FakeOffscreenCanvas);

  await assert.rejects(
    encodeImage({ source: {}, width: 10, height: 10 }),
    /empty PNG output/
  );
});

test("falls back to an HTML canvas when OffscreenCanvas is unavailable", async (t) => {
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
