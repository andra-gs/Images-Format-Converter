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
      status: "planned",
      strategy: "canvas",
      note: "The returned Blob MIME type must be checked because browser encoder support can vary."
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
      status: "planned",
      strategy: "dedicated-encoder",
      note: "BMP output requires a dedicated encoder."
    }
  },
  gif: {
    format: "gif",
    label: "GIF",
    mime: "image/gif",
    detection: { status: "implemented" },
    decoding: {
      status: "planned",
      strategy: "browser-native-static-frame",
      note: "Native image decoding may expose only a rendered frame. Animation preservation requires a separate frame-aware pipeline."
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
      status: "planned",
      strategy: "dedicated-decoder",
      note: "A TIFF decoder must be evaluated and integrated."
    },
    encoding: {
      status: "not-planned",
      strategy: null,
      note: "TIFF encoding has not been selected or implemented."
    }
  },
  heic: {
    format: "heic",
    label: "HEIC",
    mime: "image/heic",
    detection: { status: "implemented" },
    decoding: {
      status: "planned",
      strategy: "dedicated-decoder",
      note: "A HEIC decoder must be evaluated and integrated."
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
      status: "planned",
      strategy: "dedicated-decoder",
      note: "A HEIF decoder must be evaluated and integrated."
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
      status: "planned",
      strategy: "safe-svg-rasterization",
      note: "SVG input must be rasterized safely without injecting untrusted markup into the live DOM."
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
