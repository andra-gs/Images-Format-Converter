import test from "node:test";
import assert from "node:assert/strict";
import { decode, decodeFrames, encode } from "modern-gif";
import { convertImageToGif } from "../src/js/core/animated-gif.js";

test("re-encodes animated GIF frames, timing, transparency, and looping metadata", async () => {
  const firstFrame = new Uint8ClampedArray([
    0, 0, 0, 0,
    255, 0, 0, 255,
    255, 0, 0, 255,
    255, 0, 0, 255
  ]);
  const secondFrame = new Uint8ClampedArray([
    0, 0, 255, 255,
    0, 0, 255, 255,
    0, 0, 255, 255,
    0, 0, 255, 255
  ]);

  const sourceBuffer = await encode({
    width: 2,
    height: 2,
    frames: [
      { data: firstFrame, delay: 40 },
      { data: secondFrame, delay: 120 }
    ],
    maxColors: 255,
    looped: true,
    loopCount: 3
  });

  const source = new Blob([sourceBuffer], { type: "image/gif" });
  const result = await convertImageToGif(source);
  const outputBuffer = await result.blob.arrayBuffer();
  const outputMetadata = decode(outputBuffer);
  const outputFrames = decodeFrames(outputBuffer);

  assert.equal(result.format, "gif");
  assert.equal(result.width, 2);
  assert.equal(result.height, 2);
  assert.equal(outputMetadata.width, 2);
  assert.equal(outputMetadata.height, 2);
  assert.equal(outputMetadata.frames.length, 2);
  assert.equal(outputMetadata.looped, true);
  assert.equal(outputMetadata.loopCount, 3);
  assert.deepEqual(outputFrames.map((frame) => frame.delay), [40, 120]);
  assert.equal(outputFrames[0].data[3], 0);
  assert.equal(outputFrames[1].data[2], 255);
});
