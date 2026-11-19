import { decodeImage } from "./image-decoder.js";
import { encodeImage } from "./image-encoder.js";
import { detectImageFormat } from "./format-detector.js";

/**
 * Convert a supported source image and verify the generated output.
 * The returned Blob is owned by the caller.
 */
async function convertImageDirect(file, format, options = {}) {
  const source = await decodeImage(file);
  let output;

  try {
    output = await encodeImage(source, { ...options, format });

    const detectedOutput = await detectImageFormat(output);
    if (detectedOutput?.format !== format) {
      throw new Error(`The generated output did not pass ${format.toUpperCase()} signature validation.`);
    }

    const verifiedOutput = await decodeImage(output, { format });

    try {
      if (verifiedOutput.width !== source.width || verifiedOutput.height !== source.height) {
        throw new Error(`The generated ${format.toUpperCase()} dimensions do not match the source image.`);
      }
    } finally {
      verifiedOutput.close();
    }

    return {
      blob: output,
      format,
      width: source.width,
      height: source.height
    };
  } finally {
    source.close();
  }
}

let conversionWorker = null;
let nextWorkerRequestId = 0;
const pendingWorkerRequests = new Map();

function rejectPendingWorkerRequests(error) {
  for (const pending of pendingWorkerRequests.values()) {
    pending.reject(error);
  }
  pendingWorkerRequests.clear();
}

function stopConversionWorker(error) {
  if (conversionWorker) {
    conversionWorker.terminate();
    conversionWorker = null;
  }
  rejectPendingWorkerRequests(error);
}

function getConversionWorker() {
  if (conversionWorker) return conversionWorker;

  conversionWorker = new Worker(
    new URL("../workers/conversion.worker.js", import.meta.url),
    { type: "module" }
  );

  conversionWorker.addEventListener("message", (event) => {
    const { id, ok, result, error } = event.data || {};
    const pending = pendingWorkerRequests.get(id);
    if (!pending) return;

    pendingWorkerRequests.delete(id);

    if (ok) {
      pending.resolve(result);
    } else {
      const conversionError = new Error(error?.message || "Image conversion failed in the worker.");
      conversionError.name = "WorkerConversionError";
      pending.reject(conversionError);
    }
  });

  conversionWorker.addEventListener("error", (event) => {
    event.preventDefault();
    const workerError = new Error(event.message || "The conversion worker stopped unexpectedly.");
    workerError.workerUnavailable = true;
    stopConversionWorker(workerError);
  });

  conversionWorker.addEventListener("messageerror", () => {
    const workerError = new Error("The conversion worker returned an unreadable message.");
    workerError.workerUnavailable = true;
    stopConversionWorker(workerError);
  });

  return conversionWorker;
}

function supportsWorkerConversion(format) {
  if (
    typeof globalThis.Worker !== "function" ||
    typeof globalThis.OffscreenCanvas !== "function" ||
    typeof globalThis.createImageBitmap !== "function"
  ) {
    return false;
  }

  try {
    const canvas = new globalThis.OffscreenCanvas(1, 1);
    if (typeof canvas.getContext !== "function" || !canvas.getContext("2d")) return false;
    return ["bmp", "tiff"].includes(format) || typeof canvas.convertToBlob === "function";
  } catch {
    return false;
  }
}

function convertInWorker(file, format, options) {
  return new Promise((resolve, reject) => {
    let worker;

    try {
      worker = getConversionWorker();
    } catch (error) {
      error.workerUnavailable = true;
      reject(error);
      return;
    }

    const id = ++nextWorkerRequestId;
    pendingWorkerRequests.set(id, { resolve, reject });

    try {
      worker.postMessage({ id, file, format, options });
    } catch (error) {
      pendingWorkerRequests.delete(id);
      error.workerUnavailable = true;
      reject(error);
    }
  });
}

async function convertImage(file, format, options = {}) {
  if (typeof document !== "undefined") {
    const sourceFormat = await detectImageFormat(file);
    if (sourceFormat?.format === "svg") {
      return convertImageDirect(file, format, options);
    }
  }

  if (typeof document === "undefined" || !supportsWorkerConversion(format)) {
    return convertImageDirect(file, format, options);
  }

  try {
    return await convertInWorker(file, format, options);
  } catch (error) {
    if (!error.workerUnavailable && error.name !== "WorkerConversionError") throw error;
    // Retry on the main thread so HTMLImageElement/HTMLCanvas fallbacks remain available.
    return convertImageDirect(file, format, options);
  }
}

export function disposeConversionWorker() {
  if (conversionWorker) {
    conversionWorker.terminate();
    conversionWorker = null;
  }
  pendingWorkerRequests.clear();
}


/**
 * Convert a supported source image to PNG.
 */
export function convertImageToPng(file) {
  return convertImage(file, "png");
}

/**
 * Convert a supported source image to JPEG.
 * Quality is a number from 0 to 1. Transparent pixels use a white background
 * unless another valid CSS canvas color is supplied.
 */
export function convertImageToJpeg(file, { quality = 0.85, backgroundColor = "#ffffff" } = {}) {
  return convertImage(file, "jpeg", { quality, backgroundColor });
}


/**
 * Convert a supported source image to WebP.
 * Quality is a number from 0 to 1. The browser must return image/webp;
 * unsupported browser encoders are rejected rather than mislabeled.
 */
export function convertImageToWebp(file, { quality = 0.85 } = {}) {
  return convertImage(file, "webp", { quality });
}


/**
 * Convert a supported source image to a 24-bit BMP.
 * Transparent pixels are composited onto white because this BMP encoder
 * writes a broadly compatible 24-bit bitmap without an alpha channel.
 */
export function convertImageToBmp(file) {
  return convertImage(file, "bmp");
}


/**
 * Convert a supported source image to an uncompressed baseline TIFF.
 */
export function convertImageToTiff(file) {
  return convertImage(file, "tiff");
}
