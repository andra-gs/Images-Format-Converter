# Technical Specification

## 1. Architecture

The application uses a client-side, modular architecture with four conceptual layers.

```text
Presentation Layer
  HTML / CSS / UI modules
          |
          v
Application Layer
  File manager / Queue manager / Conversion controller
          |
          v
Execution Layer
  Main thread <----> Web Workers
          |
          v
Image Processing Layer
  Browser APIs / format-specific decoders and encoders
          |
          v
Output Layer
  Blob / Object URL / download / ZIP
```

There is no planned backend, database, or remote image-processing service.

## 2. Main modules

### Presentation
Responsible for rendering and interaction:
- Uploader
- File queue
- Preview
- Conversion settings
- Results
- Theme controls
- Notifications and error messages

### Application core
Responsible for coordinating work:
- File manager
- Queue manager
- Conversion controller
- Capability registry
- Job state and cancellation
- Event communication

### Format adapters
Each format adapter should expose a consistent interface where practical:
- Detect or declare supported input formats.
- Decode a source file into an agreed internal representation.
- Encode an internal representation to a target format.
- Report unsupported features and useful errors.
- Release resources.

Avoid assuming every adapter can support every conversion direction.

### Execution
- Main thread: UI updates, small jobs, capability checks, orchestration.
- Web Workers: suitable CPU-heavy decoding, encoding, and batch tasks.
- OffscreenCanvas: use when supported and useful.
- Fallback: provide a main-thread or alternative worker path where practical.

## 3. Suggested technology stack

| Technology | Purpose |
|---|---|
| HTML5 | Document structure |
| CSS3 | Styling, responsive layout, themes |
| Vanilla JavaScript ES modules | Application logic |
| Vite | Local development server and production build |
| Canvas API | Raster drawing and encoding |
| ImageBitmap | Efficient decoded image representation |
| Web Workers | Background processing |
| OffscreenCanvas | Canvas operations in workers where supported |
| JSZip | Package multiple output files |
| heic-to (candidate) | HEIC/HEIF decoding |
| UTIF.js (candidate) | TIFF decoding |
| Lucide | Interface icons |

Library selection is provisional until compatibility, maintenance, bundle size, license, and browser support have been checked.

## 4. Suggested directory structure

```text
images-format-converter/
├── public/
│   ├── favicon.svg
│   └── icons/
├── src/
│   ├── index.html
│   ├── assets/
│   ├── styles/
│   │   ├── main.css
│   │   ├── variables.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── themes.css
│   ├── js/
│   │   ├── main.js
│   │   ├── core/
│   │   │   ├── file-manager.js
│   │   │   ├── queue-manager.js
│   │   │   ├── conversion-controller.js
│   │   │   └── event-bus.js
│   │   ├── converters/
│   │   │   ├── canvas-converter.js
│   │   │   ├── bmp-converter.js
│   │   │   ├── tiff-converter.js
│   │   │   ├── heic-converter.js
│   │   │   ├── svg-converter.js
│   │   │   └── gif-converter.js
│   │   ├── workers/
│   │   │   └── conversion.worker.js
│   │   ├── ui/
│   │   │   ├── uploader.js
│   │   │   ├── preview.js
│   │   │   ├── settings.js
│   │   │   ├── results.js
│   │   │   └── theme.js
│   │   └── utils/
│   │       ├── file-validation.js
│   │       ├── format-detection.js
│   │       ├── image-utils.js
│   │       └── size-calculator.js
│   └── tests/
│       ├── validation.test.js
│       ├── converter.test.js
│       └── utils.test.js
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── TECHNICAL_SPECIFICATION.md
│   ├── DEVELOPMENT_ROADMAP.md
│   └── DEVELOPMENT_LOG.md
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
├── .gitignore
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

This is a target structure. Create folders and modules when the relevant phase begins; do not create empty files solely to make the tree look complete.

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

This is a conceptual model. Refine it when implementation reveals concrete requirements. Avoid storing duplicate large binary data unnecessarily.

## 6. Job statuses

- `pending`: waiting in queue.
- `processing`: currently being processed.
- `completed`: conversion and output validation succeeded.
- `failed`: conversion failed.
- `cancelled`: user or application cancelled the job.

Each queue item should fail independently where possible.

## 7. File validation

Validation should consider:
- File size.
- File extension as a hint.
- MIME type as a hint.
- Actual decoder support.
- Image dimensions and pixel count.
- Corrupt or malformed input.
- Format-specific constraints.

Do not rely on extension or MIME type alone. Do not assume a small compressed file will decode into a small amount of memory.

## 8. Conversion settings

- Output format.
- Quality for supported lossy encoders.
- Width and height.
- Aspect-ratio lock.
- Background color when transparency cannot be represented.
- Output filename.
- Individual download or ZIP download.

Quality controls must be format-aware. PNG is lossless in the ordinary Canvas encoding path and should not be presented as if its quality slider behaves like JPEG quality.

## 9. Conversion result

For each completed item, show:
- Original filename and format.
- Output filename and format.
- Original file size.
- Output file size.
- Output dimensions.
- Conversion status.
- Preview.
- Download action.

Size savings formula:

```text
savingsPercent =
  ((originalSize - outputSize) / originalSize) * 100
```

A negative value means the output is larger. Display that honestly.

## 10. Browser compatibility

Target testing:
- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

Feature-detect browser capabilities at runtime. Do not assume Canvas encoding, OffscreenCanvas, worker support, or format decoding is identical across browsers.

## 11. Resource management

- Revoke object URLs when no longer needed.
- Close ImageBitmap instances.
- Clear canvas dimensions or references when appropriate.
- Release worker resources and terminate workers when appropriate.
- Limit concurrency to avoid memory exhaustion.
- Handle cancellation and application teardown.
- Avoid retaining original and converted copies longer than necessary.

## 12. Testing requirements

At minimum:
- PNG to JPEG, WebP, and supported raster outputs.
- JPEG to PNG and WebP.
- WebP to PNG and JPEG.
- Transparent source to JPEG with selected background.
- Unsupported or corrupt input.
- Multiple files and independent failures.
- Large dimensions and memory pressure.
- Correct output MIME type.
- Reopen/decode generated output.
- ZIP integrity.
- Light/dark theme.
- Responsive layout.
- SVG safety tests.
- HEIC/TIFF/GIF format-specific test fixtures when those phases are implemented.

## 13. Definition of Done

A feature is complete when:
1. It matches the agreed behavior.
2. It handles expected errors.
3. It does not break unrelated queue items.
4. It passes relevant tests.
5. It respects local-processing and privacy requirements.
6. It releases temporary resources.
7. Documentation and development log are updated.
