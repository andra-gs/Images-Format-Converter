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
    optimization: mode === "none"
      ? { mode, preset: null, quality: null, targetBytes: null, targetReached: null, attempts: 1 }
      : mode === "target-size"
        ? { mode, preset: null, quality: 0.75, targetBytes: 5000, targetReached: true, attempts: 3 }
        : { mode, preset: "medium", quality: 0.75, targetBytes: null, targetReached: null, attempts: 1 },
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
  const expected = validResult(file, "webp", "none");
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


test("metadata mode must be one of the contract modes and match the request", async () => {
  const source = new Blob(["source"]);
  const result = validResult(source, "webp", "none");
  result.optimization.mode = "manual";
  await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
    format: "webp", optimization: { mode: "none" }
  }), /invalid optimization metadata mode/);
});

test("none metadata requires null preset, quality, and target fields with one attempt", async () => {
  const source = new Blob(["source"]);
  for (const [key, value] of [["preset", "low"], ["quality", 0.8], ["targetBytes", 1000], ["targetReached", false], ["attempts", 2]]) {
    const result = validResult(source, "png", "none");
    result.optimization[key] = value;
    await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
      format: "png", optimization: { mode: "none" }
    }));
  }
});

test("preset metadata requires a valid preset, numeric quality, null target fields, and one attempt", async () => {
  const source = new Blob(["source"]);
  const invalidValues = [
    ["preset", "ultra"], ["quality", null], ["quality", 1.1],
    ["targetBytes", 500], ["targetReached", false], ["attempts", 2]
  ];
  for (const [key, value] of invalidValues) {
    const result = validResult(source);
    result.optimization[key] = value;
    await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
      format: "webp", optimization: { mode: "preset", preset: "medium" }
    }));
  }
});

test("target-size metadata requires positive target, boolean result, numeric quality, and bounded attempts", async () => {
  const source = new Blob(["source"]);
  const invalidValues = [
    ["quality", null], ["quality", 2], ["targetBytes", null],
    ["targetReached", null], ["attempts", 0], ["attempts", 7.5], ["attempts", 8],
    ["preset", "low"]
  ];
  for (const [key, value] of invalidValues) {
    const result = validResult(source, "jpeg", "target-size");
    result.optimization[key] = value;
    await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
      format: "jpeg", optimization: { mode: "target-size", targetBytes: 5000 }
    }));
  }
});

test("non-optimizable output formats accept only none metadata", async () => {
  const source = new Blob(["source"]);
  const result = validResult(source, "png", "none");
  result.optimization.mode = "preset";
  result.optimization.preset = "low";
  result.optimization.quality = 0.5;
  await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
    format: "png", optimization: { mode: "none" }
  }), /unsupported output format/);
});

test("metadata attempts cannot exceed seven for target-size mode", async () => {
  const source = new Blob(["source"]);
  const result = validResult(source, "webp", "target-size");
  result.optimization.attempts = 8;
  await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
    format: "webp", optimization: { mode: "target-size", targetBytes: 5000 }
  }), /invalid target-size metadata/);
});


test("target-size quality accepts inclusive 0.10 and 0.95 boundaries", async () => {
  const source = new Blob(["source"]);
  for (const quality of [0.10, 0.95]) {
    const result = validResult(source, "jpeg", "target-size");
    result.optimization.quality = quality;
    const actual = await runExportWithOptimizer(async () => result, source, {
      format: "jpeg", optimization: { mode: "target-size", targetBytes: 5000 }
    });
    assert.equal(actual.optimization.quality, quality);
  }
});

test("target-size quality rejects values outside 0.10 through 0.95", async () => {
  const source = new Blob(["source"]);
  for (const quality of [0.0999, 0.9501, 0, 1, NaN, Infinity]) {
    const result = validResult(source, "webp", "target-size");
    result.optimization.quality = quality;
    await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
      format: "webp", optimization: { mode: "target-size", targetBytes: 5000 }
    }), /invalid target-size metadata/);
  }
});

test("preset metadata accepts each requested preset with a finite in-range quality", async () => {
  const source = new Blob(["source"]);
  for (const preset of ["low", "medium", "high"]) {
    const result = validResult(source, "webp", "preset");
    result.optimization.preset = preset;
    result.optimization.quality = 0.75;
    const actual = await runExportWithOptimizer(async () => result, source, {
      format: "webp", optimization: { mode: "preset", preset }
    });
    assert.equal(actual.optimization.preset, preset);
    assert.equal(actual.optimization.quality, 0.75);
  }
});

test("preset metadata rejects a preset that differs from the requested preset", async () => {
  const source = new Blob(["source"]);
  const result = validResult(source, "jpeg", "preset");
  result.optimization.preset = "low";
  await assert.rejects(() => runExportWithOptimizer(async () => result, source, {
    format: "jpeg", optimization: { mode: "preset", preset: "high" }
  }), /invalid preset metadata/);
});
