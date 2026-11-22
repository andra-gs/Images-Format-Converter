import { decodeImage } from "../src/js/core/image-decoder.js";
import { applyImageAdjustments } from "../src/js/core/image-adjuster.js";

const get = (selector) => document.querySelector(selector);
const fileInput = get("#adjuster-file-input");
const runButton = get("#run-test");
const resetButton = get("#reset-test");
const status = get("#test-status");
const fileInfo = get("#file-info");
const originalCanvas = get("#original-preview");
const outputCanvas = get("#output-preview");
let sourceImageData = null;

function drawImageData(canvas, imageData) {
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A 2D canvas context is unavailable.");
  context.putImageData(new ImageData(imageData.data, imageData.width, imageData.height), 0, 0);
}

function getOptions() {
  return {
    brightness: Number(get("#brightness").value),
    contrast: Number(get("#contrast").value),
    saturation: Number(get("#saturation").value),
    blur: Number(get("#blur").value),
    grayscale: get("#grayscale").checked,
    sepia: get("#sepia").checked
  };
}

function updateValues() {
  get("#brightness-value").value = get("#brightness").value;
  get("#contrast-value").value = get("#contrast").value;
  get("#saturation-value").value = get("#saturation").value + "%";
  get("#blur-value").value = get("#blur").value + " px";
}

function resetControls() {
  get("#brightness").value = 0;
  get("#contrast").value = 0;
  get("#saturation").value = 100;
  get("#blur").value = 0;
  get("#grayscale").checked = false;
  get("#sepia").checked = false;
  updateValues();
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  sourceImageData = null;
  resetControls();
  runButton.disabled = true;
  resetButton.disabled = true;
  status.textContent = "Decoding image...";
  outputCanvas.width = 0;
  outputCanvas.height = 0;
  let decoded;
  let stagingCanvas;
  try {
    decoded = await decodeImage(file);
    if (decoded.width * decoded.height > 40_000_000) {
      throw new RangeError("The image exceeds the 40-million-pixel processing limit.");
    }
    stagingCanvas = document.createElement("canvas");
    stagingCanvas.width = decoded.width;
    stagingCanvas.height = decoded.height;
    const context = stagingCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("A 2D canvas context is unavailable.");
    context.drawImage(decoded.source, 0, 0);
    const pixels = context.getImageData(0, 0, decoded.width, decoded.height);
    sourceImageData = {
      data: new Uint8ClampedArray(pixels.data),
      width: pixels.width,
      height: pixels.height,
      colorSpace: pixels.colorSpace || "srgb"
    };
    drawImageData(originalCanvas, sourceImageData);
    get("#original-dimensions").textContent = decoded.width + " × " + decoded.height + " px";
    fileInfo.textContent = file.name + " · " + Math.round(file.size / 1024) + " KB · " + decoded.format.toUpperCase();
    status.textContent = "Image decoded. Change the controls and apply adjustments.";
    runButton.disabled = false;
    resetButton.disabled = false;
  } catch (error) {
    status.textContent = "Image loading failed: " + error.message;
    fileInfo.textContent = file.name;
    originalCanvas.width = 0;
    originalCanvas.height = 0;
  } finally {
    decoded?.close();
    if (stagingCanvas) {
      stagingCanvas.width = 0;
      stagingCanvas.height = 0;
    }
  }
});

runButton.addEventListener("click", () => {
  if (!sourceImageData) return;
  try {
    const result = applyImageAdjustments(sourceImageData, getOptions());
    drawImageData(outputCanvas, result.imageData);
    get("#output-dimensions").textContent = result.width + " × " + result.height + " px";
    status.textContent = "Adjustments applied. Dimensions and alpha values are preserved.";
  } catch (error) {
    outputCanvas.width = 0;
    outputCanvas.height = 0;
    status.textContent = "Adjustment failed: " + error.message;
  }
});

resetButton.addEventListener("click", () => {
  if (!sourceImageData) return;
  resetControls();
  drawImageData(outputCanvas, sourceImageData);
  get("#output-dimensions").textContent = sourceImageData.width + " × " + sourceImageData.height + " px";
  status.textContent = "Reset to the original image.";
});

document.querySelectorAll('input[type="range"]').forEach((input) => {
  input.addEventListener("input", updateValues);
});
updateValues();
