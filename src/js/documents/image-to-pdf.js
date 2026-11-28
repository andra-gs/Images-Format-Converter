import { jsPDF } from "jspdf";
import { validateImageFile } from "../core/file-validator.js";
import { decodeImage } from "../core/image-decoder.js";

const PAGE_PRESETS = Object.freeze({
  A4: Object.freeze({ width: 595.28, height: 841.89 }),
  A5: Object.freeze({ width: 419.53, height: 595.28 }),
  LETTER: Object.freeze({ width: 612, height: 792 })
});

const LIMITS = Object.freeze({
  maxFileBytes: 25 * 1024 * 1024,
  maxTotalFileBytes: 100 * 1024 * 1024,
  maxPageCount: 50,
  maxSourceDimension: 19_200,
  maxImagePixels: 20_000_000,
  maxTotalPixels: 100_000_000,
  maxPageDimensionPt: 14_400
});

const MM_TO_PT = 72 / 25.4;
const PX_TO_PT_AT_96_PPI = 72 / 96;
const ALLOWED_OPTIONS = new Set(["pageSize", "orientation", "marginMm", "fit", "background"]);

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

function normalizeMargins(marginMm) {
  let sides;

  if (typeof marginMm === "number") {
    sides = { top: marginMm, right: marginMm, bottom: marginMm, left: marginMm };
  } else if (marginMm && typeof marginMm === "object" && !Array.isArray(marginMm)) {
    const allowedSides = new Set(["top", "right", "bottom", "left"]);
    if (Object.keys(marginMm).some((key) => !allowedSides.has(key))) {
      throw new ImageToPdfError("INVALID_OPTIONS", "Unknown margin side was provided.");
    }
    sides = {
      top: marginMm.top ?? 10,
      right: marginMm.right ?? 10,
      bottom: marginMm.bottom ?? 10,
      left: marginMm.left ?? 10
    };
  } else {
    throw new ImageToPdfError("INVALID_OPTIONS", "Margins must be a number or a per-side margin object.");
  }

  for (const value of Object.values(sides)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new ImageToPdfError("INVALID_OPTIONS", "Margin values must be finite, non-negative numbers.");
    }
  }

  return sides;
}

function normalizeOptions(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new ImageToPdfError("INVALID_OPTIONS", "Page options must be an object.");
  }

  if (Object.keys(options).some((key) => !ALLOWED_OPTIONS.has(key))) {
    throw new ImageToPdfError("INVALID_OPTIONS", "Unknown page setting was provided.");
  }

  const normalized = {
    pageSize: options.pageSize ?? "A4",
    orientation: options.orientation ?? "portrait",
    marginMm: options.marginMm ?? 10,
    fit: options.fit ?? "contain",
    background: options.background ?? "white"
  };

  if (!["A4", "A5", "LETTER", "IMAGE"].includes(normalized.pageSize)) {
    throw new ImageToPdfError("INVALID_OPTIONS", "The selected page size is not supported.");
  }
  if (!["portrait", "landscape", "auto"].includes(normalized.orientation)) {
    throw new ImageToPdfError("INVALID_OPTIONS", "The selected page orientation is not supported.");
  }
  if (!["contain", "cover"].includes(normalized.fit)) {
    throw new ImageToPdfError("INVALID_OPTIONS", "The selected image placement mode is not supported.");
  }
  if (normalized.background === "transparent") {
    throw new ImageToPdfError(
      "UNSUPPORTED_TRANSPARENCY",
      "Transparent PDF output is disabled until real-file verification passes."
    );
  }
  if (normalized.background !== "white") {
    throw new ImageToPdfError("INVALID_OPTIONS", "The selected page background is not supported.");
  }

  normalized.margins = normalizeMargins(normalized.marginMm);
  return normalized;
}

function validateDimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new ImageToPdfError("INVALID_INPUT", "Image dimensions must be positive finite numbers.");
  }

  if (
    width > LIMITS.maxSourceDimension ||
    height > LIMITS.maxSourceDimension ||
    width * height > LIMITS.maxImagePixels
  ) {
    throw new ImageToPdfError("LIMIT_EXCEEDED", "The source image exceeds the supported dimensions or pixel limit.");
  }
}

/**
 * Pure page geometry calculation shared by the UI preview and PDF writer.
 * All returned coordinates use PDF points with a top-left origin.
 */
