/**
 * Phase 5 image-processing boundary.
 *
 * The adapter owns conversion between the decoder's browser source and the
 * shared ImageData representation. Processing modules are injected so this
 * branch can be developed before their implementations are merged.
 */

export const EDITOR_PROCESSING_UNAVAILABLE = "EDITOR_PROCESSING_UNAVAILABLE";
export const IMAGE_DIMENSIONS_EXCEEDED = "IMAGE_DIMENSIONS_EXCEEDED";

export const IMAGE_LIMITS = Object.freeze({
  maxWidth: 16_384,
  maxHeight: 16_384,
  maxPixels: 40_000_000
});

const DEFAULT_ADJUSTMENTS = Object.freeze({
  brightness: 0,
  contrast: 0,
  saturation: 100,
  blur: 0,
  grayscale: false,
  sepia: false
});

function createDefaultTransformations() {
  return {
    resize: { width: null, height: null, keepAspectRatio: true },
    crop: { x: 0, y: 0, width: null, height: null },
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false
  };
}

export function createDefaultEditorState() {
  return {
    transformations: createDefaultTransformations(),
    adjustments: { ...DEFAULT_ADJUSTMENTS }
  };
}

export function resetEditorState() {
  return createDefaultEditorState();
}

export function validateImageDimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError("Image dimensions must be positive integers.");
  }

  if (
    width > IMAGE_LIMITS.maxWidth ||
    height > IMAGE_LIMITS.maxHeight ||
    width * height > IMAGE_LIMITS.maxPixels
  ) {
    const error = new RangeError("The image exceeds the supported processing dimensions.");
    error.code = IMAGE_DIMENSIONS_EXCEEDED;
    throw error;
  }

  return { width, height };
}

export function validateImageData(imageData) {
  if (
    !imageData ||
    !(imageData.data instanceof Uint8ClampedArray) ||
    !Number.isInteger(imageData.width) ||
    !Number.isInteger(imageData.height) ||
    imageData.colorSpace !== "srgb"
  ) {
    throw new TypeError("A valid sRGB ImageData object is required.");
  }

  validateImageDimensions(imageData.width, imageData.height);

  if (imageData.data.length !== imageData.width * imageData.height * 4) {
    throw new TypeError("ImageData pixel data length does not match its dimensions.");
  }

  return imageData;
}

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

  throw new Error("Canvas is unavailable in this environment.");
}

function releaseCanvas(canvas) {
  if (!canvas) return;
  try {
    canvas.width = 0;
    canvas.height = 0;
  } catch {
    // Releasing a temporary canvas is best-effort.
  }
}

/**
 * Copy a decoder result into a fresh, owned sRGB pixel buffer.
 * The caller retains ownership of decodedImage and must close it itself.
 */
export function decodedImageToImageData(decodedImage, { canvasFactory = createCanvas } = {}) {
  if (
    !decodedImage ||
    !decodedImage.source ||
    !Number.isInteger(decodedImage.width) ||
    !Number.isInteger(decodedImage.height)
  ) {
    throw new TypeError("A valid decoded image result is required.");
  }

  const { width, height } = validateImageDimensions(decodedImage.width, decodedImage.height);
  let canvas;

  try {
    canvas = canvasFactory(width, height);
    const context = canvas?.getContext?.("2d", { willReadFrequently: true });
    if (!context || typeof context.drawImage !== "function" || typeof context.getImageData !== "function") {
      throw new Error("A readable 2D canvas context is unavailable.");
    }

    context.drawImage(decodedImage.source, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);

    if (!(pixels?.data instanceof Uint8ClampedArray) || pixels.data.length !== width * height * 4) {
      throw new Error("The browser returned invalid image pixel data.");
    }

    return {
      data: new Uint8ClampedArray(pixels.data),
      width,
      height,
      colorSpace: "srgb"
    };
  } finally {
    releaseCanvas(canvas);
  }
}

/**
 * Create a caller-owned decoder-compatible canvas result from shared ImageData.
 * The returned close() method is idempotent and only releases this canvas.
 */
export function imageDataToCanvasResult(imageData, { canvasFactory = createCanvas } = {}) {
  validateImageData(imageData);
  const { width, height } = imageData;
  const canvas = canvasFactory(width, height);
  let closed = false;

  try {
    const context = canvas?.getContext?.("2d");
    if (!context || typeof context.createImageData !== "function" || typeof context.putImageData !== "function") {
      throw new Error("A writable 2D canvas context is unavailable.");
    }

    const pixels = context.createImageData(width, height);
    pixels.data.set(imageData.data);
    context.putImageData(pixels, 0, 0);
  } catch (error) {
    releaseCanvas(canvas);
    throw error;
  }

  return {
    source: canvas,
    width,
    height,
    close() {
      if (closed) return;
      closed = true;
      releaseCanvas(canvas);
    }
  };
}

function throwIfAborted(signal) {
  if (!signal?.aborted) return;
  if (typeof DOMException === "function") {
    throw new DOMException("Image editing was cancelled.", "AbortError");
  }
  const error = new Error("Image editing was cancelled.");
  error.name = "AbortError";
  throw error;
}

function createUnavailableError() {
  const error = new Error(
    "Image editing is not available yet. The Transformer and Adjuster modules have not both been integrated."
  );
  error.code = EDITOR_PROCESSING_UNAVAILABLE;
  return error;
}

/**
 * Create the editor's processing adapter.
 *
 * Inject applyImageTransformations and applyImageAdjustments after their
 * implementations are available. Processing functions may be synchronous or
 * asynchronous; awaiting both supports either contract without changing order.
 */
export function createImageProcessingAdapter({
  applyImageTransformations,
  applyImageAdjustments,
  canvasFactory = createCanvas
} = {}) {
  const hasTransformer = typeof applyImageTransformations === "function";
  const hasAdjuster = typeof applyImageAdjustments === "function";
  const capabilities = Object.freeze({
    resize: hasTransformer,
    crop: hasTransformer,
    rotate: hasTransformer,
    flip: hasTransformer,
    brightness: hasAdjuster,
    contrast: hasAdjuster,
    saturation: hasAdjuster,
    blur: hasAdjuster,
    grayscale: hasAdjuster,
    sepia: hasAdjuster
  });

  return Object.freeze({
    capabilities,

    async process({ decodedImage, transformations, adjustments, signal } = {}) {
      if (!hasTransformer || !hasAdjuster) throw createUnavailableError();
      throwIfAborted(signal);

      let imageData = decodedImageToImageData(decodedImage, { canvasFactory });
      throwIfAborted(signal);

      imageData = await applyImageTransformations(imageData, transformations || createDefaultTransformations());
      validateImageData(imageData?.imageData || imageData);
      imageData = imageData.imageData || imageData;
      throwIfAborted(signal);

      imageData = await applyImageAdjustments(imageData, adjustments || { ...DEFAULT_ADJUSTMENTS });
      validateImageData(imageData?.imageData || imageData);
      imageData = imageData.imageData || imageData;
      throwIfAborted(signal);

      return imageData;
    }
  });
}
