import JSZip from "jszip";
import {
  createIcons,
  Images,
  ShieldCheck,
  Moon,
  Sun,
  CloudUpload,
  LockKeyhole,
  FileImage,
  X,
  Trash2,
  Settings2,
  FileOutput,
  Info,
  Image,
  FileArchive
} from "lucide";
import "../styles/main.css";
import { validateImageFile } from "./core/file-validator.js";
import { createEditorQueueSnapshot } from "./core/editor-queue-events.js";
import { convertImageDataToFormat, convertImageToBmp, convertImageToGif, convertImageToJpeg, convertImageToPng, convertImageToSvg, convertImageToTiff, convertImageToWebp, disposeConversionWorker } from "./core/conversion-service.js";

const iconSet = {
  Images,
  ShieldCheck,
  Moon,
  Sun,
  CloudUpload,
  LockKeyhole,
  FileImage,
  X,
  Trash2,
  Settings2,
  FileOutput,
  Info,
  Image,
  FileArchive
};

const renderIcons = () => createIcons({ icons: iconSet });

const app = document.querySelector("#app");

if (!app) {
  throw new Error('Application root "#app" was not found.');
}

const fileInput = document.querySelector("#file-input");
const browseButton = document.querySelector("#browse-button");
const dropzone = document.querySelector("#dropzone");
const fileList = document.querySelector("#file-list");
const queueSection = document.querySelector("#queue-section");
const fileCount = document.querySelector("#file-count");
const fileFeedback = document.querySelector("#file-feedback");
const clearButton = document.querySelector("#clear-button");
const themeToggle = document.querySelector("#theme-toggle");
const settingsPanel = document.querySelector("#settings-panel");
const resultsPanel = document.querySelector("#results-panel");
const formatSelect = document.querySelector("#format-select");
const formatTrigger = document.querySelector("#output-format-trigger");
const formatValue = document.querySelector("#output-format-value");
const formatMenu = document.querySelector("#output-format-menu");
const formatOptions = [...formatMenu.querySelectorAll('[role="option"]')];
let selectedFormat = "image/png";
const qualityField = document.querySelector("#quality-field");
const outputQuality = document.querySelector("#output-quality");
const qualityValue = document.querySelector("#quality-value");
const convertButton = document.querySelector("#convert-button");
const cancelButton = document.querySelector("#cancel-button");
const batchProgress = document.querySelector("#batch-progress");
const batchProgressText = document.querySelector("#batch-progress-text");
const batchProgressPercent = document.querySelector("#batch-progress-percent");
const batchProgressBar = document.querySelector("#batch-progress-bar");
const resultsEmpty = document.querySelector("#results-empty");
const resultsList = document.querySelector("#results-list");
const zipActions = document.querySelector("#zip-actions");
const downloadZipButton = document.querySelector("#download-zip-button");
const zipStatus = document.querySelector("#zip-status");

const selectedFiles = new Map();
const conversionResults = new Map();
const editedImages = new Map();
let nextFileId = 0;

window.addEventListener("ifc:editor-result", (event) => {
  const { id, imageData } = event.detail || {};
  if (!selectedFiles.has(id)) return;

  if (imageData) editedImages.set(id, imageData);
  else editedImages.delete(id);
});
let isConverting = false;
let cancelRequested = false;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

const updateConvertButton = () => {
  convertButton.disabled = selectedFiles.size === 0 || !["image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff", "image/svg+xml", "image/gif"].includes(selectedFormat) || isConverting;
};

const notifyEditorQueueChange = () => {
  window.dispatchEvent(new CustomEvent("ifc:queue-change", {
    detail: { entries: createEditorQueueSnapshot([...selectedFiles.values()]) }
  }));
};

const updateQueueSummary = () => {
  const count = selectedFiles.size;
  fileCount.textContent = `${count} ${count === 1 ? "file" : "files"}`;
  queueSection.hidden = count === 0;
  settingsPanel.hidden = count === 0;
  resultsPanel.hidden = count === 0;
  updateConvertButton();
};

const updateQualityVisibility = () => {
  const usesQuality = ["image/jpeg", "image/webp"].includes(selectedFormat);
  qualityField.hidden = !usesQuality;
};

