import {
  convertImageToBmp,
  convertImageToGif,
  convertImageToJpeg,
  convertImageToPng,
  convertImageToSvg,
  convertImageToTiff,
  convertImageToWebp,
  convertImageDataToFormat
} from "./conversion-service.js";
import { canEncodeFormat } from "./capability-registry.js";
import { validateImageData } from "./image-processing-adapter.js";

const MIME_TYPES = Object.freeze({
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  bmp: "image/bmp",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  gif: "image/gif"
});

const PRESET_QUALITIES = Object.freeze({
  low: 0.55,
  medium: 0.75,
  high: 0.9
});

const TARGET_SIZE_CONFIG = Object.freeze({
  minQuality: 0.1,
  maxQuality: 0.95,
  maxAttempts: 7
});

// Binary subdivision samples the full quality interval. Every output is measured
// because browser encoders are not guaranteed to produce a monotonic size curve.
const TARGET_QUALITY_CANDIDATES = Object.freeze([
  0.1,
  0.95,
  0.525,
  0.3125,
  0.7375,
  0.20625,
  0.41875
]);

function createOptimizerError(code, message, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.name = "ImageOptimizationError";
  error.code = code;
  return error;
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function rejectUnknownKeys(value, allowedKeys, label) {
  const unknown = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unknown.length > 0) {
    throw createOptimizerError(
      "INVALID_OPTIMIZATION_OPTIONS",
      `Unknown ${label} option: ${unknown.join(", ")}.`
    );
  }
}

function normalizeSource(source) {
  if (typeof Blob !== "function") {
    throw new TypeError("Blob is not available in this environment.");
  }

  if (source instanceof Blob) {
    if (source.size <= 0) throw new TypeError("A non-empty File or Blob is required.");
    return { file: source, imageData: null, sourceBytes: source.size };
  }

  if (!isPlainObject(source)) {
    throw new TypeError("Source must be a File, Blob, or { file, imageData } object.");
  }

  rejectUnknownKeys(source, ["file", "imageData"], "source");

  if (!(source.file instanceof Blob) || source.file.size <= 0) {
    throw new TypeError("Edited image source requires a non-empty original File or Blob.");
  }

  validateImageData(source.imageData);

  return {
    file: source.file,
    imageData: source.imageData,
    sourceBytes: source.file.size
  };
}

function normalizeOptions(options) {
  if (!isPlainObject(options)) {
    throw createOptimizerError(
      "INVALID_OPTIMIZATION_OPTIONS",
      "Optimization options must be a plain object."
    );
  }

  rejectUnknownKeys(options, ["format", "optimization", "backgroundColor"], "top-level");

  if (typeof options.format !== "string" || options.format.trim() === "") {
    throw createOptimizerError("INVALID_OPTIMIZATION_OPTIONS", "A valid output format is required.");
  }

  const format = options.format.trim().toLowerCase();
  if (!Object.hasOwn(MIME_TYPES, format) || !canEncodeFormat(format)) {
    throw createOptimizerError(
      "UNSUPPORTED_OUTPUT_FORMAT",
      `The ${format.toUpperCase()} output format is not supported.`
    );
  }

  if (!isPlainObject(options.optimization)) {
    throw createOptimizerError(
      "INVALID_OPTIMIZATION_OPTIONS",
      "An optimization object with an explicit mode is required."
    );
  }

  const optimization = options.optimization;
  if (typeof optimization.mode !== "string") {
    throw createOptimizerError("INVALID_OPTIMIZATION_OPTIONS", "An optimization mode is required.");
  }

  let normalizedOptimization;

  if (optimization.mode === "none") {
    rejectUnknownKeys(optimization, ["mode"], "optimization");
    normalizedOptimization = { mode: "none", preset: null, targetBytes: null };
  } else if (optimization.mode === "preset") {
    rejectUnknownKeys(optimization, ["mode", "preset"], "optimization");
    if (!Object.hasOwn(PRESET_QUALITIES, optimization.preset)) {
      throw createOptimizerError(
        "INVALID_OPTIMIZATION_OPTIONS",
        "Preset must be low, medium, or high."
      );
    }
    normalizedOptimization = {
      mode: "preset",
      preset: optimization.preset,
      targetBytes: null
    };
  } else if (optimization.mode === "target-size") {
    rejectUnknownKeys(optimization, ["mode", "targetBytes"], "optimization");
    if (!Number.isFinite(optimization.targetBytes) || optimization.targetBytes <= 0) {
      throw createOptimizerError(
        "TARGET_SIZE_INVALID",
        "Target file size must be a finite positive number of bytes."
      );
    }
    normalizedOptimization = {
      mode: "target-size",
      preset: null,
      targetBytes: optimization.targetBytes
    };
  } else {
    throw createOptimizerError(
      "INVALID_OPTIMIZATION_OPTIONS",
      "Optimization mode must be none, preset, or target-size."
    );
  }

  if (normalizedOptimization.mode !== "none" && !["jpeg", "webp"].includes(format)) {
    throw createOptimizerError(
      "UNSUPPORTED_OPTIMIZATION",
      `Quality presets and target-size optimization are not supported for ${format.toUpperCase()}.`
    );
  }

  if (options.backgroundColor !== undefined) {
    if (format !== "jpeg") {
      throw createOptimizerError(
        "INVALID_OPTIMIZATION_OPTIONS",
        "backgroundColor is only supported for JPEG output."
      );
    }
    if (typeof options.backgroundColor !== "string" || options.backgroundColor.trim() === "") {
      throw createOptimizerError(
        "INVALID_OPTIMIZATION_OPTIONS",
        "JPEG backgroundColor must be a non-empty CSS color string."
      );
    }
  }

  return {
    format,
    optimization: normalizedOptimization,
    backgroundColor: options.backgroundColor || "#ffffff"
  };
}

