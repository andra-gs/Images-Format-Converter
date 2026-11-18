import test from "node:test";
import assert from "node:assert/strict";
import {
  canDecodeFormat,
  canEncodeFormat,
  getAvailableInputFormats,
  getAvailableOutputFormats,
  getDetectedFormats,
  getFormatCapabilities,
  getPlannedOutputFormats
} from "../src/js/core/capability-registry.js";

test("all signature-detected formats have a capability definition", () => {
  const formats = getDetectedFormats();

  assert.deepEqual(
    formats,
    ["png", "jpeg", "webp", "bmp", "gif", "tiff", "heic", "heif", "svg"]
  );

  for (const format of formats) {
    assert.ok(getFormatCapabilities(format), `Missing capability for ${format}`);
  }
});

test("unknown formats return null and are not marked as supported", () => {
  assert.equal(getFormatCapabilities("avif"), null);
  assert.equal(canDecodeFormat("avif"), false);
  assert.equal(canEncodeFormat("avif"), false);
});

test("only verified input decoders and output encoders are available", () => {
  assert.deepEqual(getAvailableInputFormats(), ["png", "jpeg", "webp", "bmp"]);
  assert.deepEqual(getAvailableOutputFormats(), ["png", "jpeg"]);
  assert.deepEqual(getPlannedOutputFormats(), ["webp", "bmp"]);
});

test("capability data keeps decoding and encoding separate", () => {
  const jpeg = getFormatCapabilities("jpeg");

  assert.equal(jpeg.detection.status, "implemented");
  assert.equal(jpeg.decoding.status, "implemented");
  assert.equal(jpeg.encoding.status, "implemented");
  assert.equal(jpeg.encoding.strategy, "canvas");

  const webp = getFormatCapabilities("webp");
  assert.equal(webp.encoding.status, "planned");
  assert.equal(webp.encoding.strategy, "canvas");
  assert.match(jpeg.encoding.note, /Real-file browser conversion was verified/);
});

test("returned capability data cannot mutate the internal registry", () => {
  const png = getFormatCapabilities("png");
  png.encoding.status = "planned";

  assert.equal(getFormatCapabilities("png").encoding.status, "implemented");
});
