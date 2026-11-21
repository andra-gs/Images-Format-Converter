import test from "node:test";
import assert from "node:assert/strict";
import {
  applyImageTransformations,
  IMAGE_TRANSFORMER_LIMITS
} from "../src/js/core/image-transformer.js";

function createImageData(width, height, pixels) {
  return { data: new Uint8ClampedArray(pixels), width, height, colorSpace: "srgb" };
}

function pixelsOf(result) {
  return [...result.imageData.data];
}

const twoByTwo = () => createImageData(2, 2, [
  255, 0, 0, 255, 0, 255, 0, 255,
  0, 0, 255, 255, 255, 255, 0, 255
]);

test("returns a new buffer and preserves pixels when no transformation is selected", () => {
  const source = twoByTwo();
  const original = [...source.data];
  const result = applyImageTransformations(source);

  assert.deepEqual(pixelsOf(result), original);
  assert.notEqual(result.imageData, source);
  assert.notEqual(result.imageData.data, source.data);
  assert.equal(result.width, 2);
  assert.equal(result.height, 2);
  assert.equal(result.imageData.colorSpace, "srgb");
  assert.deepEqual([...source.data], original);
});

test("crops the requested source-relative pixel rectangle", () => {
  const result = applyImageTransformations(twoByTwo(), {
    crop: { x: 1, y: 0, width: 1, height: 2 }
  });
  assert.equal(result.width, 1);
  assert.equal(result.height, 2);
  assert.deepEqual(pixelsOf(result), [0, 255, 0, 255, 255, 255, 0, 255]);
});

test("null crop dimensions extend to the source image's right and bottom edges", () => {
  const result = applyImageTransformations(twoByTwo(), {
    crop: { x: 1, y: 1, width: null, height: null }
  });
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.deepEqual(pixelsOf(result), [255, 255, 0, 255]);
});

test("resizes to exact dimensions when aspect ratio is unlocked", () => {
  const result = applyImageTransformations(twoByTwo(), {
    resize: { width: 1, height: 2, keepAspectRatio: false }
  });
  assert.equal(result.width, 1);
  assert.equal(result.height, 2);
  assert.deepEqual(pixelsOf(result), [128, 128, 0, 255, 128, 128, 128, 255]);
});

test("calculates the missing resize dimension when aspect ratio is locked", () => {
  const source = createImageData(4, 2, new Array(32).fill(100).map((value, index) => index % 4 === 3 ? 255 : value));
  const result = applyImageTransformations(source, {
    resize: { width: 2, height: null, keepAspectRatio: true }
  });
  assert.equal(result.width, 2);
  assert.equal(result.height, 1);
});

test("fits two requested bounds without distorting the aspect ratio", () => {
  const source = createImageData(4, 2, new Array(32).fill(255));
  const result = applyImageTransformations(source, {
    resize: { width: 3, height: 3, keepAspectRatio: true }
  });
  assert.equal(result.width, 3);
  assert.equal(result.height, 2);
});

test("rotates clockwise by 90 degrees and swaps dimensions", () => {
  const result = applyImageTransformations(twoByTwo(), { rotation: 90 });
  assert.equal(result.width, 2);
  assert.equal(result.height, 2);
  assert.deepEqual(pixelsOf(result), [
    0, 0, 255, 255, 255, 0, 0, 255,
    255, 255, 0, 255, 0, 255, 0, 255
  ]);
});

test("rotates by 180 and 270 degrees with correct pixel order", () => {
  const source = twoByTwo();
  const rotated180 = applyImageTransformations(source, { rotation: 180 });
  const rotated270 = applyImageTransformations(source, { rotation: 270 });
  assert.deepEqual(pixelsOf(rotated180), [
    255, 255, 0, 255, 0, 0, 255, 255,
    0, 255, 0, 255, 255, 0, 0, 255
  ]);
  assert.deepEqual(pixelsOf(rotated270), [
    0, 255, 0, 255, 255, 255, 0, 255,
    255, 0, 0, 255, 0, 0, 255, 255
  ]);
});

test("flips horizontally and vertically", () => {
  const source = twoByTwo();
  const horizontal = applyImageTransformations(source, { flipHorizontal: true });
  const vertical = applyImageTransformations(source, { flipVertical: true });
  assert.deepEqual(pixelsOf(horizontal), [
    0, 255, 0, 255, 255, 0, 0, 255,
    255, 255, 0, 255, 0, 0, 255, 255
  ]);
  assert.deepEqual(pixelsOf(vertical), [
    0, 0, 255, 255, 255, 255, 0, 255,
    255, 0, 0, 255, 0, 255, 0, 255
  ]);
});

