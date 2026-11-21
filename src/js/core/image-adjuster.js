const MAX_IMAGE_DIMENSION = 16_384;
const MAX_IMAGE_PIXELS = 40_000_000;
const DEFAULTS = Object.freeze({
  brightness: 0, contrast: 0, saturation: 100,
  grayscale: false, sepia: false, blur: 0
});
const KEYS = new Set(Object.keys(DEFAULTS));

function typeError(message, code = "INVALID_ADJUSTMENT_OPTIONS") {
  const error = new TypeError(message);
  error.code = code;
  return error;
}

function rangeError(message, code = "INVALID_ADJUSTMENT_OPTIONS") {
  const error = new RangeError(message);
  error.code = code;
  return error;
}

function validateImageData(imageData) {
  if (!imageData || typeof imageData !== "object") {
    throw typeError("A valid sRGB ImageData object is required.", "INVALID_IMAGE_DATA");
  }
  const { data, width, height, colorSpace } = imageData;
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw typeError("ImageData width and height must be integers.", "INVALID_IMAGE_DATA");
  }
  if (width <= 0 || height <= 0) {
    throw rangeError("ImageData dimensions must be positive.", "INVALID_IMAGE_DATA");
  }
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION ||
      width * height > MAX_IMAGE_PIXELS) {
    throw rangeError("Image dimensions exceed the supported limits.", "IMAGE_DIMENSIONS_EXCEEDED");
  }
  if (!(data instanceof Uint8ClampedArray) || data.length !== width * height * 4) {
    throw typeError("ImageData.data must be a correctly sized Uint8ClampedArray.", "INVALID_IMAGE_DATA");
  }
  if (colorSpace !== "srgb") {
    throw typeError('ImageData.colorSpace must be "srgb".', "INVALID_IMAGE_DATA");
  }
  return imageData;
}

function normalizeOptions(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw typeError("Adjustments must be an object.");
  }
  for (const key of Object.keys(input)) {
    if (!KEYS.has(key)) throw typeError("Unknown adjustment option: " + key + ".");
  }
  const options = { ...DEFAULTS, ...input };
  const ranges = {
    brightness: [-100, 100],
    contrast: [-100, 100],
    saturation: [0, 200],
    blur: [0, 20]
  };
  for (const [key, bounds] of Object.entries(ranges)) {
    const value = options[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw typeError(key + " must be a finite number.");
    }
    if (value < bounds[0] || value > bounds[1]) {
      throw rangeError(key + " must be between " + bounds[0] + " and " + bounds[1] + ".");
    }
  }
  if (!Number.isInteger(options.blur)) {
    throw rangeError("blur must be an integer number of pixels.");
  }
  for (const key of ["grayscale", "sepia"]) {
    if (typeof options[key] !== "boolean") throw typeError(key + " must be a boolean.");
  }
  return options;
}

function clamp(value) {
  return Math.min(255, Math.max(0, value));
}

function applyColorAdjustments(source, output, options) {
  const brightness = options.brightness * 2.55;
  const contrast = (1 + options.contrast / 100) ** 2;
  const saturation = options.saturation / 100;

  for (let i = 0; i < source.length; i += 4) {
    let r = (source[i] + brightness - 127.5) * contrast + 127.5;
    let g = (source[i + 1] + brightness - 127.5) * contrast + 127.5;
    let b = (source[i + 2] + brightness - 127.5) * contrast + 127.5;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    r = luma + (r - luma) * saturation;
    g = luma + (g - luma) * saturation;
    b = luma + (b - luma) * saturation;

    if (options.grayscale) r = g = b = luma;
    if (options.sepia) {
      const oldR = r, oldG = g, oldB = b;
      r = 0.393 * oldR + 0.769 * oldG + 0.189 * oldB;
      g = 0.349 * oldR + 0.686 * oldG + 0.168 * oldB;
      b = 0.272 * oldR + 0.534 * oldG + 0.131 * oldB;
    }

    output[i] = clamp(r);
    output[i + 1] = clamp(g);
    output[i + 2] = clamp(b);
    output[i + 3] = source[i + 3];
  }
}

