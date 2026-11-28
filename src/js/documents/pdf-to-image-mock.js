/**
 * Phase 9 UI-only mock for the PDF-to-Image engine.
 *
 * Keep this module isolated from production engine code. Replace the UI import
 * with ../documents/pdf-to-image.js when Andra's PDF.js engine is integrated.
 * The mock intentionally reports a fixed three-page document; it does not
 * parse or render the supplied PDF bytes.
 */

export class PdfToImageError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "PdfToImageError";
    this.code = code;
    this.pageNumber = options.pageNumber ?? null;
  }
}

const throwIfAborted = (signal) => {
  if (signal?.aborted) {
    throw new PdfToImageError("ABORTED", "The PDF operation was cancelled.");
  }
};

const notify = (callback, snapshot) => {
  try {
    callback?.(snapshot);
  } catch {
    // Progress callbacks must not interrupt the mock session.
  }
};

const PAGE_SIZES = [
  { widthPt: 595.28, heightPt: 841.89, rotation: 0 },
  { widthPt: 841.89, heightPt: 595.28, rotation: 0 },
  { widthPt: 612, heightPt: 792, rotation: 90 }
];

/**
 * Mock implementation of the agreed openPdfDocument(file, options) contract.
 * It is for UI development only and must never be used as a production engine.
 */
export async function openPdfDocument(file, options = {}) {
  const { signal, onProgress } = options;
  throwIfAborted(signal);

  if (!(file instanceof Blob) || file.size === 0) {
    throw new PdfToImageError("INVALID_INPUT", "Choose a non-empty PDF file.");
  }
  if (file.size > 50 * 1024 * 1024) {
    throw new PdfToImageError("LIMIT_EXCEEDED", "The PDF exceeds the 50 MiB mock limit.");
  }

  notify(onProgress, { phase: "loading", loaded: 0, total: file.size });
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  throwIfAborted(signal);
  const signature = String.fromCharCode(...header);
  if (signature !== "%PDF-") {
    throw new PdfToImageError("INVALID_PDF", "The selected file does not have a PDF signature.");
  }
  notify(onProgress, { phase: "loading", loaded: file.size, total: file.size });

  let destroyed = false;

  const assertActive = () => {
    if (destroyed) {
      throw new PdfToImageError("INVALID_INPUT", "The mock PDF session has been destroyed.");
    }
  };

  return {
    numPages: PAGE_SIZES.length,
    fingerprint: "phase-9-ui-mock",
    async getPageInfo(pageNumber) {
      assertActive();
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > PAGE_SIZES.length) {
        throw new PdfToImageError("INVALID_PAGE", "The requested page does not exist.");
      }
      return { pageNumber, ...PAGE_SIZES[pageNumber - 1] };
    },
    async renderPage(pageNumber, renderOptions = {}) {
      assertActive();
      const { dpi = 150, signal: renderSignal, onProgress: onRenderProgress } = renderOptions;
      throwIfAborted(renderSignal);
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > PAGE_SIZES.length) {
        throw new PdfToImageError("INVALID_PAGE", "The requested page does not exist.", { pageNumber });
      }
      if (!Number.isFinite(dpi) || dpi < 72 || dpi > 600) {
        throw new PdfToImageError("INVALID_OPTIONS", "DPI must be between 72 and 600.", { pageNumber });
      }

      const page = PAGE_SIZES[pageNumber - 1];
      const rotated = page.rotation % 180 !== 0;
      const width = Math.ceil((rotated ? page.heightPt : page.widthPt) * dpi / 72);
      const height = Math.ceil((rotated ? page.widthPt : page.heightPt) * dpi / 72);
      if (width > 8192 || height > 8192 || width * height > 16_000_000) {
        throw new PdfToImageError("LIMIT_EXCEEDED", "The requested raster exceeds mock limits.", { pageNumber });
      }

      notify(onRenderProgress, { phase: "rendering", pageNumber });
      throwIfAborted(renderSignal);
      const imageData = new ImageData(width, height);
      return { pageNumber, dpi, width, height, rotation: page.rotation, imageData };
    },
    async destroy() {
      destroyed = true;
    }
  };
}
