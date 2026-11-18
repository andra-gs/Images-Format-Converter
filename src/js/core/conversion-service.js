import { decodeImage } from "./image-decoder.js";
import { encodeImage } from "./image-encoder.js";
import { detectImageFormat } from "./format-detector.js";

/**
 * Convert a supported source image and verify the generated output.
 * The returned Blob is owned by the caller.
 */
async function convertImage(file, format, options = {}) {
  const source = await decodeImage(file);
  let output;

  try {
    output = await encodeImage(source, { ...options, format });

    const detectedOutput = await detectImageFormat(output);
    if (detectedOutput?.format !== format) {
      throw new Error(`The generated output did not pass ${format.toUpperCase()} signature validation.`);
    }

    const verifiedOutput = await decodeImage(output, { format });

    try {
      if (verifiedOutput.width !== source.width || verifiedOutput.height !== source.height) {
        throw new Error(`The generated ${format.toUpperCase()} dimensions do not match the source image.`);
      }
    } finally {
      verifiedOutput.close();
    }

    return {
      blob: output,
      format,
      width: source.width,
      height: source.height
    };
  } finally {
    source.close();
  }
}

/**
 * Convert a supported source image to PNG.
 */
export function convertImageToPng(file) {
  return convertImage(file, "png");
}

/**
 * Convert a supported source image to JPEG.
 * Quality is a number from 0 to 1. Transparent pixels use a white background
 * unless another valid CSS canvas color is supplied.
 */
export function convertImageToJpeg(file, { quality = 0.85, backgroundColor = "#ffffff" } = {}) {
  return convertImage(file, "jpeg", { quality, backgroundColor });
}


/**
 * Convert a supported source image to WebP.
 * Quality is a number from 0 to 1. The browser must return image/webp;
 * unsupported browser encoders are rejected rather than mislabeled.
 */
export function convertImageToWebp(file, { quality = 0.85 } = {}) {
  return convertImage(file, "webp", { quality });
}
