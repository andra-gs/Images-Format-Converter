import test from "node:test";
import assert from "node:assert/strict";
import { updateCropDraft, updateResizeDraft } from "../src/js/core/editor-input-state.js";
import { applyImageTransformations } from "../src/js/core/image-transformer.js";

test("clearing crop width stores null so the crop reaches the right edge", () => {
  const crop = { x: 4, y: 3, width: 20, height: 10 };
  updateCropDraft(crop, "width", "");
  assert.equal(crop.width, null);
  assert.equal(crop.x, 4);
});

test("clearing crop height stores null so the crop reaches the bottom edge", () => {
  const crop = { x: 4, y: 3, width: 20, height: 10 };
  updateCropDraft(crop, "height", "");
  assert.equal(crop.height, null);
});

test("empty crop X and Y values default to zero", () => {
  const crop = { x: 12, y: 8, width: null, height: null };
  updateCropDraft(crop, "x", "");
  updateCropDraft(crop, "y", "");
  assert.equal(crop.x, 0);
  assert.equal(crop.y, 0);
});

test("clearing resize width stores null instead of retaining its previous value", () => {
  const resize = { width: 320, height: 160, keepAspectRatio: true };
  updateResizeDraft(resize, "width", "", { width: 640, height: 320 });
  assert.equal(resize.width, null);
  assert.equal(resize.height, 160);
});

test("clearing resize height stores null instead of retaining its previous value", () => {
  const resize = { width: 320, height: 160, keepAspectRatio: true };
  updateResizeDraft(resize, "height", "", { width: 640, height: 320 });
  assert.equal(resize.height, null);
  assert.equal(resize.width, 320);
});

test("resize input recalculates the opposite dimension while aspect ratio is locked", () => {
  const resize = { width: null, height: null, keepAspectRatio: true };
  updateResizeDraft(resize, "width", "300", { width: 600, height: 400 });
  assert.deepEqual(resize, { width: 300, height: 200, keepAspectRatio: true });
});

test("Transformer resolves the missing resize dimension from the preserved aspect ratio", () => {
  const imageData = {
    data: new Uint8ClampedArray(200 * 100 * 4),
    width: 200,
    height: 100,
    colorSpace: "srgb"
  };
  const result = applyImageTransformations(imageData, {
    resize: { width: null, height: 50, keepAspectRatio: true }
  });
  assert.equal(result.width, 100);
  assert.equal(result.height, 50);
});

test("unlocked resize requires both dimensions after an input is cleared", () => {
  const imageData = {
    data: new Uint8ClampedArray(20 * 10 * 4),
    width: 20,
    height: 10,
    colorSpace: "srgb"
  };
  assert.throws(
    () => applyImageTransformations(imageData, {
      resize: { width: null, height: 5, keepAspectRatio: false }
    }),
    /both required when aspect ratio is unlocked/
  );
});
