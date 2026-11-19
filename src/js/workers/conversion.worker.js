import {
  convertImageToBmp,
  convertImageToJpeg,
  convertImageToPng,
  convertImageToTiff,
  convertImageToWebp
} from "../core/conversion-service.js";
import { convertImageToGif } from "../core/animated-gif.js";

const converters = {
  png: (file) => convertImageToPng(file),
  jpeg: (file, options) => convertImageToJpeg(file, options),
  webp: (file, options) => convertImageToWebp(file, options),
  bmp: (file) => convertImageToBmp(file),
  tiff: (file) => convertImageToTiff(file),
  gif: (file) => convertImageToGif(file)
};

self.addEventListener("message", async (event) => {
  const { id, file, format, options = {} } = event.data || {};
  const converter = converters[format];

  if (!converter || !file) {
    self.postMessage({
      id,
      ok: false,
      error: { message: "The worker received an invalid conversion request." }
    });
    return;
  }

  try {
    const result = await converter(file, options);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: { message: error.message || "Image conversion failed." }
    });
  }
});
