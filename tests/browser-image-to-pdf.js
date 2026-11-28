import { createImagePdf } from "../src/js/documents/image-to-pdf.js";

const $ = (selector) => document.querySelector(selector);
const fileInput = $("#files");
const generateButton = $("#generate");
const cancelButton = $("#cancel");
const progress = $("#progress");
const status = $("#status");
const preview = $("#preview");
const download = $("#download");
const details = $("#details");

let controller = null;
let pdfUrl = null;

function clearOutput() {
  if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  pdfUrl = null;
  preview.removeAttribute("src");
  preview.hidden = true;
  download.removeAttribute("href");
  download.hidden = true;
}

function setBusy(busy) {
  generateButton.disabled = busy;
  cancelButton.disabled = !busy;
  fileInput.disabled = busy;
}

generateButton.addEventListener("click", async () => {
  const files = [...fileInput.files];
  if (files.length === 0) {
    status.textContent = "Select at least one image.";
    return;
  }

  clearOutput();
  controller = new AbortController();
  setBusy(true);
  progress.value = 0;
  details.textContent = "Starting local PDF generation…";
  status.textContent = "Preparing export…";

  try {
    const result = await createImagePdf({
      images: files.map((file, index) => ({
        id: "browser-qa-" + index,
        file
      })),
      options: {
        pageSize: $("#page-size").value,
        orientation: $("#orientation").value,
        fit: $("#fit").value,
        marginMm: Number($("#margin").value),
        background: "white"
      },
      signal: controller.signal,
      onProgress(snapshot) {
        const labels = {
          validating: "Validating images",
          decoding: "Decoding image",
          composing: "Composing PDF page",
          finalizing: "Validating PDF output"
        };
        status.textContent = labels[snapshot.phase] || snapshot.phase;
        if (snapshot.phase === "finalizing") {
          progress.removeAttribute("value");
        } else {
          progress.max = snapshot.total || 1;
          progress.value = snapshot.completed;
        }
        details.textContent = JSON.stringify(snapshot, null, 2);
      }
    });

    pdfUrl = URL.createObjectURL(result.blob);
    preview.src = pdfUrl;
    preview.hidden = false;
    download.href = pdfUrl;
    download.download = result.filename;
    download.hidden = false;
    progress.max = result.pageCount;
    progress.value = result.pageCount;
    status.textContent = "PDF generated and validated. " + result.pageCount + " page(s).";
    details.textContent = JSON.stringify({
      filename: result.filename,
      pageCount: result.pageCount,
      sizeBytes: result.blob.size,
      pages: result.pages,
      warnings: result.warnings
    }, null, 2);
  } catch (error) {
    progress.value = 0;
    const imageLabel = Number.isInteger(error.imageIndex)
      ? "\nImage: " + error.imageId + " (index " + error.imageIndex + ")"
      : "";
    status.textContent = (error.message || "PDF generation failed.") + imageLabel;
    details.textContent = JSON.stringify({
      name: error.name,
      code: error.code,
      message: error.message,
      imageId: error.imageId,
      imageIndex: error.imageIndex,
      cause: error.cause?.message
    }, null, 2);
  } finally {
    controller = null;
    setBusy(false);
  }
});

cancelButton.addEventListener("click", () => controller?.abort());

window.addEventListener("beforeunload", () => {
  controller?.abort();
  clearOutput();
});
