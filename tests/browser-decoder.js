import { decodeImage } from "../src/js/core/image-decoder.js";

const fileInput = document.querySelector("#decoder-file-input");
const resultsList = document.querySelector("#decoder-results");
const emptyState = document.querySelector("#empty-state");
const clearButton = document.querySelector("#clear-results");

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

const addResult = ({ file, detail, status, success }) => {
  const item = document.createElement("li");
  item.className = "result-item";

  const name = document.createElement("div");
  name.className = "result-name";
  name.textContent = file.name;

  const metadata = document.createElement("div");
  metadata.className = "result-detail";
  metadata.textContent = `${formatBytes(file.size)} · ${file.type || "MIME type unavailable"}`;

  const result = document.createElement("div");
  result.className = `result-status ${success ? "success" : "error"}`;
  result.textContent = status;

  const extra = document.createElement("div");
  extra.className = "result-detail";
  extra.textContent = detail;

  item.append(name, metadata, result, extra);
  resultsList.append(item);
  emptyState.hidden = true;
};

fileInput.addEventListener("change", async () => {
  const files = [...fileInput.files];

  for (const file of files) {
    try {
      const decoded = await decodeImage(file);
      const detail = `Detected: ${decoded.format.toUpperCase()} · Dimensions: ${decoded.width} × ${decoded.height}`;
      decoded.close();

      addResult({
        file,
        detail: `${detail} · Decoder resource released`,
        status: "Decode successful",
        success: true
      });
    } catch (error) {
      addResult({
        file,
        detail: error.message,
        status: "Decode failed",
        success: false
      });
    }
  }

  fileInput.value = "";
});

clearButton.addEventListener("click", () => {
  resultsList.replaceChildren();
  emptyState.hidden = false;
});
