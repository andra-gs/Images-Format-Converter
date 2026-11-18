# Images Format Converter

A local-first image format conversion web application. Image files are processed in the user's browser and are not uploaded to a remote server.

> Project status: Phase 3 - Batch processing (in progress)
> Stack: Vanilla JavaScript + Vite + plain CSS
> Icons: Lucide via NPM
> Architecture: Client-side, modular, hybrid processing

## Current implementation

The current interface includes:

- File selection through the file picker and drag-and-drop.
- A selected-file queue with image previews, file details, individual removal, and clear-all behavior.
- Batch conversion with per-file pending, processing, completed, failed, and cancelled states, plus overall batch progress.
- Web Worker conversion when supported, with a main-thread fallback and a sequential concurrency limit.
- Cancellation of remaining queued files after the active conversion finishes. Successful outputs can be downloaded individually or together in a ZIP archive using JSZip.
- Light and dark themes with saved preference.
- Conversion settings for PNG, JPEG, WebP, and BMP, with quality control for JPEG and WebP. The dedicated 24-bit BMP encoder is implemented and user-verified with real PNG, JPEG, WebP, and BMP files.
- Startup skeleton that follows the selected theme and prevents an unstyled-content flash.
- Initial file validation and image-format signature detection.
- An explicit capability registry that keeps detection, decoding, and encoding status separate.
- A browser image decoder for PNG, JPEG, WebP, and BMP, with an ImageBitmap path and HTML image fallback. The user verified all four formats with real files in the browser.
- A PNG encoder and conversion service using OffscreenCanvas with an HTML Canvas fallback. The service checks the PNG signature and reopens the output to verify its dimensions.
- A dedicated 24-bit BMP encoder that writes bottom-up BGR pixel rows with 4-byte alignment. Transparent pixels are composited onto white. Automated tests cover its header, pixel data, row padding, and Canvas fallback. Real-file browser conversion has been user-verified.
- JPEG output is implemented and enabled in the main interface. The user verified PNG, JPEG, WebP, and BMP inputs convert to JPEG, transparent PNG areas become white, quality settings work, output MIME type is `image/jpeg`, dimensions match, previews display, and `.jpg` downloads work.
- The main interface supports PNG output from PNG, JPEG, WebP, and BMP inputs, with individual PNG downloads and per-file error results.
- The user verified that all four input formats convert successfully, output files open as PNG, dimensions match the originals, PNG transparency is preserved, filenames use the .png extension, downloads work, and multiple files convert independently.
- The user has verified the Phase 3 batch queue, worker processing, progress states, cancellation behavior, failure isolation, large-image responsiveness, resource cleanup, and individual downloads. The user reports that all requested tests passed. ZIP export has been implemented and still requires dependency installation, build/test verification, and archive extraction checks.

PNG, JPEG, WebP, and BMP conversion paths are user-verified with real files. The user has confirmed that the Phase 3 worker and batch-processing tests pass. The ZIP export feature is implemented but awaits dependency installation and browser verification. GIF, TIFF, HEIC, HEIF, and SVG decoding remain planned.

## Project goals

- Convert images between supported formats directly in the browser.
- Keep image files on the user's device during processing.
- Support multiple images and batch conversion.
- Provide quality, resizing, preview, and download controls.
- Offer light and dark themes.
- Keep the codebase modular for additional decoders and encoders.

## Planned formats

PNG, JPG/JPEG, WebP, BMP, HEIC/HEIF, TIFF, SVG, and GIF.

Decoding and encoding are separate capabilities. The application must not advertise a conversion path until it has been implemented and tested.

Special cases:
- Canvas commonly supports PNG output and browser-dependent JPEG/WebP output. Verify the returned Blob MIME type.
- BMP may require a dedicated encoder.
- HEIC/HEIF requires a suitable decoder, such as an evaluated `heic-to` implementation.
- TIFF decoding and encoding must be evaluated separately.
- SVG-to-raster requires safe rasterization. Raster wrapped in SVG is not true vector conversion.
- Animated GIF requires frame-aware decoding and encoding. A simple Canvas pipeline may only process one frame.

## Technology

| Area | Technology |
|---|---|
| Markup | HTML5 |
| Styling | Plain CSS3 |
| Language | Vanilla JavaScript ES modules |
| Development/build | Vite |
| Icons | Lucide NPM package |
| Standard image processing | Canvas API, ImageBitmap |
| Background processing | Web Workers, OffscreenCanvas where supported |
| ZIP downloads | JSZip, planned |
| Version control | Git and GitHub |

No backend, database, cloud storage, or remote image-processing API is planned.

## Run locally

Requirements: Node.js compatible with the Vite version in package.json and npm.

```bash
git clone https://github.com/andra-gs/Images-Format-Converter.git
cd Images-Format-Converter
npm install
npm run dev
```

Open the localhost URL printed by Vite.

Production build and preview:

```bash
npm test
npm run build
npm run preview
```

## Documentation

- [Project context](docs/PROJECT_CONTEXT.md)
- [Technical specification](docs/TECHNICAL_SPECIFICATION.md)
- [Development roadmap](docs/DEVELOPMENT_ROADMAP.md)
- [Development log](docs/DEVELOPMENT_LOG.md)
- [ChatGPT Project instructions](docs/CHATGPT_PROJECT_INSTRUCTIONS.md)
- [Starter prompt](docs/STARTER_PROMPT.md)

## Development principles

1. Keep image processing local to the browser.
2. Separate UI, orchestration, format adapters, workers, and utilities.
3. Treat decoding and encoding as separate capabilities.
4. Validate file content and decoder results. Do not trust extensions alone.
5. Revoke Object URLs and release large image resources.
6. Use Web Workers for suitable heavy work, with a fallback where practical.
7. Report unsupported conversions honestly.
8. Reopen generated outputs to validate them.