function gaussianKernel(radius) {
  if (radius === 0) return new Float32Array([1]);
  const sigma = Math.max(radius / 2, 0.5);
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let x = -radius; x <= radius; x += 1) {
    const weight = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel[x + radius] = weight;
    sum += weight;
  }
  for (let i = 0; i < kernel.length; i += 1) kernel[i] /= sum;
  return kernel;
}

function horizontalRow(source, width, height, y, kernel, radius) {
  const row = new Float32Array(width * 4);
  y = Math.min(height - 1, Math.max(0, y));
  for (let x = 0; x < width; x += 1) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let dx = -radius; dx <= radius; dx += 1) {
      const sx = Math.min(width - 1, Math.max(0, x + dx));
      const i = (y * width + sx) * 4;
      const alpha = source[i + 3] / 255;
      const weight = kernel[dx + radius];
      r += source[i] * alpha * weight;
      g += source[i + 1] * alpha * weight;
      b += source[i + 2] * alpha * weight;
      a += alpha * weight;
    }
    const target = x * 4;
    row[target] = r;
    row[target + 1] = g;
    row[target + 2] = b;
    row[target + 3] = a;
  }
  return row;
}

function applyBlurInPlace(pixels, width, height, radius) {
  const kernel = gaussianKernel(radius);
  const size = radius * 2 + 1;
  const rows = new Array(size);

  for (let slot = 0; slot < size; slot += 1) {
    const y = Math.min(height - 1, Math.max(0, slot - radius));
    rows[y % size] = horizontalRow(pixels, width, height, y, kernel, radius);
  }

  for (let y = 0; y < height; y += 1) {
    if (y > 0) {
      const enteringY = Math.min(height - 1, y + radius);
      rows[enteringY % size] = horizontalRow(pixels, width, height, enteringY, kernel, radius);
    }
    for (let x = 0; x < width; x += 1) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const sy = Math.min(height - 1, Math.max(0, y + dy));
        const row = rows[sy % size];
        const i = x * 4;
        const weight = kernel[dy + radius];
        r += row[i] * weight;
        g += row[i + 1] * weight;
        b += row[i + 2] * weight;
        a += row[i + 3] * weight;
      }
      const i = (y * width + x) * 4;
      if (a > 0) {
        pixels[i] = r / a;
        pixels[i + 1] = g / a;
        pixels[i + 2] = b / a;
      } else {
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
      }
      // Alpha is deliberately copied unchanged from the original pixel.
    }
  }
}

/**
 * Apply brightness, contrast, saturation, grayscale, sepia, and Gaussian blur.
 * The input is immutable. Output dimensions and alpha are preserved.
 */
export function applyImageAdjustments(imageData, adjustments = {}) {
  validateImageData(imageData);
  const options = normalizeOptions(adjustments);
  let output;
  try {
    output = new Uint8ClampedArray(imageData.data.length);
    applyColorAdjustments(imageData.data, output, options);
    if (options.blur > 0) applyBlurInPlace(output, imageData.width, imageData.height, options.blur);
  } catch (cause) {
    const error = new Error("Image adjustment processing failed.", { cause });
    error.name = "ImageProcessingError";
    error.code = "IMAGE_PROCESSING_FAILED";
    throw error;
  }

  const result = {
    data: output,
    width: imageData.width,
    height: imageData.height,
    colorSpace: "srgb"
  };
  return { imageData: result, width: result.width, height: result.height };
}

export const IMAGE_ADJUSTER_LIMITS = Object.freeze({
  maxDimension: MAX_IMAGE_DIMENSION,
  maxPixels: MAX_IMAGE_PIXELS,
  brightness: Object.freeze({ min: -100, max: 100, default: 0 }),
  contrast: Object.freeze({ min: -100, max: 100, default: 0 }),
  saturation: Object.freeze({ min: 0, max: 200, default: 100 }),
  blur: Object.freeze({ min: 0, max: 20, default: 0 })
});
