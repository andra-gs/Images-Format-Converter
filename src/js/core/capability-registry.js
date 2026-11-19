const FORMAT_CAPABILITIES = Object.freeze({
  png: {
    format: "png",
    label: "PNG",
    mime: "image/png",
    detection: { status: "implemented" },
    decoding: {
      status: "implemented",
      strategy: "browser-native",
      note: "Real-file decoding was verified in the browser."
    },
    encoding: {
      status: "implemented",
      strategy: "canvas",
      note: "PNG output uses OffscreenCanvas with an HTML Canvas fallback. Real-file conversion was verified in the main UI for PNG, JPEG, WebP, and BMP inputs."
    }
  },
  jpeg: {
    format: "jpeg",
    label: "JPEG",
    mime: "image/jpeg",
    detection: { status: "implemented" },
    decoding: {
      status: "implemented",
      strategy: "browser-native",
      note: "Real-file decoding was verified in the browser."
    },
    encoding: {
      status: "implemented",
      strategy: "canvas",
      note: "JPEG output uses Canvas with quality control and white compositing for transparent pixels. Real-file browser conversion was verified."
    }
  },
  webp: {
    format: "webp",
    label: "WebP",
    mime: "image/webp",
    detection: { status: "implemented" },
    decoding: {
      status: "implemented",
      strategy: "browser-native",
      note: "Real-file decoding was verified in the browser."
    },
    encoding: {
      status: "implemented",
      strategy: "canvas",
      note: "WebP output uses OffscreenCanvas with an HTML Canvas fallback. Real-file browser verification passed for PNG, JPEG, WebP, and BMP inputs, including transparency, quality, MIME type, dimensions, preview, download, and unsupported-browser errors."
    }
  },
  bmp: {
    format: "bmp",
    label: "BMP",
    mime: "image/bmp",
    detection: { status: "implemented" },
    decoding: {
      status: "implemented",
      strategy: "browser-native",
      note: "Real BMP decoding was verified in the browser."
    },
    encoding: {
      status: "implemented",
      strategy: "dedicated-encoder",
      note: "A dedicated 24-bit BMP encoder writes bottom-up BGR pixel rows with 4-byte alignment. Transparent pixels are composited onto white. Real-file browser verification is pending."
    }
  },
  gif: {
    format: "gif",
    label: "GIF",
    mime: "image/gif",
    detection: { status: "implemented" },
    decoding: {
      status: "implemented",
      strategy: "gifuct-js-first-frame",
      note: "Real-browser decoding and main-application conversion were verified. Static and animated GIF inputs are rasterized from the first image frame only; playback, frame timing, and animation-preserving output are not implemented."
    },
    encoding: {
      status: "not-planned",
      strategy: null,
      note: "Animated GIF encoding is reserved for advanced format work."
    }
  },
  tiff: {
    format: "tiff",
    label: "TIFF",
    mime: "image/tiff",
    detection: { status: "implemented" },
    decoding: {
      status: "implemented",
      strategy: "utif2",
      note: "Real TIFF fixtures passed browser decoding, main conversion, and Web Worker tests. The adapter reads the first page only."
    },
    encoding: {
      status: "implemented",
      strategy: "utif2-uncompressed",
      note: "Baseline TIFF output uses UTIF2 encodeImage with uncompressed RGBA pixels. Real-file output verification is pending."
    }
  },
  heic: {
    format: "heic",
    label: "HEIC",
    mime: "image/heic",
    detection: { status: "implemented" },
    decoding: {
      status: "implemented",
      strategy: "heic-to",
      note: "Real HEIC files passed browser decoder, main conversion pipeline, and Web Worker verification."
    },
    encoding: {
      status: "not-planned",
      strategy: null,
      note: "HEIC encoding is outside the initial output scope."
    }
  },
  heif: {
    format: "heif",
    label: "HEIF",
    mime: "image/heif",
    detection: { status: "implemented" },
    decoding: {
      status: "implemented",
      strategy: "heic-to",
      note: "Real HEIF files passed browser decoder, main conversion pipeline, and Web Worker verification."
    },
    encoding: {
      status: "not-planned",
      strategy: null,
      note: "HEIF encoding is outside the initial output scope."
    }
  },
  svg: {
    format: "svg",
    label: "SVG",
    mime: "image/svg+xml",
    detection: { status: "implemented" },
    decoding: {
      status: "implemented",
      strategy: "safe-svg-rasterization",
      note: "Real-browser verification passed for safe SVG parsing and rasterization, including removal of scripts, event handlers, foreignObject, and external images, plus conversion to PNG, JPEG, WebP, BMP, and TIFF."
    },
    encoding: {
      status: "not-planned",
      strategy: null,
      note: "Raster-to-SVG wrapping is not true vector conversion and is not offered."
    }
  }
});

const cloneCapability = (capability) => ({
  ...capability,
  detection: { ...capability.detection },
  decoding: { ...capability.decoding },
  encoding: { ...capability.encoding }
});

export function getFormatCapabilities(format) {
  const capability = FORMAT_CAPABILITIES[String(format).toLowerCase()];
  return capability ? cloneCapability(capability) : null;
}

export function getDetectedFormats() {
  return Object.keys(FORMAT_CAPABILITIES).filter(
    (format) => FORMAT_CAPABILITIES[format].detection.status === "implemented"
  );
}

export function getAvailableInputFormats() {
  return Object.keys(FORMAT_CAPABILITIES).filter(
    (format) => FORMAT_CAPABILITIES[format].decoding.status === "implemented"
  );
}

export function getAvailableOutputFormats() {
  return Object.keys(FORMAT_CAPABILITIES).filter(
    (format) => FORMAT_CAPABILITIES[format].encoding.status === "implemented"
  );
}

export function getPlannedOutputFormats() {
  return Object.keys(FORMAT_CAPABILITIES).filter(
    (format) => FORMAT_CAPABILITIES[format].encoding.status === "planned"
  );
}

export function canDecodeFormat(format) {
  return getAvailableInputFormats().includes(String(format).toLowerCase());
}

export function canEncodeFormat(format) {
  return getAvailableOutputFormats().includes(String(format).toLowerCase());
}
