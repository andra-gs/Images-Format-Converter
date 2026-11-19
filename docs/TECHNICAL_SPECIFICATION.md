# Technical Specification

## 1. Architecture

The application uses a client-side, modular architecture.

```text
Presentation: HTML / CSS / UI modules
        |
Application: file manager / queue / conversion controller
        |
Execution: main thread <----> Web Workers
        |
Image processing: browser APIs / format decoders and encoders
        |
Output: Blob / Object URL / download / ZIP
```

There is no planned backend, database, or remote image-processing service.

## 2. Main modules

- Presentation: uploader, queue, preview, settings, results, themes, notifications.
- Application core: file manager, queue manager, conversion controller, capability registry, job state, cancellation, event communication.
- Format adapters: separate decoding and encoding capabilities, report unsupported features, and release resources.
- Execution: main thread for UI and orchestration; Web Workers for suitable heavy tasks; OffscreenCanvas when supported, with a practical fallback.

## 3. Agreed technology stack

| Technology | Purpose |
|---|---|
| HTML5 | Document structure |
| Plain CSS3 | Styling, responsive layout, themes |
| Vanilla JavaScript ES modules | Application logic |
| Vite | Development server and production build |
| Lucide via NPM | Interface icons |
| Canvas API / ImageBitmap | Standard raster processing |
| Web Workers / OffscreenCanvas | Background processing where supported |
| JSZip | ZIP downloads |
| heic-to | HEIC/HEIF decoding through WebAssembly in the browser or conversion worker |
| UTIF2 | TIFF first-page decoding and baseline uncompressed TIFF encoding |

Advanced format libraries remain subject to compatibility, bundle size, license, and browser testing. UTIF2 4.1.0 was published in May 2023, so its maintenance status and compatibility should be reviewed during ongoing testing. Its MIT license and documented compression coverage make it a reasonable initial candidate, not a guarantee of universal TIFF support. heic-to 1.6.7 is selected for HEIC/HEIF decoding. It exposes a browser entry and a worker-specific `heic-to/next` entry. The adapter prefers native ImageBitmap decoding, then falls back to heic-to's bitmap output. The user has verified real HEIC and HEIF files through the browser decoder, main conversion pipeline, and Web Worker. UTIF2 4.1.0 is selected for TIFF input decoding; its adapter decodes the first IFD and renders it to Canvas. TIFF capability remains planned until representative real files pass browser and Worker tests.

## 4. Current project structure

This reflects files already created. Add feature-specific modules when their phase begins.