export function calculateImagePdfPageLayout({ imageWidth, imageHeight, options = {} } = {}) {
  validateDimensions(imageWidth, imageHeight);
  const settings = normalizeOptions(options);

  let pageWidthPt;
  let pageHeightPt;

  if (settings.pageSize === "IMAGE") {
    pageWidthPt = imageWidth * PX_TO_PT_AT_96_PPI;
    pageHeightPt = imageHeight * PX_TO_PT_AT_96_PPI;
  } else {
    const preset = PAGE_PRESETS[settings.pageSize];
    const landscape = settings.orientation === "auto"
      ? imageWidth > imageHeight
      : settings.orientation === "landscape";

    pageWidthPt = landscape ? preset.height : preset.width;
    pageHeightPt = landscape ? preset.width : preset.height;
  }

  if (
    pageWidthPt > LIMITS.maxPageDimensionPt ||
    pageHeightPt > LIMITS.maxPageDimensionPt
  ) {
    throw new ImageToPdfError("LIMIT_EXCEEDED", "The resulting page exceeds the maximum supported dimensions.");
  }

  const margins = settings.margins;
  const contentRect = {
    x: margins.left * MM_TO_PT,
    y: margins.top * MM_TO_PT,
    width: pageWidthPt - (margins.left + margins.right) * MM_TO_PT,
    height: pageHeightPt - (margins.top + margins.bottom) * MM_TO_PT
  };

  if (contentRect.width <= 0 || contentRect.height <= 0) {
    throw new ImageToPdfError("INVALID_OPTIONS", "Margins leave no usable page area.");
  }

  const sourceRatio = imageWidth / imageHeight;
  const contentRatio = contentRect.width / contentRect.height;
  let imageRect;
  let crop = null;

  if (settings.fit === "contain") {
    const scale = Math.min(
      contentRect.width / imageWidth,
      contentRect.height / imageHeight
    );
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
      crop = {
        x: (imageWidth - width) / 2,
        y: 0,
        width,
        height: imageHeight
      };
    } else {
      const height = imageWidth / contentRatio;
      crop = {
        x: 0,
        y: (imageHeight - height) / 2,
        width: imageWidth,
        height
      };
    }
  }

  return { pageWidthPt, pageHeightPt, contentRect, imageRect, crop };
}

function reportProgress(onProgress, snapshot) {
  try {
    onProgress?.(snapshot);
  } catch {
    // UI callback errors must not interrupt document generation.
  }
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new ImageToPdfError("ABORTED", "PDF generation was cancelled.");
  }
}

function validateQueue(images) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new ImageToPdfError("INVALID_INPUT", "Add at least one image before generating a PDF.");
  }
  if (images.length > LIMITS.maxPageCount) {
    throw new ImageToPdfError("LIMIT_EXCEEDED", "The export exceeds the maximum page count.");
  }

  const ids = new Set();
  let totalBytes = 0;

  for (const [index, item] of images.entries()) {
    if (
      !item ||
      typeof item.id !== "string" ||
      item.id.trim() === "" ||
      ids.has(item.id) ||
      !(item.file instanceof Blob)
    ) {
      throw new ImageToPdfError(
        "INVALID_INPUT",
        "An image queue item, File, or unique ID is invalid.",
        item?.id ?? null,
        index
      );
    }

    ids.add(item.id);

    if (item.file.size === 0) {
      throw new ImageToPdfError("INVALID_IMAGE", "The image file is empty.", item.id, index);
    }
    if (item.file.size > LIMITS.maxFileBytes) {
      throw new ImageToPdfError(
        "LIMIT_EXCEEDED",
        "The image file is empty or exceeds the per-file size limit.",
        item.id,
        index
      );
    }

    totalBytes += item.file.size;
  }

  if (totalBytes > LIMITS.maxTotalFileBytes) {
    throw new ImageToPdfError("LIMIT_EXCEEDED", "The selected files exceed the combined file-size limit.");
  }
}

async function createCanvas(width, height) {
  let canvas;

  if (typeof globalThis.OffscreenCanvas === "function") {
    canvas = new globalThis.OffscreenCanvas(width, height);
  } else if (typeof document !== "undefined" && document.createElement) {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  } else {
    throw new Error("Canvas is not available in this browser.");
  }

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    canvas.width = 0;
    canvas.height = 0;
    throw new Error("A 2D canvas context is not available.");
  }

  return { canvas, context };
}

async function canvasToPngBytes(canvas) {
  let blob;

  if (typeof canvas.convertToBlob === "function") {
    blob = await canvas.convertToBlob({ type: "image/png" });
  } else if (typeof canvas.toBlob === "function") {
    blob = await new Promise((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) resolve(value);
        else reject(new Error("The browser could not encode the page image."));
      }, "image/png");
    });
  } else {
    throw new Error("Canvas PNG encoding is not available in this browser.");
  }

  if (!(blob instanceof Blob) || blob.size === 0 || blob.type !== "image/png") {
    throw new Error("Canvas did not return a valid PNG image.");
  }

  return new Uint8Array(await blob.arrayBuffer());
}

