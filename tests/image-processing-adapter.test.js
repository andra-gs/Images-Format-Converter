import test from "node:test";
import assert from "node:assert/strict";
import {
  createDefaultEditorState,
  createImageProcessingAdapter,
  decodedImageToImageData,
  EDITOR_PROCESSING_UNAVAILABLE,
  IMAGE_DIMENSIONS_EXCEEDED,
  imageDataToCanvasResult,
  resetEditorState,
  validateImageData,
  validateImageDimensions
} from "../src/js/core/image-processing-adapter.js";

function createFakeCanvas(width, height, pixels = new Uint8ClampedArray(width * height * 4)) {
  const canvas = {
    width,
    height,
    context: {
      drawImage() {},
      getImageData() {
        return { data: pixels };
      },
      createImageData(nextWidth, nextHeight) {
        return { data: new Uint8ClampedArray(nextWidth * nextHeight * 4) };
      },
      putImageData(imageData) {
        canvas.writtenPixels = new Uint8ClampedArray(imageData.data);
      }
    },
    getContext() {
      return this.context;
    }
  };
  return canvas;
}

const sampleImageData = (red = 10) => ({
  data: new Uint8ClampedArray([red, 20, 30, 255]),
  width: 1,
  height: 1,
  colorSpace: "srgb"
});

test("default editor state follows the shared Phase 5 data model", () => {
  assert.deepEqual(createDefaultEditorState(), {
    transformations: {
      resize: { width: null, height: null, keepAspectRatio: true },
      crop: { x: 0, y: 0, width: null, height: null },
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false
    },
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 100,
      blur: 0,
      grayscale: false,
      sepia: false
    }
  });
});

test("reset returns an independent neutral shared state", () => {
  const first = createDefaultEditorState();
  first.adjustments.brightness = 35;
  first.transformations.crop.x = 12;

  const reset = resetEditorState();
  assert.equal(reset.adjustments.brightness, 0);
  assert.equal(reset.transformations.crop.x, 0);
  assert.notEqual(first, reset);
  assert.notEqual(first.adjustments, reset.adjustments);
  assert.notEqual(first.transformations, reset.transformations);
});

test("validates dimensions and the agreed pixel limits", () => {
  assert.deepEqual(validateImageDimensions(1920, 1080), { width: 1920, height: 1080 });
  assert.throws(() => validateImageDimensions(0, 10), RangeError);
  assert.throws(
    () => validateImageDimensions(16_385, 1),
    (error) => error instanceof RangeError && error.code === IMAGE_DIMENSIONS_EXCEEDED
  );
  assert.throws(
    () => validateImageDimensions(8000, 6000),
    (error) => error instanceof RangeError && error.code === IMAGE_DIMENSIONS_EXCEEDED
  );
});

test("validates sRGB ImageData structure and pixel-buffer length", () => {
  assert.equal(validateImageData(sampleImageData()).width, 1);
  assert.throws(() => validateImageData({}), TypeError);
  assert.throws(
    () => validateImageData({ ...sampleImageData(), data: new Uint8Array(4) }),
    TypeError
  );
  assert.throws(
    () => validateImageData({ ...sampleImageData(), data: new Uint8ClampedArray(3) }),
    TypeError
  );
  assert.throws(
    () => validateImageData({ ...sampleImageData(), colorSpace: "display-p3" }),
    TypeError
  );
});

test("decoder adapter copies pixels and releases only its temporary canvas", () => {
  const pixels = new Uint8ClampedArray([1, 2, 3, 255]);
  const canvas = createFakeCanvas(1, 1, pixels);
  const source = { source: { marker: "original" }, width: 1, height: 1 };
  const result = decodedImageToImageData(source, { canvasFactory: () => canvas });

  assert.deepEqual([...result.data], [1, 2, 3, 255]);
  assert.notEqual(result.data, pixels);
  assert.equal(result.colorSpace, "srgb");
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
  assert.equal(source.source.marker, "original");
});

test("decoder adapter rejects invalid dimensions before allocating a canvas", () => {
  let allocated = false;
  assert.throws(
    () => decodedImageToImageData(
      { source: {}, width: 0, height: 1 },
      { canvasFactory: () => { allocated = true; return createFakeCanvas(1, 1); } }
    ),
    TypeError
  );
  assert.equal(allocated, false);
});

test("ImageData-to-canvas result owns its canvas and closes idempotently", () => {
  const canvas = createFakeCanvas(1, 1);
  const result = imageDataToCanvasResult(sampleImageData(), { canvasFactory: () => canvas });

  assert.deepEqual([...canvas.writtenPixels], [10, 20, 30, 255]);
  result.close();
  result.close();
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test("placeholder adapter keeps all capabilities unavailable until both modules are injected", async () => {
  const adapter = createImageProcessingAdapter();
  assert.ok(Object.values(adapter.capabilities).every((available) => available === false));
  assert.equal(Object.isFrozen(adapter.capabilities), true);
  await assert.rejects(
    adapter.process({}),
    (error) => error.code === EDITOR_PROCESSING_UNAVAILABLE
  );
});

test("adapter runs Transformer before Adjuster and returns validated ImageData", async () => {
  const calls = [];
  const transformer = async (imageData, options) => {
    calls.push(["transform", options.rotation]);
    return { imageData: sampleImageData(40), width: 1, height: 1 };
  };
  const adjuster = (imageData, options) => {
    calls.push(["adjust", options.brightness, imageData.data[0]]);
    return { imageData: sampleImageData(70), width: 1, height: 1 };
  };
  const canvas = createFakeCanvas(1, 1, new Uint8ClampedArray([1, 2, 3, 255]));
  const adapter = createImageProcessingAdapter({
    applyImageTransformations: transformer,
    applyImageAdjustments: adjuster,
    canvasFactory: () => canvas
  });

  const result = await adapter.process({
    decodedImage: { source: {}, width: 1, height: 1 },
    transformations: { rotation: 90 },
    adjustments: { brightness: 15 }
  });

  assert.deepEqual(calls, [["transform", 90], ["adjust", 15, 40]]);
  assert.deepEqual([...result.data], [70, 20, 30, 255]);
  assert.ok(Object.values(adapter.capabilities).every((available) => available === true));
});

test("adapter rejects mismatched processing output dimensions", async () => {
  const adapter = createImageProcessingAdapter({
    applyImageTransformations: () => ({
      imageData: sampleImageData(),
      width: 2,
      height: 1
    }),
    applyImageAdjustments: () => ({ imageData: sampleImageData(), width: 1, height: 1 }),
    canvasFactory: () => createFakeCanvas(1, 1)
  });

  await assert.rejects(
    adapter.process({ decodedImage: { source: {}, width: 1, height: 1 } }),
    TypeError
  );
});

test("adapter stops between processing stages when the signal is aborted", async () => {
  const controller = new AbortController();
  let adjusterCalled = false;
  const adapter = createImageProcessingAdapter({
    applyImageTransformations: () => {
      controller.abort();
      return { imageData: sampleImageData(), width: 1, height: 1 };
    },
    applyImageAdjustments: () => {
      adjusterCalled = true;
      return { imageData: sampleImageData(), width: 1, height: 1 };
    },
    canvasFactory: () => createFakeCanvas(1, 1)
  });

  await assert.rejects(
    adapter.process({
      decodedImage: { source: {}, width: 1, height: 1 },
      signal: controller.signal
    }),
    (error) => error.name === "AbortError"
  );
  assert.equal(adjusterCalled, false);
});
