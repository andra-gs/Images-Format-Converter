# Images Format Converter

A local-first image format conversion web application. Users clone this repository, install its dependencies, and run the application on localhost. Image files are processed in the user's browser and are not uploaded to a remote server.

> Project status: Planning / Phase 0 - Project Foundation
> Initial development approach: Vanilla JavaScript + Vite
> Architecture: Client-side, modular, hybrid processing

## Project goals

- Convert images between supported formats directly in the browser.
- Keep image files on the user's device during processing.
- Support multiple images and batch conversion.
- Provide quality, resizing, preview, and download controls.
- Offer light and dark themes.
- Keep the codebase modular so additional decoders and encoders can be added without rewriting the application.

## Planned formats

PNG, JPG/JPEG, WebP, BMP, HEIC/HEIF, TIFF, SVG, and GIF.

Format support is capability-dependent. Reading a format (decoding) and producing a format (encoding) are separate capabilities. The application must not advertise a conversion path until it has been implemented and tested.

Special cases:

- Canvas commonly supports PNG output and browser-dependent JPEG/WebP output. Always inspect the resulting Blob MIME type.
- BMP requires a dedicated encoder if the browser does not provide one.
- HEIC/HEIF requires a suitable decoder, such as `heic-to` or another evaluated library.
- TIFF requires a decoder such as UTIF.js. TIFF encoding and advanced TIFF features must be verified separately.
- SVG to raster formats requires safe SVG loading and rasterization. Raster images wrapped inside SVG are not true vector conversions.
- Animated GIF requires frame-aware decoding and encoding. A simple Canvas pipeline may only process one frame.

## Technology direction

| Area | Planned technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3; Tailwind CSS only if adopted during setup |
| Language | Vanilla JavaScript (ES modules, modern JavaScript) |
| Development/build | Vite |
| Standard image processing | Canvas API, ImageBitmap |
| Background processing | Web Workers, OffscreenCanvas where supported |
| HEIC/HEIF | Evaluate `heic-to` and alternatives |
| TIFF | UTIF.js for decoding; validate encoder options |
| ZIP downloads | JSZip |
| Icons | Lucide |
| Version control | Git and GitHub |

No backend, database, cloud storage, or remote image-processing API is planned for the core application.

## Run locally

The following commands will apply once the Vite application skeleton and its `package.json` scripts have been created:

```bash
git clone https://github.com/andra-gs/Images-Format-Converter.git
cd Images-Format-Converter
npm install
npm run dev
```

Production build:

```bash
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

1. Keep all image processing local to the browser.
2. Separate UI code, application orchestration, format adapters, and utilities.
3. Treat decoding and encoding as separate capabilities.
4. Validate actual file content and decoder results. Do not trust file extensions alone.
5. Revoke Object URLs and release large image resources when they are no longer needed.
6. Use Web Workers for suitable heavy work, with a fallback for browsers without required capabilities.
7. Report unsupported conversions honestly.
8. Test output files by decoding them again, not merely by checking that a Blob was returned.

## Project status

The repository currently contains project documentation only. Phase 0 is in progress. The application skeleton has not yet been created, and no conversion feature is implemented.
