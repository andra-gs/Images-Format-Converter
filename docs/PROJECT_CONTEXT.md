# Project Context: Images Format Converter

## 1. Project summary

**Images Format Converter** is a web application for converting image formats locally in the user's browser.

The intended workflow is:

1. The user clones the GitHub repository.
2. The user installs dependencies and starts the Vite development server.
3. The user opens the application through localhost.
4. The user selects image files from their device or drops them into the application.
5. The browser reads and processes the selected files.
6. The user downloads the converted results to their device.

The core application must not upload image files to a backend, cloud storage, or external image-conversion service.

## 2. Product principles

- **Local-first privacy:** selected image data remains in the browser/device during normal application use.
- **No backend dependency:** the planned core application does not require a server API or database.
- **Honest format support:** support depends on both decoder and encoder capabilities.
- **Modular implementation:** each format-specific pipeline should be replaceable or extendable.
- **Progressive delivery:** build a tested MVP first, then add advanced formats and image manipulation.
- **Responsive interface:** support desktop and mobile layouts.
- **Theme support:** provide both light and dark modes.

## 3. Agreed decisions

| Topic | Decision |
|---|---|
| Frontend | Vanilla JavaScript |
| Markup | HTML5 |
| Styling | Plain CSS3; do not add Tailwind CSS unless the owner changes this decision |
| Build tool | Vite |
| Processing | Hybrid: lightweight work on the main thread, suitable heavy work in Web Workers |
| Worker canvas | OffscreenCanvas where supported, with fallback |
| Themes | Light and dark |
| Development | Phased, starting with an MVP |
| Repository | GitHub |
| Runtime | Localhost |
| Backend/database | None planned for the core application |

## 4. Planned image formats

The agreed format list is:

- PNG
- JPG / JPEG
- WebP
- BMP
- HEIC / HEIF
- TIFF
- SVG
- GIF

The list is a product target, not a claim that every source-to-target combination is already supported.

### Decoder and encoder distinction

A decoder reads a source image into a representation the application can process. An encoder writes that representation into the target format. A format can be readable without being writable, and vice versa.

The application should maintain an explicit capability registry. The UI should only offer output formats that are genuinely available for the selected input and current browser/library environment.

### Format-specific considerations

**PNG, JPEG, WebP**
- Use browser image decoding and Canvas APIs where appropriate.
- Use `canvas.toBlob()` or `OffscreenCanvas.convertToBlob()`.
- Check the returned MIME type. Browser support varies, and unsupported requested output types may fall back to PNG.
- JPEG does not preserve transparency. Provide a configurable background color when converting transparent sources to JPEG.

**BMP**
- A dedicated BMP encoder may be required.
- Validate generated files by decoding them with an independent decoder or browser-supported path.

**HEIC / HEIF**
- Use `heic-to` as the selected browser-compatible decoder. Version 1.6.7 is integrated as a decoder fallback with a worker-specific entry point. The user has verified real HEIC and HEIF files through the browser decoder, main conversion pipeline, and Web Worker. HEIC/HEIF input support is implemented; HEIC/HEIF output encoding remains out of scope. Continue monitoring bundle size, licensing, and browser compatibility.
- Treat HEIC and HEIF as related but not automatically identical in every implementation detail.
- HEIC input conversion does not imply HEIC output support.

**TIFF**
- UTIF2 4.1.0 is integrated for TIFF decoding and baseline uncompressed TIFF encoding.
- The decoder and main/Worker conversion paths for TIFF input were verified by the user with real files, including single-page/multi-page behavior, grayscale/RGB, and available LZW, Deflate, and PackBits variants.
- The decoder renders the first IFD only. Multi-page selection and output are not implemented.
- TIFF output uses UTIF2 encodeImage with RGBA pixels and no compression. The user verified real-file conversions, independent opening, dimensions, visual output, Worker conversion, individual downloads, and ZIP export.
- Compression selection, metadata preservation, and multi-page TIFF writing are not supported by the current encoder path.

**SVG**
- SVG is a vector document format, unlike ordinary raster formats.
- An initial browser-side sanitizer and rasterization path is integrated. It parses XML without inserting untrusted markup into the live document.
- The sanitizer allows basic vector shapes, text, gradients, and local clipping/mask references. It removes scripts, event handlers, CSS, external links, embedded images, foreignObject, animation, and unsupported elements.
- DOCTYPE and entity declarations are rejected. Raster dimensions are bounded.
- SVG conversion currently runs on the main thread because sanitization uses DOMParser and XMLSerializer.
- The browser decoder test page includes a fixture containing script, event-handler, foreignObject, and external-image content.
- SVG decoding and conversion were verified by the user in a real browser, including safe-fixture sanitization and conversion to PNG, JPEG, WebP, BMP, and TIFF.
- Raster-to-SVG output is implemented as an SVG wrapper containing an embedded PNG data resource. It preserves the raster image appearance and dimensions but does not create editable vector paths. The UI labels this behavior explicitly. The user verified transparent and opaque raster inputs, matching dimensions, re-decoding generated SVG files, individual downloads, and ZIP export in a real browser. The user also confirmed `npm test` and `npm run build` pass after this implementation.