const closeFormatMenu = (returnFocus = false) => {
  formatMenu.hidden = true;
  formatTrigger.setAttribute("aria-expanded", "false");
  if (returnFocus) formatTrigger.focus();
};

const openFormatMenu = (focusSelected = false) => {
  formatMenu.hidden = false;
  formatTrigger.setAttribute("aria-expanded", "true");
  const selectedOption = formatOptions.find((option) => option.dataset.value === selectedFormat);
  (focusSelected ? selectedOption : formatOptions[0])?.focus();
};

const selectFormat = (option) => {
  if (option.getAttribute("aria-disabled") === "true") return;
  selectedFormat = option.dataset.value;
  formatValue.textContent = option.textContent.trim();
  formatOptions.forEach((item) => {
    const isSelected = item === option;
    item.setAttribute("aria-selected", String(isSelected));
    item.classList.toggle("is-selected", isSelected);
  });
  closeFormatMenu();
  updateQualityVisibility();
  updateConvertButton();
  formatTrigger.focus();
};

formatTrigger.addEventListener("click", () => {
  if (formatMenu.hidden) openFormatMenu(true);
  else closeFormatMenu();
});

formatOptions.forEach((option) => {
  option.addEventListener("click", () => {
    if (option.getAttribute("aria-disabled") !== "true") selectFormat(option);
  });

  option.addEventListener("keydown", (event) => {
    if (option.getAttribute("aria-disabled") === "true") return;

    const enabledOptions = formatOptions.filter(
      (item) => item.getAttribute("aria-disabled") !== "true"
    );
    const index = enabledOptions.indexOf(option);
    let nextIndex = index;

    if (event.key === "ArrowDown") nextIndex = (index + 1) % enabledOptions.length;
    else if (event.key === "ArrowUp") nextIndex = (index - 1 + enabledOptions.length) % enabledOptions.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = enabledOptions.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectFormat(option);
      return;
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeFormatMenu(true);
      return;
    } else {
      return;
    }

    event.preventDefault();
    enabledOptions[nextIndex].focus();
  });
});

document.addEventListener("click", (event) => {
  if (!formatSelect.contains(event.target)) closeFormatMenu();
});

formatTrigger.addEventListener("keydown", (event) => {
  if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    openFormatMenu(true);
  }
  if (event.key === "Escape") closeFormatMenu();
});

const renderFile = (entry) => {
  const item = document.createElement("li");
  item.className = "file-item";
  item.dataset.fileId = String(entry.id);

  const preview = document.createElement("div");
  preview.className = "file-preview";

  const image = document.createElement("img");
  image.src = entry.url;
  image.alt = "";
  image.loading = "lazy";
  image.addEventListener("error", () => {
    const fallback = document.createElement("span");
    fallback.className = "file-preview-fallback";
    fallback.textContent = entry.format.label;
    preview.replaceChildren(fallback);
  }, { once: true });
  preview.append(image);

  const details = document.createElement("div");
  details.className = "file-details";

  const name = document.createElement("span");
  name.className = "file-name";
  name.textContent = entry.file.name;

  const meta = document.createElement("span");
  meta.className = "file-meta";
  meta.textContent = `${formatBytes(entry.file.size)} · ${entry.format.label}`;

  details.append(name, meta);

  const removeButton = document.createElement("button");
  removeButton.className = "remove-button";
  removeButton.type = "button";
  removeButton.setAttribute("aria-label", `Remove ${entry.file.name}`);
  removeButton.innerHTML = '<i data-lucide="x"></i>';
  removeButton.addEventListener("click", () => removeFile(entry.id));

  item.append(preview, details, removeButton);
  fileList.append(item);
};

const showFileFeedback = (messages, state = "info") => {
  fileFeedback.hidden = messages.length === 0;
  fileFeedback.dataset.state = state;
  fileFeedback.textContent = messages.join(" ");
};

const updateResultsVisibility = () => {
  const hasResults = conversionResults.size > 0;
  const hasDownloadableResults = [...conversionResults.values()].some((result) => result.blob instanceof Blob);
  resultsEmpty.hidden = hasResults;
  resultsList.hidden = !hasResults;
  zipActions.hidden = !hasDownloadableResults;
  downloadZipButton.disabled = !hasDownloadableResults;
};

