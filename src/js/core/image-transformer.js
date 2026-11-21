const MAX_IMAGE_DIMENSION = 16_384;
const MAX_IMAGE_PIXELS = 40_000_000;
const SUPPORTED_ROTATIONS = new Set([0, 90, 180, 270]);

const DEFAULT_TRANSFORMATIONS = Object.freeze({
  resize: Object.freeze({ width: null, height: null, keepAspectRatio: true }),
  crop: Object.freeze({ x: 0, y: 0, width: null, height: null }),
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false
});

const TOP_LEVEL_KEYS = new Set(Object.keys(DEFAULT_TRANSFORMATIONS));
const RESIZE_KEYS = new Set(Object.keys(DEFAULT_TRANSFORMATIONS.resize));
const CROP_KEYS = new Set(Object.keys(DEFAULT_TRANSFORMATIONS.crop));

function createRangeError(message, code = "INVALID_TRANSFORM_OPTIONS") {
  const error = new RangeError(message);
  error.code = code;
  return error;
}

function createTypeError(message, code = "INVALID_TRANSFORM_OPTIONS") {
  const error = new TypeError(message);
  error.code = code;
  return error;
}

function assertKnownProperties(value, allowedKeys, label) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      throw createTypeError(`Unknown ${label} option: ${key}.`);
    }
  }
}

function validateDimension(width, height, label = "Image") {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(`${label} width and height must be positive integers.`);
  }

  if (
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw createRangeError(
      `${label} dimensions exceed the supported limit of ${MAX_IMAGE_DIMENSION}px per side and ${MAX_IMAGE_PIXELS} pixels total.`,
      "IMAGE_DIMENSIONS_EXCEEDED"
    );
  }

  return { width, height };
}

function validateImageData(imageData) {
  if (!imageData || typeof imageData !== "object") {
    throw createTypeError("A valid sRGB ImageData object is required.", "INVALID_IMAGE_DATA");
  }

  const { data, width, height, colorSpace } = imageData;
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw createTypeError("ImageData width and height must be integers.", "INVALID_IMAGE_DATA");
  }
  if (width <= 0 || height <= 0) {
    throw createRangeError("ImageData dimensions must be positive integers.", "INVALID_IMAGE_DATA");
  }
  validateDimension(width, height, "Source image");

  if (!(data instanceof Uint8ClampedArray)) {
    throw createTypeError("ImageData.data must be a Uint8ClampedArray.", "INVALID_IMAGE_DATA");
  }

  if (data.length !== width * height * 4) {
    throw createTypeError("ImageData.data length must equal width × height × 4.", "INVALID_IMAGE_DATA");
  }

  if (colorSpace !== "srgb") {
    throw createTypeError('ImageData.colorSpace must be "srgb".', "INVALID_IMAGE_DATA");
  }

  return imageData;
}

function normalizeTransformations(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw createTypeError("Transformations must be an object.");
  }

  assertKnownProperties(options, TOP_LEVEL_KEYS, "transformation");

  const resizeInput = options.resize ?? {};
  const cropInput = options.crop ?? {};

  if (!resizeInput || typeof resizeInput !== "object" || Array.isArray(resizeInput)) {
    throw createTypeError("Resize options must be an object.");
  }
  if (!cropInput || typeof cropInput !== "object" || Array.isArray(cropInput)) {
    throw createTypeError("Crop options must be an object.");
  }

  assertKnownProperties(resizeInput, RESIZE_KEYS, "resize");
  assertKnownProperties(cropInput, CROP_KEYS, "crop");

  const resize = { ...DEFAULT_TRANSFORMATIONS.resize, ...resizeInput };
  const crop = { ...DEFAULT_TRANSFORMATIONS.crop, ...cropInput };
  const rotation = options.rotation ?? DEFAULT_TRANSFORMATIONS.rotation;
  const flipHorizontal = options.flipHorizontal ?? DEFAULT_TRANSFORMATIONS.flipHorizontal;
  const flipVertical = options.flipVertical ?? DEFAULT_TRANSFORMATIONS.flipVertical;

  for (const key of ["width", "height"]) {
    const value = resize[key];
    if (value !== null && (!Number.isInteger(value) || value <= 0)) {
      throw createRangeError(`Resize ${key} must be a positive integer or null.`);
    }
  }

  if (typeof resize.keepAspectRatio !== "boolean") {
    throw createTypeError("Resize keepAspectRatio must be a boolean.");
  }

  for (const key of ["x", "y"]) {
    if (!Number.isInteger(crop[key]) || crop[key] < 0) {
      throw createRangeError(`Crop ${key} must be a non-negative integer.`, "INVALID_CROP_BOUNDS");
    }
  }

  for (const key of ["width", "height"]) {
    const value = crop[key];
    if (value !== null && (!Number.isInteger(value) || value <= 0)) {
      throw createRangeError(`Crop ${key} must be a positive integer or null.`, "INVALID_CROP_BOUNDS");
    }
  }

  if (!SUPPORTED_ROTATIONS.has(rotation)) {
    throw createRangeError("Rotation must be one of 0, 90, 180, or 270 degrees.");
  }
  if (typeof flipHorizontal !== "boolean" || typeof flipVertical !== "boolean") {
    throw createTypeError("Horizontal and vertical flip options must be booleans.");
  }

  return { resize, crop, rotation, flipHorizontal, flipVertical };
}

