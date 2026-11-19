import test from "node:test";
import assert from "node:assert/strict";
import { decodeImage } from "../src/js/core/image-decoder.js";

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

test("decodes a supported raster image with createImageBitmap", async (t) => {
  let closeCalls = 0;
  const bitmap = {
    width: 1280,
    height: 720,
    close() {
      closeCalls += 1;
    }
  };

  mockGlobal(t, "createImageBitmap", async () => bitmap);

  const result = await decodeImage(new Blob(["image"]), { format: "png" });

  assert.equal(result.source, bitmap);
  assert.equal(result.width, 1280);
  assert.equal(result.height, 720);
  assert.equal(result.format, "png");

  result.close();
  result.close();
  assert.equal(closeCalls, 1);
});

test("falls back to an HTML image when createImageBitmap fails", async (t) => {
  let revokedUrl = null;
  const originalUrlDescriptor = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
  const originalRevokeDescriptor = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");

  mockGlobal(t, "createImageBitmap", async () => {
    throw new Error("Native bitmap decoding failed.");
  });

  class FakeImage {
    naturalWidth = 640;
    naturalHeight = 480;
    src = "";

    async decode() {}
    removeAttribute(name) {
      if (name === "src") this.src = "";
    }
  }

  mockGlobal(t, "Image", FakeImage);

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: () => "blob:test-image"
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: (url) => {
      revokedUrl = url;
    }
  });

  t.after(() => {
    if (originalUrlDescriptor) Object.defineProperty(URL, "createObjectURL", originalUrlDescriptor);
    else delete URL.createObjectURL;

    if (originalRevokeDescriptor) Object.defineProperty(URL, "revokeObjectURL", originalRevokeDescriptor);
    else delete URL.revokeObjectURL;
  });

  const result = await decodeImage(new Blob(["image"]), { format: "jpeg" });

  assert.equal(result.width, 640);
  assert.equal(result.height, 480);
  assert.equal(result.format, "jpeg");

  result.close();
  assert.equal(revokedUrl, "blob:test-image");
});

test("rejects SVG when a safe XML parser is unavailable", async (t) => {
  mockGlobal(t, "DOMParser", undefined);

  await assert.rejects(
    decodeImage(new Blob(["<svg xmlns='http://www.w3.org/2000/svg'/>"]), { format: "svg" }),
    /could not be safely parsed or rasterized/
  );
});

test("decodes the first frame of a GIF into a bounded canvas", async (t) => {
  const gifBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const gifBytes = Uint8Array.from(atob(gifBase64), (character) => character.charCodeAt(0));
  let canvasCreated;
  let putImageDataCall;
  let closeCalls = 0;

  class FakeOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      canvasCreated = this;
    }

    getContext(type) {
      assert.equal(type, "2d");
      return {
        clearRect() {},
        fillRect() {},
        createImageData(width, height) {
          return { data: new Uint8ClampedArray(width * height * 4) };
        },
        putImageData(imageData, x, y) {
          putImageDataCall = { imageData, x, y };
        }
      };
    }
  }

  mockGlobal(t, "OffscreenCanvas", FakeOffscreenCanvas);
  mockGlobal(t, "document", undefined);

  const result = await decodeImage(new Blob([gifBytes]), { format: "gif" });

  assert.equal(result.format, "gif");
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.equal(canvasCreated.width, 1);
  assert.equal(canvasCreated.height, 1);
  assert.equal(putImageDataCall.x, 0);
  assert.equal(putImageDataCall.y, 0);
  assert.equal(putImageDataCall.imageData.data.length, 4);

  result.close();
  result.close();
  assert.equal(canvasCreated.width, 0);
  assert.equal(canvasCreated.height, 0);
});

test("rejects malformed GIF input with a format-specific error", async () => {
  await assert.rejects(
    decodeImage(new Blob(["GIF89a"]), { format: "gif" }),
    /This GIF file could not be decoded/
  );
});

test("continues to reject formats outside the browser decoder scope", async () => {
  await assert.rejects(
    decodeImage(new Blob(["image"]), { format: "avif" }),
    /Decoding is not available for the avif format/
  );
});

test("rejects invalid and empty input", async () => {
  await assert.rejects(decodeImage({}), /valid File or Blob/);
  await assert.rejects(decodeImage(new Blob([])), /file is empty/);
});

test("rejects decoded sources with invalid dimensions and releases them", async (t) => {
  let closeCalls = 0;

  mockGlobal(t, "createImageBitmap", async () => ({
    width: 0,
    height: 100,
    close() {
      closeCalls += 1;
    }
  }));

  mockGlobal(t, "Image", undefined);

  await assert.rejects(
    decodeImage(new Blob(["image"]), { format: "webp" }),
    /could not decode the selected image/
  );
  assert.equal(closeCalls, 1);
});

test("detects the input format when the caller does not provide one", async (t) => {
  const bitmap = { width: 320, height: 240, close() {} };
  mockGlobal(t, "createImageBitmap", async () => bitmap);

  const pngHeader = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ]);
  const result = await decodeImage(new Blob([pngHeader]));

  assert.equal(result.format, "png");
  assert.equal(result.width, 320);
  assert.equal(result.height, 240);
  result.close();
});
