const FORMAT_MIME_TYPES = Object.freeze({
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  bmp: "image/bmp",
  tiff: "image/tiff",
  svg: "image/svg+xml"
});

function createHtmlCanvas(width, height, mimeType, quality) {
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("Canvas is not available in this browser.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  return {
    canvas,
    context: canvas.getContext("2d"),
    toBlob: () => new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("The browser could not create the image output."));
          return;
        }
        resolve(blob);
      }, mimeType, ["image/jpeg", "image/webp"].includes(mimeType) ? quality : undefined);
    })
  };
}

function prepareCanvas(context, source, width, height, mimeType, backgroundColor) {
  if (mimeType === "image/jpeg") {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(source, 0, 0, width, height);
}

async function createCanvasBlob(decodedImage, { mimeType, quality, backgroundColor }) {
  const { source, width, height } = decodedImage;

  if (typeof globalThis.OffscreenCanvas === "function") {
    try {
      const canvas = new globalThis.OffscreenCanvas(width, height);
      const context = canvas.getContext("2d");

      if (context && typeof canvas.convertToBlob === "function") {
        prepareCanvas(context, source, width, height, mimeType, backgroundColor);
        const blob = await canvas.convertToBlob({
          type: mimeType,
          ...(["image/jpeg", "image/webp"].includes(mimeType) ? { quality } : {})
        });

        if (blob instanceof Blob && blob.size > 0 && blob.type.toLowerCase() === mimeType) {
          return blob;
        }
      }
    } catch {
      // Fall through to the HTML canvas implementation.
    }
  }

  const { canvas, context, toBlob } = createHtmlCanvas(width, height, mimeType, quality);

  if (!context) {
    throw new Error("A 2D canvas context is not available.");
  }

  if (typeof canvas.toBlob !== "function") {
    throw new Error("Canvas image encoding is not available in this browser.");
  }

  prepareCanvas(context, source, width, height, mimeType, backgroundColor);
  return toBlob();
}

function encodeBmpPixels(imageData, width, height) {
  const bytesPerPixel = 3;
  const rowBytes = width * bytesPerPixel;
  const rowStride = Math.ceil(rowBytes / 4) * 4;
  const pixelArraySize = rowStride * height;
  const headerSize = 14 + 40;
  const fileSize = headerSize + pixelArraySize;

  if (!Number.isSafeInteger(fileSize) || fileSize > 0xffffffff) {
    throw new RangeError("The image is too large to encode as a BMP file.");
  }

  const output = new ArrayBuffer(fileSize);
  const view = new DataView(output);
  const pixels = new Uint8Array(output);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, headerSize, true);

  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  const source = imageData.data;
  let targetOffset = headerSize;

  // BMP stores rows bottom-up. A 24-bit BMP uses BGR pixels and 4-byte row alignment.
  for (let y = height - 1; y >= 0; y -= 1) {
    const sourceRow = y * width * 4;

    for (let x = 0; x < width; x += 1) {
      const sourceOffset = sourceRow + x * 4;
      const alpha = source[sourceOffset + 3] / 255;

      // 24-bit BMP has no alpha channel, so transparent pixels are composited onto white.
      const red = Math.round(source[sourceOffset] * alpha + 255 * (1 - alpha));
      const green = Math.round(source[sourceOffset + 1] * alpha + 255 * (1 - alpha));
      const blue = Math.round(source[sourceOffset + 2] * alpha + 255 * (1 - alpha));

      pixels[targetOffset++] = blue;
      pixels[targetOffset++] = green;
      pixels[targetOffset++] = red;
    }

    targetOffset += rowStride - rowBytes;
  }

  return new Blob([output], { type: "image/bmp" });
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return globalThis.btoa(binary);
}

