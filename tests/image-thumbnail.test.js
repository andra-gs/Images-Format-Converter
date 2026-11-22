import test from "node:test";
import assert from "node:assert/strict";
import { createImageThumbnail } from "../src/js/core/image-thumbnail.js";

function createCanvasFactory() {
  const state = { width: 0, height: 0, drawArgs: null, released: false };
  const factory = (width, height) => {
    state.width = width;
    state.height = height;
    return {
      getContext() {
        return {
          drawImage(...args) {
            state.drawArgs = args;
          }
        };
      },
      async convertToBlob({ type }) {
        return new Blob(["thumbnail"], { type });
      },
      set width(value) {
        state.released = value === 0;
      },
      get width() {
        return state.width;
      },
      set height(value) {
        state.released = value === 0;
      },
      get height() {
        return state.height;
      }
    };
  };
  return { factory, state };
}

test("creates a thumbnail Blob and scales a landscape image within maxSize", async () => {
  const { factory, state } = createCanvasFactory();
  const source = { width: 400, height: 200 };
  const blob = await createImageThumbnail(
    { source, width: 400, height: 200 },
    { maxSize: 96, canvasFactory: factory }
  );

  assert.equal(blob.type, "image/png");
  assert.equal(state.width, 96);
  assert.equal(state.height, 48);
  assert.equal(state.drawArgs[0], source);
  assert.deepEqual(state.drawArgs.slice(1), [0, 0, 96, 48]);
  assert.equal(state.released, true);
});

test("does not upscale small images", async () => {
  const { factory, state } = createCanvasFactory();
  await createImageThumbnail(
    { source: {}, width: 40, height: 24 },
    { maxSize: 96, canvasFactory: factory }
  );

  assert.equal(state.width, 40);
  assert.equal(state.height, 24);
});

test("rejects invalid decoded image dimensions", async () => {
  await assert.rejects(
    createImageThumbnail({ source: {}, width: 0, height: 24 }),
    /valid decoded image/
  );
});

test("rejects an invalid thumbnail size", async () => {
  await assert.rejects(
    createImageThumbnail({ source: {}, width: 20, height: 20 }, { maxSize: 0 }),
    /positive integer/
  );
});
