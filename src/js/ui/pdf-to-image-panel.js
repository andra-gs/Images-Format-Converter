import { createIcons, FileText, FileUp, Layers3, Settings2, Info } from "lucide";
import "../../styles/pdf-to-image.css";

const iconSet = { FileText, FileUp, Layers3, Settings2, Info };
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
          <p>Convert selected pages from a PDF into PNG, JPEG, or WebP images. Processing stays in your browser.</p>
        </div>
        <span class="pdf-to-image-status">UI foundation</span>
      </header>

      <section class="pdf-to-image-intro" aria-labelledby="pdf-to-image-start-title">
        <div class="pdf-to-image-intro-icon"><i data-lucide="file-up"></i></div>
        <div>
          <h3 id="pdf-to-image-start-title">Your PDF workspace</h3>
          <p>The upload area, document queue, page selection, and export controls will be added in the next implementation step.</p>
        </div>
      </section>

      <div class="pdf-to-image-foundation-grid">
        <section class="pdf-to-image-foundation-card" aria-labelledby="pdf-to-image-pages-title">
          <div class="pdf-to-image-card-icon"><i data-lucide="layers-3"></i></div>
          <h3 id="pdf-to-image-pages-title">Page management</h3>
          <p>Document details, page thumbnails, selection, and page ordering.</p>
          <span>Planned · Phase 9.2</span>
        </section>
        <section class="pdf-to-image-foundation-card" aria-labelledby="pdf-to-image-export-title">
          <div class="pdf-to-image-card-icon"><i data-lucide="settings-2"></i></div>
          <h3 id="pdf-to-image-export-title">Export settings</h3>
          <p>Output format, resolution, quality, preview, and download options.</p>
          <span>Planned · Phase 9.3–9.4</span>
        </section>
      </div>

      <p class="pdf-to-image-privacy"><i data-lucide="info"></i><span>PDF rendering will use the local PDF engine. This panel currently contains UI scaffolding only; no PDF is uploaded or processed yet.</span></p>
    </section>
  `);

  renderIcons(document.querySelector("#pdf-to-image-panel"));
}