function resolveCrop(crop, sourceWidth, sourceHeight) {
  if (crop.x >= sourceWidth || crop.y >= sourceHeight) {
    throw createRangeError("Crop origin must be inside the source image.", "INVALID_CROP_BOUNDS");
  }

  const width = crop.width ?? sourceWidth - crop.x;
  const height = crop.height ?? sourceHeight - crop.y;

  if (crop.x + width > sourceWidth || crop.y + height > sourceHeight) {
    throw createRangeError("Crop area must remain within the source image bounds.", "INVALID_CROP_BOUNDS");
  }

  validateDimension(width, height, "Crop");
  return { x: crop.x, y: crop.y, width, height };
}

function resolveResize(resize, cropWidth, cropHeight) {
  let { width, height } = resize;

  if (width === null && height === null) {
    width = cropWidth;
    height = cropHeight;
  } else if (resize.keepAspectRatio) {
    if (width === null) {
      width = Math.max(1, Math.round(height * cropWidth / cropHeight));
    } else if (height === null) {
      height = Math.max(1, Math.round(width * cropHeight / cropWidth));
    } else {
      const scale = Math.min(width / cropWidth, height / cropHeight);
      width = Math.max(1, Math.round(cropWidth * scale));
      height = Math.max(1, Math.round(cropHeight * scale));
    }
  } else if (width === null || height === null) {
    throw createRangeError("Resize width and height are both required when aspect ratio is unlocked.");
  }

  validateDimension(width, height, "Resized image");
  return { width, height };
}

function sampleBilinear(source, width, height, x, y, output, outputOffset) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const w00 = (1 - tx) * (1 - ty);
  const w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty;
  const w11 = tx * ty;
  const o00 = (y0 * width + x0) * 4;
  const o10 = (y0 * width + x1) * 4;
  const o01 = (y1 * width + x0) * 4;
  const o11 = (y1 * width + x1) * 4;

  const a00 = source[o00 + 3] / 255;
  const a10 = source[o10 + 3] / 255;
  const a01 = source[o01 + 3] / 255;
  const a11 = source[o11 + 3] / 255;
  const alpha = a00 * w00 + a10 * w10 + a01 * w01 + a11 * w11;

  if (alpha > 0) {
    output[outputOffset] = (
      source[o00] * a00 * w00 + source[o10] * a10 * w10 +
      source[o01] * a01 * w01 + source[o11] * a11 * w11
    ) / alpha;
    output[outputOffset + 1] = (
      source[o00 + 1] * a00 * w00 + source[o10 + 1] * a10 * w10 +
      source[o01 + 1] * a01 * w01 + source[o11 + 1] * a11 * w11
    ) / alpha;
    output[outputOffset + 2] = (
      source[o00 + 2] * a00 * w00 + source[o10 + 2] * a10 * w10 +
      source[o01 + 2] * a01 * w01 + source[o11 + 2] * a11 * w11
    ) / alpha;
  } else {
    output[outputOffset] = 0;
    output[outputOffset + 1] = 0;
    output[outputOffset + 2] = 0;
  }
  output[outputOffset + 3] = alpha * 255;
}

/**
 * Apply crop, resize, rotation, and flips to an sRGB ImageData-shaped value.
 * The input is never mutated. The returned pixel buffer is newly allocated
 * and owned by the caller. This synchronous implementation uses typed arrays
 * only, so it can run on the main thread or in a Web Worker.
 */
export function applyImageTransformations(imageData, transformations = {}) {
  validateImageData(imageData);
  const options = normalizeTransformations(transformations);
  const crop = resolveCrop(options.crop, imageData.width, imageData.height);
  const resize = resolveResize(options.resize, crop.width, crop.height);
  const outputWidth = options.rotation === 90 || options.rotation === 270 ? resize.height : resize.width;
  const outputHeight = options.rotation === 90 || options.rotation === 270 ? resize.width : resize.height;

  validateDimension(outputWidth, outputHeight, "Transformed image");

  const outputPixels = new Uint8ClampedArray(outputWidth * outputHeight * 4);
  const scaleX = crop.width / resize.width;
  const scaleY = crop.height / resize.height;
  const sourcePixels = imageData.data;

  for (let y = 0; y < outputHeight; y += 1) {
    const rotatedY = options.flipVertical ? outputHeight - 1 - y : y;

    for (let x = 0; x < outputWidth; x += 1) {
      const rotatedX = options.flipHorizontal ? outputWidth - 1 - x : x;
      let resizedX;
      let resizedY;

      switch (options.rotation) {
        case 90:
          resizedX = rotatedY;
          resizedY = resize.height - 1 - rotatedX;
          break;
        case 180:
          resizedX = resize.width - 1 - rotatedX;
          resizedY = resize.height - 1 - rotatedY;
          break;
        case 270:
          resizedX = resize.width - 1 - rotatedY;
          resizedY = rotatedX;
          break;
        default:
          resizedX = rotatedX;
          resizedY = rotatedY;
      }

      const sourceX = Math.min(
        imageData.width - 1,
        Math.max(0, crop.x + (resizedX + 0.5) * scaleX - 0.5)
      );
      const sourceY = Math.min(
        imageData.height - 1,
        Math.max(0, crop.y + (resizedY + 0.5) * scaleY - 0.5)
      );

      sampleBilinear(
        sourcePixels,
        imageData.width,
        imageData.height,
        sourceX,
        sourceY,
        outputPixels,
        (y * outputWidth + x) * 4
      );
    }
  }

  const resultImageData = {
    data: outputPixels,
    width: outputWidth,
    height: outputHeight,
    colorSpace: "srgb"
  };

  return { imageData: resultImageData, width: outputWidth, height: outputHeight };
}

export const IMAGE_TRANSFORMER_LIMITS = Object.freeze({
  maxDimension: MAX_IMAGE_DIMENSION,
  maxPixels: MAX_IMAGE_PIXELS
});
