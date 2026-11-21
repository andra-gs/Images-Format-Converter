import "../../styles/editor.css";
import {
  createDefaultEditorState,
  createImageProcessingAdapter,
  resetEditorState
} from "../core/image-processing-adapter.js";

const workspace = document.querySelector(".workspace");
const fileList = document.querySelector("#file-list");

if (workspace && fileList) {
  const adapter = createImageProcessingAdapter();
  const panel = document.createElement("section");
  panel.className = "editor-panel";
  panel.id = "image-editor";
  panel.setAttribute("aria-labelledby", "editor-title");
  panel.hidden = true;

  panel.innerHTML = `
    <div class="editor-heading">
      <div>
        <span class="editor-eyebrow">PHASE 5 · IMAGE MANIPULATION</span>
        <h2 id="editor-title">Image editor</h2>
        <p>Prepare an image before sending it to the existing converter.</p>
      </div>
      <label class="editor-file-picker">
        <span>Editing image</span>
        <select id="editor-file-select" aria-label="Choose an image to edit"></select>
      </label>
    </div>

    <div class="editor-layout">
      <div class="editor-preview-card">
        <div class="editor-preview-toolbar">
          <strong>Original preview</strong>
          <span id="editor-image-dimensions">Select an image</span>
        </div>
        <div class="editor-preview-stage" id="editor-preview-stage">
          <div class="editor-preview-empty" id="editor-preview-empty">
            <span aria-hidden="true">▧</span>
            <p>Select an image from the file queue to begin.</p>
          </div>
          <img id="editor-preview-image" alt="Original image preview" hidden />
        </div>
        <p class="editor-preview-caption" id="editor-preview-caption">
          Preview is read-only while the processing adapter is a placeholder.
        </p>
      </div>

      <div class="editor-controls">
        <fieldset class="editor-control-group">
          <legend>Resize</legend>
          <div class="editor-two-columns">
            <label>Width (px)
              <input id="editor-width" type="number" min="1" max="16384" step="1" />
            </label>
            <label>Height (px)
              <input id="editor-height" type="number" min="1" max="16384" step="1" />
            </label>
          </div>
          <label class="editor-check">
            <input id="editor-aspect" type="checkbox" checked />
            Keep aspect ratio
          </label>
        </fieldset>

        <fieldset class="editor-control-group">
          <legend>Crop area (px)</legend>
          <div class="editor-two-columns">
            <label>Position X
              <input id="editor-crop-x" type="number" min="0" step="1" value="0" />
            </label>
            <label>Position Y
              <input id="editor-crop-y" type="number" min="0" step="1" value="0" />
            </label>
            <label>Crop width
              <input id="editor-crop-width" type="number" min="1" step="1" />
            </label>
            <label>Crop height
              <input id="editor-crop-height" type="number" min="1" step="1" />
            </label>
          </div>
          <p class="editor-field-note">Crop selection is a draft control; processing is not connected yet.</p>
        </fieldset>

        <fieldset class="editor-control-group">
          <legend>Transform</legend>
          <label>Rotation
            <select id="editor-rotation">
              <option value="0">Original</option>
              <option value="90">90° clockwise</option>
              <option value="180">180°</option>
              <option value="270">270° clockwise</option>
            </select>
          </label>
          <div class="editor-two-columns editor-flips">
            <label class="editor-check">
              <input id="editor-flip-horizontal" type="checkbox" />
              Flip horizontal
            </label>
            <label class="editor-check">
              <input id="editor-flip-vertical" type="checkbox" />
              Flip vertical
            </label>
          </div>
        </fieldset>

        <fieldset class="editor-control-group">
          <legend>Adjustments</legend>
          <label class="editor-range-label" for="editor-brightness">
            <span>Brightness</span><output id="editor-brightness-value">0</output>
          </label>
          <input id="editor-brightness" type="range" min="-100" max="100" value="0" />
          <label class="editor-range-label" for="editor-contrast">
            <span>Contrast</span><output id="editor-contrast-value">0</output>
          </label>
          <input id="editor-contrast" type="range" min="-100" max="100" value="0" />
          <label class="editor-range-label" for="editor-saturation">
            <span>Saturation</span><output id="editor-saturation-value">100%</output>
          </label>
          <input id="editor-saturation" type="range" min="0" max="200" value="100" />
          <label class="editor-range-label" for="editor-blur">
            <span>Blur</span><output id="editor-blur-value">0 px</output>
          </label>
          <input id="editor-blur" type="range" min="0" max="20" value="0" />
          <div class="editor-two-columns editor-flips">
            <label class="editor-check">
              <input id="editor-grayscale" type="checkbox" />
              Grayscale
            </label>
            <label class="editor-check">
              <input id="editor-sepia" type="checkbox" />
              Sepia
            </label>
          </div>
        </fieldset>

        <p class="editor-adapter-notice" role="status">
          <strong>Preview mode only.</strong> Controls can be configured, but image processing
          and Apply are disabled until the transformation and adjustment modules are integrated.
        </p>
        <div class="editor-actions">
          <button class="editor-reset-button" id="editor-reset" type="button">Reset changes</button>
          <button class="editor-apply-button" id="editor-apply" type="button" disabled>Apply edits</button>
        </div>
      </div>
    </div>
  `;

  workspace.insertAdjacentElement("afterend", panel);

  const get = (id) => panel.querySelector(`#${id}`);
  const fileSelect = get("editor-file-select");
  const preview = get("editor-preview-image");
  const previewEmpty = get("editor-preview-empty");
  const dimensionsLabel = get("editor-image-dimensions");
  const applyButton = get("editor-apply");
  let selectedSource = null;
  let sourceDimensions = { width: null, height: null };
  let draft = createDefaultEditorState();

  const readQueue = () => [...fileList.querySelectorAll("[data-file-id]")].map((item) => {
    const image = item.querySelector(".file-preview img");
    const name = item.querySelector(".file-name")?.textContent?.trim() || "Image";
    return {
      id: item.dataset.fileId,
      name,
      url: image?.currentSrc || image?.src || ""
    };
  }).filter((entry) => entry.url);

  const updateValueLabels = () => {
    get("editor-brightness-value").value = String(draft.adjustments.brightness);
    get("editor-contrast-value").value = String(draft.adjustments.contrast);
    get("editor-saturation-value").value = `${draft.adjustments.saturation}%`;
    get("editor-blur-value").value = `${draft.adjustments.blur} px`;
  };

  const renderDraft = () => {
    get("editor-width").value = draft.transformations.resize.width ?? "";
    get("editor-height").value = draft.transformations.resize.height ?? "";
    get("editor-aspect").checked = draft.transformations.resize.keepAspectRatio;
    get("editor-crop-x").value = draft.transformations.crop.x;
    get("editor-crop-y").value = draft.transformations.crop.y;
    get("editor-crop-width").value = draft.transformations.crop.width ?? "";
    get("editor-crop-height").value = draft.transformations.crop.height ?? "";
    get("editor-rotation").value = String(draft.transformations.rotation);
    get("editor-flip-horizontal").checked = draft.transformations.flipHorizontal;
    get("editor-flip-vertical").checked = draft.transformations.flipVertical;
    get("editor-brightness").value = draft.adjustments.brightness;
    get("editor-contrast").value = draft.adjustments.contrast;
    get("editor-saturation").value = draft.adjustments.saturation;
    get("editor-blur").value = draft.adjustments.blur;
    get("editor-grayscale").checked = draft.adjustments.grayscale;
    get("editor-sepia").checked = draft.adjustments.sepia;
    updateValueLabels();
  };

  const setSelectedSource = (source) => {
    selectedSource = source;
    sourceDimensions = { width: null, height: null };
    draft = resetEditorState();
    preview.removeAttribute("src");
    preview.hidden = true;
    previewEmpty.hidden = false;
    dimensionsLabel.textContent = "Loading dimensions…";

    if (!source) {
      dimensionsLabel.textContent = "Select an image";
      renderDraft();
      return;
    }

    preview.onload = () => {
      sourceDimensions = {
        width: preview.naturalWidth,
        height: preview.naturalHeight
      };
      draft = createDefaultEditorState(sourceDimensions);
      dimensionsLabel.textContent = `${sourceDimensions.width} × ${sourceDimensions.height} px`;
      previewEmpty.hidden = true;
      preview.hidden = false;
      renderDraft();
    };
    preview.onerror = () => {
      dimensionsLabel.textContent = "Preview unavailable";
      previewEmpty.hidden = false;
      preview.hidden = true;
    };
    preview.src = source.url;
  };

  const refreshFiles = () => {
    const entries = readQueue();
    const previousId = selectedSource?.id;
    fileSelect.replaceChildren();

    for (const entry of entries) {
      const option = document.createElement("option");
      option.value = entry.id;
      option.textContent = entry.name;
      fileSelect.append(option);
    }

    panel.hidden = entries.length === 0;
    if (entries.length === 0) {
      setSelectedSource(null);
      return;
    }

    const next = entries.find((entry) => entry.id === previousId) || entries[0];
    fileSelect.value = next.id;

    // Preserve the current draft when unrelated queue entries are added or removed.
    if (selectedSource?.id !== next.id) {
      setSelectedSource(next);
    } else {
      selectedSource = next;
    }
  };

  fileSelect.addEventListener("change", () => {
    const source = readQueue().find((entry) => entry.id === fileSelect.value);
    setSelectedSource(source || null);
  });

  get("editor-width").addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value);
    if (Number.isFinite(value) && value > 0) {
      draft.transformations.resize.width = Math.round(value);
      if (draft.transformations.resize.keepAspectRatio && sourceDimensions.width) {
        draft.transformations.resize.height = Math.max(1, Math.round(value * sourceDimensions.height / sourceDimensions.width));
        get("editor-height").value = draft.transformations.resize.height;
      }
    }
  });

  get("editor-height").addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value);
    if (Number.isFinite(value) && value > 0) {
      draft.transformations.resize.height = Math.round(value);
      if (draft.transformations.resize.keepAspectRatio && sourceDimensions.height) {
        draft.transformations.resize.width = Math.max(1, Math.round(value * sourceDimensions.width / sourceDimensions.height));
        get("editor-width").value = draft.transformations.resize.width;
      }
    }
  });

  get("editor-aspect").addEventListener("change", (event) => {
    draft.transformations.resize.keepAspectRatio = event.currentTarget.checked;
  });

  for (const id of ["editor-crop-x", "editor-crop-y", "editor-crop-width", "editor-crop-height"]) {
    get(id).addEventListener("input", (event) => {
      const key = id.replace("editor-crop-", "");
      const value = Number(event.currentTarget.value);
      if (Number.isFinite(value) && value >= 0) draft.transformations.crop[key] = Math.round(value);
    });
  }

  get("editor-rotation").addEventListener("change", (event) => {
    draft.transformations.rotation = Number(event.currentTarget.value);
  });
  get("editor-flip-horizontal").addEventListener("change", (event) => {
    draft.transformations.flipHorizontal = event.currentTarget.checked;
  });
  get("editor-flip-vertical").addEventListener("change", (event) => {
    draft.transformations.flipVertical = event.currentTarget.checked;
  });

  for (const [id, key] of [
    ["editor-brightness", "brightness"],
    ["editor-contrast", "contrast"],
    ["editor-saturation", "saturation"],
    ["editor-blur", "blur"]
  ]) {
    get(id).addEventListener("input", (event) => {
      draft.adjustments[key] = Number(event.currentTarget.value);
      updateValueLabels();
    });
  }

  get("editor-grayscale").addEventListener("change", (event) => {
    draft.adjustments.grayscale = event.currentTarget.checked;
  });
  get("editor-sepia").addEventListener("change", (event) => {
    draft.adjustments.sepia = event.currentTarget.checked;
  });

  get("editor-reset").addEventListener("click", () => {
    draft = resetEditorState(sourceDimensions);
    renderDraft();
  });

  applyButton.addEventListener("click", async () => {
    if (!selectedSource || applyButton.disabled) return;
    try {
      await adapter.process(selectedSource, draft);
    } catch (error) {
      get("editor-preview-caption").textContent = error.message;
    }
  });

  renderDraft();
  refreshFiles();

  const observer = new MutationObserver(refreshFiles);
  observer.observe(fileList, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
}
