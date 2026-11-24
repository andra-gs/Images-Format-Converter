import { createExportSettingsControls, buildExportOptions } from "../src/js/ui/export-panel.js";
import { runExportWithOptimizer, runIndependentExports } from "../src/js/ui/export-optimizer-adapter.js";

const resultsNode = document.querySelector("#results");
const summaryNode = document.querySelector("#summary");
const detailsNode = document.querySelector("#details");
const optionsNode = document.querySelector("#selected-options");
const results = [];
const presetQuality = { low: 0.55, medium: 0.75, high: 0.90 };

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function equal(actual, expected, message) {
  assert(Object.is(actual, expected), message + ` (actual: ${actual}, expected: ${expected})`);
}
function makeResult(source, options, overrides = {}) {
  const format = options.format;
  const blob = new Blob(["mock-output"], { type: format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : `image/${format}` });
  const mode = options.optimization.mode;
  const optimization = mode === "none"
    ? { mode, preset: null, quality: null, targetBytes: null, targetReached: null, attempts: 1 }
    : mode === "preset"
      ? { mode, preset: options.optimization.preset, quality: presetQuality[options.optimization.preset], targetBytes: null, targetReached: null, attempts: 1 }
      : { mode, preset: null, quality: 0.75, targetBytes: options.optimization.targetBytes, targetReached: false, attempts: 7 };
  const size = {
    sourceBytes: source instanceof Blob ? source.size : source.file.size,
    outputBytes: blob.size,
    differenceBytes: (source instanceof Blob ? source.size : source.file.size) - blob.size,
    reductionPercent: ((source instanceof Blob ? source.size : source.file.size) - blob.size) / (source instanceof Blob ? source.size : source.file.size) * 100
  };
  return { blob, format, mimeType: blob.type, width: 20, height: 10, size, optimization, validation: { status: "passed" }, ...overrides };
}
async function check(name, fn) {
  try { await fn(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, error: error.message }); }
  renderResults();
}
function renderResults() {
  resultsNode.replaceChildren();
  for (const result of results) {
    const li = document.createElement("li");
    li.className = result.pass ? "pass" : "fail";
    li.textContent = `${result.pass ? "PASS" : "FAIL"} — ${result.name}${result.error ? ": " + result.error : ""}`;
    resultsNode.append(li);
  }
  const passed = results.filter(item => item.pass).length;
  summaryNode.textContent = `${passed}/${results.length} pengujian lulus`;
  detailsNode.textContent = results.map(item => `${item.pass ? "PASS" : "FAIL"}: ${item.name}${item.error ? "\\n  " + item.error : ""}`).join("\\n");
}
async function run() {
  results.length = 0;
  renderResults();
  const source = new Blob(["source-image"]);
  const presetOptions = preset => ({ format: "webp", optimization: { mode: "preset", preset } });
  const targetOptions = { format: "jpeg", optimization: { mode: "target-size", targetBytes: 500 * 1024 } };
  const mockOptimizer = async (actualSource, options) => makeResult(actualSource, options);

  await check("Mock API receives the exact source and options", async () => {
    let received;
    await runExportWithOptimizer(async (s, o) => { received = [s, o]; return makeResult(s, o); }, source, presetOptions("medium"));
    equal(received[0], source, "Source reference must be preserved");
    equal(received[1].optimization.preset, "medium", "Preset must be forwarded");
  });
  await check("Preset Low, Medium, High return valid metadata", async () => {
    for (const preset of ["low", "medium", "high"]) {
      const result = await runExportWithOptimizer(mockOptimizer, source, presetOptions(preset));
      equal(result.optimization.preset, preset, "Returned preset must match request");
      equal(result.optimization.quality, presetQuality[preset], "Mock optimizer mapping must match contract");
    }
  });
  await check("Mismatched preset metadata is rejected", async () => {
    await runExportWithOptimizer(async (s, o) => makeResult(s, o, { optimization: { ...makeResult(s,o).optimization, preset: "low" } }), source, presetOptions("high"))
      .then(() => { throw new Error("Expected mismatched preset to reject"); }, error => assert(/preset metadata/.test(error.message), "Expected preset metadata error"));
  });
  await check("Target Size accepts quality boundaries 0.10 and 0.95", async () => {
    for (const quality of [0.10, 0.95]) {
      const result = await runExportWithOptimizer(async (s, o) => makeResult(s, o, { optimization: { ...makeResult(s,o).optimization, quality } }), source, targetOptions);
      equal(result.optimization.quality, quality, "Boundary quality should be accepted");
    }
  });
  await check("Target Size rejects quality outside 0.10–0.95", async () => {
    for (const quality of [0.099, 0.951]) {
      await runExportWithOptimizer(async (s, o) => makeResult(s, o, { optimization: { ...makeResult(s,o).optimization, quality } }), source, targetOptions)
        .then(() => { throw new Error("Expected out-of-range quality to reject"); }, error => assert(/target-size metadata/.test(error.message), "Expected target-size metadata error"));
    }
  });
  await check("Target Size accepts best-effort result with targetReached false", async () => {
    const result = await runExportWithOptimizer(mockOptimizer, source, targetOptions);
    equal(result.optimization.targetReached, false, "Best-effort result should be preserved");
    equal(result.optimization.attempts, 7, "Attempts must remain bounded at seven");
  });
  await check("Unsupported formats accept only no optimization", async () => {
    const options = buildExportOptions("png", { mode: "preset", preset: "high" });
    equal(options.optimization.mode, "none", "PNG must use none mode");
    const result = await runExportWithOptimizer(mockOptimizer, source, options);
    equal(result.optimization.mode, "none", "PNG result must use none metadata");
  });
  await check("One failed image does not prevent another image export", async () => {
    const second = new Blob(["second-image"]);
    const outputs = await runIndependentExports([
      { id: "first", source, options: presetOptions("low") },
      { id: "second", source: second, options: { format: "webp", optimization: { mode: "none" } } }
    ], async (s, o) => {
      if (s === source) throw new Error("mock per-file failure");
      return makeResult(s, o);
    });
    equal(outputs[0].result, null, "Failed file should have no result");
    assert(outputs[0].error instanceof Error, "Failed file should retain error");
    assert(outputs[1].result.blob instanceof Blob, "Other file should succeed");
  });
}
function mountControls() {
  const host = document.querySelector("#export-controls");
  const controls = createExportSettingsControls({
    fileId: "browser-mock-file",
    format: "webp",
    settings: { mode: "preset", preset: "medium" },
    onChange: (_id, options) => { optionsNode.textContent = JSON.stringify(options, null, 2); }
  });
  host.append(controls.element);
  document.querySelector("#mock-format").addEventListener("change", event => {
    controls.updateFormat(event.target.value);
    optionsNode.textContent = JSON.stringify(controls.getOptions(), null, 2);
  });
  optionsNode.textContent = JSON.stringify(controls.getOptions(), null, 2);
}
document.querySelector("#rerun").addEventListener("click", run);
mountControls();
run();
