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
  assert.deepEqual(getAvailableInputFormats(), ["png", "jpeg", "webp", "bmp", "gif", "tiff", "heic", "heif", "svg"]);
  assert.deepEqual(getAvailableOutputFormats(), ["png", "jpeg", "webp", "bmp", "tiff"]);
  assert.deepEqual(getPlannedOutputFormats(), []);
});

test("capability data keeps decoding and encoding separate", () => {
  const jpeg = getFormatCapabilities("jpeg");

  assert.equal(jpeg.detection.status, "implemented");
  assert.equal(jpeg.decoding.status, "implemented");
  assert.equal(jpeg.encoding.status, "implemented");
  assert.equal(jpeg.encoding.strategy, "canvas");

  const bmp = getFormatCapabilities("bmp");
  assert.equal(bmp.encoding.status, "implemented");
  assert.equal(bmp.encoding.strategy, "dedicated-encoder");
  assert.match(bmp.encoding.note, /24-bit BMP encoder/);

  const webp = getFormatCapabilities("webp");
  assert.equal(webp.encoding.status, "implemented");
  assert.equal(webp.encoding.strategy, "canvas");
  assert.match(webp.encoding.note, /Real-file browser verification passed/);
  assert.match(jpeg.encoding.note, /Real-file browser conversion was verified/);

  const heic = getFormatCapabilities("heic");
  const heif = getFormatCapabilities("heif");
  assert.equal(heic.decoding.status, "implemented");
  assert.equal(heif.decoding.status, "implemented");
  assert.equal(heic.encoding.status, "not-planned");
  assert.equal(heif.encoding.status, "not-planned");

  const tiff = getFormatCapabilities("tiff");
  assert.equal(tiff.decoding.status, "implemented");
  assert.equal(tiff.decoding.strategy, "utif2");
  assert.equal(tiff.encoding.status, "implemented");
  assert.equal(tiff.encoding.strategy, "utif2-uncompressed");

  const gif = getFormatCapabilities("gif");
  assert.equal(gif.detection.status, "implemented");
  assert.equal(gif.decoding.status, "implemented");
  assert.equal(gif.decoding.strategy, "gifuct-js-first-frame");
  assert.equal(canDecodeFormat("gif"), true);

  const svg = getFormatCapabilities("svg");
  assert.equal(svg.detection.status, "implemented");
  assert.equal(svg.decoding.status, "implemented");
  assert.equal(svg.decoding.strategy, "safe-svg-rasterization");
  assert.equal(canDecodeFormat("svg"), true);
});

test("returned capability data cannot mutate the internal registry", () => {
  const png = getFormatCapabilities("png");
  png.encoding.status = "planned";

  assert.equal(getFormatCapabilities("png").encoding.status, "implemented");
});
