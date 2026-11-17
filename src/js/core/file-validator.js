import { detectImageFormat } from "./format-detector.js";

export async function validateImageFile(file) {
  if (!(file instanceof Blob)) {
    return {
      valid: false,
      reason: "The selected item is not a valid file."
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      reason: "The file is empty."
    };
  }

  let detected;
  try {
    detected = await detectImageFormat(file);
  } catch {
    return {
      valid: false,
      reason: "The file could not be read."
    };
  }

  if (!detected) {
    return {
      valid: false,
      reason: "The file content does not match a recognized image format."
    };
  }

  const declaredMime = file.type?.toLowerCase() || "";
  const mimeMismatch = Boolean(
    declaredMime &&
    declaredMime !== "application/octet-stream" &&
    declaredMime !== detected.mime
  );

  return {
    valid: true,
    format: detected,
    warnings: mimeMismatch
      ? ["The file MIME type does not match its detected content. The detected format will be used."]
      : []
  };
}
