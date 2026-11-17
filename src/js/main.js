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
  Trash2
} from "lucide";
import "../styles/main.css";

const iconSet = {
  Images,
  ShieldCheck,
  Moon,
  Sun,
  CloudUpload,
  LockKeyhole,
  FileImage,
  X,
  Trash2
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
const clearButton = document.querySelector("#clear-button");
const themeToggle = document.querySelector("#theme-toggle");

const selectedFiles = new Map();
let nextFileId = 0;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

const updateQueueSummary = () => {
  const count = selectedFiles.size;
  fileCount.textContent = `${count} ${count === 1 ? "file" : "files"}`;
  queueSection.hidden = count === 0;
};

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
  preview.append(image);

  const details = document.createElement("div");
  details.className = "file-details";

  const name = document.createElement("span");
  name.className = "file-name";
  name.textContent = entry.file.name;

  const meta = document.createElement("span");
  meta.className = "file-meta";
  meta.textContent = `${formatBytes(entry.file.size)} · ${entry.file.type || "Image"}`;

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

const addFiles = (files) => {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  const ignoredCount = files.length - imageFiles.length;

  for (const file of imageFiles) {
    const duplicate = [...selectedFiles.values()].some(
      (entry) => entry.file.name === file.name &&
        entry.file.size === file.size &&
        entry.file.lastModified === file.lastModified
    );

    if (duplicate) continue;

    const entry = {
      id: nextFileId++,
      file,
      url: URL.createObjectURL(file)
    };

    selectedFiles.set(entry.id, entry);
    renderFile(entry);
  }

  updateQueueSummary();
  renderIcons();

  if (ignoredCount > 0) {
    console.info(`${ignoredCount} non-image file(s) were ignored.`);
  }
};

const removeFile = (id) => {
  const entry = selectedFiles.get(id);
  if (!entry) return;

  URL.revokeObjectURL(entry.url);
  selectedFiles.delete(id);
  fileList.querySelector(`[data-file-id="${id}"]`)?.remove();
  updateQueueSummary();
};

const clearFiles = () => {
  for (const entry of selectedFiles.values()) {
    URL.revokeObjectURL(entry.url);
  }

  selectedFiles.clear();
  fileList.replaceChildren();
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

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("ifc-theme", nextTheme);
  applyTheme(nextTheme);
});

renderIcons();

window.addEventListener("beforeunload", () => {
  for (const entry of selectedFiles.values()) {
    URL.revokeObjectURL(entry.url);
  }
});