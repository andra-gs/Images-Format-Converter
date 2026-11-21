import { decodeImage } from "../src/js/core/image-decoder.js";
import { applyImageTransformations } from "../src/js/core/image-transformer.js";

const fileInput = document.querySelector("#transformer-file-input");
const operationSelect = document.querySelector("#operation-select");
const runButton = document.querySelector("#run-test");
const fileInfo = document.querySelector("#file-info");
const status = document.querySelector("#test-status");
const originalDimensions = document.querySelector("#original-dimensions");
const outputDimensions = document.querySelector("#output-dimensions");
const originalCanvas = document.querySelector("#original-preview");
const outputCanvas = document.querySelector("#output-preview");

let selectedFile = null;
let sourceImageData = null;
let sourceDetails = null;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

function drawImageData(canvas, imageData) {
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("A 2D canvas context is not available.");
  const output = context.createImageData(imageData.width, imageData.height);
  output.data.set(imageData.data);
  context.putImageData(output, 0, 0);
}

function getTransformation(name, width, height) {
  switch (name) {
    case "crop": {
      const cropWidth = Math.max(1, Math.floor(width * 0.8));
      const cropHeight = Math.max(1, Math.floor(height * 0.8));
      return {
        crop: {
          x: Math.floor((width - cropWidth) / 2),
          y: Math.floor((height - cropHeight) / 2),
          width: cropWidth,
          height: cropHeight
        }
      };
    }
    case "resize":
      return {
        resize: {
          width: Math.max(1, Math.round(width * 0.5)),
          height: null,
          keepAspectRatio: true
        }
      };
    case "rotate-90":
      return { rotation: 90 };
    case "rotate-180":
      return { rotation: 180 };
    case "rotate-270":
      return { rotation: 270 };
    case "flip-horizontal":
      return { flipHorizontal: true };
    case "flip-vertical":
      return { flipVertical: true };
    case "combined": {
      const cropWidth = Math.max(1, Math.floor(width * 0.8));
      const cropHeight = Math.max(1, Math.floor(height * 0.8));
      return {
        crop: {
          x: Math.floor((width - cropWidth) / 2),
          y: Math.floor((height - cropHeight) / 2),
          width: cropWidth,
          height: cropHeight
        },
        resize: {
          width: Math.max(1, Math.round(cropWidth * 0.5)),
          height: null,
          keepAspectRatio: true
        },
        rotation: 90,
        flipHorizontal: true
      };
    }
    default:
      return {};
  }
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  selectedFile = file;
  sourceImageData = null;
  sourceDetails = null;
  runButton.disabled = true;
  status.textContent = "Decoding image...";
  outputCanvas.width = 0;
  outputCanvas.height = 0;
  outputDimensions.textContent = "No transformation run.";

  let decoded;
  let stagingCanvas;
  try {
    decoded = await decodeImage(file);

    if (decoded.width * decoded.height > 40_000_000) {
      throw new RangeError("The image exceeds the 40-million-pixel transformation limit.");
    }

    stagingCanvas = document.createElement("canvas");
    stagingCanvas.width = decoded.width;
    stagingCanvas.height = decoded.height;
    const context = stagingCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("A 2D canvas context is not available.");

    context.drawImage(decoded.source, 0, 0);
    const browserImageData = context.getImageData(0, 0, decoded.width, decoded.height);
    sourceImageData = {
      data: browserImageData.data,
      width: browserImageData.width,
      height: browserImageData.height,
      colorSpace: browserImageData.colorSpace || "srgb"
    };

    sourceDetails = {
      format: decoded.format,
      width: decoded.width,
      height: decoded.height
    };

    drawImageData(originalCanvas, sourceImageData);
    originalDimensions.textContent = `${decoded.width} × ${decoded.height} px`;
    fileInfo.textContent = `${file.name} · ${formatBytes(file.size)} · ${decoded.format.toUpperCase()}`;
    status.textContent = "Image decoded. Choose a transformation and run the test.";
    runButton.disabled = false;
  } catch (error) {
    status.textContent = `Image loading failed: ${error.message}`;
    fileInfo.textContent = file.name;
    originalCanvas.width = 0;
    originalCanvas.height = 0;
    originalDimensions.textContent = "Image could not be loaded.";
  } finally {
    decoded?.close();
    if (stagingCanvas) {
      stagingCanvas.width = 0;
      stagingCanvas.height = 0;
    }
  }
});

runButton.addEventListener("click", () => {
  if (!sourceImageData || !sourceDetails) return;

  try {
    const transformation = getTransformation(
      operationSelect.value,
      sourceImageData.width,
      sourceImageData.height
    );
    const result = applyImageTransformations(sourceImageData, transformation);
    drawImageData(outputCanvas, result.imageData);
    outputDimensions.textContent = `${result.width} × ${result.height} px`;
    status.textContent = `Passed: ${operationSelect.selectedOptions[0].textContent}. Output: ${result.width} × ${result.height} px.`;
  } catch (error) {
    outputCanvas.width = 0;
    outputCanvas.height = 0;
    outputDimensions.textContent = "Transformation failed.";
    status.textContent = `Transformation failed: ${error.message}`;
  }
});
