import test from "node:test";
import assert from "node:assert/strict";
import { convertImageDataToFormat } from "../src/js/core/conversion-service.js";

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

function setupImageEncodingMocks(t, { decodedWidth = 4, decodedHeight = 3 } = {}) {
  const canvases = [];
  const draws = [];
  let bitmapClosed = false;
  const pngSignature = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ]);
  const encodedBlob = new Blob([pngSignature], { type: "image/png" });

  class FakeOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.imageDataWritten = null;
      canvases.push(this);
    }

    getContext() {
      return {
        createImageData: (width, height) => ({
          data: new Uint8ClampedArray(width * height * 4),
          width,
          height
        }),
        putImageData: (imageData, x, y) => {
          this.imageDataWritten = imageData;
          this.putPosition = [x, y];
        },
        drawImage: (source, ...args) => {
          draws.push({ source, args });
        }
      };
    }

    async convertToBlob(options) {
      assert.deepEqual(options, { type: "image/png" });
      return encodedBlob;
    }
  }

  mockGlobal(t, "OffscreenCanvas", FakeOffscreenCanvas);
  mockGlobal(t, "createImageBitmap", async (blob) => {
    assert.equal(blob, encodedBlob);
    return {
      width: decodedWidth,
      height: decodedHeight,
      close() {
        bitmapClosed = true;
      }
    };
  });

  return {
    canvases,
    draws,
    encodedBlob,
    wasBitmapClosed: () => bitmapClosed
  };
}

test("converts edited ImageData without decoding the original file and verifies the output", async (t) => {
  const mocks = setupImageEncodingMocks(t);
  const pixels = new Uint8ClampedArray(4 * 3 * 4);
  pixels.set([12, 34, 56, 255]);
  const imageData = {
    data: pixels,
    width: 4,
    height: 3,
    colorSpace: "srgb"
  };

  const result = await convertImageDataToFormat(imageData, "png");

  assert.equal(result.format, "png");
  assert.equal(result.blob, mocks.encodedBlob);
  assert.equal(result.width, 4);
  assert.equal(result.height, 3);
  assert.equal(mocks.draws.length, 1);
  assert.equal(mocks.draws[0].source, mocks.canvases[0]);
  assert.deepEqual(mocks.draws[0].args, [0, 0, 4, 3]);
  assert.deepEqual([...pixels.slice(0, 4)], [12, 34, 56, 255]);
  assert.equal(mocks.canvases[0].width, 0);
  assert.equal(mocks.canvases[0].height, 0);
  assert.equal(mocks.wasBitmapClosed(), true);
});

test("rejects ImageData when the encoded output dimensions do not match", async (t) => {
  setupImageEncodingMocks(t, { decodedWidth: 5, decodedHeight: 3 });
  const imageData = {
    data: new Uint8ClampedArray(4 * 3 * 4),
    width: 4,
    height: 3,
    colorSpace: "srgb"
  };

  await assert.rejects(
    convertImageDataToFormat(imageData, "png"),
    /dimensions do not match the source image/
  );
});

test("rejects invalid ImageData before allocating an encoding canvas", async (t) => {
  const mocks = setupImageEncodingMocks(t);

  await assert.rejects(
    convertImageDataToFormat({
      data: new Uint8ClampedArray(4),
      width: 2,
      height: 2,
      colorSpace: "srgb"
    }, "png"),
    /pixel data length does not match/
  );

  assert.equal(mocks.canvases.length, 0);
});

test("does not route edited ImageData through the animated GIF File conversion path", async (t) => {
  const mocks = setupImageEncodingMocks(t);
  const imageData = {
    data: new Uint8ClampedArray(4 * 3 * 4),
    width: 4,
    height: 3,
    colorSpace: "srgb"
  };

  await assert.rejects(
    convertImageDataToFormat(imageData, "gif"),
    /Edited ImageData conversion supports PNG, JPEG, WebP, BMP, TIFF, and SVG/
  );
  assert.equal(mocks.canvases.length, 0);
});