const removeConversionResult = (fileId) => {
  const result = conversionResults.get(fileId);
  if (result?.url) URL.revokeObjectURL(result.url);
  conversionResults.delete(fileId);
  resultsList.querySelector(`[data-result-id="${fileId}"]`)?.remove();
  updateResultsVisibility();
};

const clearConversionResults = () => {
  for (const result of conversionResults.values()) {
    if (result.url) URL.revokeObjectURL(result.url);
  }
  conversionResults.clear();
  resultsList.replaceChildren();
  updateResultsVisibility();
};

const renderConversionStatus = (entry, status, detailText) => {
  removeConversionResult(entry.id);

  const item = document.createElement("li");
  item.className = `result-item result-item-${status}`;
  item.dataset.resultId = String(entry.id);

  const heading = document.createElement("div");
  heading.className = "result-name";
  heading.textContent = entry.file.name;

  const statusLabel = document.createElement("span");
  statusLabel.className = `result-status result-status-${status}`;
  statusLabel.textContent = status.charAt(0).toUpperCase() + status.slice(1);

  const detail = document.createElement("div");
  detail.className = "result-detail";
  detail.textContent = detailText;

  item.append(heading, statusLabel, detail);

  if (status === "processing") {
    const progress = document.createElement("div");
    progress.className = "result-progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", `Converting ${entry.file.name}`);
    const indicator = document.createElement("span");
    progress.append(indicator);
    item.append(progress);
  }

  resultsList.append(item);
  conversionResults.set(entry.id, { url: null, status });
  updateResultsVisibility();
};

const updateBatchProgress = (total, finished) => {
  const percentage = total === 0 ? 0 : Math.round((finished / total) * 100);
  batchProgress.hidden = total === 0;
  batchProgressText.textContent = `${finished} of ${total} files processed`;
  batchProgressPercent.textContent = `${percentage}%`;
  batchProgressBar.value = percentage;
};

const renderConversionResult = (entry, result) => {
  removeConversionResult(entry.id);

  const extension = result.format === "jpeg" ? "jpg" : result.format === "webp" ? "webp" : result.format === "bmp" ? "bmp" : result.format === "tiff" ? "tif" : result.format === "svg" ? "svg" : result.format === "gif" ? "gif" : "png";
  const formatLabel = result.format.toUpperCase();
  const outputName = `${entry.file.name.replace(/\.[^.]+$/, "") || "image"}.${extension}`;
  const url = URL.createObjectURL(result.blob);
  conversionResults.set(entry.id, { url, outputName, blob: result.blob });

  const item = document.createElement("li");
  item.className = "result-item";
  item.dataset.resultId = String(entry.id);

  const heading = document.createElement("div");
  heading.className = "result-name";
  heading.textContent = outputName;

  const detail = document.createElement("div");
  detail.className = "result-detail";
  detail.textContent = `${formatLabel} · ${result.width} × ${result.height} · ${formatBytes(result.blob.size)}`;

  const download = document.createElement("a");
  download.className = "result-download";
  download.href = url;
  download.download = outputName;
  download.textContent = `Download ${formatLabel}`;

  const status = document.createElement("span");
  status.className = "result-status result-status-completed";
  status.textContent = "Completed";

  item.append(heading, status, detail, download);
  resultsList.append(item);
  updateResultsVisibility();
};


