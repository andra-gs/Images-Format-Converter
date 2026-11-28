import { createIcons, FileText, ImagePlus, Images, ArrowUp, ArrowDown, X, FileOutput, Info } from "lucide";
import "../styles/image-to-pdf.css";
import { validateImageFile } from "../core/file-validator.js";
import { decodeImage } from "../core/image-decoder.js";
import { createImageThumbnail } from "../core/image-thumbnail.js";
import { calculateImagePdfPageLayout, createImagePdf } from "./image-to-pdf-mock.js";

const iconSet = { FileText, ImagePlus, Images, ArrowUp, ArrowDown, X, FileOutput, Info, RotateCcw };
const renderIcons = (root = document) => createIcons({ icons: iconSet, attrs: { "aria-hidden": "true" }, root });

const mountPoint = document.querySelector(".phase-note");
if (mountPoint && !document.querySelector("#image-to-pdf-panel")) {
  mountPoint.insertAdjacentHTML("beforebegin", `
    <section class="image-to-pdf-panel" id="image-to-pdf-panel" aria-labelledby="pdf-title">
      <div class="pdf-panel-heading">
        <div class="pdf-heading-copy">
          <span class="pdf-eyebrow">DOCUMENT TOOLS · PHASE 8</span>
          <h2 id="pdf-title">Image to PDF</h2>
          <p>Combine your images into an ordered, multi-page PDF. Everything stays in this browser.</p>
        </div>
        <span class="pdf-beta-label">UI preview</span>
      </div>

      <div class="pdf-upload-row">
        <div class="pdf-upload-copy">
          <strong>Add images</strong>
          <span>Choose multiple image files or drop them here. Arrange the page order below.</span>
        </div>
        <label class="pdf-add-button" for="pdf-file-input"><i data-lucide="image-plus"></i> Add images</label>
        <input id="pdf-file-input" type="file" accept="image/*" multiple hidden />
      </div>
      <div class="pdf-dropzone" id="pdf-dropzone" tabindex="0" role="button" aria-label="Add images or drag and drop them here">
        <i data-lucide="images"></i>
        <span>Drop images here, or use <strong>Add images</strong></span>
      </div>
      <p class="pdf-feedback" id="pdf-feedback" role="status" aria-live="polite" hidden></p>

      <div class="pdf-workspace-grid">
        <section class="pdf-queue-card" aria-labelledby="pdf-queue-title">
          <div class="pdf-card-heading">
            <div>
              <h3 id="pdf-queue-title">Page order</h3>
              <p id="pdf-queue-count">0 images · 0 pages</p>
            </div>
            <button class="pdf-clear-button" id="pdf-clear-button" type="button" disabled>Clear all</button>
          </div>
          <ol class="pdf-queue-list" id="pdf-queue-list">
            <li class="pdf-queue-empty">Your selected images will appear here.</li>
          </ol>
          <p class="pdf-queue-hint">Use the arrows to change the order. Each image becomes one PDF page.</p>
        </section>

        <section class="pdf-preview-card" aria-labelledby="pdf-preview-title">
          <div class="pdf-card-heading">
            <div>
              <h3 id="pdf-preview-title">Page preview</h3>
              <p id="pdf-preview-caption">Add an image to preview its page.</p>
            </div>
            <span class="pdf-page-counter" id="pdf-page-counter">— / —</span>
          </div>
          <div class="pdf-preview-stage">
            <div class="pdf-page" id="pdf-page" aria-label="PDF page preview">
              <img id="pdf-preview-image" alt="Preview of the selected image on the PDF page" hidden />
              <span id="pdf-preview-placeholder">Page preview</span>
            </div>
          </div>
          <div class="pdf-preview-meta" id="pdf-preview-meta">Preview geometry is supplied by the shared layout helper.</div>
        </section>
      </div>

      <section class="pdf-settings-card" aria-labelledby="pdf-settings-title">
        <div class="pdf-card-heading">
          <div>
            <h3 id="pdf-settings-title">Page settings</h3>
            <p>These settings apply to every page unless Image Size is selected.</p>
          </div>
        </div>
        <div class="pdf-settings-grid">
          <div class="pdf-field">
            <label for="pdf-page-size">Page size</label>
            <select id="pdf-page-size">
              <option value="A4" selected>A4</option>
              <option value="A5">A5</option>
              <option value="LETTER">Letter</option>
              <option value="IMAGE">Image Size (96 PPI)</option>
            </select>
          </div>
          <div class="pdf-field" id="pdf-orientation-field">
            <label for="pdf-orientation">Orientation</label>
            <select id="pdf-orientation">
              <option value="portrait" selected>Portrait</option>
              <option value="landscape">Landscape</option>
              <option value="auto">Auto (based on image)</option>
            </select>
          </div>
          <div class="pdf-field">
            <label for="pdf-fit">Image placement</label>
            <select id="pdf-fit">
              <option value="contain" selected>Fit — show full image</option>
              <option value="cover">Fill — crop to fill page</option>
            </select>
          </div>
          <div class="pdf-field">
            <label for="pdf-margin-mode">Margins</label>
            <select id="pdf-margin-mode">
              <option value="uniform" selected>Same on all sides</option>
              <option value="individual">Set each side</option>
            </select>
          </div>
          <div class="pdf-field" id="pdf-uniform-margin-field">
            <label for="pdf-margin-uniform">Margin (mm)</label>
            <input id="pdf-margin-uniform" type="number" min="0" max="250" step="0.5" value="10" />
          </div>
          <div class="pdf-margin-sides" id="pdf-margin-sides" hidden>
            <div class="pdf-field"><label for="pdf-margin-top">Top (mm)</label><input id="pdf-margin-top" type="number" min="0" max="250" step="0.5" value="10" /></div>
            <div class="pdf-field"><label for="pdf-margin-right">Right (mm)</label><input id="pdf-margin-right" type="number" min="0" max="250" step="0.5" value="10" /></div>
            <div class="pdf-field"><label for="pdf-margin-bottom">Bottom (mm)</label><input id="pdf-margin-bottom" type="number" min="0" max="250" step="0.5" value="10" /></div>
            <div class="pdf-field"><label for="pdf-margin-left">Left (mm)</label><input id="pdf-margin-left" type="number" min="0" max="250" step="0.5" value="10" /></div>
          </div>
        </div>
        <div class="pdf-settings-note"><i data-lucide="info"></i><span>White page background is the only available option for now. Transparency will remain hidden until real PDF output passes verification in two independent viewers.</span></div>
      </section>

      <section class="pdf-export-card" aria-labelledby="pdf-export-title">
        <div class="pdf-export-copy">
          <h3 id="pdf-export-title">Export PDF</h3>
          <p id="pdf-export-description">The UI is connected to a contract mock while the PDF engine is being developed separately.</p>
        </div>
        <div class="pdf-progress" id="pdf-progress" hidden>
          <div class="pdf-progress-heading"><span id="pdf-progress-label">Preparing export…</span><span id="pdf-progress-count"></span></div>
          <progress id="pdf-progress-bar" max="100" value="0"></progress>
        </div>
        <div class="pdf-export-actions">
          <button class="pdf-export-button" id="pdf-export-button" type="button" disabled><i data-lucide="file-output"></i> Run mock export</button>
          <button class="pdf-cancel-button" id="pdf-cancel-button" type="button" hidden>Cancel</button>
        </div>
        <p class="pdf-mock-disclaimer" id="pdf-mock-disclaimer">Mock mode only: this flow does not create or download a PDF file.</p>
      </section>
    </section>
  `);

  const root = document.querySelector("#image-to-pdf-panel");
  const $ = (selector) => root.querySelector(selector);
  const fileInput = $("#pdf-file-input");
  const dropzone = $("#pdf-dropzone");
  const queueList = $("#pdf-queue-list");
  const feedback = $("#pdf-feedback");
  const clearButton = $("#pdf-clear-button");
  const pageSize = $("#pdf-page-size");
  const orientation = $("#pdf-orientation");
  const fit = $("#pdf-fit");
  const marginMode = $("#pdf-margin-mode");
  const uniformMargin = $("#pdf-margin-uniform");
  const marginInputs = ["top", "right", "bottom", "left"].map((side) => $(`#pdf-margin-${side}`));
  const page = $("#pdf-page");
  const previewImage = $("#pdf-preview-image");
  const previewPlaceholder = $("#pdf-preview-placeholder");
  const exportButton = $("#pdf-export-button");
  const cancelButton = $("#pdf-cancel-button");
  const progress = $("#pdf-progress");
  const progressLabel = $("#pdf-progress-label");
  const progressCount = $("#pdf-progress-count");
  const progressBar = $("#pdf-progress-bar");

  const entries = [];
  let activeIndex = 0;
  let nextId = 1;
  let controller = null;
  let running = false;
  let previewLoadToken = 0;

  const formatBytes = (bytes) => bytes < 1024 ** 2
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 ** 2).toFixed(2)} MB`;

  const getOptions = () => ({
    pageSize: pageSize.value,
    orientation: orientation.value,
    fit: fit.value,
    background: "white",
    marginMm: marginMode.value === "uniform"
      ? Number(uniformMargin.value)
      : Object.fromEntries(["top", "right", "bottom", "left"].map((side, index) => [side, Number(marginInputs[index].value)]))
  });

  const showFeedback = (message, state = "info") => {
    feedback.textContent = message;
    feedback.dataset.state = state;
    feedback.hidden = !message;
  };

  const updateControls = () => {
    $("#pdf-queue-count").textContent = `${entries.length} ${entries.length === 1 ? "image" : "images"} · ${entries.length} ${entries.length === 1 ? "page" : "pages"}`;
    clearButton.disabled = entries.length === 0 || running;
    exportButton.disabled = entries.length === 0 || running;
    pageSize.disabled = running;
    orientation.disabled = running || pageSize.value === "IMAGE";
    fit.disabled = running;
    marginMode.disabled = running;
    uniformMargin.disabled = running || marginMode.value !== "uniform";
    marginInputs.forEach((input) => { input.disabled = running || marginMode.value !== "individual"; });
    $("#pdf-orientation-field").classList.toggle("is-disabled", pageSize.value === "IMAGE");
    $("#pdf-uniform-margin-field").hidden = marginMode.value !== "uniform";
    $("#pdf-margin-sides").hidden = marginMode.value !== "individual";
    $("#pdf-margin-sides").classList.toggle("is-visible", marginMode.value === "individual");
  };

  const renderQueue = () => {
    queueList.replaceChildren();
    if (entries.length === 0) {
      const empty = document.createElement("li");
      empty.className = "pdf-queue-empty";
      empty.textContent = "Your selected images will appear here.";
      queueList.append(empty);
    }

    entries.forEach((entry, index) => {
      const item = document.createElement("li");
      item.className = `pdf-queue-item${index === activeIndex ? " is-active" : ""}`;
      item.dataset.id = entry.id;

      const select = document.createElement("button");
      select.className = "pdf-queue-select";
      select.type = "button";
      select.setAttribute("aria-label", `Preview page ${index + 1}: ${entry.file.name}`);
      select.addEventListener("click", () => {
        activeIndex = index;
        renderQueue();
        renderPreview();
      });

      const thumb = document.createElement("img");
      thumb.className = "pdf-queue-thumb";
      if (entry.url) thumb.src = entry.url;
      else {
        thumb.classList.add("pdf-queue-thumb-empty");
        thumb.removeAttribute("src");
      }
      thumb.alt = "";
      const details = document.createElement("span");
      details.className = "pdf-queue-details";
      const name = document.createElement("strong");
      name.textContent = entry.file.name;
      const meta = document.createElement("small");
      meta.textContent = `Page ${index + 1} · ${formatBytes(entry.file.size)}`;
      details.append(name, meta);
      select.append(thumb, details);

      const actions = document.createElement("span");
      actions.className = "pdf-queue-actions";
      const up = document.createElement("button");
      up.className = "pdf-icon-button";
      up.type = "button";
      up.innerHTML = '<i data-lucide="arrow-up"></i>';
      up.setAttribute("aria-label", `Move ${entry.file.name} up`);
      up.disabled = running || index === 0;
      up.addEventListener("click", () => moveEntry(index, -1));
      const down = document.createElement("button");
      down.className = "pdf-icon-button";
      down.type = "button";
      down.innerHTML = '<i data-lucide="arrow-down"></i>';
      down.setAttribute("aria-label", `Move ${entry.file.name} down`);
      down.disabled = running || index === entries.length - 1;
      down.addEventListener("click", () => moveEntry(index, 1));
      const remove = document.createElement("button");
      remove.className = "pdf-icon-button is-remove";
      remove.type = "button";
      remove.innerHTML = '<i data-lucide="x"></i>';
      remove.setAttribute("aria-label", `Remove ${entry.file.name}`);
      remove.disabled = running;
      remove.addEventListener("click", () => removeEntry(index));
      actions.append(up, down, remove);
      item.append(select, actions);
      queueList.append(item);
    });

    updateControls();
    renderIcons(root);
  };

  const renderPreview = async () => {
    const entry = entries[activeIndex];
    const token = ++previewLoadToken;
    if (!entry) {
      previewImage.hidden = true;
      previewPlaceholder.hidden = false;
      page.style.aspectRatio = "210 / 297";
      page.style.setProperty("--page-width", "210");
      $("#pdf-preview-caption").textContent = "Add an image to preview its page.";
      $("#pdf-page-counter").textContent = "— / —";
      $("#pdf-preview-meta").textContent = "Preview geometry is supplied by the shared layout helper.";
      return;
    }

    $("#pdf-preview-caption").textContent = entry.file.name;
    $("#pdf-page-counter").textContent = `${activeIndex + 1} / ${entries.length}`;

    try {
      if (!entry.width || !entry.height) {
        throw new Error("The image preview could not be decoded. The PDF engine will validate the original file during export.");
      }
      const layout = calculateImagePdfPageLayout({
        imageWidth: entry.width,
        imageHeight: entry.height,
        options: getOptions()
      });
      if (token !== previewLoadToken || !entries.includes(entry)) return;
      const { pageWidthPt, pageHeightPt, contentRect, imageRect, crop } = layout;
      page.style.aspectRatio = `${pageWidthPt} / ${pageHeightPt}`;
      if (entry.url) {
        previewImage.src = entry.url;
        previewImage.hidden = false;
        previewPlaceholder.hidden = true;
        previewImage.style.left = `${imageRect.x / pageWidthPt * 100}%`;
        previewImage.style.top = `${imageRect.y / pageHeightPt * 100}%`;
        previewImage.style.width = `${imageRect.width / pageWidthPt * 100}%`;
        previewImage.style.height = `${imageRect.height / pageHeightPt * 100}%`;
        previewImage.style.objectFit = crop ? "cover" : "contain";
        previewImage.style.objectPosition = "center";
      } else {
        previewImage.hidden = true;
        previewPlaceholder.hidden = false;
        previewPlaceholder.textContent = "Thumbnail unavailable";
      }
      $("#pdf-preview-meta").textContent = `${pageWidthPt.toFixed(1)} × ${pageHeightPt.toFixed(1)} pt · Content area ${contentRect.width.toFixed(1)} × ${contentRect.height.toFixed(1)} pt`;
    } catch (error) {
      previewImage.hidden = true;
      previewPlaceholder.hidden = false;
      previewPlaceholder.textContent = error.message || "Preview is unavailable for these settings.";
      $("#pdf-preview-meta").textContent = "Adjust the page settings to restore the preview.";
    }
  };

  const moveEntry = (index, offset) => {
    const next = index + offset;
    if (running || next < 0 || next >= entries.length) return;
    [entries[index], entries[next]] = [entries[next], entries[index]];
    activeIndex = next;
    renderQueue();
    renderPreview();
  };

  const removeEntry = (index) => {
    if (running) return;
    const [removed] = entries.splice(index, 1);
    URL.revokeObjectURL(removed.url);
    if (entries.length === 0) activeIndex = 0;
    else if (activeIndex >= entries.length) activeIndex = entries.length - 1;
    else if (index < activeIndex) activeIndex -= 1;
    renderQueue();
    renderPreview();
  };

  const addFiles = async (fileList) => {
    if (running) return;
    const rejected = [];
    const previewWarnings = [];
    for (const file of [...fileList]) {
      const duplicate = entries.some((entry) =>
        entry.file.name === file.name &&
        entry.file.size === file.size &&
        entry.file.lastModified === file.lastModified
      );
      if (duplicate) continue;

      const validation = await validateImageFile(file);
      if (!validation.valid) {
        rejected.push(`${file.name}: ${validation.reason}`);
        continue;
      }

      let decoded;
      let thumbnailUrl = null;
      let width = null;
      let height = null;
      try {
        decoded = await decodeImage(file, { format: validation.format.format });
        width = decoded.width;
        height = decoded.height;
        const thumbnailBlob = await createImageThumbnail(decoded, { maxSize: 1200 });
        thumbnailUrl = URL.createObjectURL(thumbnailBlob);
      } catch (error) {
        previewWarnings.push(`${file.name}: preview unavailable (${error.message})`);
      } finally {
        decoded?.close?.();
      }

      entries.push({
        id: `pdf-image-${nextId++}`,
        file,
        format: validation.format,
        width,
        height,
        url: thumbnailUrl
      });
    }

    if (entries.length > 0) activeIndex = Math.min(activeIndex, entries.length - 1);
    renderQueue();
    renderPreview();
    const messages = [...rejected, ...previewWarnings];
    showFeedback(messages.join(" · "), rejected.length ? "error" : previewWarnings.length ? "warning" : "info");
  };

  const resetProgress = () => {
    progress.hidden = true;
    progressBar.value = 0;
    progressLabel.textContent = "Preparing export…";
    progressCount.textContent = "";
  };

  const runMockExport = async () => {
    if (running || entries.length === 0) return;
    running = true;
    controller = new AbortController();
    showFeedback("");
    progress.hidden = false;
    progressBar.removeAttribute("value");
    progressLabel.textContent = "Starting mock export…";
    progressCount.textContent = "";
    cancelButton.hidden = false;
    exportButton.innerHTML = '<i data-lucide="file-output"></i> Running mock…';
    updateControls();
    renderQueue();
    renderIcons(root);

    try {
      const result = await createImagePdf({
        images: entries.map(({ id, file }) => ({ id, file })),
        options: getOptions(),
        signal: controller.signal,
        onProgress: (snapshot) => {
          const labels = {
            validating: "Validating images",
            decoding: "Preparing image data",
            composing: "Composing pages",
            finalizing: "Finalizing export"
          };
          progressLabel.textContent = labels[snapshot.phase] || "Processing";
          if (snapshot.phase === "finalizing") {
            progressBar.removeAttribute("value");
            progressCount.textContent = "Please wait";
          } else {
            const percent = snapshot.total ? Math.round(snapshot.completed / snapshot.total * 100) : 0;
            progressBar.value = percent;
            progressCount.textContent = `${snapshot.completed} / ${snapshot.total}`;
          }
        }
      });
      showFeedback(`Mock flow completed for ${result.pageCount} pages. No PDF file was generated; production download will be enabled after engine integration.`, "success");
      progressLabel.textContent = "Mock flow complete";
      progressCount.textContent = `${result.pageCount} pages`;
      progressBar.value = 100;
    } catch (error) {
      if (error.code === "ABORTED") {
        showFeedback("Mock export cancelled. No PDF was created.", "warning");
      } else {
        const failedIndex = Number.isInteger(error.imageIndex) ? error.imageIndex : -1;
        const failedName = failedIndex >= 0 ? entries[failedIndex]?.file.name : null;
        showFeedback(
          failedName ? `${failedName}: ${error.message}` : (error.message || "The mock export could not be completed."),
          "error"
        );
      }
      progressLabel.textContent = error.code === "ABORTED" ? "Cancelled" : "Mock export failed";
      progressCount.textContent = "";
      progressBar.value = 0;
    } finally {
      running = false;
      controller = null;
      cancelButton.hidden = true;
      exportButton.innerHTML = '<i data-lucide="file-output"></i> Run mock export';
      updateControls();
      renderQueue();
      renderIcons(root);
    }
  };

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
  dropzone.addEventListener("drop", (event) => {
    addFiles(event.dataTransfer.files);
  });
  clearButton.addEventListener("click", () => {
    if (running) return;
    for (const entry of entries) URL.revokeObjectURL(entry.url);
    entries.length = 0;
    activeIndex = 0;
    renderQueue();
    renderPreview();
    showFeedback("");
    resetProgress();
  });
  cancelButton.addEventListener("click", () => controller?.abort());
  exportButton.addEventListener("click", runMockExport);

  [pageSize, orientation, fit, marginMode, uniformMargin, ...marginInputs].forEach((control) => {
    control.addEventListener("change", () => {
      updateControls();
      renderPreview();
    });
    control.addEventListener("input", () => {
      if (control.type === "number") renderPreview();
    });
  });

  window.addEventListener("beforeunload", () => {
    controller?.abort();
    for (const entry of entries) URL.revokeObjectURL(entry.url);
  });

  updateControls();
  renderIcons(root);
}

