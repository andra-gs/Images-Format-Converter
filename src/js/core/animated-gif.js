import { decode, decodeFrames, encode } from "modern-gif";
import workerUrl from "modern-gif/worker?url";
import { decodeImage } from "./image-decoder.js";
import { detectImageFormat } from "./format-detector.js";

const MAX_GIF_DIMENSION = 16_384;
const MAX_GIF_FRAME_PIXELS = 40_000_000;
const MAX_GIF_TOTAL_PIXELS = 25_000_000;
const MAX_GIF_FRAMES = 200;

function validateGifMetadata(gif) {
  const { width, height, frames } = gif || {};

  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width > MAX_GIF_DIMENSION ||
    height > MAX_GIF_DIMENSION ||
    width * height > MAX_GIF_FRAME_PIXELS
  ) {
    throw new Error("The GIF has invalid or excessive image dimensions.");
  }

  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error("The GIF does not contain any image frames.");
  }

  if (frames.length > MAX_GIF_FRAMES) {
    throw new Error(`This GIF contains more than the supported ${MAX_GIF_FRAMES} frames.`);
  }

  if (width * height * frames.length > MAX_GIF_TOTAL_PIXELS) {
    throw new Error("This GIF exceeds the supported total animation pixel limit.");
  }

  for (const [index, frame] of frames.entries()) {
    const { left, top, width: frameWidth, height: frameHeight } = frame;
    if (
      !Number.isInteger(left) ||
      !Number.isInteger(top) ||
      !Number.isInteger(frameWidth) ||
      !Number.isInteger(frameHeight) ||
      left < 0 ||
      top < 0 ||
      frameWidth <= 0 ||
      frameHeight <= 0 ||
      left + frameWidth > width ||
      top + frameHeight > height ||
      frameWidth * frameHeight > MAX_GIF_FRAME_PIXELS
    ) {
      throw new Error(`GIF frame ${index + 1} has invalid or excessive dimensions.`);
    }
  }

  return { width, height, frames };
}

function hasWorkerSupport() {
  return typeof globalThis.Worker === "function";
}

async function decodeAllFrames(buffer, metadata) {
  if (hasWorkerSupport()) {
    try {
      return await decodeFrames(buffer, { gif: metadata, workerUrl });
    } catch {
      // Retry synchronously if the library's worker cannot be created or used.
    }
  }

  return decodeFrames(buffer, { gif: metadata });
}

async function encodeFrames(options) {
  if (hasWorkerSupport()) {
    try {
      return await encode({ ...options, workerUrl });
    } catch {
      // Retry without the library worker for browsers with restricted worker support.
    }
  }

  return encode(options);
}

function normalizeDelay(delay) {
  const value = Number.isFinite(delay) && delay > 0 ? delay : 100;
  // GIF stores frame delays in 10 ms units.
  return Math.max(10, Math.round(value / 10) * 10);
}

async function createGifFromGif(file) {
  const buffer = await file.arrayBuffer();
  const metadata = decode(buffer);
  const { width, height, frames: sourceFrames } = validateGifMetadata(metadata);
  const decodedFrames = await decodeAllFrames(buffer, metadata);

  if (!Array.isArray(decodedFrames) || decodedFrames.length !== sourceFrames.length) {
    throw new Error("The GIF decoder returned an incomplete set of animation frames.");
  }

  const frames = decodedFrames.map((frame, index) => {
    if (
      frame.width !== width ||
      frame.height !== height ||
      !(frame.data instanceof Uint8ClampedArray) ||
      frame.data.length !== width * height * 4
    ) {
      throw new Error(`GIF frame ${index + 1} contains invalid pixel data.`);
    }

    return {
      data: frame.data,
      delay: normalizeDelay(frame.delay)
    };
  });

  return {
    width,
    height,
    frames,
    looped: metadata.looped,
    loopCount: metadata.loopCount
  };
}

async function createGifFromStaticImage(file) {
  const source = await decodeImage(file);

  try {
    if (source.width * source.height > MAX_GIF_FRAME_PIXELS) {
      throw new Error("The source image exceeds the supported GIF dimensions.");
    }

    return {
      width: source.width,
      height: source.height,
      frames: [{ data: source.source, delay: 100 }],
      looped: false
    };
  } finally {
    source.close();
  }
}

export async function convertImageToGif(file) {
  if (!(file instanceof Blob) || file.size === 0) {
    throw new TypeError("A valid, non-empty image file is required.");
  }

  let animation;

  try {
    const detected = await detectImageFormat(file);
    if (!detected) {
      throw new Error("The file content is not a recognized image format.");
    }

    animation = detected.format === "gif"
      ? await createGifFromGif(file)
      : await createGifFromStaticImage(file);

    const encoded = await encodeFrames({
      width: animation.width,
      height: animation.height,
      frames: animation.frames,
      maxColors: 255,
      looped: animation.looped,
      ...(Number.isInteger(animation.loopCount) ? { loopCount: animation.loopCount } : {})
    });

    const blob = new Blob([encoded], { type: "image/gif" });
    if (blob.size === 0) {
      throw new Error("The GIF encoder returned an empty output.");
    }

    const outputMetadata = decode(await blob.arrayBuffer());
    if (
      outputMetadata.width !== animation.width ||
      outputMetadata.height !== animation.height ||
      outputMetadata.frames.length !== animation.frames.length
    ) {
      throw new Error("The generated GIF failed its dimension or frame-count verification.");
    }

    if (
      animation.looped !== undefined &&
      Boolean(outputMetadata.looped) !== Boolean(animation.looped)
    ) {
      throw new Error("The generated GIF did not preserve the source looping setting.");
    }

    if (
      animation.looped &&
      Number.isInteger(animation.loopCount) &&
      outputMetadata.loopCount !== animation.loopCount
    ) {
      throw new Error("The generated GIF did not preserve the source loop count.");
    }

    const detectedOutput = await detectImageFormat(blob);
    if (detectedOutput?.format !== "gif") {
      throw new Error("The generated output did not pass GIF signature validation.");
    }

    return {
      blob,
      format: "gif",
      width: animation.width,
      height: animation.height
    };
  } catch (error) {
    const conversionError = new Error(error.message || "GIF conversion failed.");
    conversionError.cause = error;
    throw conversionError;
  }
}