async function createPageImageBytes(decoded, layout) {
  const crop = layout.crop;
  const width = crop ? Math.max(1, Math.ceil(crop.width)) : decoded.width;
  const height = crop ? Math.max(1, Math.ceil(crop.height)) : decoded.height;
  let canvas;

  try {
    const created = await createCanvas(width, height);
    canvas = created.canvas;

    if (crop) {
      created.context.drawImage(
        decoded.source,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        width,
        height
      );
    } else {
      created.context.drawImage(decoded.source, 0, 0, width, height);
    }

    return await canvasToPngBytes(canvas);
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

function makePdfDocument(firstLayout) {
  return new jsPDF({
    unit: "pt",
    format: [firstLayout.pageWidthPt, firstLayout.pageHeightPt],
    orientation: firstLayout.pageWidthPt > firstLayout.pageHeightPt ? "landscape" : "portrait",
    compress: true,
    putOnlyUsedFonts: true
  });
}

function assertCurrentPdfPageSize(pdf, layout) {
  const pageSize = pdf.internal?.pageSize;
  const actualWidth = pageSize?.getWidth?.();
  const actualHeight = pageSize?.getHeight?.();

  if (
    !Number.isFinite(actualWidth) ||
    !Number.isFinite(actualHeight) ||
    Math.abs(actualWidth - layout.pageWidthPt) > 0.1 ||
    Math.abs(actualHeight - layout.pageHeightPt) > 0.1
  ) {
    throw new Error("The PDF library created a page with dimensions that differ from the shared layout.");
  }
}

function addPageBackground(pdf, layout) {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, layout.pageWidthPt, layout.pageHeightPt, "F");
}

function wrapImageError(error, code, message, item, index) {
  if (error instanceof ImageToPdfError) {
    return new ImageToPdfError(error.code, error.message, item.id, index, error.cause ?? error);
  }
  return new ImageToPdfError(code, message, item.id, index, error);
}

async function countSerializedPdfPages(blob, signal) {
  const decoder = new TextDecoder("latin1");
  const pattern = /\/Type\s+\/Page(?!s)\b/g;
  let tail = "";
  let count = 0;

  const consume = (text, final = false) => {
    const combined = tail + text;
    const safeLength = final ? combined.length : Math.max(0, combined.length - 16);
    const safeText = combined.slice(0, safeLength);
    count += [...safeText.matchAll(pattern)].length;
    tail = combined.slice(safeLength);
  };

  if (typeof blob.stream === "function") {
    const reader = blob.stream().getReader();
    try {
      while (true) {
        throwIfAborted(signal);
        const { done, value } = await reader.read();
        if (done) break;
        consume(decoder.decode(value, { stream: true }));
      }
      consume(decoder.decode(), true);
    } finally {
      reader.releaseLock?.();
    }
  } else {
    consume(await blob.text(), true);
  }

  return count;
}

async function validatePdfBlob(blob, expectedPageCount, pdf, signal) {
  if (!(blob instanceof Blob) || blob.size === 0 || blob.type !== "application/pdf") {
    throw new ImageToPdfError("PDF_VALIDATION_FAILED", "The generated PDF Blob is empty or has an invalid MIME type.");
  }

  const header = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  const signature = String.fromCharCode(...header);
  if (signature !== "%PDF-") {
    throw new ImageToPdfError("PDF_VALIDATION_FAILED", "The generated file does not contain a valid PDF signature.");
  }

  const libraryPageCount = typeof pdf.getNumberOfPages === "function" ? pdf.getNumberOfPages() : null;
  const serializedPageCount = await countSerializedPdfPages(blob, signal);
  if (libraryPageCount !== expectedPageCount || serializedPageCount !== expectedPageCount) {
    throw new ImageToPdfError("PDF_VALIDATION_FAILED", "The generated PDF page count does not match the input image count.");
  }
}

/**
 * Generate one PDF page per input image. Processing is local and sequential.
 * The caller owns the returned Blob and any Object URLs created from it.
 */
export async function createImagePdf({
  images,
  options = {},
  signal,
  onProgress
} = {}) {
  validateQueue(images);
  const settings = normalizeOptions(options);
  throwIfAborted(signal);

  const validated = [];
  let totalPixels = 0;
  let totalBytes = 0;

  for (const [index, item] of images.entries()) {
    throwIfAborted(signal);
    reportProgress(onProgress, {
      phase: "validating",
      completed: index,
      total: images.length,
      currentIndex: index,
      currentId: item.id,
      currentName: item.file.name || "image"
    });

    let validation;
    try {
      validation = await validateImageFile(item.file);
    } catch (error) {
      throw new ImageToPdfError("INVALID_IMAGE", "The selected image could not be validated.", item.id, index, error);
    }
    if (!validation.valid) {
      throw new ImageToPdfError("INVALID_IMAGE", validation.reason, item.id, index);
    }

    totalBytes += item.file.size;
    if (totalBytes > LIMITS.maxTotalFileBytes) {
      throw new ImageToPdfError("LIMIT_EXCEEDED", "The selected files exceed the combined file-size limit.", item.id, index);
    }

    validated.push({ ...item, format: validation.format.format });
    reportProgress(onProgress, {
      phase: "validating",
      completed: index + 1,
      total: images.length,
      currentIndex: index,
      currentId: item.id,
      currentName: item.file.name || "image"
    });
  }

  let pdf = null;
  const pages = [];

  for (const [index, item] of validated.entries()) {
    throwIfAborted(signal);
    reportProgress(onProgress, {
      phase: "decoding",
      completed: index,
      total: validated.length,
      currentIndex: index,
      currentId: item.id,
      currentName: item.file.name || "image"
    });

    let decoded;
    try {
      decoded = await decodeImage(item.file, { format: item.format });
    } catch (error) {
      throw wrapImageError(
        error,
        "IMAGE_DECODE_FAILED",
        "The selected image could not be decoded.",
        item,
        index
      );
    }

    try {
      throwIfAborted(signal);
      validateDimensions(decoded.width, decoded.height);
      reportProgress(onProgress, {
        phase: "decoding",
        completed: index + 1,
        total: validated.length,
        currentIndex: index,
        currentId: item.id,
        currentName: item.file.name || "image"
      });
      totalPixels += decoded.width * decoded.height;
      if (totalPixels > LIMITS.maxTotalPixels) {
        throw new ImageToPdfError(
          "LIMIT_EXCEEDED",
          "The selected images exceed the combined decoded-pixel limit.",
          item.id,
          index
        );
      }

      throwIfAborted(signal);
      const layout = calculateImagePdfPageLayout({
        imageWidth: decoded.width,
        imageHeight: decoded.height,
        options
      });

      reportProgress(onProgress, {
        phase: "composing",
        completed: index,
        total: validated.length,
        currentIndex: index,
        currentId: item.id,
        currentName: item.file.name || "image"
      });

      const imageBytes = await createPageImageBytes(decoded, layout);
      throwIfAborted(signal);

      if (!pdf) {
        pdf = makePdfDocument(layout);
      } else {
        pdf.addPage(
          [layout.pageWidthPt, layout.pageHeightPt],
          layout.pageWidthPt > layout.pageHeightPt ? "landscape" : "portrait"
        );
      }
      assertCurrentPdfPageSize(pdf, layout);

      addPageBackground(pdf, layout);
      pdf.addImage(
        imageBytes,
        "PNG",
        layout.imageRect.x,
        layout.imageRect.y,
        layout.imageRect.width,
        layout.imageRect.height,
        undefined,
        "FAST"
      );

      pages.push({
        index,
        sourceId: item.id,
        sourceName: item.file.name || "image",
        sourceWidth: decoded.width,
        sourceHeight: decoded.height,
        pageWidthPt: layout.pageWidthPt,
        pageHeightPt: layout.pageHeightPt
      });
      reportProgress(onProgress, {
        phase: "composing",
        completed: index + 1,
        total: validated.length,
        currentIndex: index,
        currentId: item.id,
        currentName: item.file.name || "image"
      });
    } catch (error) {
      throw wrapImageError(
        error,
        "PDF_GENERATION_FAILED",
        "The selected image could not be added to the PDF.",
        item,
        index
      );
    } finally {
      decoded.close?.();
    }
  }

  throwIfAborted(signal);
  reportProgress(onProgress, {
    phase: "finalizing",
    completed: 0,
    total: validated.length,
    currentIndex: null,
    currentId: null,
    currentName: null
  });

  let blob;
  try {
    blob = pdf.output("blob");
    await validatePdfBlob(blob, pages.length, pdf, signal);
  } catch (error) {
    if (error instanceof ImageToPdfError) throw error;
    throw new ImageToPdfError("PDF_GENERATION_FAILED", "The PDF could not be serialized.", null, null, error);
  }

  throwIfAborted(signal);
  return {
    blob,
    filename: "converted.pdf",
    pageCount: pages.length,
    pages,
    warnings: []
  };
}