const getUniqueArchiveName = (fileName, usedNames) => {
  const dotIndex = fileName.lastIndexOf(".");
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : "";
  let candidate = fileName;
  let suffix = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${baseName} (${suffix})${extension}`;
    suffix += 1;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
};

const downloadAllAsZip = async () => {
  const completedResults = [...conversionResults.values()].filter(
    (result) => result.blob instanceof Blob && result.outputName
  );
  if (completedResults.length === 0 || downloadZipButton.disabled) return;

  downloadZipButton.disabled = true;
  downloadZipButton.textContent = "Preparing ZIP...";
  zipStatus.textContent = "Preparing converted files for the ZIP archive.";

  try {
    const zip = new JSZip();
    const usedNames = new Set();

    for (const result of completedResults) {
      const archiveName = getUniqueArchiveName(result.outputName, usedNames);
      zip.file(archiveName, result.blob);
    }

    const archive = await zip.generateAsync(
      { type: "blob", compression: "STORE" },
      (metadata) => {
        zipStatus.textContent = `Creating ZIP archive: ${Math.round(metadata.percent)}%`;
      }
    );

    const url = URL.createObjectURL(archive);
    const link = document.createElement("a");
    link.href = url;
    link.download = "converted-images.zip";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    zipStatus.textContent = `ZIP archive created with ${completedResults.length} ${completedResults.length === 1 ? "image" : "images"}.`;
  } catch (error) {
    zipStatus.textContent = error.message || "Could not create the ZIP archive.";
  } finally {
    downloadZipButton.disabled = false;
    downloadZipButton.innerHTML = '<i data-lucide="file-archive"></i>Download all as ZIP';
    renderIcons();
    updateResultsVisibility();
  }
};

downloadZipButton.addEventListener("click", downloadAllAsZip);

const renderConversionError = (entry, error) => {
  removeConversionResult(entry.id);

  const item = document.createElement("li");
  item.className = "result-item result-item-error";
  item.dataset.resultId = String(entry.id);

  const heading = document.createElement("div");
  heading.className = "result-name";
  heading.textContent = entry.file.name;

  const detail = document.createElement("div");
  detail.className = "result-detail";
  detail.textContent = error.message || "Conversion failed.";

  const status = document.createElement("span");
  status.className = "result-status result-status-failed";
  status.textContent = "Failed";

  item.append(heading, status, detail);
  resultsList.append(item);
  conversionResults.set(entry.id, { url: null, status: "failed" });
  updateResultsVisibility();
};

const runConversion = async () => {
  if (!["image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff", "image/svg+xml", "image/gif"].includes(selectedFormat) || isConverting) return;

  isConverting = true;
  cancelRequested = false;
  updateConvertButton();
  convertButton.textContent = "Converting...";
  cancelButton.hidden = false;
  cancelButton.disabled = false;
  cancelButton.textContent = "Cancel remaining";

  const failures = [];
  const filesToConvert = [...selectedFiles.values()];
  let finished = 0;

  updateBatchProgress(filesToConvert.length, finished);
  for (const entry of filesToConvert) {
    if (selectedFiles.has(entry.id)) {
      renderConversionStatus(entry, "pending", "Waiting in the conversion queue.");
    }
  }

  for (const entry of filesToConvert) {
    if (!selectedFiles.has(entry.id)) {
      finished += 1;
      updateBatchProgress(filesToConvert.length, finished);
      continue;
    }

    if (cancelRequested) {
      renderConversionStatus(entry, "cancelled", "This file was not processed.");
      finished += 1;
      updateBatchProgress(filesToConvert.length, finished);
      continue;
    }

    renderConversionStatus(entry, "processing", `Converting to ${selectedFormat.replace("image/", "").toUpperCase()}...`);

    try {
      const quality = Number(outputQuality.value) / 100;
      const editedImageData = editedImages.get(entry.id);
      let result;

      if (editedImageData) {
        if (selectedFormat === "image/gif") {
          throw new Error("Edited images cannot be exported as GIF yet. Choose PNG, JPEG, WebP, BMP, TIFF, or SVG, or reset the edits to convert the original file as GIF.");
        }

        const outputFormat = selectedFormat === "image/svg+xml"
          ? "svg"
          : selectedFormat.replace("image/", "");
        const options = ["image/jpeg", "image/webp"].includes(selectedFormat)
          ? { quality }
          : {};
        result = await convertImageDataToFormat(editedImageData, outputFormat, options);
      } else {
        result = selectedFormat === "image/jpeg"
          ? await convertImageToJpeg(entry.file, { quality })
          : selectedFormat === "image/webp"
            ? await convertImageToWebp(entry.file, { quality })
            : selectedFormat === "image/bmp"
              ? await convertImageToBmp(entry.file)
              : selectedFormat === "image/tiff"
                ? await convertImageToTiff(entry.file)
                : selectedFormat === "image/svg+xml"
                  ? await convertImageToSvg(entry.file)
                  : selectedFormat === "image/gif"
                    ? await convertImageToGif(entry.file)
                    : await convertImageToPng(entry.file);
      }

      if (selectedFiles.has(entry.id)) {
        renderConversionResult(entry, result);
      }
    } catch (error) {
      if (selectedFiles.has(entry.id)) {
        renderConversionError(entry, error);
        failures.push(`${entry.file.name}: ${error.message}`);
      }
    }

    finished += 1;
    updateBatchProgress(filesToConvert.length, finished);
  }

  isConverting = false;
  cancelRequested = false;
  cancelButton.hidden = true;
  cancelButton.disabled = false;
  convertButton.innerHTML = '<i data-lucide="file-output"></i>Convert images';
  renderIcons();
  updateConvertButton();

  if (failures.length > 0) {
    showFileFeedback(failures, "error");
  } else if (filesToConvert.length > 0 && cancelButton.dataset.cancelled === "true") {
    showFileFeedback(["Conversion stopped after the current file. Remaining files were skipped."], "warning");
  }
  cancelButton.dataset.cancelled = "false";
};

cancelButton.addEventListener("click", () => {
  if (!isConverting || cancelRequested) return;
  cancelRequested = true;
  cancelButton.disabled = true;
  cancelButton.textContent = "Stopping after current file...";
  cancelButton.dataset.cancelled = "true";
});
const addFiles = async (files) => {
  const rejected = [];
  const warnings = [];

  for (const file of [...files]) {
    const validation = await validateImageFile(file);

    if (!validation.valid) {
      rejected.push(`${file.name}: ${validation.reason}`);
      continue;
    }

    const duplicate = [...selectedFiles.values()].some(
      (entry) => entry.file.name === file.name &&
        entry.file.size === file.size &&
        entry.file.lastModified === file.lastModified
    );

    if (duplicate) continue;

    const entry = {
      id: nextFileId++,
      file,
      format: validation.format,
      capabilities: validation.capabilities,
      url: URL.createObjectURL(file)
    };

    selectedFiles.set(entry.id, entry);
    renderFile(entry);

    for (const warning of validation.warnings) {
      warnings.push(`${file.name}: ${warning}`);
    }
  }

  updateQueueSummary();
  renderIcons();

  const messages = [...rejected, ...warnings];
  showFileFeedback(messages, rejected.length > 0 ? "error" : "warning");
  notifyEditorQueueChange();
};

const removeFile = (id) => {
  const entry = selectedFiles.get(id);
  if (!entry) return;

  URL.revokeObjectURL(entry.url);
  selectedFiles.delete(id);
  editedImages.delete(id);
  fileList.querySelector(`[data-file-id="${id}"]`)?.remove();
  removeConversionResult(id);
  updateQueueSummary();
  notifyEditorQueueChange();
};

const clearFiles = () => {
  for (const entry of selectedFiles.values()) {
    URL.revokeObjectURL(entry.url);
  }

  selectedFiles.clear();
  editedImages.clear();
  fileList.replaceChildren();
  clearConversionResults();
  fileInput.value = "";
  updateQueueSummary();
  notifyEditorQueueChange();
};

browseButton.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (event) => {
  addFiles(event.target.files);
  fileInput.value = "";
});

dropzone.addEventListener("click", (event) => {
  if (event.target.closest("button")) return;
  fileInput.click();
});

dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

for (const eventName of ["dragenter", "dragover"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
  });
}

dropzone.addEventListener("drop", (event) => {
  addFiles(event.dataTransfer.files);
});

clearButton.addEventListener("click", clearFiles);

outputQuality.addEventListener("input", () => {
  qualityValue.value = `${outputQuality.value}%`;
  qualityValue.textContent = `${outputQuality.value}%`;
});

convertButton.addEventListener("click", runConversion);

const savedTheme = localStorage.getItem("ifc-theme");
const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  themeToggle.innerHTML = theme === "dark"
    ? '<i data-lucide="sun"></i>'
    : '<i data-lucide="moon"></i>';
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
  renderIcons();
};

applyTheme(savedTheme || preferredTheme);
updateQualityVisibility();

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("ifc-theme", nextTheme);
  applyTheme(nextTheme);
});

renderIcons();

document.querySelector("#boot-splash")?.remove();
app.style.visibility = "visible";

window.addEventListener("beforeunload", () => {
  for (const entry of selectedFiles.values()) {
    URL.revokeObjectURL(entry.url);
  }
  disposeConversionWorker();
});
