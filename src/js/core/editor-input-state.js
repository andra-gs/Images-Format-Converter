/**
 * Keep numeric editor inputs aligned with the Image Transformer API.
 * Empty resize dimensions are null so the Transformer can resolve the
 * missing side when aspect ratio is locked.
 */
export function updateResizeDraft(resize, dimension, rawValue, sourceDimensions) {
  if (dimension !== "width" && dimension !== "height") {
    throw new TypeError("Resize dimension must be width or height.");
  }

  const raw = String(rawValue ?? "").trim();
  const value = raw === "" ? null : Number(raw);
  resize[dimension] = value !== null && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;

  if (
    resize[dimension] !== null &&
    resize.keepAspectRatio &&
    Number.isInteger(sourceDimensions?.width) &&
    Number.isInteger(sourceDimensions?.height) &&
    sourceDimensions.width > 0 &&
    sourceDimensions.height > 0
  ) {
    const ratio = sourceDimensions.width / sourceDimensions.height;
    if (dimension === "width") {
      resize.height = Math.max(1, Math.round(resize.width / ratio));
    } else {
      resize.width = Math.max(1, Math.round(resize.height * ratio));
    }
  }

  return resize;
}

/**
 * Crop width/height use null to mean "through the remaining source edge".
 * Empty X/Y coordinates are normalized to the origin.
 */
export function updateCropDraft(crop, dimension, rawValue) {
  if (!["x", "y", "width", "height"].includes(dimension)) {
    throw new TypeError("Unknown crop dimension.");
  }

  const raw = String(rawValue ?? "").trim();
  if (raw === "") {
    crop[dimension] = dimension === "width" || dimension === "height" ? null : 0;
    return crop;
  }

  const value = Number(raw);
  if (Number.isFinite(value) && value >= 0) {
    crop[dimension] = Math.round(value);
  }

  return crop;
}