```text
Images-Format-Converter/
├── public/
│   └── favicon.svg
├── src/
│   ├── styles/
│   │   ├── main.css
│   │   ├── variables.css
│   │   ├── reset.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── themes.css
│   └── js/
│       ├── main.js
│       └── core/
│           ├── file-validator.js
│           ├── format-detector.js
│           ├── capability-registry.js
│           ├── image-decoder.js
│           ├── image-encoder.js
│           └── conversion-service.js
├── tests/
│   ├── capability-registry.test.js
│   ├── image-decoder.test.js
│   ├── image-encoder.test.js
│   ├── browser-decoder.html
│   ├── browser-decoder.css
│   └── browser-decoder.js
├── docs/
├── .github/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

The Vite entry point is the root-level `index.html`. Plain CSS is the selected styling approach. Lucide is installed as an NPM dependency. Running `npm install` generates `package-lock.json`.

Future directories such as `converters/`, `workers/`, `core/`, `ui/`, and `tests/` will be added when needed. Do not create empty placeholders.

## 5. Suggested conversion data model

```javascript
{
  id: "unique-file-id",
  original: {
    file: File,
    name: "photo.png",
    format: "PNG",
    size: 2048000,
    width: 1920,
    height: 1080
  },
  settings: {
    outputFormat: "WEBP",
    quality: 0.85,
    resize: null,
    backgroundColor: null
  },
  result: {
    blob: null,
    name: null,
    format: null,
    size: null,
    url: null
  },
  status: "pending",
  error: null
}
```

This is conceptual and may be refined during implementation. Avoid duplicate large binary data.

## 6. Job statuses

- `pending`: waiting in queue.
- `processing`: currently processing.
- `completed`: conversion and output validation succeeded.
- `failed`: conversion failed.
- `cancelled`: user or application cancelled the job.

Each queue item should fail independently where possible.

## 7. File validation

Consider file size, extension and MIME hints, actual decoder support, dimensions and pixel count, corrupt input, and format-specific constraints. Do not trust extension or MIME type alone. A small compressed file can decode into a large image.

## 8. Browser image decoder

The browser decoder handles PNG, JPEG, WebP, and BMP through `createImageBitmap()` when available, with an `HTMLImageElement` and Object URL fallback. HEIC/HEIF first attempt native ImageBitmap decoding, then use heic-to's WebAssembly decoder. The worker uses the package's `heic-to/next` entry; the main-thread fallback uses `heic-to`. The user verified HEIC and HEIF with real files through the decoder test, main conversion pipeline, and Worker. TIFF uses UTIF2 to decode the first IFD, convert it to RGBA, and render it to Canvas or OffscreenCanvas. The current TIFF adapter intentionally uses only the first page of a multi-page file. Its capability remains planned until real TIFF fixtures pass browser and Worker tests. The decoder returns a common result containing the decoded source, width, height, detected format, and a `close()` method. Callers must close the result after processing. SVG and GIF remain outside this decoder's scope.

## 9. Initial PNG conversion pipeline

The first conversion path decodes a supported source image, draws it to a 2D Canvas, and encodes the canvas as PNG. The encoder prefers `OffscreenCanvas` and falls back to an HTML canvas. The conversion service checks the generated PNG signature, decodes the generated output again, and confirms that its dimensions match the source. It closes both decoded image resources after use. PNG output does not use the lossy quality slider.

The user verified the complete PNG conversion flow in the main interface with real PNG, JPEG, WebP, and BMP input files. The generated files opened as PNG, retained the source dimensions, preserved PNG transparency, downloaded with the `.png` extension, and worked independently during multi-file conversion. PNG encoding is marked implemented in the capability registry. JPEG output is also implemented and enabled in the main interface after separate real-file browser verification. WebP output is now implemented, verified, and enabled in the main interface. BMP output now has a dedicated 24-bit encoder. It writes a Windows BMP file header and 40-byte DIB header, stores rows bottom-up as BGR pixels, and pads each row to a 4-byte boundary. Because this implementation uses 24-bit BMP, transparent pixels are composited onto white. The conversion service validates the BMP signature, reopens the output, and checks its dimensions. Real-file browser verification is still pending.

## 10. JPEG conversion pipeline

The JPEG encoder uses the browser Canvas API. It accepts a quality value from 0 to 1 and composites the decoded source onto an explicit background color before drawing, because JPEG cannot store alpha transparency. The default background is white (`#ffffff`). The encoder prefers OffscreenCanvas and falls back to an HTML canvas. It verifies that the returned Blob has the exact `image/jpeg` MIME type. The conversion service checks the JPEG file signature, decodes the generated output again, and confirms that its dimensions match the source. It releases both decoded image resources after processing.

The user verified real-file JPEG output in the main application interface: PNG, JPEG, WebP, and BMP sources convert successfully; transparent PNG pixels are composited onto white; quality changes produce valid output; the MIME type is `image/jpeg`; dimensions match; the preview displays; and `.jpg` downloads work. JPEG is enabled in the main interface and marked implemented in the capability registry. The default background remains white; a user-selectable background control is a later enhancement.

## 11. WebP conversion pipeline

The WebP encoder uses the browser Canvas API with a quality value from 0 to 1. It prefers OffscreenCanvas and falls back to an HTML canvas. Browser support for WebP encoding can vary, so the encoder verifies that the returned Blob MIME type is exactly `image/webp`. If a browser silently returns PNG or another format, the conversion fails with a clear error rather than presenting the file as WebP. The conversion service validates the WebP signature, decodes the generated output again, and confirms that its dimensions match the source. The main interface now enables WebP output and shares the quality slider with JPEG.

