const PNG_MIME_TYPE = "image/png";

function createHtmlCanvas(width, height) {
  if (typeof document?.createElement !== "function") {
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
          reject(new Error("The browser could not create the PNG output."));
          return;
        }
        resolve(blob);
      }, PNG_MIME_TYPE);
    })
  };
}

async function createCanvasBlob(decodedImage) {
  const { source, width, height } = decodedImage;

  if (typeof globalThis.OffscreenCanvas === "function") {
    const canvas = new globalThis.OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("A 2D canvas context is not available.");
    }

    context.drawImage(source, 0, 0, width, height);
    return canvas.convertToBlob({ type: PNG_MIME_TYPE });
  }

  const { canvas, context, toBlob } = createHtmlCanvas(width, height);

  if (!context) {
    throw new Error("A 2D canvas context is not available.");
  }

  context.drawImage(source, 0, 0, width, height);
  return toBlob();
}

/**
 * Encode a decoded browser image as PNG.
 * PNG encoding preserves transparency and does not use a quality setting.
 */
export async function encodeImage(decodedImage, { format = "png" } = {}) {
  if (!decodedImage?.source || !Number.isFinite(decodedImage.width) || !Number.isFinite(decodedImage.height)) {
    throw new TypeError("A valid decoded image result is required.");
  }

  if (decodedImage.width <= 0 || decodedImage.height <= 0) {
    throw new Error("The decoded image has invalid dimensions.");
  }

  if (String(format).toLowerCase() !== "png") {
    throw new Error("Only PNG encoding is currently implemented.");
  }

  let blob;

  try {
    blob = await createCanvasBlob(decodedImage);
  } catch (error) {
    throw new Error("PNG encoding failed in this browser.", { cause: error });
  }

  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("The browser returned an empty PNG output.");
  }

  if (blob.type && blob.type.toLowerCase() !== PNG_MIME_TYPE) {
    throw new Error("The browser returned an unexpected output MIME type.");
  }

  return blob;
}
