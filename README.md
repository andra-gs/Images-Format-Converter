# Images Format Converter

A local-first image format conversion web application. Image files are processed in the user's browser and are not uploaded to a remote server.

> Project status: Phase 4 - Advanced format support (in progress)
> Stack: Vanilla JavaScript + Vite + plain CSS
> Icons: Lucide via NPM
> Architecture: Client-side, modular, hybrid processing

## Current implementation

The current interface includes:

- File selection through the file picker and drag-and-drop.
- A selected-file queue with image previews, file details, individual removal, and clear-all behavior.
- Batch conversion with per-file pending, processing, completed, failed, and cancelled states, plus overall batch progress.
- Web Worker conversion when supported, with a main-thread fallback and a sequential concurrency limit.
- Cancellation of remaining queued files after the active conversion finishes. Successful outputs can be downloaded individually or together in a ZIP archive using JSZip. The user has verified ZIP export, including archive extraction and image integrity.
- Light and dark themes with saved preference.
- Conversion settings for PNG, JPEG, WebP, BMP, baseline uncompressed TIFF, SVG wrapper output, and GIF output, with quality control for JPEG and WebP. The dedicated 24-bit BMP encoder is implemented and user-verified with real PNG, JPEG, WebP, and BMP files.
- Startup skeleton that follows the selected theme and prevents an unstyled-content flash.
- Initial file validation and image-format signature detection.
- SVG input is parsed and sanitized to a restricted vector subset before rasterization. SVG output embeds a PNG data resource in an SVG image element. This preserves the raster image but does not vectorize it. The sanitizer allows only bounded embedded PNG data for image elements and continues to reject external resources and active content. The user has verified SVG rasterization and conversion to PNG, JPEG, WebP, BMP, and TIFF in the real browser. Raster-to-SVG output has also been verified with transparent and opaque sources, matching dimensions, SVG re-decoding, individual downloads, and ZIP export.
- GIF input uses gifuct-js to decode the first frame for conversion to static formats. GIF output uses modern-gif to create single-frame GIFs from static images and re-encode animated GIFs with frame order, timing, and looping metadata. The implementation is committed but real-browser verification is pending. GIF animation-to-other-animated-formats is outside the current scope.
- An explicit capability registry that keeps detection, decoding, and encoding status separate.
- A browser image decoder for PNG, JPEG, WebP, and BMP, with an ImageBitmap path and HTML image fallback. HEIC/HEIF decoding uses heic-to and has been user-verified in the decoder, main conversion pipeline, and Web Worker. TIFF decoding uses UTIF2 and has been user-verified with real fixtures in the browser, main conversion pipeline, and Web Worker.
- A PNG encoder and conversion service using OffscreenCanvas with an HTML Canvas fallback. The service checks the PNG signature and reopens the output to verify its dimensions.
- A dedicated 24-bit BMP encoder that writes bottom-up BGR pixel rows with 4-byte alignment. Transparent pixels are composited onto white. Automated tests cover its header, pixel data, row padding, and Canvas fallback. Real-file browser conversion has been user-verified.
- Baseline TIFF output through UTIF2. The encoder writes uncompressed RGBA TIFF files and is integrated into the main interface and Web Worker. Real-file conversion, viewing, dimensions, Worker execution, individual downloads, and ZIP export have been user-verified.
- JPEG output is implemented and enabled in the main interface. The user verified PNG, JPEG, WebP, and BMP inputs convert to JPEG, transparent PNG areas become white, quality settings work, output MIME type is `image/jpeg`, dimensions match, previews display, and `.jpg` downloads work.
- The main interface supports PNG output from PNG, JPEG, WebP, and BMP inputs, with individual PNG downloads and per-file error results.
- The user verified that all four input formats convert successfully, output files open as PNG, dimensions match the originals, PNG transparency is preserved, filenames use the .png extension, downloads work, and multiple files convert independently.
- The user has verified Phase 3 batch processing, worker execution, progress states, cancellation, failure isolation, responsiveness, cleanup, individual downloads, and ZIP archive integrity.

PNG, JPEG, WebP, and BMP conversion paths are user-verified with real files. Phase 3, including ZIP export, is user-verified. HEIC/HEIF decoding is user-verified. TIFF input decoding and conversion are user-verified with real fixtures. The decoder reads the first page only. TIFF output is implemented as uncompressed baseline TIFF and has been user-verified with real files. SVG decoding, raster-to-SVG output, re-decoding, downloads, and ZIP export are user-verified. The user also reports `npm test` and `npm run build` pass after the SVG output implementation. GIF first-frame conversion to static formats is user-verified. Animated GIF-to-GIF and static-image-to-GIF output have been implemented with modern-gif, but require dependency installation, automated tests, production build, and real-browser verification.

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
- HEIC/HEIF uses the integrated `heic-to` decoder adapter. The user verified real-file decoding, main conversion, and Worker processing.
- TIFF uses the integrated UTIF2 decoder adapter. Real-file input verification passed; the current adapter reads only the first TIFF page.
- TIFF output uses UTIF2's uncompressed encoder. Real-file output is user-verified. Compression, metadata preservation, and multi-page writing are not included.
- SVG-to-raster uses a restricted sanitizer before rasterization. Raster-to-SVG output is an SVG wrapper containing embedded PNG data, not true vector conversion.
- GIF-to-static conversion uses the first frame. GIF-to-GIF output re-encodes all frames and aims to preserve frame timing and looping metadata. Static images produce single-frame GIFs. Animation is not converted to animated WebP or APNG.

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
| ZIP downloads | JSZip |
| HEIC/HEIF decoding | heic-to (WebAssembly, browser and worker entry points) |
| TIFF decoding and baseline encoding | UTIF2 (first-page raster decoding; uncompressed TIFF output) |
| GIF decoding and encoding | gifuct-js 2.1.2 for first-frame static conversion; modern-gif 2.1.0 for animated GIF decode/re-encode and GIF output |
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