function calculateSizeMetrics(sourceBytes, outputBytes) {
  const differenceBytes = sourceBytes - outputBytes;
  return {
    sourceBytes,
    outputBytes,
    differenceBytes,
    reductionPercent: (differenceBytes / sourceBytes) * 100
  };
}

function convertSource(file, imageData, format, encoderOptions) {
  if (imageData) {
    if (format === "gif") {
      throw createOptimizerError(
        "UNSUPPORTED_OUTPUT_FORMAT",
        "Edited ImageData cannot be exported as GIF. The GIF path is reserved for the original File to preserve animation."
      );
    }
    return convertImageDataToFormat(imageData, format, encoderOptions);
  }

  switch (format) {
    case "png": return convertImageToPng(file);
    case "jpeg": return convertImageToJpeg(file, encoderOptions);
    case "webp": return convertImageToWebp(file, encoderOptions);
    case "bmp": return convertImageToBmp(file);
    case "tiff": return convertImageToTiff(file);
    case "svg": return convertImageToSvg(file);
    case "gif": return convertImageToGif(file);
    default:
      throw createOptimizerError("UNSUPPORTED_OUTPUT_FORMAT", "The requested output format is not supported.");
  }
}

function getConversionErrorCode(error) {
  const message = String(error?.message || "");
  if (/signature validation|dimensions do not match|output validation|generated (?:gif|output).*?(?:failed|did not pass)|dimension or frame-count verification|did not preserve.*loop/i.test(message)) {
    return "OUTPUT_VALIDATION_FAILED";
  }
  return "ENCODING_FAILED";
}

async function encodeCandidate(file, imageData, format, quality, backgroundColor) {
  const encoderOptions = format === "jpeg"
    ? { quality, backgroundColor }
    : { quality };

  try {
    const result = await convertSource(file, imageData, format, encoderOptions);
    if (!(result?.blob instanceof Blob) || result.blob.size <= 0) {
      throw new Error("The conversion service returned an empty output Blob.");
    }
    if (result.format !== format || result.blob.type.toLowerCase() !== MIME_TYPES[format]) {
      throw createOptimizerError(
        "OUTPUT_VALIDATION_FAILED",
        "The conversion service returned an unexpected output format or MIME type."
      );
    }
    if (!Number.isInteger(result.width) || !Number.isInteger(result.height) ||
        result.width <= 0 || result.height <= 0) {
      throw createOptimizerError(
        "OUTPUT_VALIDATION_FAILED",
        "The conversion service returned invalid output dimensions."
      );
    }
    return result;
  } catch (error) {
    if (error?.name === "ImageOptimizationError" && error?.code) throw error;
    throw createOptimizerError(
      getConversionErrorCode(error),
      "Image encoding or output validation failed.",
      error
    );
  }
}

