const OUTPUT_FORMATS = new Set(["png", "jpeg", "webp", "bmp", "tiff", "svg", "gif"]);
const OPTIMIZABLE_FORMATS = new Set(["jpeg", "webp"]);

function getSourceFile(source) {
  if (source instanceof Blob) return source;
  if (
    source &&
    typeof source === "object" &&
    source.file instanceof Blob &&
    source.imageData &&
    Number.isInteger(source.imageData.width) &&
    Number.isInteger(source.imageData.height) &&
    source.imageData.width > 0 &&
    source.imageData.height > 0 &&
    source.imageData.data instanceof Uint8ClampedArray
  ) {
    return source.file;
  }
  throw new TypeError("Optimizer source must be a File/Blob or an edited { file, imageData } source.");
}

function assertFiniteNonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`Optimizer result has invalid ${name}.`);
  }
}

/**
 * UI-owned boundary around the agreed optimizeImage API.
 * It validates source/result ownership and measurements without duplicating
 * encoder, preset, or target-size policy.
 */
export async function runExportWithOptimizer(optimizer, source, options) {
  if (typeof optimizer !== "function") {
    throw new TypeError("An optimizeImage-compatible function is required.");
  }
  const sourceFile = getSourceFile(source);
  if (!options || typeof options !== "object" || !OUTPUT_FORMATS.has(options.format)) {
    throw new TypeError("A supported output format is required.");
  }
  if (!options.optimization || !["none", "preset", "target-size"].includes(options.optimization.mode)) {
    throw new TypeError("An explicit optimization mode is required.");
  }
  if (options.optimization.mode !== "none" && !OPTIMIZABLE_FORMATS.has(options.format)) {
    throw new TypeError("Optimization modes are supported only for JPEG and WebP.");
  }

  const result = await optimizer(source, options);
  if (!(result?.blob instanceof Blob)) {
    throw new TypeError("Optimizer result is missing its output Blob.");
  }
  if (result.format !== options.format) {
    throw new TypeError("Optimizer result format does not match the requested format.");
  }
  if (result.mimeType !== result.blob.type) {
    throw new TypeError("Optimizer result MIME type does not match its output Blob.");
  }
  if (!Number.isInteger(result.width) || result.width <= 0 ||
      !Number.isInteger(result.height) || result.height <= 0) {
    throw new TypeError("Optimizer result is missing valid output dimensions.");
  }
  if (result.validation?.status !== "passed") {
    throw new TypeError("Optimizer output has not passed validation.");
  }

  const size = result.size;
  if (!size) throw new TypeError("Optimizer result is missing actual size measurements.");
  for (const key of ["sourceBytes", "outputBytes", "differenceBytes"]) {
    assertFiniteNonNegative(key === "differenceBytes" ? Math.abs(size[key]) : size[key], key);
  }
  if (!Number.isFinite(size.reductionPercent)) {
    throw new TypeError("Optimizer result has invalid reductionPercent.");
  }
  if (size.sourceBytes !== sourceFile.size || size.outputBytes !== result.blob.size) {
    throw new TypeError("Optimizer size measurements do not match the source and output Blobs.");
  }
  if (size.differenceBytes !== size.sourceBytes - size.outputBytes) {
    throw new TypeError("Optimizer differenceBytes is inconsistent with measured sizes.");
  }

  return result;
}
