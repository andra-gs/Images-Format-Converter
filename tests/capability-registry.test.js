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

test("detected formats are not automatically treated as decodable or encodable", () => {
  assert.deepEqual(getAvailableInputFormats(), []);
  assert.deepEqual(getAvailableOutputFormats(), []);
  assert.deepEqual(getPlannedOutputFormats(), ["png", "jpeg", "webp", "bmp"]);
});

test("capability data keeps decoding and encoding separate", () => {
  const jpeg = getFormatCapabilities("jpeg");

  assert.equal(jpeg.detection.status, "implemented");
  assert.equal(jpeg.decoding.status, "planned");
  assert.equal(jpeg.encoding.status, "planned");
  assert.equal(jpeg.encoding.strategy, "canvas");
});

test("returned capability data cannot mutate the internal registry", () => {
  const png = getFormatCapabilities("png");
  png.encoding.status = "implemented";

  assert.equal(getFormatCapabilities("png").encoding.status, "planned");
});
