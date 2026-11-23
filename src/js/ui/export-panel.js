const PRESETS = ["low", "medium", "high"];
const OPTIMIZABLE_FORMATS = new Set(["jpeg", "webp"]);

function normalizeFormat(format) {
  return String(format || "").toLowerCase().replace(/^image\//, "").replace("image/svg+xml", "svg");
}

function createElement(documentRef, tag, className, text) {
  const element = documentRef.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function supportsExportOptimization(format) {
  return OPTIMIZABLE_FORMATS.has(normalizeFormat(format));
}

/**
 * Convert one file's UI state into the agreed optimizer options shape.
 * Preset quality values intentionally remain inside the optimizer contract.
 */
export function buildExportOptions(format, settings = {}) {
  const normalizedFormat = normalizeFormat(format);
  const optimizationSupported = supportsExportOptimization(normalizedFormat);

  if (!optimizationSupported || settings.mode === "none" || !settings.mode) {
    return { format: normalizedFormat, optimization: { mode: "none" } };
  }

  if (settings.mode === "preset") {
    const preset = String(settings.preset || "medium").toLowerCase();
    if (!PRESETS.includes(preset)) throw new TypeError("Unknown export preset.");
    return { format: normalizedFormat, optimization: { mode: "preset", preset } };
  }

  if (settings.mode === "target-size") {
    const targetBytes = Number(settings.targetBytes);
    if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
      throw new TypeError("Target file size must be a positive number of bytes.");
    }
    return { format: normalizedFormat, optimization: { mode: "target-size", targetBytes } };
  }

  throw new TypeError("Unknown export optimization mode.");
}

/** Format metrics exclusively from the optimizer's measured result.size object. */
export function getExportSizeMetrics(result) {
  const size = result?.size;
  if (!size || !Number.isFinite(size.sourceBytes) || !Number.isFinite(size.outputBytes)) {
    throw new TypeError("Optimizer result is missing actual size measurements.");
  }

  return {
    sourceBytes: size.sourceBytes,
    outputBytes: size.outputBytes,
    differenceBytes: size.differenceBytes,
    reductionPercent: size.reductionPercent
  };
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

/**
 * Create per-file controls. The caller owns mounting, persistence and invoking
 * optimizeImage; this module does not encode, compress, or choose quality values.
 */
export function createExportSettingsControls({
  fileId,
  format,
  settings = { mode: "preset", preset: "medium" },
  onChange = () => {},
  documentRef = document
}) {
  let currentFormat = normalizeFormat(format);
  let currentSettings = { ...settings };
  const root = createElement(documentRef, "section", "export-file-settings");
  root.dataset.fileId = String(fileId);
  root.setAttribute("aria-label", "Export settings");

  const heading = createElement(documentRef, "strong", "export-file-settings-title", "Export settings");
  const modeLabel = createElement(documentRef, "label", "export-control-label", "Optimization");
  const modeSelect = createElement(documentRef, "select", "export-control");
  modeSelect.setAttribute("aria-label", "Optimization mode");
  [
    ["none", "No optimization"],
    ["preset", "Quality preset"],
    ["target-size", "Target file size"]
  ].forEach(([value, label]) => {
    const option = createElement(documentRef, "option", "", label);
    option.value = value;
    modeSelect.append(option);
  });

  const presetLabel = createElement(documentRef, "label", "export-control-label", "Preset");
  const presetSelect = createElement(documentRef, "select", "export-control");
  presetSelect.setAttribute("aria-label", "Export preset");
  PRESETS.forEach((preset) => {
    const option = createElement(documentRef, "option", "", preset[0].toUpperCase() + preset.slice(1));
    option.value = preset;
    presetSelect.append(option);
  });

  const targetLabel = createElement(documentRef, "label", "export-control-label", "Target size (KB)");
  const targetInput = createElement(documentRef, "input", "export-control");
  targetInput.type = "number";
  targetInput.min = "1";
  targetInput.step = "1";
  targetInput.inputMode = "numeric";
  targetInput.placeholder = "e.g. 500";
  targetInput.setAttribute("aria-label", "Target file size in kilobytes");

  const hint = createElement(documentRef, "p", "export-control-hint");
  hint.setAttribute("role", "status");

  const presetGroup = createElement(documentRef, "div", "export-control-group");
  const targetGroup = createElement(documentRef, "div", "export-control-group");
  presetGroup.append(presetLabel, presetSelect);
  targetGroup.append(targetLabel, targetInput);
  root.append(heading, modeLabel, modeSelect, presetGroup, targetGroup, hint);

  const emitChange = () => {
    currentSettings = {
      mode: modeSelect.value,
      preset: presetSelect.value,
      targetBytes: Number(targetInput.value) * 1024
    };
    onChange(fileId, buildExportOptions(currentFormat, currentSettings));
  };

  const render = () => {
    const supported = supportsExportOptimization(currentFormat);
    modeSelect.disabled = !supported;
    modeSelect.value = supported ? (currentSettings.mode || "preset") : "none";
    presetGroup.hidden = !supported || modeSelect.value !== "preset";
    targetGroup.hidden = !supported || modeSelect.value !== "target-size";
    hint.textContent = supported
      ? "Preset and target-size controls are available for JPEG and WebP."
      : "This format uses the standard conversion path without optimization controls.";
  };

  modeSelect.addEventListener("change", emitChange);
  presetSelect.addEventListener("change", emitChange);
  targetInput.addEventListener("change", emitChange);

  presetSelect.value = currentSettings.preset || "medium";
  targetInput.value = currentSettings.targetBytes
    ? String(Math.round(currentSettings.targetBytes / 1024))
    : "";
  render();

  return {
    element: root,
    getSettings: () => ({ ...currentSettings }),
    getOptions: () => buildExportOptions(currentFormat, currentSettings),
    updateFormat(nextFormat) {
      currentFormat = normalizeFormat(nextFormat);
      render();
    },
    updateSettings(nextSettings) {
      currentSettings = { ...nextSettings };
      presetSelect.value = currentSettings.preset || "medium";
      targetInput.value = currentSettings.targetBytes
        ? String(Math.round(currentSettings.targetBytes / 1024))
        : "";
      render();
    }
  };
}