**GIF**
- The initial GIF input adapter uses gifuct-js 2.1.2 to parse GIF data and decompress only the first image frame.
- The first frame is drawn onto a canvas using the GIF logical-screen dimensions. Transparent first-frame pixels remain transparent; the global background color is used when the first frame does not declare transparency.
- GIF-to-static conversion continues to use only the first image frame. GIF-to-GIF conversion uses modern-gif 2.1.0 to decode all composited frames and re-encode them. Frame order, delays, and looping metadata are passed through to the encoder. Static image inputs produce a single-frame GIF.
- GIF first-frame decoding and animated GIF-to-GIF re-encoding run inside the existing application Web Worker when supported and fall back to the main thread. The modern-gif codec is invoked synchronously inside that worker to avoid nested worker lifetime leaks.
- The user verified first-frame GIF decoding and conversion to static formats. Animated GIF-to-GIF and static-image-to-GIF output have also been verified in the real browser, including frame timing, looping, transparency, frame order, batch processing, individual downloads, and ZIP export. GitHub Actions passed lockfile synchronization, npm ci, npm test, and npm run build. Animated GIF conversion to WebP/APNG remains unsupported.
- The animated conversion path limits input to 200 frames and 25 million total logical-screen pixels to reduce memory risk. GIF animation is not converted to animated WebP or APNG.

## 5. Planned user features

### Core / MVP
- Select files through a file picker.
- Drag and drop.
- Multiple file selection.
- Image preview.
- Output format selection.
- Single-image conversion.
- Download converted file.
- Conversion status and clear error messages.
- File validation.

### Next improvements
- Batch conversion.
- Quality control for lossy formats.
- ZIP download.
- Image resizing.
- Before/after file-size comparison.
- Compression statistics.

### Advanced features
- HEIC/HEIF and TIFF pipelines.
- SVG rasterization.
- Static and animated GIF handling.
- Image rotation.
- Background customization.
- Metadata viewer.
- Optional conversion history, only if a clear local-storage policy is defined.

## 6. Privacy and security requirements

- Do not transmit selected image data over the network.
- Do not use remote conversion APIs.
- Do not store user images persistently by default.
- Validate file size, type hints, dimensions, and actual decodability.
- Treat MIME type and extension as hints, not proof.
- Avoid unsafe SVG insertion and script execution.
- Release Object URLs with `URL.revokeObjectURL()` when no longer needed.
- Close `ImageBitmap` objects and release references to large Blobs and canvases.
- Limit concurrent conversions and consider configurable size/dimension limits.
- Do not claim localhost alone makes arbitrary files safe.

## 7. Product quality expectations

A conversion is successful only when:
- The selected source can be decoded.
- The target encoder is actually available.
- The produced MIME type matches the requested format.
- The result can be decoded or opened again.
- Relevant properties (dimensions, transparency, animation, and quality) behave according to the selected conversion mode.
- Errors are isolated to the affected file and do not unnecessarily stop other queue items.

## 8. Current phase and out of scope for the initial MVP

Phase 4 (Advanced Format Support) was completed on 2026-11-20. Phase 5 (Image Manipulation) was merged through PR #5 and its integrated Editor workflow was verified. Phase 6 (Image Optimization and Export Workflow) was completed through PR #7 and PR #9, both merged into `main` by 2026-11-25. PR #9 reports 156/156 automated tests passing, a successful production build, successful integrated browser checks, and passing GitHub Actions. Phase 7 (Testing, Documentation, and Release) is the next stage and has not started. A known UI issue remains: the startup skeleton was last reported to always use the light theme, even when dark theme is selected.

- User accounts and authentication.
- Cloud storage.
- Server-side conversion.
- Public hosted conversion service.
- Database-backed conversion history.
- Guaranteed support for every codec variant of every listed format.
- Animated GIF conversion to WebP/APNG, multi-page TIFF output, and compressed TIFF output are not supported by the current pipelines.

## 9. Team ownership and collaboration for Phases 5 and 6

The project has three assigned developers. Their GitHub usernames identify their task ownership and must be used consistently in project discussions, issues, Pull Requests, and ChatGPT sessions.

