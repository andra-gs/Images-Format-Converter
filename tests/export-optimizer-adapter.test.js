import test from "node:test";
import assert from "node:assert/strict";
import { runExportWithOptimizer, runIndependentExports } from "../src/js/ui/export-optimizer-adapter.js";

function validResult(source, format = "webp", mode = "preset") {
  const blob = new Blob(["output"], { type: `image/${format}` });
  return {
    blob, format, mimeType: blob.type, width: 20, height: 10,
    size: {
      sourceBytes: source.size, outputBytes: blob.size,
      differenceBytes: source.size - blob.size,
      reductionPercent: ((source.size - blob.size) / source.size) * 100
    },
    optimization: mode === "none"\n      ? { mode, preset: null, quality: null, targetBytes: null, targetReached: null, attempts: 1 }\n      : mode === "target-size"\n        ? { mode, preset: null, quality: 0.75, targetBytes: 5000, targetReached: true, attempts: 3 }\n        : { mode, preset: "medium", quality: 0.75, targetBytes: null, targetReached: null, attempts: 1 },
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
    ...validResult(source, "webp", "none"),
    blob, mimeType: blob.type,
    size: { sourceBytes: source.size, outputBytes: blob.size, differenceBytes: source.size - blob.size,
      reductionPercent: ((source.size - blob.size) / source.size) * 100 }
  };
  const actual = await runExportWithOptimizer(async () => result, source, {
    format: "webp", optimization: { mode: "none" }
  });
  assert.ok(actual.size.reductionPercent < 0);
});


test("adapter validates optimizer metadata against requested mode and preset", async () => {
  const source = new Blob(["source"]);
  const options = { format: "webp", optimization: { mode: "preset", preset: "high" } };
  const result = validResult(source);
  result.optimization.preset = "medium";
  await assert.rejects(() => runExportWithOptimizer(async () => result, source, options), /invalid preset metadata/);
});

test("adapter validates target-size metadata and attempt bounds", async () => {
  const source = new Blob(["source"]);
  const options = { format: "jpeg", optimization: { mode: "target-size", targetBytes: 5000 } };
  const result = validResult(source, "jpeg", "target-size");
  result.optimization.attempts = 8;
  await assert.rejects(() => runExportWithOptimizer(async () => result, source, options), /invalid target-size metadata/);
});

test("adapter validates actual percentage and allows negative byte difference", async () => {
  const source = new Blob(["x"]);
  const result = validResult(source, "webp", "none");
  result.size.reductionPercent = 0;
  await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
    format: "webp", optimization: { mode: "none" }
  }), /reductionPercent is inconsistent/);
});

test("independent exports isolate a failed image and retain each image's own options", async () => {
  const first = new Blob(["first"]);
  const second = new Blob(["second"]);
  const items = [
    { id: "first", source: first, options: { format: "webp", optimization: { mode: "preset", preset: "low" } } },
    { id: "second", source: second, options: { format: "jpeg", optimization: { mode: "none" } } }
  ];
  const received = [];
  const results = await runIndependentExports(items, async (source, options) => {
    received.push({ source, options });
    if (source === first) throw new Error("mock encode failure");
    return validResult(source, "jpeg", "none");
  });

  assert.equal(received.length, 2);
  assert.equal(received[0].source, first);
  assert.equal(received[0].options.optimization.preset, "low");
  assert.equal(received[1].source, second);
  assert.equal(received[1].options.optimization.mode, "none");
  assert.match(results[0].error.message, /mock encode failure/);
  assert.equal(results[0].result, null);
  assert.equal(results[1].error, null);
  assert.ok(results[1].result.blob instanceof Blob);
});
