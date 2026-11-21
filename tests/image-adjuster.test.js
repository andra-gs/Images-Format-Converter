import test from "node:test";
import assert from "node:assert/strict";
import { applyImageAdjustments, IMAGE_ADJUSTER_LIMITS } from "../src/js/core/image-adjuster.js";

function image(width, height, pixels) {
  return { data: new Uint8ClampedArray(pixels), width, height, colorSpace: "srgb" };
}
const pixels = (result) => [...result.imageData.data];

test("defaults return a new immutable buffer with unchanged pixels and dimensions", () => {
  const source = image(2, 1, [100, 150, 200, 255, 20, 40, 60, 128]);
  const original = [...source.data];
  const result = applyImageAdjustments(source);
  assert.deepEqual(pixels(result), original);
  assert.notEqual(result.imageData.data, source.data);
  assert.deepEqual([...source.data], original);
  assert.equal(result.width, 2);
  assert.equal(result.height, 1);
  assert.equal(result.imageData.colorSpace, "srgb");
});

test("brightness uses the agreed -100 to 100 range", () => {
  const source = image(2, 1, [0, 64, 255, 255, 255, 128, 0, 128]);
  assert.deepEqual(pixels(applyImageAdjustments(source, { brightness: 100 })),
    [255, 255, 255, 255, 255, 255, 255, 128]);
  assert.deepEqual(pixels(applyImageAdjustments(source, { brightness: -100 })),
    [0, 0, 0, 255, 0, 0, 0, 128]);
});

test("contrast pivots around middle gray", () => {
  const source = image(3, 1, [0, 0, 0, 255, 128, 128, 128, 255, 255, 255, 255, 255]);
  assert.deepEqual(pixels(applyImageAdjustments(source, { contrast: 100 })),
    [0, 0, 0, 255, 130, 130, 130, 255, 255, 255, 255, 255]);
  assert.deepEqual(pixels(applyImageAdjustments(source, { contrast: -100 })),
    [128, 128, 128, 255, 128, 128, 128, 255, 128, 128, 128, 255]);
});

test("saturation uses sRGB luminance and supports 0 to 200 percent", () => {
  const source = image(1, 1, [200, 100, 50, 255]);
  assert.deepEqual(pixels(applyImageAdjustments(source, { saturation: 0 })), [118, 118, 118, 255]);
  assert.deepEqual(pixels(applyImageAdjustments(source, { saturation: 200 })), [255, 82, 0, 255]);
});

test("grayscale uses sRGB luminance and preserves alpha", () => {
  const result = applyImageAdjustments(image(1, 1, [200, 100, 50, 173]), { grayscale: true });
  assert.deepEqual(pixels(result), [118, 118, 118, 173]);
});

test("sepia applies its color matrix and preserves alpha", () => {
  const result = applyImageAdjustments(image(1, 1, [100, 150, 200, 91]), { sepia: true });
  assert.deepEqual(pixels(result), [192, 171, 134, 91]);
});

test("grayscale runs before sepia when both are enabled", () => {
  const result = applyImageAdjustments(image(1, 1, [200, 100, 50, 255]), {
    grayscale: true, sepia: true
  });
  assert.deepEqual(pixels(result), [159, 142, 110, 255]);
});

test("Gaussian blur preserves alpha and uses premultiplied-alpha samples", () => {
  const source = image(3, 1, [0, 0, 0, 255, 255, 255, 255, 128, 0, 0, 0, 0]);
  const result = applyImageAdjustments(source, { blur: 1 });
  assert.deepEqual(pixels(result), [14, 14, 14, 255, 201, 201, 201, 128, 255, 255, 255, 0]);
});

test("premultiplied-alpha blur avoids transparent color fringes", () => {
  const source = image(2, 1, [255, 0, 0, 0, 0, 0, 255, 255]);
  const result = applyImageAdjustments(source, { blur: 1 });
  assert.deepEqual(pixels(result), [0, 0, 255, 0, 0, 0, 255, 255]);
});

test("Gaussian blur processes multiple rows with a separable kernel", () => {
  const source = image(3, 3, [
    0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255,
    0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255,
    0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255
  ]);
  assert.deepEqual(pixels(applyImageAdjustments(source, { blur: 1 })), [
    3, 3, 3, 255, 21, 21, 21, 255, 3, 3, 3, 255,
    21, 21, 21, 255, 158, 158, 158, 255, 21, 21, 21, 255,
    3, 3, 3, 255, 21, 21, 21, 255, 3, 3, 3, 255
  ]);
});

test("combined adjustments follow the documented processing order", () => {
  const result = applyImageAdjustments(image(1, 1, [80, 120, 160, 77]), {
    brightness: 10, contrast: 20, saturation: 150, grayscale: true, sepia: true
  });
  assert.deepEqual(pixels(result), [196, 175, 136, 77]);
});

test("dimensions and alpha remain unchanged when all adjustments are combined", () => {
  const source = image(2, 1, [100, 150, 200, 255, 20, 40, 60, 128]);
  const result = applyImageAdjustments(source, {
    brightness: 15, contrast: -10, saturation: 130, blur: 2
  });
  assert.equal(result.width, source.width);
  assert.equal(result.height, source.height);
  assert.deepEqual([result.imageData.data[3], result.imageData.data[7]], [255, 128]);
});

test("invalid ImageData and color spaces are rejected", () => {
  assert.throws(() => applyImageAdjustments(null), TypeError);
  assert.throws(() => applyImageAdjustments({}), (error) => error.code === "INVALID_IMAGE_DATA");
  assert.throws(() => applyImageAdjustments({
    data: new Uint8Array(4), width: 1, height: 1, colorSpace: "srgb"
  }), (error) => error.code === "INVALID_IMAGE_DATA");
  assert.throws(() => applyImageAdjustments({
    data: new Uint8ClampedArray(4), width: 1, height: 1, colorSpace: "display-p3"
  }), (error) => error.code === "INVALID_IMAGE_DATA");
});

test("unknown options and wrong parameter types are rejected", () => {
  const source = image(1, 1, [10, 20, 30, 255]);
  assert.throws(() => applyImageAdjustments(source, { unknown: true }), TypeError);
  assert.throws(() => applyImageAdjustments(source, { brightness: "10" }), TypeError);
  assert.throws(() => applyImageAdjustments(source, { grayscale: 1 }), TypeError);
  assert.throws(() => applyImageAdjustments(source, null), TypeError);
});

test("out-of-range and non-finite values are rejected", () => {
  const source = image(1, 1, [10, 20, 30, 255]);
  for (const [key, value] of [
    ["brightness", -101], ["brightness", 101], ["contrast", -101],
    ["contrast", 101], ["saturation", -1], ["saturation", 201],
    ["blur", -1], ["blur", 21], ["blur", 1.5]
  ]) assert.throws(() => applyImageAdjustments(source, { [key]: value }), RangeError);
  assert.throws(() => applyImageAdjustments(source, { brightness: Number.NaN }), TypeError);
  assert.throws(() => applyImageAdjustments(source, { contrast: Infinity }), TypeError);
});

test("shared image limits are enforced", () => {
  assert.equal(IMAGE_ADJUSTER_LIMITS.maxDimension, 16_384);
  assert.equal(IMAGE_ADJUSTER_LIMITS.maxPixels, 40_000_000);
  assert.throws(() => applyImageAdjustments({
    data: new Uint8ClampedArray(4), width: 16_385, height: 1, colorSpace: "srgb"
  }), (error) => error.code === "IMAGE_DIMENSIONS_EXCEEDED");
});
