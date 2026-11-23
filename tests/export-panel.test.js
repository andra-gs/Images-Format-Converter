import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExportOptions,
  getExportSizeMetrics,
  supportsExportOptimization,
  formatBytes,
  runExportWithOptimizer
} from "../src/js/ui/export-panel.js";

test("only JPEG and WebP expose optimization capabilities", () => {
  assert.equal(supportsExportOptimization("jpeg"), true);
  assert.equal(supportsExportOptimization("image/webp"), true);
  for (const format of ["png", "bmp", "tiff", "gif", "svg", "heic"]) {
    assert.equal(supportsExportOptimization(format), false);
  }
});

test("preset options use contract identifiers without duplicating quality values", () => {
  assert.deepEqual(buildExportOptions("image/jpeg", { mode: "preset", preset: "low" }), {
    format: "jpeg",
    optimization: { mode: "preset", preset: "low" }
  });
  assert.deepEqual(buildExportOptions("webp", { mode: "preset", preset: "high" }), {
    format: "webp",
    optimization: { mode: "preset", preset: "high" }
  });
});

test("target-size options convert the UI KB input to bytes", () => {
  assert.deepEqual(buildExportOptions("jpeg", { mode: "target-size", targetBytes: 512000 }), {
    format: "jpeg",
    optimization: { mode: "target-size", targetBytes: 512000 }
  });
  assert.throws(
    () => buildExportOptions("webp", { mode: "target-size", targetBytes: 0 }),
    /positive number/
  );
});

test("unsupported formats always use mode none", () => {
  assert.deepEqual(buildExportOptions("png", { mode: "preset", preset: "high" }), {
    format: "png",
    optimization: { mode: "none" }
  });
});

test("invalid preset and mode are rejected", () => {
  assert.throws(() => buildExportOptions("jpeg", { mode: "preset", preset: "ultra" }), /Unknown export preset/);
  assert.throws(() => buildExportOptions("jpeg", { mode: "magic" }), /Unknown export optimization mode/);
});

test("size metrics are read from actual optimizer result measurements", () => {
  assert.deepEqual(getExportSizeMetrics({
    size: { sourceBytes: 1000, outputBytes: 700, differenceBytes: 300, reductionPercent: 30 }
  }), {
    sourceBytes: 1000,
    outputBytes: 700,
    differenceBytes: 300,
    reductionPercent: 30
  });
  assert.throws(() => getExportSizeMetrics({ blob: new Blob(["x"]) }), /actual size measurements/);
});

test("negative reduction percentage is preserved when output is larger", () => {
  const metrics = getExportSizeMetrics({
    size: { sourceBytes: 100, outputBytes: 125, differenceBytes: -25, reductionPercent: -25 }
  });
  assert.equal(metrics.reductionPercent, -25);
});

test("byte formatting handles B, KB, MB and invalid values", () => {
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(2048), "2.0 KB");
  assert.equal(formatBytes(2 * 1024 * 1024), "2.00 MB");
  assert.equal(formatBytes(-1), "—");
});

test("mock optimizer receives the original source and exact UI options", async () => {
  const source = new Blob(["source"]);
  const options = { format: "webp", optimization: { mode: "preset", preset: "medium" } };
  let received;
  const mockOptimizeImage = async (actualSource, actualOptions) => {
    received = { actualSource, actualOptions };
    const blob = new Blob(["optimized"], { type: "image/webp" });
    return {
      blob,
      format: "webp",
      mimeType: "image/webp",
      width: 2,
      height: 2,
      validation: { status: "passed" },
      size: { sourceBytes: 6, outputBytes: blob.size, differenceBytes: 6 - blob.size, reductionPercent: -50 }
    };
  };
  const result = await runExportWithOptimizer(mockOptimizeImage, source, options);
  assert.equal(received.actualSource, source);
  assert.deepEqual(received.actualOptions, options);
  assert.equal(result.size.outputBytes, 9);
  assert.equal(result.size.reductionPercent, -50);
});

test("mock optimizer adapter rejects malformed results and missing functions", async () => {
  await assert.rejects(() => runExportWithOptimizer(null, new Blob(["x"]), {}), /compatible function/);
  const source = new Blob(["x"]);
  const blob = new Blob(["x"], { type: "image/webp" });
  await assert.rejects(() => runExportWithOptimizer(async () => ({
    blob, format: "webp", mimeType: "image/webp", width: 1, height: 1,
    validation: { status: "passed" }
  }), source, { format: "webp", optimization: { mode: "none" } }), /actual size measurements/);
});
