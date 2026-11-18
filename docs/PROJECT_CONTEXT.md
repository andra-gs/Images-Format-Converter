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
- UTIF2 4.1.0 is integrated as the TIFF decoder.
- The current adapter decodes and renders the first IFD only. Multi-page navigation is not implemented.
- Test real TIFF files, including color depth, compression variants, orientation, and memory use, before marking TIFF input supported.
- TIFF encoding must be evaluated separately. Do not claim complete TIFF support based only on decoding support.

**SVG**
- SVG is a vector document format, unlike ordinary raster formats.
- SVG-to-PNG/JPEG/WebP can be implemented by safely loading and rasterizing the SVG.
- Raster-to-SVG can wrap the raster image in an SVG document, but this does not vectorize the image.
- Never inject untrusted SVG markup into the live DOM using unsafe `innerHTML`.
- Consider SVG sanitization and external-resource restrictions.

**GIF**
- Static GIF can use a raster pipeline.
- Animated GIF needs frame decoding and encoding to preserve animation, frame timing, and transparency.
- Converting an animated GIF to a still format should have a clear frame-selection policy.
- Animated GIF support is a later milestone, not a requirement for the first MVP.

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

## 8. Out of scope for the initial MVP

- User accounts and authentication.
- Cloud storage.
- Server-side conversion.
- Public hosted conversion service.
- Database-backed conversion history.
- Guaranteed support for every codec variant of every listed format.
- Full animated GIF and advanced TIFF support before the relevant later phases.
