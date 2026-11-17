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
| JSZip | ZIP downloads, planned for batch phase |
| heic-to | Candidate HEIC/HEIF decoder |
| UTIF.js | Candidate TIFF decoder |

Advanced format libraries remain provisional until compatibility, maintenance, bundle size, license, and browser support have been checked.

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
│       └── main.js
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

## 8. Conversion settings

- Output format.
- Quality for supported lossy encoders.
- Width, height, and aspect-ratio lock.
- Background color when transparency cannot be represented.
- Output filename.
- Individual download or ZIP download.

Quality controls must be format-aware. PNG must not be presented as if its quality slider behaves like JPEG quality.

## 9. Conversion result

Show original and output filename/format, file sizes, dimensions, status, preview, and download action.

```text
savingsPercent = ((originalSize - outputSize) / originalSize) * 100
```

A negative value means the output is larger. Display that honestly.

## 10. Browser compatibility

Target Chrome, Edge, Firefox, and Safari. Feature-detect Canvas encoding, OffscreenCanvas, worker support, and decoding capabilities.

## 11. Resource management

Revoke Object URLs, close ImageBitmap instances, release workers and large references, limit concurrency, handle cancellation, and avoid retaining duplicate image data longer than necessary.

## 12. Testing requirements

Test PNG/JPEG/WebP paths, transparency to JPEG with a selected background, corrupt and unsupported inputs, multiple files with independent failures, large dimensions, output MIME type, reopening generated files, ZIP integrity, themes, responsive layout, SVG safety, and format-specific HEIC/TIFF/GIF fixtures when those phases begin.

## 13. Definition of Done

A feature is complete when it matches the agreed behavior, handles errors, passes relevant tests, preserves local processing, releases temporary resources, and has appropriate documentation.
