/**
 * Temporary bridge for the Phase 5 editor UI.
 *
 * The transformation and adjustment modules are owned by other contributors.
 * Keep this adapter intentionally unavailable until their APIs are agreed
 * and their implementations are merged into main.
 */

export const EDITOR_PROCESSING_UNAVAILABLE = "EDITOR_PROCESSING_UNAVAILABLE";

export function createDefaultEditorState(dimensions = {}) {
  const width = Number.isFinite(dimensions.width) ? dimensions.width : null;
  const height = Number.isFinite(dimensions.height) ? dimensions.height : null;

  return {
    resize: {
      width,
      height,
      keepAspectRatio: true
    },
    crop: {
      x: 0,
      y: 0,
      width,
      height
    },
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 100,
      blur: 0,
      grayscale: false,
      sepia: false
    }
  };
}

export function resetEditorState(dimensions = {}) {
  return createDefaultEditorState(dimensions);
}

export function createImageProcessingAdapter() {
  const capabilities = Object.freeze({
    resize: false,
    crop: false,
    rotate: false,
    flip: false,
    brightness: false,
    contrast: false,
    saturation: false,
    blur: false,
    grayscale: false,
    sepia: false
  });

  return Object.freeze({
    capabilities,

    async process() {
      const error = new Error(
        "Image editing is not available yet. The processing modules have not been integrated."
      );
      error.code = EDITOR_PROCESSING_UNAVAILABLE;
      throw error;
    }
  });
}
