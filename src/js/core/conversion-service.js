import { decodeImage } from "./image-decoder.js";
import { encodeImage } from "./image-encoder.js";
import { detectImageFormat } from "./format-detector.js";

/**
 * Convert a supported source image to PNG and verify the generated output.
 * The returned Blob is owned by the caller.
 */
export async function convertImageToPng(file) {
  const source = await decodeImage(file);
  let output;

  try {
    output = await encodeImage(source, { format: "png" });

    const detectedOutput = await detectImageFormat(output);
    if (detectedOutput?.format !== "png") {
      throw new Error("The generated output did not pass PNG signature validation.");
    }

    const verifiedOutput = await decodeImage(output, { format: "png" });

    try {
      if (verifiedOutput.width !== source.width || verifiedOutput.height !== source.height) {
        throw new Error("The generated PNG dimensions do not match the source image.");
      }
    } finally {
      verifiedOutput.close();
    }

    return {
      blob: output,
      format: "png",
      width: source.width,
      height: source.height
    };
  } finally {
    source.close();
  }
}