The user verified all 11 browser checks: PNG, JPEG, WebP, and BMP sources convert to WebP; PNG transparency is preserved; quality adjustment works; the MIME type is exactly `image/webp`; dimensions match; preview displays; the download uses the `.webp` extension; and browsers without WebP encoding support show a clear error.

## 12. Conversion settings

- Output format.
- Quality for supported lossy encoders.
- Width, height, and aspect-ratio lock.
- Background color when transparency cannot be represented.
- Output filename.
- Individual download or ZIP download.

Quality controls must be format-aware. PNG must not be presented as if its quality slider behaves like JPEG quality.

## 13. Conversion result

Show original and output filename/format, file sizes, dimensions, status, preview, and download action.

```text
savingsPercent = ((originalSize - outputSize) / originalSize) * 100
```

A negative value means the output is larger. Display that honestly.

## 14. Browser compatibility

Target Chrome, Edge, Firefox, and Safari. Feature-detect Canvas encoding, OffscreenCanvas, worker support, and decoding capabilities.

## 15. Resource management

Revoke Object URLs, close ImageBitmap instances, release workers and large references, limit concurrency, handle cancellation, and avoid retaining duplicate image data longer than necessary.

## 16. Testing requirements

Test PNG/JPEG/WebP paths, transparency to JPEG with a selected background, corrupt and unsupported inputs, multiple files with independent failures, large dimensions, output MIME type, reopening generated files, ZIP integrity, themes, responsive layout, SVG safety, and format-specific HEIC/TIFF/GIF fixtures when those phases begin.

## 17. Definition of Done

A feature is complete when it matches the agreed behavior, handles errors, passes relevant tests, preserves local processing, releases temporary resources, and has appropriate documentation.


## 18. BMP conversion pipeline

The BMP encoder is a dedicated browser-side implementation. It draws the decoded source to a 2D Canvas, reads RGBA pixel data, and writes a 24-bit Windows BMP file. Pixel rows are stored bottom-up in BGR order and padded to 4-byte boundaries. The 24-bit format has no alpha channel, so transparent pixels are composited onto white. The conversion service checks the BMP signature, decodes the generated output again, and confirms that its dimensions match the source. Automated unit tests cover the file header, pixel order, row padding, alpha compositing, and HTML Canvas fallback. Real-file browser verification is pending.


## 19. Batch processing and worker execution

The application keeps the UI and queue orchestration on the main thread. When Worker, OffscreenCanvas, and createImageBitmap are available, image conversion runs in a module Web Worker. The worker uses the same conversion service and returns the verified output Blob and dimensions. If worker support is unavailable or worker execution cannot complete, the application retries through the main-thread conversion path so HTMLImageElement and HTMLCanvas fallbacks remain available.

The queue processes one image at a time to limit simultaneous decoded-image memory usage. Each job moves through pending, processing, completed, failed, or cancelled. The interface shows an indeterminate per-file processing indicator and overall batch completion progress. The cancel action allows the active conversion to finish, then marks remaining queued files as cancelled. It does not interrupt a running Canvas operation.

Decoded ImageBitmap resources are closed by the conversion service. The UI revokes input and output Object URLs when their items are removed, when the queue is cleared, or when the page unloads. The conversion worker is terminated on page unload. ZIP export uses JSZip on the main thread. Only successfully converted results are added. Duplicate output names receive numeric suffixes to prevent overwriting entries inside the archive. The archive uses STORE mode to avoid additional CPU cost from compression. ZIP integrity and browser download behavior have been user-verified.


## 20. Baseline TIFF output

The TIFF encoder reuses the existing UTIF2 dependency. It reads RGBA pixels from OffscreenCanvas where available, with an HTML Canvas fallback, then calls UTIF2 `encodeImage(rgba, width, height)`. The current API writes uncompressed TIFF data. This keeps the first output implementation small and local, but generated files may be substantially larger than compressed TIFF files. Compression selection, metadata preservation, and multi-page TIFF writing are not included. The conversion service validates the TIFF signature, reopens the generated file through the TIFF decoder, and checks dimensions. The user verified real source conversions, independent viewing, dimensions, visual output, Worker conversion, individual downloads, and ZIP export.
