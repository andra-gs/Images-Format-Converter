import { convertImageToJpeg, convertImageToWebp } from "../src/js/core/conversion-service.js";

const fileInput = document.querySelector("#encoder-file-input");
const outputFormat = document.querySelector("#output-format");
const outputQuality = document.querySelector("#output-quality");
const qualityValue = document.querySelector("#quality-value");
const resultsList = document.querySelector("#encoder-results");
const emptyState = document.querySelector("#empty-state");
const clearButton = document.querySelector("#clear-results");
const resultUrls = new Set();

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

const addResult = ({ file, result, error, format }) => {
  const item = document.createElement("li");
  item.className = "result-item";

  const name = document.createElement("div");
  name.className = "result-name";
  name.textContent = file.name;

  const metadata = document.createElement("div");
  metadata.className = "result-detail";
  metadata.textContent = `Source: ${formatBytes(file.size)} · ${file.type || "MIME type unavailable"}`;

  const status = document.createElement("div");
  status.className = `result-status ${result ? "success" : "error"}`;
  status.textContent = result ? `${format.toUpperCase()} conversion and validation successful` : `${format.toUpperCase()} conversion failed`;

  const detail = document.createElement("div");
  detail.className = "result-detail";
  item.append(name, metadata, status, detail);

  if (result) {
    const extension = format === "jpeg" ? "jpg" : "webp";
    const outputName = `${file.name.replace(/\.[^.]+$/, "") || "image"}.${extension}`;
    const url = URL.createObjectURL(result.blob);
    resultUrls.add(url);

    detail.textContent = `MIME: ${result.blob.type} · Dimensions: ${result.width} × ${result.height} · Output: ${formatBytes(result.blob.size)}`;

    const preview = document.createElement("img");
    preview.className = "result-preview";
    preview.src = url;
    preview.alt = `${format.toUpperCase()} output preview for ${file.name}`;

    const download = document.createElement("a");
    download.className = "download-link";
    download.href = url;
    download.download = outputName;
    download.textContent = `Download ${outputName}`;

    item.append(preview, download);
  } else {
    detail.textContent = error?.message || "Unknown conversion error.";
  }

  resultsList.append(item);
  emptyState.hidden = true;
};

fileInput.addEventListener("change", async () => {
  const files = [...fileInput.files];
  const format = outputFormat.value;
  const quality = Number(outputQuality.value) / 100;

  for (const file of files) {
    try {
      const result = format === "jpeg"
        ? await convertImageToJpeg(file, { quality, backgroundColor: "#ffffff" })
        : await convertImageToWebp(file, { quality });
      addResult({ file, result, format });
    } catch (error) {
      addResult({ file, error, format });
    }
  }

  fileInput.value = "";
});

outputQuality.addEventListener("input", () => {
  qualityValue.value = `${outputQuality.value}%`;
  qualityValue.textContent = `${outputQuality.value}%`;
});

clearButton.addEventListener("click", () => {
  for (const url of resultUrls) URL.revokeObjectURL(url);
  resultUrls.clear();
  resultsList.replaceChildren();
  emptyState.hidden = false;
});

window.addEventListener("beforeunload", () => {
  for (const url of resultUrls) URL.revokeObjectURL(url);
});