| GitHub username | Phase 5 | Phase 6 |
|---|---|---|
| `andra-gs` | Image Transformation: resize, aspect ratio, crop, rotate, horizontal flip, vertical flip | Image Optimization Engine: format-aware quality presets, feasible target-size attempts, size measurement and output validation |
| `Adit1945-web` | Image Adjustment: brightness, contrast, saturation, grayscale, sepia, blur | No Phase 6 assignment. Metadata Management is deferred to a future backlog item. |
| `FarrelPtrv` | Editor UI and Integration: editing workspace, preview, controls, reset/apply, connection to processing modules and conversion service | Export Presets and UI Integration: capability-aware export controls, size reporting, individual download and ZIP integration |

### Phase 5 work boundaries

- `andra-gs` owns the transformation processing module in `src/js/core/image-transformer.js` and its tests in `tests/image-transformer.test.js`.
- `Adit1945-web` owns the adjustment processing module in `src/js/core/image-adjuster.js` and its tests in `tests/image-adjuster.test.js`.
- `FarrelPtrv` owns the editor interface in `src/js/ui/image-editor.js`, its stylesheet in `src/styles/editor.css`, and integration tests in `tests/image-editor.test.js`.
- The shared sRGB ImageData representation and the public Transformer/Adjuster contracts are agreed and implemented. The Editor integration uses `createImageProcessingAdapter()` to apply transformations before adjustments and passes edited ImageData to the existing conversion service. See `docs/TECHNICAL_SPECIFICATION.md` and `docs/PHASE_5_EDITOR_UI.md`.
- The editor must pass the final edited image to the existing conversion service. Do not replace or duplicate the established format decoders, encoders, batch queue, Worker orchestration, or ZIP exporter.

### Phase 6 work boundaries

- `andra-gs` owns `src/js/core/image-optimizer.js`, `tests/image-optimizer.test.js`, and `docs/PHASE_6_OPTIMIZATION.md`. The module handles format-aware quality presets, feasible target-size attempts, actual source/output size measurement, and output validation.
- `FarrelPtrv` owns `src/js/ui/export-panel.js`, `src/styles/export-panel.css`, `tests/export-panel.test.js`, and `docs/PHASE_6_EXPORT_UI.md`. The UI connects export controls to the optimizer and integrates the settings with individual and ZIP downloads.
- Metadata Management is deferred to a future backlog item. It has no Phase 6 owner, branch, or API.
- Reading, removing, and preserving metadata remain separate capabilities if Metadata Management is proposed later.
- Target output size is not guaranteed. If the encoder cannot reach a requested size, show the actual achieved size and explain the limitation.
- The optimizer API and capability matrix are approved and implemented. JPEG/WebP support Low/Medium/High presets and best-effort Target Size; PNG, BMP, TIFF, GIF, and SVG use `mode: none`. The production Export UI integration is merged and verified through PR #9. Target Size remains best-effort and is never guaranteed.

### Git and integration policy

Each member works on a separate branch created from the latest `main`:

| Phase | `andra-gs` | `Adit1945-web` | `FarrelPtrv` |
|---|---|---|---|
| Phase 5 | `phase-5-transformation` | `phase-5-adjustment` | `phase-5-editor-ui` |
| Phase 6 | `phase-6-optimization` | Not applicable | `phase-6-export-ui` |

Do not push feature work directly to `main`. Submit a Pull Request to `main`, include automated tests, run `npm test` and `npm run build`, and perform relevant browser checks. Phase 5 and Phase 6 integrations are complete. Phase 6 followed the required order: optimizer PR #7 merged first, then the Export UI branch was synchronized and production integration was merged through PR #9. The integrated test suite, production build, GitHub Actions, and browser checks were reported as passing in PR #9.

### Instructions for ChatGPT used by team members

ChatGPT must read the root-level `AGENTS.md` first and identify the developer's GitHub username before selecting a task. If the username is unknown, ask for it. It must also read `docs/DEVELOPMENT_ROADMAP.md`, this file, and `docs/TECHNICAL_SPECIFICATION.md`, then work only within that member's assigned responsibility for the active phase. `docs/STARTER_PROMPT.md` may be used to start a session. It must not silently implement another member's work, change task ownership, or modify shared integration files without coordination. It must distinguish planned tasks from implemented and verified functionality.

## 10. Current implementation status (2026-11-25)

- Phases 0–6: complete and merged into `main`.
- Phase 5: Image Transformer, Image Adjuster, and Editor integration are complete.
- Phase 6: Image Optimization Engine and Export UI production integration are complete.
- Phase 7: release-readiness work is next and has not started.
- Deferred backlog: Metadata Management remains unassigned and outside Phase 6.
- Known UI issue: the startup skeleton was last reported to always appear in the light theme. The application theme itself still switches between light and dark, and the no-unstyled-content-flash check passed.
