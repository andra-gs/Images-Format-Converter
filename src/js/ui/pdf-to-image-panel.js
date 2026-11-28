import { createIcons, FileText, Images, Info, ArrowUp, ArrowDown, X, Trash2, Check } from "lucide";
import "../../styles/pdf-to-image.css";
import { openPdfDocument } from "../documents/pdf-to-image-mock.js";

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

      <p class="pdf-to-image-privacy"><i data-lucide="info"></i><span>Files stay on your device. This phase uses a separate UI mock for PDF loading and page metadata; actual PDF page rendering will be connected to the PDF engine after UI development.</span></p>
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

  const documents = [];
  const pages = [];
  let nextDocumentId = 1;
  let isLoading = false;
  let loadController = null;

  const formatBytes = (bytes) => bytes < 1024 ** 2
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 ** 2).toFixed(2)} MB`;

  const showFeedback = (messages, state = "info") => {
    feedback.textContent = Array.isArray(messages) ? messages.join(" ") : messages;
    feedback.dataset.state = state;
    feedback.hidden = !feedback.textContent;
  };

  const getSelectedPages = () => pages.filter((page) => page.selected);

  const updateSummary = () => {
    const selectedCount = getSelectedPages().length;
    $("#pdf-document-count").textContent = documents.length
      ? `${documents.length} ${documents.length === 1 ? "document" : "documents"} · ${pages.length} total pages`
      : "No documents added";
    $("#pdf-page-count").textContent = pages.length
      ? `${selectedCount} of ${pages.length} pages selected`
      : "Add a PDF to view its pages.";
    clearButton.disabled = documents.length === 0 || isLoading;
    addButton.disabled = isLoading;
    fileInput.disabled = isLoading;
    selectAllButton.disabled = pages.length === 0 || isLoading || selectedCount === pages.length;
    selectNoneButton.disabled = pages.length === 0 || isLoading || selectedCount === 0;
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
            <input type="checkbox" data-select-page="${page.id}" ${page.selected ? "checked" : ""} />
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
            <button class="pdf-icon-button" type="button" data-move-page="${page.id}" data-direction="-1" aria-label="Move page ${page.pageNumber} up" title="Move up" ${index === 0 || isLoading ? "disabled" : ""}><i data-lucide="arrow-up"></i></button>
            <button class="pdf-icon-button" type="button" data-move-page="${page.id}" data-direction="1" aria-label="Move page ${page.pageNumber} down" title="Move down" ${index === pages.length - 1 || isLoading ? "disabled" : ""}><i data-lucide="arrow-down"></i></button>
            <button class="pdf-icon-button pdf-remove-page" type="button" data-remove-page="${page.id}" aria-label="Remove page ${page.pageNumber}" title="Remove page" ${isLoading ? "disabled" : ""}><i data-lucide="x"></i></button>
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
    if (candidates.length === 0 || isLoading) return;

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

        const entry = { id: nextDocumentId++, file, session };
        documents.push(entry);

        for (let pageNumber = 1; pageNumber <= session.numPages; pageNumber += 1) {
          const info = await session.getPageInfo(pageNumber);
          pages.push({
            id: `${entry.id}:${pageNumber}`,
            documentId: entry.id,
            pageNumber,
            info,
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
    if (!checkbox || isLoading) return;
    const page = pages.find((entry) => entry.id === checkbox.dataset.selectPage);
    if (!page) return;
    page.selected = checkbox.checked;
    renderPages();
  });

  pageList.addEventListener("click", (event) => {
    if (isLoading) return;
    const moveButton = event.target.closest("[data-move-page]");
    if (moveButton) {
      const index = pages.findIndex((entry) => entry.id === moveButton.dataset.movePage);
      const target = index + Number(moveButton.dataset.direction);
      if (index < 0 || target < 0 || target >= pages.length) return;
      [pages[index], pages[target]] = [pages[target], pages[index]];
      renderPages();
      return;
    }
    const removeButton = event.target.closest("[data-remove-page]");
    if (removeButton) {
      const index = pages.findIndex((entry) => entry.id === removeButton.dataset.removePage);
      if (index >= 0) pages.splice(index, 1);
      renderPages();
    }
  });

  selectAllButton.addEventListener("click", () => {
    pages.forEach((page) => { page.selected = true; });
    renderPages();
  });
  selectNoneButton.addEventListener("click", () => {
    pages.forEach((page) => { page.selected = false; });
    renderPages();
  });

  clearButton.addEventListener("click", async () => {
    if (isLoading) return;
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
    for (const entry of documents) {
      try { entry.session.destroy(); } catch { /* Best-effort page unload cleanup. */ }
    }
  });

  renderDocuments();
  renderPages();
  renderIcons(root);
}
