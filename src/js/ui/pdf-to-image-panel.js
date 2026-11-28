import { createIcons, FileText, Images, Info, ArrowUp, ArrowDown, X, Trash2, Check } from "lucide";
import "../../styles/pdf-to-image.css";
import { openPdfDocument } from "../documents/pdf-to-image-mock.js";
import { convertImageDataToFormat } from "../core/conversion-service.js";

const iconSet = { FileText, Images, Info, ArrowUp, ArrowDown, X, Trash2, Check };
const renderIcons = (root = document) => createIcons({
  icons: iconSet,
  attrs: { "aria-hidden": "true" },
  root
});

const mountPoint = document.querySelector("#image-format-workspace");

if (mountPoint && !document.querySelector("#pdf-to-image-panel")) {
  mountPoint.insertAdjacentHTML("afterend", `
    <section class="pdf-to-image-panel" id="pdf-to-image-panel" aria-labelledby="pdf-to-image-title" hidden>
      <header class="pdf-to-image-heading">
        <div>
          <span class="pdf-to-image-eyebrow">DOCUMENT TOOLS · PHASE 9</span>
          <h2 id="pdf-to-image-title">PDF to Image</h2>
          <p>Choose PDF documents, select the pages you need, and arrange their export order.</p>
        </div>
        <span class="pdf-to-image-status">Local processing</span>
      </header>

      <section class="pdf-upload-card" aria-labelledby="pdf-upload-title">
        <div class="pdf-upload-copy">
          <div class="pdf-to-image-card-icon"><i data-lucide="file-text"></i></div>
          <div>
            <h3 id="pdf-upload-title">Add PDF documents</h3>
            <p>Upload one or more PDF files. Documents are opened locally in your browser.</p>
          </div>
        </div>
        <button class="pdf-add-button" id="pdf-add-button" type="button"><i data-lucide="file-text"></i> Choose PDF files</button>
        <input id="pdf-file-input" type="file" accept="application/pdf,.pdf" multiple hidden />
        <div class="pdf-dropzone" id="pdf-dropzone" tabindex="0" role="button" aria-label="Add PDF documents or drag and drop PDF files here">
          <i data-lucide="images"></i>
          <span>Drop PDF files here, or <strong>browse your device</strong></span>
          <small>PDF only · Up to 50 MiB per file</small>
        </div>
        <p class="pdf-feedback" id="pdf-feedback" role="status" aria-live="polite" hidden></p>
        <div class="pdf-loading" id="pdf-loading" hidden>
          <span class="pdf-loading-spinner" aria-hidden="true"></span>
          <span id="pdf-loading-label">Opening PDF…</span>
        </div>
      </section>

      <section class="pdf-documents-card" aria-labelledby="pdf-documents-title">
        <div class="pdf-card-heading">
          <div>
            <h3 id="pdf-documents-title">Document queue</h3>
            <p id="pdf-document-count">No documents added</p>
          </div>
          <button class="pdf-clear-button" id="pdf-clear-button" type="button" disabled><i data-lucide="trash-2"></i> Clear all</button>
        </div>
        <ul class="pdf-document-list" id="pdf-document-list">
          <li class="pdf-empty-state">Your PDF documents will appear here.</li>
        </ul>
      </section>

      <section class="pdf-pages-card" aria-labelledby="pdf-pages-title">
        <div class="pdf-card-heading pdf-pages-heading">
          <div>
            <h3 id="pdf-pages-title">Page selection and order</h3>
            <p id="pdf-page-count">Add a PDF to view its pages.</p>
          </div>
          <div class="pdf-page-actions">
            <button class="pdf-secondary-button" id="pdf-select-all-button" type="button" disabled>Select all</button>
            <button class="pdf-secondary-button" id="pdf-select-none-button" type="button" disabled>Select none</button>
          </div>
        </div>
        <div class="pdf-page-list" id="pdf-page-list">
          <div class="pdf-empty-state">Page cards will appear after a PDF is opened.</div>
        </div>
        <p class="pdf-page-hint">Selected pages will be exported in the order shown. Use the arrows to rearrange pages.</p>
      </section>

      <section class="pdf-export-card" aria-labelledby="pdf-export-title">
        <div class="pdf-card-heading">
          <div>
            <h3 id="pdf-export-title">Export configuration</h3>
            <p>Choose the output format and image resolution for selected pages.</p>
          </div>
        </div>
        <div class="pdf-export-grid">
          <label class="pdf-setting-field" for="pdf-output-format">
            <span>Output format</span>
            <select id="pdf-output-format">
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
            <small>PNG preserves lossless image quality. JPEG and WebP use compression.</small>
          </label>
          <label class="pdf-setting-field" for="pdf-output-dpi">
            <span>Resolution <strong id="pdf-dpi-value">150 DPI</strong></span>
            <input id="pdf-output-dpi" type="range" min="72" max="600" step="1" value="150" />
            <small>72–600 DPI · Default 150 DPI</small>
          </label>
          <label class="pdf-setting-field pdf-quality-field" for="pdf-output-quality" hidden>
            <span>Image quality <strong id="pdf-quality-value">85%</strong></span>
            <input id="pdf-output-quality" type="range" min="0" max="100" step="1" value="85" />
            <small>Higher quality generally creates larger files.</small>
          </label>
        </div>
        <div class="pdf-export-estimate" aria-live="polite">
          <div><span>Selected pages</span><strong id="pdf-export-selected-count">0</strong></div>
          <div><span>Estimated raster size</span><strong id="pdf-export-dimensions">—</strong></div>
          <div><span>Total pixel workload</span><strong id="pdf-export-pixels">—</strong></div>
        </div>
        <p class="pdf-export-validation" id="pdf-export-validation" role="status" aria-live="polite">Add and select PDF pages to calculate the output dimensions.</p>
      </section>

      <section class="pdf-preview-card" aria-labelledby="pdf-preview-title">
        <div class="pdf-card-heading">
          <div>
            <h3 id="pdf-preview-title">Page preview</h3>
            <p>Render selected pages with the current output settings before downloading.</p>
          </div>
          <div class="pdf-preview-actions">
            <button class="pdf-preview-button" id="pdf-preview-button" type="button" disabled>Preview selected pages</button>
            <button class="pdf-cancel-button" id="pdf-preview-cancel" type="button" hidden>Cancel preview</button>
          </div>
        </div>
        <div class="pdf-preview-progress" id="pdf-preview-progress" hidden>
          <span id="pdf-preview-progress-label" aria-live="polite">Preparing preview…</span>
          <progress id="pdf-preview-progress-bar" max="100" value="0"></progress>
        </div>
        <p class="pdf-preview-feedback" id="pdf-preview-feedback" role="status" aria-live="polite" hidden></p>
        <div class="pdf-preview-grid" id="pdf-preview-grid">
          <div class="pdf-empty-state">Rendered page previews will appear here.</div>
        </div>
      </section>

      <p class="pdf-to-image-privacy"><i data-lucide="info"></i><span>Files stay on your device. Page cards and previews currently use mock document data; actual PDF page content will appear after the real PDF engine is integrated.</span></p>
    </section>
  `);

  const root = document.querySelector("#pdf-to-image-panel");
  const $ = (selector) => root.querySelector(selector);
  const fileInput = $("#pdf-file-input");
  const dropzone = $("#pdf-dropzone");
  const feedback = $("#pdf-feedback");
  const documentList = $("#pdf-document-list");
  const pageList = $("#pdf-page-list");
  const loading = $("#pdf-loading");
  const loadingLabel = $("#pdf-loading-label");
  const addButton = $("#pdf-add-button");
  const clearButton = $("#pdf-clear-button");
  const selectAllButton = $("#pdf-select-all-button");
  const selectNoneButton = $("#pdf-select-none-button");
  const previewButton = $("#pdf-preview-button");
  const previewCancelButton = $("#pdf-preview-cancel");
  const previewProgress = $("#pdf-preview-progress");
  const previewProgressLabel = $("#pdf-preview-progress-label");
  const previewProgressBar = $("#pdf-preview-progress-bar");
  const previewFeedback = $("#pdf-preview-feedback");
  const previewGrid = $("#pdf-preview-grid");

  const documents = [];
  const pages = [];
  let nextDocumentId = 1;
  let isLoading = false;
  let loadController = null;
  let isPreviewing = false;
  let previewController = null;
  const previewObjectUrls = [];
  const exportSettings = { format: "png", dpi: 150, quality: 0.85 };
  const exportLimits = { maxDimension: 8192, maxPixelsPerPage: 16_000_000, maxPixelsPerJob: 100_000_000 };

  const formatBytes = (bytes) => bytes < 1024 ** 2
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 ** 2).toFixed(2)} MB`;

  const showFeedback = (messages, state = "info") => {
    feedback.textContent = Array.isArray(messages) ? messages.join(" ") : messages;
    feedback.dataset.state = state;
    feedback.hidden = !feedback.textContent;
  };

  const getSelectedPages = () => pages.filter((page) => page.selected);

  const getRasterDimensions = (page, dpi = exportSettings.dpi) => {
    const rotated = Math.abs(page.info.rotation || 0) % 180 === 90;
    const widthPt = rotated ? page.info.heightPt : page.info.widthPt;
    const heightPt = rotated ? page.info.widthPt : page.info.heightPt;
    return {
      width: Math.ceil(widthPt * dpi / 72),
      height: Math.ceil(heightPt * dpi / 72)
    };
  };

  const renderExportConfiguration = () => {
    const format = $("#pdf-output-format");
    const dpi = $("#pdf-output-dpi");
    const quality = $("#pdf-output-quality");
    const qualityField = $(".pdf-quality-field");
    const selectedCount = $("#pdf-export-selected-count");
    const dimensions = $("#pdf-export-dimensions");
    const pixels = $("#pdf-export-pixels");
    const validation = $("#pdf-export-validation");
    if (!format || !dpi || !quality || !qualityField) return;

    format.value = exportSettings.format;
    dpi.value = String(exportSettings.dpi);
    $("#pdf-dpi-value").textContent = `${exportSettings.dpi} DPI`;
    quality.value = String(Math.round(exportSettings.quality * 100));
    $("#pdf-quality-value").textContent = `${Math.round(exportSettings.quality * 100)}%`;
    qualityField.hidden = exportSettings.format === "png";

    const selected = getSelectedPages();
    selectedCount.textContent = String(selected.length);
    if (selected.length === 0) {
      dimensions.textContent = "—";
      pixels.textContent = "—";
      validation.textContent = "Select at least one page to prepare an export.";
      validation.dataset.state = "info";
      return;
    }

    const results = selected.map((page) => ({ page, ...getRasterDimensions(page) }));
    const totalPixels = results.reduce((sum, item) => sum + item.width * item.height, 0);
    const invalid = results.filter((item) =>
      item.width > exportLimits.maxDimension ||
      item.height > exportLimits.maxDimension ||
      item.width * item.height > exportLimits.maxPixelsPerPage
    );
    const maxWidth = Math.max(...results.map((item) => item.width));
    const maxHeight = Math.max(...results.map((item) => item.height));
    dimensions.textContent = `${maxWidth.toLocaleString()} × ${maxHeight.toLocaleString()} px max`;
    pixels.textContent = `${(totalPixels / 1_000_000).toFixed(2)} MP / 100 MP`;

    if (invalid.length > 0) {
      validation.textContent = `${invalid.length} selected page(s) exceed the 8,192 px dimension or 16 MP per-page limit. Reduce the DPI or deselect those pages.`;
      validation.dataset.state = "error";
    } else if (totalPixels > exportLimits.maxPixelsPerJob) {
      validation.textContent = "The selected pages exceed the 100 MP export-job limit. Reduce the DPI or select fewer pages.";
      validation.dataset.state = "error";
    } else {
      validation.textContent = `Configuration is valid. ${selected.length} page(s) are within the provisional raster limits.`;
      validation.dataset.state = "success";
    }
  };

  const updateSummary = () => {
    const selectedCount = getSelectedPages().length;
    $("#pdf-document-count").textContent = documents.length
      ? `${documents.length} ${documents.length === 1 ? "document" : "documents"} · ${pages.length} total pages`
      : "No documents added";
    $("#pdf-page-count").textContent = pages.length
      ? `${selectedCount} of ${pages.length} pages selected`
      : "Add a PDF to view its pages.";
    clearButton.disabled = documents.length === 0 || isLoading || isPreviewing;
    addButton.disabled = isLoading || isPreviewing;
    fileInput.disabled = isLoading || isPreviewing;
    selectAllButton.disabled = pages.length === 0 || isLoading || isPreviewing || selectedCount === pages.length;
    selectNoneButton.disabled = pages.length === 0 || isLoading || isPreviewing || selectedCount === 0;
    previewButton.disabled = selectedCount === 0 || isLoading || isPreviewing;
    $("#pdf-output-format").disabled = isLoading || isPreviewing;
    $("#pdf-output-dpi").disabled = isLoading || isPreviewing;
    $("#pdf-output-quality").disabled = isLoading || isPreviewing;
    renderExportConfiguration();
  };

  const renderDocuments = () => {
    if (documents.length === 0) {
      documentList.innerHTML = '<li class="pdf-empty-state">Your PDF documents will appear here.</li>';
      updateSummary();
      return;
    }

    documentList.innerHTML = documents.map((entry) => `
      <li class="pdf-document-item" data-document-id="${entry.id}">
        <span class="pdf-document-icon"><i data-lucide="file-text"></i></span>
        <span class="pdf-document-details">
          <strong title="${escapeHtml(entry.file.name)}">${escapeHtml(entry.file.name)}</strong>
          <small>${entry.session.numPages} pages · ${formatBytes(entry.file.size)}</small>
        </span>
        <button class="pdf-icon-button" type="button" data-remove-document="${entry.id}" aria-label="Remove ${escapeHtml(entry.file.name)}" title="Remove document"><i data-lucide="x"></i></button>
      </li>
    `).join("");
    renderIcons(documentList);
    updateSummary();
  };

  const renderPages = () => {
    if (pages.length === 0) {
      pageList.innerHTML = '<div class="pdf-empty-state">Page cards will appear after a PDF is opened.</div>';
      updateSummary();
      return;
    }

    pageList.innerHTML = pages.map((page, index) => {
      const width = page.info.widthPt || 595.28;
      const height = page.info.heightPt || 841.89;
      const rotated = Math.abs(page.info.rotation || 0) % 180 === 90;
      const ratio = rotated ? height / width : width / height;
      const documentName = documents.find((entry) => entry.id === page.documentId)?.file.name || "PDF";
      return `
        <article class="pdf-page-item ${page.selected ? "is-selected" : ""}" data-page-id="${page.id}">
          <label class="pdf-page-select">
            <input type="checkbox" data-select-page="${page.id}" ${page.selected ? "checked" : ""} ${isLoading || isPreviewing ? "disabled" : ""} />
            <span class="pdf-page-check"><i data-lucide="check"></i></span>
            <span class="pdf-page-select-label">Select page</span>
          </label>
          <div class="pdf-page-thumb-wrap">
            <div class="pdf-page-thumb" style="--page-ratio:${Math.max(0.55, Math.min(1.8, ratio)).toFixed(3)}">
              <span class="pdf-page-thumb-fold"></span>
              <strong>${page.pageNumber}</strong>
              <small>PDF PAGE</small>
            </div>
          </div>
          <div class="pdf-page-meta">
            <strong>Page ${page.pageNumber}</strong>
            <span title="${escapeHtml(documentName)}">${escapeHtml(documentName)}</span>
            <small>${Math.round(width)} × ${Math.round(height)} pt</small>
          </div>
          <div class="pdf-page-controls">
            <button class="pdf-icon-button" type="button" data-move-page="${page.id}" data-direction="-1" aria-label="Move page ${page.pageNumber} up" title="Move up" ${index === 0 || isLoading || isPreviewing ? "disabled" : ""}><i data-lucide="arrow-up"></i></button>
            <button class="pdf-icon-button" type="button" data-move-page="${page.id}" data-direction="1" aria-label="Move page ${page.pageNumber} down" title="Move down" ${index === pages.length - 1 || isLoading || isPreviewing ? "disabled" : ""}><i data-lucide="arrow-down"></i></button>
            <button class="pdf-icon-button pdf-remove-page" type="button" data-remove-page="${page.id}" aria-label="Remove page ${page.pageNumber}" title="Remove page" ${isLoading || isPreviewing ? "disabled" : ""}><i data-lucide="x"></i></button>
          </div>
        </article>
      `;
    }).join("");
    renderIcons(pageList);
    updateSummary();
  };

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  const setLoading = (active, label = "Opening PDF…") => {
    isLoading = active;
    loading.hidden = !active;
    loadingLabel.textContent = label;
    addButton.disabled = active;
    fileInput.disabled = active;
    updateSummary();
    renderDocuments();
    renderPages();
  };

  const clearPreview = () => {
    for (const url of previewObjectUrls.splice(0)) URL.revokeObjectURL(url);
    previewGrid.innerHTML = '<div class="pdf-empty-state">Rendered page previews will appear here.</div>';
    previewFeedback.hidden = true;
    previewFeedback.textContent = "";
    previewProgress.hidden = true;
    previewProgressBar.value = 0;
  };

  const appendPreview = (page, documentName, url, dimensions) => {
    const card = document.createElement("article");
    card.className = "pdf-preview-item";
    const image = document.createElement("img");
    image.src = url;
    image.alt = `Preview of page ${page.pageNumber} from ${documentName}`;
    image.loading = "lazy";
    const caption = document.createElement("div");
    caption.className = "pdf-preview-caption";
    const title = document.createElement("strong");
    title.textContent = `Page ${page.pageNumber}`;
    const detail = document.createElement("span");
    detail.textContent = `${documentName} · ${dimensions.width} × ${dimensions.height} px`;
    caption.append(title, detail);
    card.append(image, caption);
    const emptyState = previewGrid.querySelector(".pdf-empty-state");
    if (emptyState) emptyState.remove();
    previewGrid.append(card);
  };

  const runPreview = async () => {
    if (isLoading || isPreviewing) return;
    const selected = getSelectedPages();
    if (!selected.length) {
      showFeedback("Select at least one page before creating a preview.", "warning");
      return;
    }
    renderExportConfiguration();
    if ($("#pdf-export-validation").dataset.state === "error") {
      showFeedback("The current export settings exceed the raster limits. Reduce the DPI or select fewer pages.", "error");
      return;
    }

    clearPreview();
    showFeedback("");
    isPreviewing = true;
    previewController = new AbortController();
    const { signal } = previewController;
    previewProgress.hidden = false;
    previewCancelButton.hidden = false;
    previewProgressBar.max = selected.length;
    previewProgressLabel.textContent = `Preparing ${selected.length} selected page(s)…`;
    updateSummary();

    let completed = 0;
    const errors = [];
    try {
      for (let index = 0; index < selected.length; index += 1) {
        const page = selected[index];
        if (signal.aborted) break;
        const entry = documents.find((item) => item.id === page.documentId);
        if (!entry) {
          errors.push(`Page ${page.pageNumber}: its PDF document is no longer available.`);
          previewProgressBar.value = index + 1;
          continue;
        }

        let rendered = null;
        try {
          previewProgressLabel.textContent = `Rendering page ${index + 1} of ${selected.length}…`;
          rendered = await entry.session.renderPage(page.pageNumber, {
            dpi: exportSettings.dpi,
            signal,
            onProgress(snapshot) {
              if (snapshot.phase === "rendering") {
                previewProgressLabel.textContent = `Rendering page ${index + 1} of ${selected.length}…`;
              }
            }
          });
          if (signal.aborted) break;

          const options = exportSettings.format === "png"
            ? {}
            : { quality: exportSettings.quality, backgroundColor: "#ffffff" };
          const encoded = await convertImageDataToFormat(rendered.imageData, exportSettings.format, options);
          if (signal.aborted) break;

          const url = URL.createObjectURL(encoded.blob);
          previewObjectUrls.push(url);
          appendPreview(page, entry.file.name, url, { width: encoded.width, height: encoded.height });
          completed += 1;
        } catch (error) {
          if (signal.aborted || error?.code === "ABORTED") break;
          errors.push(`Page ${page.pageNumber}: ${error.message || "Preview rendering failed."}`);
        } finally {
          if (rendered) rendered.imageData = null;
        }

        previewProgressBar.value = index + 1;
      }
    } finally {
      const wasCancelled = signal.aborted;
      previewController = null;
      isPreviewing = false;
      previewCancelButton.hidden = true;
      previewProgressBar.value = wasCancelled ? completed : selected.length;
      previewProgressLabel.textContent = wasCancelled
        ? `Preview cancelled · ${completed} page(s) completed`
        : `Preview complete · ${completed} of ${selected.length} page(s) rendered`;
      if (errors.length) {
        previewFeedback.textContent = errors.join(" ");
        previewFeedback.dataset.state = "error";
        previewFeedback.hidden = false;
      } else if (wasCancelled) {
        previewFeedback.textContent = "Preview was cancelled. Completed page previews remain available.";
        previewFeedback.dataset.state = "warning";
        previewFeedback.hidden = false;
      } else if (completed === 0) {
        previewFeedback.textContent = "No pages could be previewed.";
        previewFeedback.dataset.state = "error";
        previewFeedback.hidden = false;
      } else {
        previewFeedback.textContent = "All selected pages were rendered successfully.";
        previewFeedback.dataset.state = "success";
        previewFeedback.hidden = false;
      }
      updateSummary();
    }
  };

  const destroyDocument = async (entry) => {
    try {
      await entry.session?.destroy();
    } catch (error) {
      console.warn("Could not destroy PDF session:", error);
    }
  };

  const removeDocument = async (documentId) => {
    if (isLoading) return;
    const index = documents.findIndex((entry) => entry.id === documentId);
    if (index < 0) return;
    clearPreview();
    const [entry] = documents.splice(index, 1);
    for (let pageIndex = pages.length - 1; pageIndex >= 0; pageIndex -= 1) {
      if (pages[pageIndex].documentId === documentId) pages.splice(pageIndex, 1);
    }
    await destroyDocument(entry);
    renderDocuments();
    renderPages();
  };

  const addFiles = async (fileList) => {
    const candidates = [...fileList];
    if (candidates.length === 0 || isLoading || isPreviewing) return;

    clearPreview();
    const rejected = [];
    let addedCount = 0;

    for (const file of candidates) {
      if (!(file instanceof Blob) || file.size === 0) {
        rejected.push(`${file.name || "Unnamed file"} is empty or invalid.`);
        continue;
      }
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        rejected.push(`${file.name}: only PDF files are supported.`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        rejected.push(`${file.name}: exceeds the 50 MiB file limit.`);
        continue;
      }
      const duplicate = documents.some((entry) =>
        entry.file.name === file.name &&
        entry.file.size === file.size &&
        entry.file.lastModified === file.lastModified
      );
      if (duplicate) continue;

      setLoading(true, `Opening ${file.name}…`);
      const controller = new AbortController();
      loadController = controller;
      try {
        const session = await openPdfDocument(file, {
          signal: controller.signal,
          onProgress(snapshot) {
            if (snapshot.phase === "loading" && snapshot.total) {
              const percent = Math.round((snapshot.loaded / snapshot.total) * 100);
              loadingLabel.textContent = `Opening ${file.name}… ${percent}%`;
            }
          }
        });

        if (session.numPages > 200) {
          await session.destroy();
          rejected.push(`${file.name}: exceeds the 200-page limit.`);
          continue;
        }

        const pageMetadata = [];
        for (let pageNumber = 1; pageNumber <= session.numPages; pageNumber += 1) {
          pageMetadata.push({
            pageNumber,
            info: await session.getPageInfo(pageNumber)
          });
        }

        const entry = { id: nextDocumentId++, file, session };
        documents.push(entry);
        for (const metadata of pageMetadata) {
          pages.push({
            id: `${entry.id}:${metadata.pageNumber}`,
            documentId: entry.id,
            pageNumber: metadata.pageNumber,
            info: metadata.info,
            selected: true
          });
        }
        addedCount += 1;
      } catch (error) {
        rejected.push(`${file.name}: ${error.message || "Could not open this PDF."}`);
      } finally {
        loadController = null;
        setLoading(false);
      }
    }

    renderDocuments();
    renderPages();
    if (rejected.length) showFeedback(rejected, addedCount ? "warning" : "error");
    else if (addedCount) showFeedback(`${addedCount} PDF ${addedCount === 1 ? "document was" : "documents were"} added successfully.`, "success");
    else showFeedback("");
  };

  addButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (event) => {
    addFiles(event.target.files);
    fileInput.value = "";
  });

  dropzone.addEventListener("click", (event) => {
    if (!event.target.closest("button")) fileInput.click();
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
  dropzone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

  documentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-document]");
    if (button) removeDocument(Number(button.dataset.removeDocument));
  });

  pageList.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-select-page]");
    if (!checkbox || isLoading || isPreviewing) return;
    const page = pages.find((entry) => entry.id === checkbox.dataset.selectPage);
    if (!page) return;
    clearPreview();
    page.selected = checkbox.checked;
    renderPages();
  });

  pageList.addEventListener("click", (event) => {
    if (isLoading || isPreviewing) return;
    const moveButton = event.target.closest("[data-move-page]");
    if (moveButton) {
      clearPreview();
      const index = pages.findIndex((entry) => entry.id === moveButton.dataset.movePage);
      const target = index + Number(moveButton.dataset.direction);
      if (index < 0 || target < 0 || target >= pages.length) return;
      [pages[index], pages[target]] = [pages[target], pages[index]];
      renderPages();
      return;
    }
    const removeButton = event.target.closest("[data-remove-page]");
    if (removeButton) {
      clearPreview();
      const index = pages.findIndex((entry) => entry.id === removeButton.dataset.removePage);
      if (index >= 0) pages.splice(index, 1);
      renderPages();
    }
  });

  selectAllButton.addEventListener("click", () => {
    clearPreview();
    pages.forEach((page) => { page.selected = true; });
    renderPages();
  });
  selectNoneButton.addEventListener("click", () => {
    clearPreview();
    pages.forEach((page) => { page.selected = false; });
    renderPages();
  });

  previewButton.addEventListener("click", runPreview);
  previewCancelButton.addEventListener("click", () => previewController?.abort());

  $("#pdf-output-format").addEventListener("change", (event) => {
    clearPreview();
    exportSettings.format = event.target.value;
    renderExportConfiguration();
  });
  $("#pdf-output-dpi").addEventListener("input", (event) => {
    clearPreview();
    exportSettings.dpi = Number(event.target.value);
    renderExportConfiguration();
  });
  $("#pdf-output-quality").addEventListener("input", (event) => {
    clearPreview();
    exportSettings.quality = Number(event.target.value) / 100;
    renderExportConfiguration();
  });

  clearButton.addEventListener("click", async () => {
    if (isLoading || isPreviewing) return;
    clearPreview();
    const current = [...documents];
    documents.length = 0;
    pages.length = 0;
    renderDocuments();
    renderPages();
    await Promise.all(current.map(destroyDocument));
    showFeedback("");
  });

  window.addEventListener("beforeunload", () => {
    loadController?.abort();
    previewController?.abort();
    for (const url of previewObjectUrls) URL.revokeObjectURL(url);
    for (const entry of documents) {
      try { entry.session.destroy(); } catch { /* Best-effort page unload cleanup. */ }
    }
  });

  renderDocuments();
  renderPages();
  renderIcons(root);
}
