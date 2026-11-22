/**
 * Rasterize a decoded image source into a small PNG thumbnail Blob.
 * This module accepts decoder output rather than relying on native <img>
 * support for the original source format.
 */
function createCanvas(width, height) {
  if (typeof globalThis.OffscreenCanvas === "function") {
    return new globalThis.OffscreenCanvas(width, height);
  }

  if (typeof document !== "undefined" && typeof document.createElement === "function") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  throw new Error("Canvas is unavailable for queue thumbnail generation.");
}

function canvasToBlob(canvas) {
  if (typeof canvas.convertToBlob === "function") {
    return canvas.convertToBlob({ type: "image/png" });
  }

  if (typeof canvas.toBlob === "function") {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob instanceof Blob && blob.size > 0) resolve(blob);
        else reject(new Error("The browser could not encode the queue thumbnail."));
      }, "image/png");
    });
  }

  throw new Error("Canvas Blob export is unavailable.");
}

export async function createImageThumbnail(
  decodedImage,
  { maxSize = 96, canvasFactory = createCanvas } = {}
) {
  const width = Number(decodedImage?.width);
  const height = Number(decodedImage?.height);

  if (
    !decodedImage?.source ||
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new TypeError("A valid decoded image is required to create a thumbnail.");
  }

  if (!Number.isInteger(maxSize) || maxSize <= 0) {
    throw new RangeError("Thumbnail maxSize must be a positive integer.");
  }

  const scale = Math.min(1, maxSize / Math.max(width, height));
  const thumbnailWidth = Math.max(1, Math.round(width * scale));
  const thumbnailHeight = Math.max(1, Math.round(height * scale));
  const canvas = canvasFactory(thumbnailWidth, thumbnailHeight);

  try {
    const context = canvas?.getContext?.("2d");
    if (!context || typeof context.drawImage !== "function") {
      throw new Error("A 2D Canvas context is unavailable for the thumbnail.");
    }

    context.drawImage(decodedImage.source, 0, 0, thumbnailWidth, thumbnailHeight);
    const blob = await canvasToBlob(canvas);
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error("The generated queue thumbnail is empty.");
    }
    return blob;
  } finally {
    try {
      canvas.width = 0;
      canvas.height = 0;
    } catch {
      // Canvas release is best-effort.
    }
  }
}
