import test from "node:test";
import assert from "node:assert/strict";
import {
  createDefaultEditorState,
  createImageProcessingAdapter,
  EDITOR_PROCESSING_UNAVAILABLE,
  resetEditorState
} from "../src/js/core/image-processing-adapter.js";

test("default editor state uses source dimensions and neutral adjustments", () => {
  const state = createDefaultEditorState({ width: 1200, height: 800 });

  assert.deepEqual(state.resize, {
    width: 1200,
    height: 800,
    keepAspectRatio: true
  });
  assert.deepEqual(state.crop, { x: 0, y: 0, width: 1200, height: 800 });
  assert.equal(state.rotation, 0);
  assert.equal(state.flipHorizontal, false);
  assert.equal(state.flipVertical, false);
  assert.deepEqual(state.adjustments, {
    brightness: 0,
    contrast: 0,
    saturation: 100,
    blur: 0,
    grayscale: false,
    sepia: false
  });
});

test("default editor state safely handles missing dimensions", () => {
  const state = createDefaultEditorState();
  assert.equal(state.resize.width, null);
  assert.equal(state.resize.height, null);
  assert.equal(state.crop.width, null);
  assert.equal(state.crop.height, null);
});

test("reset creates a fresh neutral state", () => {
  const first = createDefaultEditorState({ width: 640, height: 480 });
  first.adjustments.brightness = 40;

  const reset = resetEditorState({ width: 640, height: 480 });
  assert.equal(reset.adjustments.brightness, 0);
  assert.notEqual(first, reset);
  assert.notEqual(first.adjustments, reset.adjustments);
});

test("placeholder adapter reports all processing capabilities as unavailable", () => {
  const adapter = createImageProcessingAdapter();
  assert.ok(Object.values(adapter.capabilities).every((available) => available === false));
  assert.equal(Object.isFrozen(adapter.capabilities), true);
});

test("placeholder adapter rejects processing with a stable error code", async () => {
  const adapter = createImageProcessingAdapter();

  await assert.rejects(
    adapter.process({}, {}),
    (error) => error.code === EDITOR_PROCESSING_UNAVAILABLE
  );
});
