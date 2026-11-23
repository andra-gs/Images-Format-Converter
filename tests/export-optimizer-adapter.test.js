import test from "node:test";
import assert from "node:assert/strict";
import { runExportWithOptimizer } from "../src/js/ui/export-optimizer-adapter.js";

function validResult(source, format = "webp") {
  const blob = new Blob(["output"], { type: `image/${format}` });
  return {
    blob, format, mimeType: blob.type, width: 20, height: 10,
    size: {
      sourceBytes: source.size, outputBytes: blob.size,
      differenceBytes: source.size - blob.size,
      reductionPercent: ((source.size - blob.size) / source.size) * 100
    },
    optimization: { mode: "preset", preset: "medium", quality: 0.75, targetBytes: null, targetReached: null, attempts: 1 },
    validation: { status: "passed" }
  };
}

test("adapter forwards the exact source and options and returns validated result", async () => {
  const source = new Blob(["original"]);
  const options = { format: "webp", optimization: { mode: "preset", preset: "medium" } };
  const expected = validResult(source);
  let received;
  const actual = await runExportWithOptimizer(async (s, o) => {
    received = [s, o];
    return expected;
  }, source, options);
  assert.equal(received[0], source);
  assert.equal(received[1], options);
  assert.equal(actual, expected);
});

test("adapter accepts edited File plus ImageData and measures original File", async () => {
  const file = new Blob(["original file"]);
  const imageData = { width: 2, height: 2, data: new Uint8ClampedArray(16) };
  const source = { file, imageData };
  const expected = validResult(file);
  let received;
  await runExportWithOptimizer(async (s) => { received = s; return expected; }, source, {
    format: "webp", optimization: { mode: "none" }
  });
  assert.equal(received, source);
});

test("adapter rejects malformed source and missing optimizer", async () => {
  await assert.rejects(() => runExportWithOptimizer(null, new Blob(["x"]), {
    format: "png", optimization: { mode: "none" }
  }), /compatible function/);
  await assert.rejects(() => runExportWithOptimizer(async () => validResult(new Blob(["x"])), {}, {
    format: "png", optimization: { mode: "none" }
  }), /source must be/);
});

test("adapter rejects unsupported modes, format mismatch, and unvalidated output", async () => {
  const source = new Blob(["source"]);
  await assert.rejects(() => runExportWithOptimizer(async () => validResult(source), source, {
    format: "png", optimization: { mode: "preset", preset: "low" }
  }), /only for JPEG and WebP/);
  const wrongFormat = validResult(source);
  wrongFormat.format = "jpeg";
  await assert.rejects(() => runExportWithOptimizer(async () => wrongFormat, source, {
    format: "webp", optimization: { mode: "none" }
  }), /format does not match/);
  const unvalidated = validResult(source);
  unvalidated.validation.status = "failed";
  await assert.rejects(() => runExportWithOptimizer(async () => unvalidated, source, {
    format: "webp", optimization: { mode: "none" }
  }), /not passed validation/);
});

test("adapter rejects inconsistent Blob size measurements", async () => {
  const source = new Blob(["source"]);
  const result = validResult(source);
  result.size.outputBytes += 1;
  await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
    format: "webp", optimization: { mode: "none" }
  }), /do not match/);
});

test("adapter preserves legitimate negative size reduction", async () => {
  const source = new Blob(["x"]);
  const blob = new Blob(["larger output"]);
  const result = {
    ...validResult(source),
    blob, mimeType: blob.type,
    size: { sourceBytes: source.size, outputBytes: blob.size, differenceBytes: source.size - blob.size,
      reductionPercent: ((source.size - blob.size) / source.size) * 100 }
  };
  const actual = await runExportWithOptimizer(async () => result, source, {
    format: "webp", optimization: { mode: "none" }
  });
  assert.ok(actual.size.reductionPercent < 0);
});
