const POINTS_PER_INCH = 72;

export const PDF_RASTER_DEFAULT_LIMITS = Object.freeze({
  minDpi: 72,
  maxDpi: 600,
  maxDimension: 8_192,
  maxPixels: 16_000_000
});

function validatePositiveFinite(value, label) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
}

function normalizeLimits(limits = {}) {
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) {
    throw new TypeError("PDF raster limits must be an object.");
  }

  const normalized = {
    ...PDF_RASTER_DEFAULT_LIMITS,
    ...limits
  };

  for (const key of ["minDpi", "maxDpi", "maxDimension", "maxPixels"]) {
    validatePositiveFinite(normalized[key], key);
  }

  if (normalized.minDpi > normalized.maxDpi) {
    throw new RangeError("Minimum DPI cannot exceed maximum DPI.");
  }

  return normalized;
}

function ceilPixelDimension(points, dpi) {
  // Multiply before dividing to avoid an unnecessary rounded intermediate.
  const exactDimension = (points * dpi) / POINTS_PER_INCH;
  const nearestInteger = Math.round(exactDimension);
  const floatingPointTolerance =
    Number.EPSILON * Math.max(1, Math.abs(exactDimension)) * 4;

  // Ignore machine-precision noise only at integer boundaries.
  // Genuine fractional dimensions still round upward to avoid clipping.
  if (Math.abs(exactDimension - nearestInteger) <= floatingPointTolerance) {
    return nearestInteger;
  }

  return Math.ceil(exactDimension);
}

/**
 * Calculate a safe integer raster size from a PDF.js page viewport measured
 * in PDF points at scale 1. Pass the viewport's rotated width and height so
 * intrinsic page rotation is already reflected in the dimensions.
 *
 * This helper does not allocate a Canvas or render a page.
 */
export function calculatePdfRasterDimensions({
  widthPt,
  heightPt,
  dpi = 150,
  limits
} = {}) {
  validatePositiveFinite(widthPt, "PDF page width");
  validatePositiveFinite(heightPt, "PDF page height");

  const normalizedLimits = normalizeLimits(limits);
  validatePositiveFinite(dpi, "DPI");

  if (dpi < normalizedLimits.minDpi || dpi > normalizedLimits.maxDpi) {
    throw new RangeError(
      `DPI must be between ${normalizedLimits.minDpi} and ${normalizedLimits.maxDpi}.`
    );
  }

  const scale = dpi / POINTS_PER_INCH;
  const width = ceilPixelDimension(widthPt, dpi);
  const height = ceilPixelDimension(heightPt, dpi);

  if (width > normalizedLimits.maxDimension || height > normalizedLimits.maxDimension) {
    throw new RangeError("The requested PDF raster exceeds the maximum output dimension.");
  }

  const pixels = width * height;
  if (!Number.isSafeInteger(pixels) || pixels > normalizedLimits.maxPixels) {
    throw new RangeError("The requested PDF raster exceeds the maximum pixel count.");
  }

  return Object.freeze({
    width,
    height,
    pixels,
    dpi,
    scale
  });
}
