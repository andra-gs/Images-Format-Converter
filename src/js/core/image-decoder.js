import { detectImageFormat } from "./format-detector.js";
import { sanitizeSvgText } from "./svg-sanitizer.js";

const BROWSER_RASTER_FORMATS = new Set(["png", "jpeg", "webp", "bmp", "heic", "heif", "tiff", "svg"]);

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

async function decodeWithSvg(file) {
  const sourceText = await file.text();
  const sanitizedText = sanitizeSvgText(sourceText);
  const sanitizedBlob = new Blob([sanitizedText], { type: "image/svg+xml" });

  try {
    return await decodeWithImageBitmap(sanitizedBlob, "svg");
  } catch (bitmapError) {
    try {
      return await decodeWithImageElement(sanitizedBlob, "svg");
    } catch (imageError) {
      const decodeError = new Error("The sanitized SVG could not be rasterized by this browser.");
      decodeError.cause = imageError || bitmapError;
      throw decodeError;
    }
  }
}

async function decodeWithTiffLibrary(file, format) {
  const decoderModule = await import("utif2");
  const decoder = decoderModule.default || decoderModule;
  const buffer = await file.arrayBuffer();
  const directories = decoder.decode(buffer);
  const firstPage = directories?.[0];

  if (!firstPage) {
    throw new Error("The TIFF file does not contain a readable image page.");
  }

  decoder.decodeImage(buffer, firstPage);

  const { width, height } = firstPage;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("The TIFF decoder returned invalid image dimensions.");
  }

  const rgba = decoder.toRGBA8(firstPage);
  if (!rgba || rgba.length !== width * height * 4) {
    throw new Error("The TIFF decoder returned incomplete pixel data.");
  }

  let canvas;
  if (typeof globalThis.OffscreenCanvas === "function") {
    canvas = new globalThis.OffscreenCanvas(width, height);
  } else if (typeof document !== "undefined" && document.createElement) {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  } else {
    throw new Error("Canvas is not available to render the decoded TIFF image.");
  }

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("A 2D canvas context is not available for TIFF decoding.");
  }

  const imageData = context.createImageData(width, height);
  imageData.data.set(rgba);
  context.putImageData(imageData, 0, 0);

  try {
    return createDecodedResult(canvas, format, () => {
      canvas.width = 0;
      canvas.height = 0;
    });
  } catch (error) {
    canvas.width = 0;
    canvas.height = 0;
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
 * Decode a validated image into a browser-processable source.
 *
 * The caller owns the returned resource and must call close() when finished.
 * SVG is sanitized to a restricted vector subset before browser rasterization.
 * GIF is intentionally excluded. TIFF uses UTIF2 to render its first page to Canvas.
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

  if (detectedFormat === "svg") {
    try {
      return await decodeWithSvg(file);
    } catch (error) {
      const decodeError = new Error("This SVG file could not be safely parsed or rasterized.");
      decodeError.cause = error;
      throw decodeError;
    }
  }

  if (detectedFormat === "tiff") {
    try {
      return await decodeWithTiffLibrary(file, detectedFormat);
    } catch (error) {
      const decodeError = new Error("This TIFF file could not be decoded. It may use an unsupported compression or image variant.");
      decodeError.cause = error;
      throw decodeError;
    }
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
