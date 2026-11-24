const OUTPUT_FORMATS = new Set(["png", "jpeg", "webp", "bmp", "tiff", "svg", "gif"]);
const OPTIMIZABLE_FORMATS = new Set(["jpeg", "webp"]);
const PRESETS = new Set(["low", "medium", "high"]);
const OPTIMIZATION_MODES = new Set(["none", "preset", "target-size"]);
const MAX_TARGET_ATTEMPTS = 7;

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
  ) return source.file;
  throw new TypeError("Optimizer source must be a File/Blob or an edited { file, imageData } source.");
}

function assertFiniteNonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`Optimizer result has invalid ${name}.`);
  }
}

function validateOptimizationMetadata(metadata, requested, format) {
  if (!metadata || !OPTIMIZATION_MODES.has(metadata.mode)) {
    throw new TypeError("Optimizer result has invalid optimization metadata mode.");
  }

  if (!OPTIMIZABLE_FORMATS.has(format) && metadata.mode !== "none") {
    throw new TypeError("Optimizer metadata requests optimization for an unsupported output format.");
  }

  if (metadata.mode !== requested.mode) {
    throw new TypeError("Optimizer result has invalid optimization metadata mode.");
  }

  if (metadata.mode === "none") {
    if (metadata.preset !== null || metadata.quality !== null ||
        metadata.targetBytes !== null || metadata.targetReached !== null ||
        metadata.attempts !== 1) {
      throw new TypeError("No-optimization metadata must use null settings and exactly one attempt.");
    }
    return;
  }

  if (metadata.mode === "preset") {
    if (!PRESETS.has(requested.preset) || metadata.preset !== requested.preset ||
        metadata.targetBytes !== null || metadata.targetReached !== null ||
        !Number.isFinite(metadata.quality) || metadata.quality < 0 || metadata.quality > 1 ||
        metadata.attempts !== 1) {
      throw new TypeError("Optimizer result has invalid preset metadata.");
    }
    return;
  }

  if (metadata.mode === "target-size") {
    if (!Number.isFinite(requested.targetBytes) || requested.targetBytes <= 0 ||
        metadata.preset !== null || metadata.targetBytes !== requested.targetBytes ||
        typeof metadata.targetReached !== "boolean" ||
        !Number.isFinite(metadata.quality) || metadata.quality < 0.10 || metadata.quality > 0.95 ||
        !Number.isInteger(metadata.attempts) || metadata.attempts < 1 ||
        metadata.attempts > MAX_TARGET_ATTEMPTS) {
      throw new TypeError("Optimizer result has invalid target-size metadata.");
    }
    return;
  }
}

/**
 * UI-owned boundary around the agreed optimizeImage API.
 * Validates handoff and result metadata without duplicating optimizer policy.
 */
export async function runExportWithOptimizer(optimizer, source, options) {
  if (typeof optimizer !== "function") {
    throw new TypeError("An optimizeImage-compatible function is required.");
  }
  const sourceFile = getSourceFile(source);
  if (!options || typeof options !== "object" || !OUTPUT_FORMATS.has(options.format)) {
    throw new TypeError("A supported output format is required.");
  }
  if (!options.optimization || !OPTIMIZATION_MODES.has(options.optimization.mode)) {
    throw new TypeError("An explicit supported optimization mode is required.");
  }
  if (options.optimization.mode !== "none" && !OPTIMIZABLE_FORMATS.has(options.format)) {
    throw new TypeError("Optimization modes are supported only for JPEG and WebP.");
  }

  const result = await optimizer(source, options);
  if (!(result?.blob instanceof Blob)) throw new TypeError("Optimizer result is missing its output Blob.");
  if (result.format !== options.format) throw new TypeError("Optimizer result format does not match the requested format.");
  if (result.mimeType !== result.blob.type) throw new TypeError("Optimizer result MIME type does not match its output Blob.");
  if (!Number.isInteger(result.width) || result.width <= 0 ||
      !Number.isInteger(result.height) || result.height <= 0) {
    throw new TypeError("Optimizer result is missing valid output dimensions.");
  }
  if (result.validation?.status !== "passed") {
    throw new TypeError("Optimizer output has not passed validation.");
  }

  const size = result.size;
  if (!size) throw new TypeError("Optimizer result is missing actual size measurements.");
  assertFiniteNonNegative(size.sourceBytes, "sourceBytes");
  assertFiniteNonNegative(size.outputBytes, "outputBytes");
  if (!Number.isFinite(size.differenceBytes)) {
    throw new TypeError("Optimizer result has invalid differenceBytes.");
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
  const expectedReduction = size.sourceBytes === 0
    ? 0
    : (size.differenceBytes / size.sourceBytes) * 100;
  if (Math.abs(size.reductionPercent - expectedReduction) > 1e-9) {
    throw new TypeError("Optimizer reductionPercent is inconsistent with measured sizes.");
  }

  validateOptimizationMetadata(result.optimization, options.optimization, result.format);
  return result;
}

/**
 * Runs independent per-file exports. A rejected export is returned as that
 * file's error and never rejects or prevents other files from completing.
 */
export async function runIndependentExports(items, optimizer) {
  return Promise.all(items.map(async ({ id, source, options }) => {
    try {
      return { id, result: await runExportWithOptimizer(optimizer, source, options), error: null };
    } catch (error) {
      return { id, result: null, error };
    }
  }));
}