function createResult(result, sourceBytes, format, optimization, attempts) {
  return {
    blob: result.blob,
    format,
    mimeType: MIME_TYPES[format],
    width: result.width,
    height: result.height,
    size: calculateSizeMetrics(sourceBytes, result.blob.size),
    optimization: {
      mode: optimization.mode,
      preset: optimization.preset,
      quality: optimization.quality,
      targetBytes: optimization.targetBytes,
      targetReached: optimization.targetReached,
      attempts
    },
    validation: { status: "passed" }
  };
}

async function optimizeToTarget(file, imageData, format, targetBytes, sourceBytes, backgroundColor) {
  const candidates = [];
  let attempts = 0;
  let lastError = null;

  for (const quality of TARGET_QUALITY_CANDIDATES.slice(0, TARGET_SIZE_CONFIG.maxAttempts)) {
    attempts += 1;
    try {
      const result = await encodeCandidate(file, imageData, format, quality, backgroundColor);
      candidates.push({ result, quality, size: result.blob.size });
    } catch (error) {
      lastError = error;
    }
  }

  if (candidates.length === 0) {
    throw createOptimizerError(
      lastError?.code || "ENCODING_FAILED",
      "All target-size encoding attempts failed.",
      lastError
    );
  }

  const withinTarget = candidates
    .filter((candidate) => candidate.size <= targetBytes)
    .sort((a, b) => b.size - a.size || b.quality - a.quality);

  const selected = withinTarget.length > 0
    ? withinTarget[0]
    : candidates.sort((a, b) => a.size - b.size || a.quality - b.quality)[0];

  return createResult(
    selected.result,
    sourceBytes,
    format,
    {
      mode: "target-size",
      preset: null,
      quality: selected.quality,
      targetBytes,
      targetReached: withinTarget.length > 0
    },
    attempts
  );
}

/**
 * Convert and optionally optimize an image using the existing conversion
 * service. The original source is never mutated. The returned Blob belongs
 * to the caller.
 *
 * @param {Blob|File|{file: Blob|File, imageData: ImageData}} source
 * @param {{format: string, optimization: object, backgroundColor?: string}} options
 */
export async function optimizeImage(source, options) {
  const normalizedSource = normalizeSource(source);
  const normalizedOptions = normalizeOptions(options);
  const { file, imageData, sourceBytes } = normalizedSource;
  const { format, optimization, backgroundColor } = normalizedOptions;

  if (optimization.mode === "target-size") {
    return optimizeToTarget(
      file,
      imageData,
      format,
      optimization.targetBytes,
      sourceBytes,
      backgroundColor
    );
  }

  const quality = optimization.mode === "preset"
    ? PRESET_QUALITIES[optimization.preset]
    : null;

  const encoderOptions = quality === null
    ? (format === "jpeg" ? { backgroundColor } : {})
    : (format === "jpeg" ? { quality, backgroundColor } : { quality });

  let result;
  try {
    result = await convertSource(file, imageData, format, encoderOptions);
  } catch (error) {
    if (error?.name === "ImageOptimizationError" && error?.code) throw error;
    throw createOptimizerError(
      getConversionErrorCode(error),
      "Image encoding or output validation failed.",
      error
    );
  }

  if (!(result?.blob instanceof Blob) || result.blob.size <= 0 ||
      result.format !== format || result.blob.type.toLowerCase() !== MIME_TYPES[format] ||
      !Number.isInteger(result.width) || !Number.isInteger(result.height) ||
      result.width <= 0 || result.height <= 0) {
    throw createOptimizerError(
      "OUTPUT_VALIDATION_FAILED",
      "The conversion service returned an invalid output result."
    );
  }

  return createResult(
    result,
    sourceBytes,
    format,
    {
      mode: optimization.mode,
      preset: optimization.preset,
      quality,
      targetBytes: null,
      targetReached: null
    },
    1
  );
}

export const IMAGE_OPTIMIZATION_CAPABILITIES = Object.freeze({
  formats: Object.freeze({
    jpeg: Object.freeze({ presets: true, targetSize: true }),
    webp: Object.freeze({ presets: true, targetSize: true }),
    png: Object.freeze({ presets: false, targetSize: false }),
    bmp: Object.freeze({ presets: false, targetSize: false }),
    tiff: Object.freeze({ presets: false, targetSize: false }),
    gif: Object.freeze({ presets: false, targetSize: false }),
    svg: Object.freeze({ presets: false, targetSize: false })
  }),
  presets: PRESET_QUALITIES,
  targetSize: TARGET_SIZE_CONFIG
});
