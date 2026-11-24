import { decodeImage } from "../src/js/core/image-decoder.js";
import {
  IMAGE_OPTIMIZATION_CAPABILITIES,
  optimizeImage
} from "../src/js/core/image-optimizer.js";

const get = (selector) => document.querySelector(selector);
const fileInput = get("#optimizer-file-input");
const formatSelect = get("#output-format");
const modeSelect = get("#optimization-mode");
const presetControl = get("#preset-control");
const targetControl = get("#target-control");
const backgroundControl = get("#background-control");
const runButton = get("#run-optimizer");
const downloadLink = get("#download-output");
const status = get("#test-status");
const originalCanvas = get("#original-preview");
const outputCanvas = get("#output-preview");

let selectedFile = null;
let outputUrl = null;
let isRunning = false;

const EXTENSIONS = {
  jpeg: "jpg",
  webp: "webp",
  png: "png",
  bmp: "bmp",
  tiff: "tiff",
  gif: "gif",
  svg: "svg"
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(2) + "%";
}

function clearOutput() {
  if (outputUrl) {
    URL.revokeObjectURL(outputUrl);
    outputUrl = null;
  }
  downloadLink.removeAttribute("href");
  downloadLink.hidden = true;
  outputCanvas.width = 0;
  outputCanvas.height = 0;
  get("#output-details").textContent = "No output generated.";
  [
    "#source-size", "#output-size", "#size-difference", "#size-change",
    "#actual-quality", "#attempt-count", "#target-reached", "#validation-status"
  ].forEach((selector) => {
    get(selector).textContent = "—";
  });
}

function drawDecoded(canvas, decoded) {
  canvas.width = decoded.width;
  canvas.height = decoded.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A 2D canvas context is unavailable.");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);
}

function updateControls() {
  const format = formatSelect.value;
  const capabilities = IMAGE_OPTIMIZATION_CAPABILITIES.formats[format];
  const presetOption = modeSelect.querySelector('option[value="preset"]');
  const targetOption = modeSelect.querySelector('option[value="target-size"]');

  presetOption.disabled = !capabilities?.presets;
  targetOption.disabled = !capabilities?.targetSize;

  if (modeSelect.selectedOptions[0]?.disabled) {
    modeSelect.value = "none";
  }

  presetControl.hidden = modeSelect.value !== "preset";
  targetControl.hidden = modeSelect.value !== "target-size";
  backgroundControl.hidden = format !== "jpeg";

  if (capabilities?.presets && capabilities?.targetSize) {
    get("#capability-note").textContent = "JPEG and WebP support quality presets and best-effort target-size optimization.";
  } else {
    get("#capability-note").textContent = format.toUpperCase() + " supports conversion without a quality preset or target-size mode.";
  }
}

function updateBusyState(busy) {
  isRunning = busy;
  runButton.disabled = busy || !selectedFile;
  fileInput.disabled = busy;
  formatSelect.disabled = busy;
  modeSelect.disabled = busy;
  get("#quality-preset").disabled = busy;
  get("#target-size-kb").disabled = busy;
  get("#jpeg-background").disabled = busy;
  runButton.textContent = busy ? "Processing..." : "Run optimization";
}

async function showOriginal(file) {
  let decoded;
  try {
    decoded = await decodeImage(file);
    drawDecoded(originalCanvas, decoded);
    get("#original-details").textContent =
      decoded.width + " × " + decoded.height + " px · " +
      formatBytes(file.size) + " · " + decoded.format.toUpperCase();
  } finally {
    decoded?.close();
  }
}

function getOptions() {
  const format = formatSelect.value;
  const mode = modeSelect.value;
  const optimization = { mode };

  if (mode === "preset") {
    optimization.preset = get("#quality-preset").value;
  } else if (mode === "target-size") {
    const targetKb = Number(get("#target-size-kb").value);
    if (!Number.isFinite(targetKb) || targetKb <= 0) {
      throw new Error("Target size must be a positive number of KB.");
    }
    optimization.targetBytes = Math.round(targetKb * 1024);
  }

  const options = { format, optimization };
  if (format === "jpeg") {
    options.backgroundColor = get("#jpeg-background").value;
  }
  return options;
}

function renderResult(result, sourceFile) {
  const difference = result.size.differenceBytes;
  get("#source-size").textContent = formatBytes(result.size.sourceBytes);
  get("#output-size").textContent = formatBytes(result.size.outputBytes);
  get("#size-difference").textContent =
    (difference >= 0 ? "−" : "+") + formatBytes(Math.abs(difference));
  get("#size-change").textContent = formatPercent(-result.size.reductionPercent);
  get("#actual-quality").textContent =
    result.optimization.quality == null ? "Not applicable" : result.optimization.quality.toFixed(3);
  get("#attempt-count").textContent = String(result.optimization.attempts);
  get("#target-reached").textContent =
    result.optimization.mode === "target-size"
      ? (result.optimization.targetReached ? "Yes" : "No")
      : "Not applicable";
  get("#validation-status").textContent = result.validation.status;

  outputUrl = URL.createObjectURL(result.blob);
  const originalName = sourceFile.name.replace(/\.[^.]+$/, "");
  downloadLink.href = outputUrl;
  downloadLink.download = originalName + "-optimized." + EXTENSIONS[result.format];
  downloadLink.hidden = false;

  get("#output-details").textContent =
    result.width + " × " + result.height + " px · " +
    result.mimeType + " · " + formatBytes(result.size.outputBytes);
}

fileInput.addEventListener("change", async () => {
  selectedFile = fileInput.files?.[0] || null;
  clearOutput();
  originalCanvas.width = 0;
  originalCanvas.height = 0;
  runButton.disabled = true;

  if (!selectedFile) {
    get("#file-info").textContent = "No image selected.";
    get("#original-details").textContent = "No image loaded.";
    status.textContent = "Select an image to begin.";
    return;
  }

  get("#file-info").textContent =
    selectedFile.name + " · " + formatBytes(selectedFile.size);
  status.textContent = "Decoding source image...";
  try {
    await showOriginal(selectedFile);
    status.textContent = "Source decoded. Choose an output format and optimization mode.";
    runButton.disabled = false;
  } catch (error) {
    get("#original-details").textContent = "Source preview unavailable.";
    status.textContent = "Source decoding failed: " + error.message;
  }
});

formatSelect.addEventListener("change", updateControls);
modeSelect.addEventListener("change", updateControls);

runButton.addEventListener("click", async () => {
  if (!selectedFile || isRunning) return;
  let outputDecoded;

  try {
    const options = getOptions();
    updateBusyState(true);
    clearOutput();
    status.textContent = "Encoding and validating output. Target-size mode can take several attempts.";

    const result = await optimizeImage(selectedFile, options);
    outputDecoded = await decodeImage(result.blob, { format: result.format });
    drawDecoded(outputCanvas, outputDecoded);
    renderResult(result, selectedFile);

    const targetMessage = result.optimization.mode === "target-size"
      ? (result.optimization.targetReached ? " Target size reached." : " Target size was not reached; the smallest valid candidate was returned.")
      : "";
    status.textContent =
      "Optimization and output decoding passed." + targetMessage;
  } catch (error) {
    clearOutput();
    status.textContent =
      "Optimization failed" + (error.code ? " [" + error.code + "]" : "") + ": " + error.message;
  } finally {
    outputDecoded?.close();
    updateBusyState(false);
  }
});

window.addEventListener("pagehide", () => {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
});

updateControls();
