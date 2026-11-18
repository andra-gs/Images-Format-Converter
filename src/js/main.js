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
  Image
} from "lucide";
import "../styles/main.css";
import { validateImageFile } from "./core/file-validator.js";
import { convertImageToJpeg, convertImageToPng, convertImageToWebp } from "./core/conversion-service.js";

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
  Image
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
const resultsEmpty = document.querySelector("#results-empty");
const resultsList = document.querySelector("#results-list");

const selectedFiles = new Map();
const conversionResults = new Map();
let nextFileId = 0;
let isConverting = false;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

const updateConvertButton = () => {
  convertButton.disabled = selectedFiles.size === 0 || !["image/png", "image/jpeg", "image/webp"].includes(selectedFormat) || isConverting;
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
  resultsEmpty.hidden = hasResults;
  resultsList.hidden = !hasResults;
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

const renderConversionResult = (entry, result) => {
  removeConversionResult(entry.id);

  const extension = result.format === "jpeg" ? "jpg" : result.format === "webp" ? "webp" : "png";
  const formatLabel = result.format.toUpperCase();
  const outputName = `${entry.file.name.replace(/\.[^.]+$/, "") || "image"}.${extension}`;
  const url = URL.createObjectURL(result.blob);
  conversionResults.set(entry.id, { url, outputName });

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

  item.append(heading, detail, download);
  resultsList.append(item);
  updateResultsVisibility();
};

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

  item.append(heading, detail);
  resultsList.append(item);
  conversionResults.set(entry.id, { url: null });
  updateResultsVisibility();
};

const runConversion = async () => {
  if (!["image/png", "image/jpeg", "image/webp"].includes(selectedFormat) || isConverting) return;

  isConverting = true;
  updateConvertButton();
  convertButton.textContent = "Converting...";

  const failures = [];
  const filesToConvert = [...selectedFiles.values()];

  for (const entry of filesToConvert) {
    if (!selectedFiles.has(entry.id)) continue;

    try {
      const quality = Number(outputQuality.value) / 100;
      const result = selectedFormat === "image/jpeg"
        ? await convertImageToJpeg(entry.file, { quality })
        : selectedFormat === "image/webp"
          ? await convertImageToWebp(entry.file, { quality })
          : await convertImageToPng(entry.file);
      if (!selectedFiles.has(entry.id)) continue;
      renderConversionResult(entry, result);
    } catch (error) {
      if (!selectedFiles.has(entry.id)) continue;
      renderConversionError(entry, error);
      failures.push(`${entry.file.name}: ${error.message}`);
    }
  }

  isConverting = false;
  convertButton.innerHTML = '<i data-lucide="file-output"></i>Convert images';
  renderIcons();
  updateConvertButton();

  if (failures.length > 0) {
    showFileFeedback(failures, "error");
  }
};

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
};

const removeFile = (id) => {
  const entry = selectedFiles.get(id);
  if (!entry) return;

  URL.revokeObjectURL(entry.url);
  selectedFiles.delete(id);
  fileList.querySelector(`[data-file-id="${id}"]`)?.remove();
  removeConversionResult(id);
  updateQueueSummary();
};

const clearFiles = () => {
  for (const entry of selectedFiles.values()) {
    URL.revokeObjectURL(entry.url);
  }

  selectedFiles.clear();
  fileList.replaceChildren();
  clearConversionResults();
  fileInput.value = "";
  updateQueueSummary();
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
});