test("applies crop, resize, rotation, then flip in the agreed order", () => {
  const source = createImageData(3, 2, [
    10, 0, 0, 255, 20, 0, 0, 255, 30, 0, 0, 255,
    40, 0, 0, 255, 50, 0, 0, 255, 60, 0, 0, 255
  ]);
  const result = applyImageTransformations(source, {
    crop: { x: 1, y: 0, width: 2, height: 2 },
    resize: { width: 2, height: 2, keepAspectRatio: false },
    rotation: 90,
    flipHorizontal: true
  });
  assert.equal(result.width, 2);
  assert.equal(result.height, 2);
  assert.deepEqual(pixelsOf(result), [
    20, 0, 0, 255, 50, 0, 0, 255,
    30, 0, 0, 255, 60, 0, 0, 255
  ]);
});

test("uses premultiplied-alpha interpolation to avoid transparent color fringes", () => {
  const source = createImageData(2, 1, [255, 0, 0, 0, 0, 0, 255, 255]);
  const result = applyImageTransformations(source, {
    resize: { width: 3, height: 1, keepAspectRatio: false }
  });
  assert.deepEqual(pixelsOf(result), [
    0, 0, 0, 0,
    0, 0, 255, 128,
    0, 0, 255, 255
  ]);
});

test("rejects invalid ImageData and unsupported color spaces", () => {
  assert.throws(() => applyImageTransformations(null), TypeError);
  assert.throws(() => applyImageTransformations({}), (error) => error instanceof TypeError && error.code === "INVALID_IMAGE_DATA");
  assert.throws(() => applyImageTransformations({
    data: new Uint8Array(4), width: 1, height: 1, colorSpace: "srgb"
  }), (error) => error instanceof TypeError && error.code === "INVALID_IMAGE_DATA");
  assert.throws(() => applyImageTransformations({
    data: new Uint8ClampedArray(4), width: 1, height: 1, colorSpace: "display-p3"
  }), TypeError);
  assert.throws(() => applyImageTransformations({
    data: new Uint8ClampedArray(3), width: 1, height: 1, colorSpace: "srgb"
  }), TypeError);
});

test("rejects unknown options and invalid parameter types", () => {
  const source = twoByTwo();
  assert.throws(() => applyImageTransformations(source, { unknown: true }), (error) => error.code === "INVALID_TRANSFORM_OPTIONS");
  assert.throws(() => applyImageTransformations(source, { resize: { unknown: 1 } }), TypeError);
  assert.throws(() => applyImageTransformations(source, { crop: { unknown: 1 } }), TypeError);
  assert.throws(() => applyImageTransformations(source, { flipHorizontal: 1 }), TypeError);
  assert.throws(() => applyImageTransformations(source, { resize: { keepAspectRatio: 1 } }), TypeError);
});

test("rejects invalid dimensions, crop bounds, and rotation values", () => {
  const source = twoByTwo();
  assert.throws(() => applyImageTransformations(source, { resize: { width: 0 } }), RangeError);
  assert.throws(() => applyImageTransformations(source, {
    resize: { width: 2, height: null, keepAspectRatio: false }
  }), RangeError);
  assert.throws(() => applyImageTransformations(source, { crop: { x: 2, y: 0 } }), (error) => error.code === "INVALID_CROP_BOUNDS");
  assert.throws(() => applyImageTransformations(source, {
    crop: { x: 1, y: 1, width: 2, height: 1 }
  }), (error) => error.code === "INVALID_CROP_BOUNDS");
  assert.throws(() => applyImageTransformations(source, { rotation: 45 }), RangeError);
});

test("enforces the agreed dimension and pixel limits", () => {
  assert.deepEqual(IMAGE_TRANSFORMER_LIMITS, { maxDimension: 16_384, maxPixels: 40_000_000 });
  assert.throws(() => applyImageTransformations({
    data: new Uint8ClampedArray(4), width: 16_385, height: 1, colorSpace: "srgb"
  }), (error) => error instanceof RangeError && error.code === "IMAGE_DIMENSIONS_EXCEEDED");
  assert.throws(() => applyImageTransformations(twoByTwo(), {
    resize: { width: 8000, height: 6000, keepAspectRatio: false }
  }), (error) => error instanceof RangeError && error.code === "IMAGE_DIMENSIONS_EXCEEDED");
});
