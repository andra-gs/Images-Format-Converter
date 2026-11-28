/**
 * Phase 8 UI contract mock.
 * This module intentionally does not generate a PDF. Replace it with the
 * production document engine only after the engine PR is merged into main.
 */

const PAGE_PRESETS = {
  A4: { width: 595.28, height: 841.89 },
  A5: { width: 419.53, height: 595.28 },
  LETTER: { width: 612, height: 792 }
};

const MAX_PAGE_PT = 14400;
const MM_TO_PT = 72 / 25.4;

export class ImageToPdfError extends Error {
  constructor(code, message, imageId = null, imageIndex = null, cause = undefined) {
    super(message);
    this.name = "ImageToPdfError";
    this.code = code;
    this.imageId = imageId;
    this.imageIndex = imageIndex;
    if (cause !== undefined) this.cause = cause;
  }
}

const normalizeMargins = (marginMm = 10) => {
  const sides = typeof marginMm === "number"
    ? { top: marginMm, right: marginMm, bottom: marginMm, left: marginMm }
    : {
        top: marginMm?.top ?? 10,
        right: marginMm?.right ?? 10,
        bottom: marginMm?.bottom ?? 10,
        left: marginMm?.left ?? 10
      };

  for (const value of Object.values(sides)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new ImageToPdfError("INVALID_OPTIONS", "Margin values must be finite, non-negative numbers.");
    }
  }
  return sides;
};

const validateOptions = (options = {}) => {
  const normalized = {
    pageSize: options.pageSize ?? "A4",
    orientation: options.orientation ?? "portrait",
    marginMm: options.marginMm ?? 10,
    fit: options.fit ?? "contain",
    background: options.background ?? "white"
  };

  if (!["A4", "A5", "LETTER", "IMAGE"].includes(normalized.pageSize) ||
      !["portrait", "landscape", "auto"].includes(normalized.orientation) ||
      !["contain", "cover"].includes(normalized.fit) ||
      normalized.background !== "white") {
    throw new ImageToPdfError("INVALID_OPTIONS", "The selected page settings are not supported by the current mock.");
  }

  normalized.margins = normalizeMargins(normalized.marginMm);
  return normalized;
};

/**
 * Mock stand-in for the engine's single layout source of truth.
 * Geometry follows the approved API contract; it is not a PDF writer.
 */
export function calculateImagePdfPageLayout({ imageWidth, imageHeight, options = {} }) {
  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) ||
      imageWidth <= 0 || imageHeight <= 0) {
    throw new ImageToPdfError("INVALID_INPUT", "Image dimensions must be positive numbers.");
  }

  const settings = validateOptions(options);
  let pageWidthPt;
  let pageHeightPt;

  if (settings.pageSize === "IMAGE") {
    pageWidthPt = imageWidth * 72 / 96;
    pageHeightPt = imageHeight * 72 / 96;
  } else {
    const preset = PAGE_PRESETS[settings.pageSize];
    const landscape = settings.orientation === "auto"
      ? imageWidth > imageHeight
      : settings.orientation === "landscape";
    pageWidthPt = landscape ? preset.height : preset.width;
    pageHeightPt = landscape ? preset.width : preset.height;
  }

  if (pageWidthPt > MAX_PAGE_PT || pageHeightPt > MAX_PAGE_PT) {
    throw new ImageToPdfError("LIMIT_EXCEEDED", "The resulting page exceeds the maximum supported dimensions.");
  }

  const { top, right, bottom, left } = settings.margins;
  const contentRect = {
    x: left * MM_TO_PT,
    y: top * MM_TO_PT,
    width: pageWidthPt - (left + right) * MM_TO_PT,
    height: pageHeightPt - (top + bottom) * MM_TO_PT
  };

  if (contentRect.width <= 0 || contentRect.height <= 0) {
    throw new ImageToPdfError("INVALID_OPTIONS", "Margins leave no usable page area.");
  }

  const sourceRatio = imageWidth / imageHeight;
  const contentRatio = contentRect.width / contentRect.height;
  let imageRect;
  let crop = null;

  if (settings.fit === "contain") {
    const scale = Math.min(contentRect.width / imageWidth, contentRect.height / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    imageRect = {
      x: contentRect.x + (contentRect.width - width) / 2,
      y: contentRect.y + (contentRect.height - height) / 2,
      width,
      height
    };
  } else {
    imageRect = { ...contentRect };
    if (sourceRatio > contentRatio) {
      const width = imageHeight * contentRatio;
      crop = { x: (imageWidth - width) / 2, y: 0, width, height: imageHeight };
    } else {
      const height = imageWidth / contentRatio;
      crop = { x: 0, y: (imageHeight - height) / 2, width: imageWidth, height };
    }
  }

  return { pageWidthPt, pageHeightPt, contentRect, imageRect, crop };
}

/**
 * Simulates the agreed engine lifecycle for UI development.
 * It never returns a PDF Blob and must not be used as a production exporter.
 */
export async function createImagePdf({ images, options = {}, signal, onProgress } = {}) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new ImageToPdfError("INVALID_INPUT", "Add at least one image before continuing.");
  }

  const report = (progress) => {
    try { onProgress?.(progress); } catch { /* UI callbacks cannot interrupt the mock. */ }
  };
  const checkpoint = () => {
    if (signal?.aborted) throw new ImageToPdfError("ABORTED", "Export was cancelled.");
  };
  const pause = () => new Promise((resolve) => setTimeout(resolve, 180));

  validateOptions(options);
  checkpoint();

  for (const [index, item] of images.entries()) {
    checkpoint();
    if (!item?.id || !(item.file instanceof File)) {
      throw new ImageToPdfError("INVALID_INPUT", "An image queue item is invalid.", item?.id ?? null, index);
    }
    report({
      phase: "validating",
      completed: index + 1,
      total: images.length,
      currentIndex: index,
      currentId: item.id,
      currentName: item.file.name
    });
    await pause();
  }

  for (const [index, item] of images.entries()) {
    checkpoint();
    report({
      phase: "decoding",
      completed: index + 1,
      total: images.length,
      currentIndex: index,
      currentId: item.id,
      currentName: item.file.name
    });
    await pause();
  }

  for (const [index, item] of images.entries()) {
    checkpoint();
    report({
      phase: "composing",
      completed: index + 1,
      total: images.length,
      currentIndex: index,
      currentId: item.id,
      currentName: item.file.name
    });
    await pause();
  }

  checkpoint();
  report({
    phase: "finalizing",
    completed: 0,
    total: images.length,
    currentIndex: null,
    currentId: null,
    currentName: null
  });
  await pause();
  checkpoint();

  return {
    mock: true,
    pageCount: images.length,
    filename: "converted.pdf",
    warnings: ["Mock only: no PDF document was generated."]
  };
}