async function createSvgBlob(decodedImage) {
  const { width, height } = decodedImage;
  const pngBlob = await createCanvasBlob(decodedImage, {
    mimeType: "image/png",
    quality: 1,
    backgroundColor: "#ffffff"
  });
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const pngBase64 = bytesToBase64(pngBytes);
  if (pngBase64.length > 64 * 1024 * 1024) {
    throw new RangeError("The embedded PNG is too large for the supported SVG wrapper size.");
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image x="0" y="0" width="${width}" height="${height}" href="data:image/png;base64,${pngBase64}" /></svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

async function createTiffBlob(decodedImage) {
  const { source, width, height } = decodedImage;
  let imageData;

  if (typeof globalThis.OffscreenCanvas === "function") {
    try {
      const canvas = new globalThis.OffscreenCanvas(width, height);
      const context = canvas.getContext("2d");

      if (context?.getImageData) {
        context.drawImage(source, 0, 0, width, height);
        imageData = context.getImageData(0, 0, width, height);
      }
    } catch {
      // Fall through to the HTML canvas implementation.
    }
  }

  if (!imageData) {
    const { canvas, context } = createHtmlCanvas(width, height, "image/tiff");
    if (!context || typeof context.getImageData !== "function") {
      throw new Error("A readable 2D canvas context is not available for TIFF encoding.");
    }

    context.drawImage(source, 0, 0, width, height);
    imageData = context.getImageData(0, 0, width, height);
  }

  if (!imageData?.data || imageData.data.length !== width * height * 4) {
    throw new Error("The browser returned invalid pixel data for TIFF encoding.");
  }

  const tiffModule = await import("utif2");
  const tiffEncoder = tiffModule.default || tiffModule;
  const rgba = new Uint8Array(
    imageData.data.buffer,
    imageData.data.byteOffset,
    imageData.data.byteLength
  );
  const encoded = tiffEncoder.encodeImage(rgba, width, height);

  if (!(encoded instanceof ArrayBuffer) || encoded.byteLength === 0) {
    throw new Error("The TIFF encoder returned an invalid output buffer.");
  }

  return new Blob([encoded], { type: "image/tiff" });
}

async function createBmpBlob(decodedImage) {
  const { source, width, height } = decodedImage;
  let imageData;

  if (typeof globalThis.OffscreenCanvas === "function") {
    try {
      const canvas = new globalThis.OffscreenCanvas(width, height);
      const context = canvas.getContext("2d");

      if (context?.getImageData) {
        context.drawImage(source, 0, 0, width, height);
        imageData = context.getImageData(0, 0, width, height);
      }
    } catch {
      // Fall through to the HTML canvas implementation.
    }
  }

  if (!imageData) {
    const { canvas, context } = createHtmlCanvas(width, height, "image/bmp");
    if (!context || typeof context.getImageData !== "function") {
      throw new Error("A readable 2D canvas context is not available for BMP encoding.");
    }

    context.drawImage(source, 0, 0, width, height);
    imageData = context.getImageData(0, 0, width, height);
  }

  if (!imageData?.data || imageData.data.length !== width * height * 4) {
    throw new Error("The browser returned invalid pixel data for BMP encoding.");
  }

  return encodeBmpPixels(imageData, width, height);
}

/**
 * Encode a decoded browser image as PNG, JPEG, WebP, 24-bit BMP, baseline TIFF, or an SVG wrapper containing embedded PNG data.
 * TIFF output uses UTIF2's uncompressed encoder. JPEG and WebP quality values
 * are numbers from 0 to 1. JPEG and BMP transparent pixels are composited onto white.
 */
export async function encodeImage(
  decodedImage,
  { format = "png", quality = 0.85, backgroundColor = "#ffffff" } = {}
) {
  if (!decodedImage?.source || !Number.isFinite(decodedImage.width) || !Number.isFinite(decodedImage.height)) {
    throw new TypeError("A valid decoded image result is required.");
  }

  if (decodedImage.width <= 0 || decodedImage.height <= 0 ||
      !Number.isInteger(decodedImage.width) || !Number.isInteger(decodedImage.height)) {
    throw new Error("The decoded image has invalid dimensions.");
  }

  const normalizedFormat = String(format).toLowerCase();
  const mimeType = FORMAT_MIME_TYPES[normalizedFormat];

  if (!mimeType) {
    throw new Error("Only PNG, JPEG, WebP, BMP, and TIFF encoding are currently implemented.");
  }

  if (["jpeg", "webp"].includes(normalizedFormat)) {
    if (!Number.isFinite(quality) || quality < 0 || quality > 1) {
      throw new RangeError(`${normalizedFormat.toUpperCase()} quality must be a number between 0 and 1.`);
    }

    if (normalizedFormat === "jpeg" && (typeof backgroundColor !== "string" || backgroundColor.trim() === "")) {
      throw new TypeError("A valid JPEG background color is required.");
    }
  }

  if (normalizedFormat === "bmp") {
    try {
      return await createBmpBlob(decodedImage);
    } catch (error) {
      throw new Error("BMP encoding failed in this browser.", { cause: error });
    }
  }

  if (normalizedFormat === "tiff") {
    try {
      return await createTiffBlob(decodedImage);
    } catch (error) {
      throw new Error("TIFF encoding failed in this browser.", { cause: error });
    }
  }

  if (normalizedFormat === "svg") {
    try {
      return await createSvgBlob(decodedImage);
    } catch (error) {
      throw new Error("SVG wrapper encoding failed in this browser.", { cause: error });
    }
  }

  let blob;

  try {
    blob = await createCanvasBlob(decodedImage, {
      mimeType,
      quality,
      backgroundColor
    });
  } catch (error) {
    throw new Error(`${normalizedFormat.toUpperCase()} encoding failed in this browser.`, { cause: error });
  }

  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error(`The browser returned an empty ${normalizedFormat.toUpperCase()} output.`);
  }

  if (blob.type.toLowerCase() !== mimeType) {
    throw new Error("The browser returned an unexpected output MIME type.");
  }

  return blob;
}
