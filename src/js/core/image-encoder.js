const FORMAT_MIME_TYPES = Object.freeze({
  png: "image/png",
  jpeg: "image/jpeg"
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
      }, mimeType, mimeType === "image/jpeg" ? quality : undefined);
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
          ...(mimeType === "image/jpeg" ? { quality } : {})
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

/**
 * Encode a decoded browser image as PNG or JPEG.
 * JPEG quality is a number from 0 to 1. Transparent pixels are composited
 * onto the supplied background color, which defaults to white.
 */
export async function encodeImage(
  decodedImage,
  { format = "png", quality = 0.85, backgroundColor = "#ffffff" } = {}
) {
  if (!decodedImage?.source || !Number.isFinite(decodedImage.width) || !Number.isFinite(decodedImage.height)) {
    throw new TypeError("A valid decoded image result is required.");
  }

  if (decodedImage.width <= 0 || decodedImage.height <= 0) {
    throw new Error("The decoded image has invalid dimensions.");
  }

  const normalizedFormat = String(format).toLowerCase();
  const mimeType = FORMAT_MIME_TYPES[normalizedFormat];

  if (!mimeType) {
    throw new Error("Only PNG and JPEG encoding are currently implemented.");
  }

  if (normalizedFormat === "jpeg") {
    if (!Number.isFinite(quality) || quality < 0 || quality > 1) {
      throw new RangeError("JPEG quality must be a number between 0 and 1.");
    }

    if (typeof backgroundColor !== "string" || backgroundColor.trim() === "") {
      throw new TypeError("A valid JPEG background color is required.");
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
