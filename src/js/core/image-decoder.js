import { detectImageFormat } from "./format-detector.js";

const BROWSER_RASTER_FORMATS = new Set(["png", "jpeg", "webp", "bmp", "heic", "heif"]);

function getImageDimensions(source) {
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("The decoded image has invalid dimensions.");
  }

  return { width, height };
}

function createDecodedResult(source, format, cleanup) {
  const { width, height } = getImageDimensions(source);
  let closed = false;

  return {
    source,
    width,
    height,
    format,
    close() {
      if (closed) return;
      closed = true;
      cleanup();
    }
  };
}

async function decodeWithImageBitmap(file, format) {
  if (typeof globalThis.createImageBitmap !== "function") {
    throw new Error("ImageBitmap is not available in this browser.");
  }

  const bitmap = await globalThis.createImageBitmap(file);

  try {
    return createDecodedResult(bitmap, format, () => bitmap.close?.());
  } catch (error) {
    bitmap.close?.();
    throw error;
  }
}

async function decodeWithHeicLibrary(file, format) {
  // heic-to provides a worker-specific entry so the WASM decoder can run
  // inside the existing conversion worker without requiring DOM APIs.
  const decoderModule = typeof document === "undefined"
    ? await import("heic-to/next")
    : await import("heic-to");

  const bitmap = await decoderModule.heicTo({
    blob: file,
    type: "bitmap"
  });

  try {
    return createDecodedResult(bitmap, format, () => bitmap.close?.());
  } catch (error) {
    bitmap.close?.();
    throw error;
  }
}

async function decodeWithImageElement(file, format) {
  if (typeof globalThis.Image !== "function") {
    throw new Error("The browser image element is not available.");
  }

  if (typeof globalThis.URL?.createObjectURL !== "function") {
    throw new Error("Object URLs are not available in this browser.");
  }

  const image = new globalThis.Image();
  const objectUrl = globalThis.URL.createObjectURL(file);

  try {
    if (typeof image.decode === "function") {
      image.src = objectUrl;
      await image.decode();
    } else {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("The browser could not load this image."));
        image.src = objectUrl;
      });
    }

    return createDecodedResult(image, format, () => {
      image.removeAttribute?.("src");
      globalThis.URL.revokeObjectURL(objectUrl);
    });
  } catch (error) {
    globalThis.URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

/**
 * Decode a validated raster image into a browser-processable source.
 *
 * The caller owns the returned resource and must call close() when finished.
 * SVG, GIF, and TIFF are intentionally excluded from this module.
 */
export async function decodeImage(file, { format } = {}) {
  if (!(file instanceof Blob)) {
    throw new TypeError("A valid File or Blob is required.");
  }

  if (file.size === 0) {
    throw new Error("The image file is empty.");
  }

  let detectedFormat = format;

  if (!detectedFormat) {
    const detected = await detectImageFormat(file);
    detectedFormat = detected?.format;
  }

  detectedFormat = String(detectedFormat || "").toLowerCase();

  if (!BROWSER_RASTER_FORMATS.has(detectedFormat)) {
    throw new Error(`Decoding is not available for the ${detectedFormat || "unknown"} format.`);
  }

  const decodingErrors = [];

  try {
    return await decodeWithImageBitmap(file, detectedFormat);
  } catch (error) {
    decodingErrors.push(error);
  }

  if (detectedFormat === "heic" || detectedFormat === "heif") {
    try {
      return await decodeWithHeicLibrary(file, detectedFormat);
    } catch (error) {
      decodingErrors.push(error);
    }
  }

  try {
    return await decodeWithImageElement(file, detectedFormat);
  } catch (error) {
    decodingErrors.push(error);
  }

  const decodeError = new Error("This browser could not decode the selected image.");
  decodeError.cause = decodingErrors.at(-1);
  throw decodeError;
}
