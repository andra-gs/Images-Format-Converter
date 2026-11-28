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
| gifuct-js | GIF first-frame extraction for conversion to static formats |
| modern-gif | Animated GIF decoding and encoding, including frame composition and color quantization |

Advanced format libraries remain subject to compatibility, bundle size, license, and browser testing. UTIF2 4.1.0 was published in May 2023, so its maintenance status and compatibility should be reviewed during ongoing testing. Its MIT license and documented compression coverage make it a reasonable initial candidate, not a guarantee of universal TIFF support. heic-to 1.6.7 is selected for HEIC/HEIF decoding. It exposes a browser entry and a worker-specific `heic-to/next` entry. The adapter prefers native ImageBitmap decoding, then falls back to heic-to's bitmap output. The user has verified real HEIC and HEIF files through the browser decoder, main conversion pipeline, and Web Worker. UTIF2 4.1.0 is selected for TIFF input decoding; its adapter decodes the first IFD and renders it to Canvas. The user has verified representative real TIFF files through browser and Worker tests.

## 4. Current project structure

This is a representative view of the current structure after Phase 5 and Phase 6 integration. It lists the principal modules, not every test fixture or utility.

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
│   │   ├── editor.css
│   │   ├── export-panel.css
│   │   └── themes.css
│   └── js/
│       ├── main.js
│       ├── core/
│       │   ├── file-validator.js
│       │   ├── format-detector.js
│       │   ├── capability-registry.js
│       │   ├── image-decoder.js
│       │   ├── image-encoder.js
│       │   ├── conversion-service.js
│       │   ├── animated-gif.js
│       │   ├── image-transformer.js
│       │   ├── image-adjuster.js
│       │   ├── image-processing-adapter.js
│       │   ├── editor-input-state.js
│       │   ├── editor-queue-events.js
│       │   ├── image-thumbnail.js
│       │   └── image-optimizer.js
│       └── ui/
│           ├── image-editor.js
│           ├── export-panel.js
│           └── export-optimizer-adapter.js
├── tests/
│   ├── capability-registry.test.js
│   ├── image-decoder.test.js
│   ├── image-encoder.test.js
│   ├── image-transformer.test.js
│   ├── image-adjuster.test.js
│   ├── image-optimizer.test.js
│   ├── image-processing-adapter.test.js
│   ├── export-panel.test.js
│   ├── export-optimizer-adapter.test.js
│   ├── browser-decoder.html
│   ├── browser-optimizer.html
│   └── browser-export-optimizer.html
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

The browser decoder handles PNG, JPEG, WebP, and BMP through `createImageBitmap()` when available, with an `HTMLImageElement` and Object URL fallback. HEIC/HEIF first attempt native ImageBitmap decoding, then use heic-to's WebAssembly decoder. The worker uses the package's `heic-to/next` entry; the main-thread fallback uses `heic-to`. The user verified HEIC and HEIF with real files through the decoder test, main conversion pipeline, and Worker. TIFF uses UTIF2 to decode the first IFD, convert it to RGBA, and render it to Canvas or OffscreenCanvas. The current TIFF adapter intentionally uses only the first page of a multi-page file. The user verified real TIFF fixtures through browser and Worker tests. The decoder returns a common result containing the decoded source, width, height, detected format, and a `close()` method. Callers must close the result after processing. SVG uses a restricted sanitizer and browser rasterization path. The user verified real-browser SVG decoding and raster-to-SVG wrapper output, including re-decoding generated SVG files, dimensions, transparency, individual downloads, and ZIP export. GIF-to-static conversion uses gifuct-js to decompress only the first image frame and render it to Canvas or OffscreenCanvas. GIF output uses modern-gif 2.1.0 to encode single-frame GIFs from static sources and to decode/re-encode animated GIF sources. The animated path uses modern-gif's worker entry where available, with a synchronous fallback. It validates logical dimensions, frame descriptors, frame count, per-frame pixel area, total animation pixel area, and output signature/frame count. The user verified animated GIF-to-GIF and static-image-to-GIF output in the real browser, including timing, looping, transparency, frame order, batch processing, downloads, and ZIP export. GitHub Actions passed npm ci, npm test, and npm run build.

## 9. Initial PNG conversion pipeline

The first conversion path decodes a supported source image, draws it to a 2D Canvas, and encodes the canvas as PNG. The encoder prefers `OffscreenCanvas` and falls back to an HTML canvas. The conversion service checks the generated PNG signature, decodes the generated output again, and confirms that its dimensions match the source. It closes both decoded image resources after use. PNG output does not use the lossy quality slider.

The user verified the complete PNG conversion flow in the main interface with real PNG, JPEG, WebP, and BMP input files. The generated files opened as PNG, retained the source dimensions, preserved PNG transparency, downloaded with the `.png` extension, and worked independently during multi-file conversion. PNG encoding is marked implemented in the capability registry. JPEG output is also implemented and enabled in the main interface after separate real-file browser verification. WebP output is now implemented, verified, and enabled in the main interface. BMP output now has a dedicated 24-bit encoder. It writes a Windows BMP file header and 40-byte DIB header, stores rows bottom-up as BGR pixels, and pads each row to a 4-byte boundary. Because this implementation uses 24-bit BMP, transparent pixels are composited onto white. The conversion service validates the BMP signature, reopens the output, and checks its dimensions. Real-file browser verification has been user-confirmed.

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

The BMP encoder is a dedicated browser-side implementation. It draws the decoded source to a 2D Canvas, reads RGBA pixel data, and writes a 24-bit Windows BMP file. Pixel rows are stored bottom-up in BGR order and padded to 4-byte boundaries. The 24-bit format has no alpha channel, so transparent pixels are composited onto white. The conversion service checks the BMP signature, decodes the generated output again, and confirms that its dimensions match the source. Automated unit tests cover the file header, pixel order, row padding, alpha compositing, and HTML Canvas fallback. Real-file browser verification has been user-confirmed.


## 19. Batch processing and worker execution

The application keeps the UI and queue orchestration on the main thread. When Worker, OffscreenCanvas, and createImageBitmap are available, image conversion runs in a module Web Worker. The worker uses the same conversion service and returns the verified output Blob and dimensions. If worker support is unavailable or worker execution cannot complete, the application retries through the main-thread conversion path so HTMLImageElement and HTMLCanvas fallbacks remain available.

The queue processes one image at a time to limit simultaneous decoded-image memory usage. Each job moves through pending, processing, completed, failed, or cancelled. The interface shows an indeterminate per-file processing indicator and overall batch completion progress. The cancel action allows the active conversion to finish, then marks remaining queued files as cancelled. It does not interrupt a running Canvas operation.

Decoded ImageBitmap resources are closed by the conversion service. The UI revokes input and output Object URLs when their items are removed, when the queue is cleared, or when the page unloads. The conversion worker is terminated on page unload. ZIP export uses JSZip on the main thread. Only successfully converted results are added. Duplicate output names receive numeric suffixes to prevent overwriting entries inside the archive. The archive uses STORE mode to avoid additional CPU cost from compression. ZIP integrity and browser download behavior have been user-verified.


## 20. Baseline TIFF output

The TIFF encoder reuses the existing UTIF2 dependency. It reads RGBA pixels from OffscreenCanvas where available, with an HTML Canvas fallback, then calls UTIF2 `encodeImage(rgba, width, height)`. The current API writes uncompressed TIFF data. This keeps the first output implementation small and local, but generated files may be substantially larger than compressed TIFF files. Compression selection, metadata preservation, and multi-page TIFF writing are not included. The conversion service validates the TIFF signature, reopens the generated file through the TIFF decoder, and checks dimensions. The user verified real source conversions, independent viewing, dimensions, visual output, Worker conversion, individual downloads, and ZIP export.


## 21. Safe SVG rasterization

SVG input is parsed with the browser's DOMParser into an inert XML document. The application does not insert the original or sanitized SVG markup into the live page DOM. A strict allowlist retains basic vector shapes, text, gradients, and local clipping/mask references. Script elements, event attributes, style blocks and attributes, external links, embedded images, foreignObject, animation, and unsupported elements are removed. DOCTYPE and entity declarations are rejected. External URL references are not retained.

The sanitizer requires usable dimensions from numeric width/height values or a valid viewBox. It limits each dimension to 16,384 pixels and the total raster area to 40 million pixels. The sanitized document is serialized to an image/svg+xml Blob and rasterized with createImageBitmap, falling back to an HTMLImageElement when necessary. Temporary object URLs are released when the decoded resource closes.

SVG source conversion runs on the main thread because the sanitizer depends on DOMParser and XMLSerializer. Other supported formats continue to use the existing Worker path. The user verified SVG decoding and conversion in a real browser, including the sanitizer fixture and conversion to PNG, JPEG, WebP, BMP, and TIFF. The current sanitizer intentionally supports a restricted SVG subset; unsupported SVG features may be removed and therefore may not appear in the rasterized result.


## 22. Static GIF first-frame decoding

The initial GIF adapter uses gifuct-js 2.1.2. It parses the GIF logical screen and frame descriptors, then decompresses only the first image frame rather than decompressing every frame. The frame patch is drawn at its descriptor offset onto a canvas sized to the logical screen. The adapter preserves first-frame transparency and applies the global background color when the frame does not declare transparency. Logical dimensions are limited to 16,384 pixels per side and 40 million total pixels.

This path supports converting GIF input into the currently implemented raster output formats. For animated GIF input, the output is a still image from the first image frame. It does not preserve animation, frame timing, looping, or later frames. The decoder can run in the existing Web Worker when supported and falls back to the main thread. The user verified GIF decoding in the browser and conversion through the main application. GIF first-frame decoding is available as input; animation, frame timing, and later frames are not preserved.


## 23. Raster-to-SVG wrapper output

The SVG encoder does not trace raster pixels into vector paths. It first encodes the decoded source to PNG with the browser Canvas API, then embeds that PNG as a base64 data resource in an SVG `<image>` element. The SVG root and image element use the decoded source pixel dimensions and matching viewBox. The result retains the visible raster image but does not provide editable vector shapes or resolution-independent detail.

The SVG sanitizer permits an `image` element only when its `href` is a bounded, base64-encoded `data:image/png` resource. External URLs, other data MIME types, scripts, CSS, and active content remain disallowed. The output is reopened through the safe SVG decoder and checked for matching dimensions by the conversion service. SVG output runs on the main thread because safe SVG verification depends on DOMParser and XMLSerializer. The user verified transparent and opaque source conversion, dimensions, re-decoding, individual downloads, and ZIP export. The user also reports that `npm test` and `npm run build` pass after this implementation.


## 24. Animated GIF output

The current GIF policy separates static and animated conversions:

- GIF to PNG, JPEG, WebP, BMP, TIFF, or SVG uses only the first image frame through the existing gifuct-js decoder.
- GIF to GIF decodes all composited logical-screen frames with modern-gif 2.1.0 and re-encodes them in their original order.
- Frame delays are normalized to GIF's 10 ms timing units before encoding.
- The source looping flag and loop count are passed to the encoder when present.
- The encoder uses up to 255 palette colors to reserve a transparent index. Palette quantization can change colors slightly.
- GIF transparency is binary. Partial alpha cannot be represented exactly and may be simplified during encoding.
- The encoder rebuilds frames from fully composited images, so it preserves the displayed animation rather than the original disposal-method codes.
- Static image input is converted to a single-frame GIF with a 100 ms frame delay.
- Animated GIF conversion to animated WebP or APNG is not supported.

The animated path runs inside the application's existing conversion Worker. The codec itself runs synchronously inside that worker to avoid spawning nested workers that do not expose a public termination API. If the application Worker is unavailable, the existing conversion service falls back to the main thread. Input is limited to 200 frames, 16,384 pixels per dimension, 40 million pixels per individual frame, and 25 million logical-screen pixels across the animation. These limits reduce, but do not eliminate, memory pressure. All frame data is held in memory during re-encoding.

The encoder output is reopened with modern-gif to verify logical dimensions and frame count, then checked with the existing signature detector. On 2026-11-20, the user confirmed real-browser verification of animated GIF-to-GIF and static-image-to-GIF behavior, including timing, looping, transparency, frame order, batch processing, individual downloads, and ZIP export. The current limitations remain: palette quantization can alter colors, partial alpha may be simplified, original disposal-method codes are not preserved, and animated GIF-to-WebP/APNG is unsupported.

## 18. Multi-developer module boundaries for Phases 5 and 6

Before using this specification for implementation, read the root-level `AGENTS.md` for persistent ChatGPT instructions and collaboration rules.

The team consists of three developers. GitHub usernames are the canonical identifiers for task ownership:

- `andra-gs`: Phase 5 Image Transformation; Phase 6 Image Optimization Engine.
- `Adit1945-web`: Phase 5 Image Adjustment; no Phase 6 assignment.
- `FarrelPtrv`: Phase 5 Editor UI and Integration; Phase 6 Export Presets and UI Integration. Metadata Management is deferred to a future backlog item.

### Phase 5 module boundaries

| Owner | Module | Responsibilities | Suggested files |
|---|---|---|---|
| `andra-gs` | Image Transformer | Resize, aspect-ratio handling, crop, rotation, horizontal flip, vertical flip | `src/js/core/image-transformer.js`, `tests/image-transformer.test.js` |
| `Adit1945-web` | Image Adjuster | Brightness, contrast, saturation, grayscale, sepia, blur | `src/js/core/image-adjuster.js`, `tests/image-adjuster.test.js` |
| `FarrelPtrv` | Editor UI and integration | Editing workspace, preview, controls, reset/apply, integration with transformer, adjuster, and existing conversion service | `src/js/ui/image-editor.js`, `src/styles/editor.css`, `tests/image-editor.test.js` |

Transformation and adjustment modules must not depend on DOM UI state. They should expose documented processing interfaces and predictable errors. The editor owns user interaction and coordinates calls to the processing modules. The existing conversion service remains the final output conversion path.

### Phase 6 module boundaries

| Owner | Module | Responsibilities | Suggested files |
|---|---|---|---|
| `andra-gs` | Image Optimizer | Format-aware quality presets, feasible target-size attempts, actual file-size measurement and comparison, output validation | `src/js/core/image-optimizer.js`, `tests/image-optimizer.test.js` |
| `FarrelPtrv` | Export UI and integration | Capability-aware export controls, preset selection, size reporting, individual-download and ZIP integration | `src/js/ui/export-panel.js`, `src/styles/export-panel.css`, `tests/export-panel.test.js` |

### Agreed Phase 5 processing contract

The processing-module contract was agreed by the project team before implementation. The editor operation-history and reset-state design remains an editor-level coordination item.

#### Shared image representation

Both processing modules accept an sRGB ImageData-shaped value:

```javascript
{
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colorSpace: "srgb"
}
```

Inputs are immutable. Each module returns a new value in `{ imageData, width, height }`. The caller owns returned buffers. Both modules preserve the source alpha channel and use the shared limits of 16,384 pixels per side and 40,000,000 pixels total.

#### Public APIs

```javascript
applyImageTransformations(imageData, transformations)
applyImageAdjustments(imageData, adjustments)
```

The Transformer applies Crop → Resize → Rotation → Flip. The Adjuster applies Brightness → Contrast → Saturation → Grayscale → Sepia → Blur.

#### Adjustment options

| Option | Range | Default |
|---|---:|---:|
| `brightness` | -100 to 100 | 0 |
| `contrast` | -100 to 100 | 0 |
| `saturation` | 0 to 200 | 100 |
| `grayscale` | boolean | false |
| `sepia` | boolean | false |
| `blur` | 0 to 20 pixels | 0 |

Blur uses Gaussian Blur with an integer radius in pixels. The Image Adjuster rejects unknown properties and values outside the documented ranges.

#### Errors and resource ownership

- Wrong input types or invalid ImageData structures throw `TypeError`.
- Invalid parameter ranges and dimensions throw `RangeError`.
- Internal processing failures use an `ImageProcessingError` with a `.code` property.
- Shared error codes include `INVALID_IMAGE_DATA`, `INVALID_TRANSFORM_OPTIONS`, `INVALID_ADJUSTMENT_OPTIONS`, `INVALID_CROP_BOUNDS`, `IMAGE_DIMENSIONS_EXCEEDED`, and `IMAGE_PROCESSING_FAILED`.
- Processing modules do not depend on DOM or UI state. They do not mutate or close caller-owned input data. The caller owns returned ImageData buffers.
- Cancellation is coordinated by the asynchronous pipeline or Worker layer through `AbortSignal`; the synchronous pixel modules do not own cancellation.

The editor developer must coordinate the editable operation state, original-image retention for reset, and integration sequence with both processing-module owners. Do not create incompatible contracts independently in separate branches.

### Execution and testing requirements

- Keep processing modules independent from UI markup and DOM event handlers where practical.
- Reuse the existing conversion pipeline and capability registry. Do not create a second conversion engine.
- Preserve local-first processing. Selected image data and metadata must not be sent to remote services.
- Keep resource cleanup and dimension/pixel limits consistent with existing project safety practices.
- Add unit tests for processing logic and integration tests for user workflows.
- Test representative real images and every format for which the UI exposes the new option.
- Run `npm test` and `npm run build` before submitting each Pull Request.
- Run the full test suite, production build, and end-to-end browser tests after the three branches are integrated.

Suggested branch names:

| Phase | `andra-gs` | `Adit1945-web` | `FarrelPtrv` |
|---|---|---|---|
| Phase 5 | `phase-5-transformation` | `phase-5-adjustment` | `phase-5-editor-ui` |
| Phase 6 | `phase-6-optimization` | Not applicable | `phase-6-export-ui` |

These are naming conventions only. A branch is not considered created or implemented merely because it appears in this specification.

## 25. Phase 5 shared ImageData contract

The Phase 5 team has agreed to use an sRGB pixel buffer as the shared representation between the Image Transformer, Image Adjuster, and Editor integration.

```javascript
{
  data: Uint8ClampedArray,
  width: number,
  height: number,
  colorSpace: "srgb"
}
```

Both processing modules receive an ImageData-shaped value, must not mutate the input, and return a new result:

```javascript
{
  imageData,
  width,
  height
}
```

The returned width and height must match the returned `imageData`. Image dimensions and every allocated pixel buffer/canvas are subject to the project limits: 16,384 pixels per side and 40,000,000 total pixels. Alpha values must be preserved according to the agreed operation behavior. Processing modules must not depend on DOM UI state and should remain compatible with Web Workers.

### Image Transformer — `src/js/core/image-transformer.js`

Owner: `andra-gs`.

Public API:

```javascript
applyImageTransformations(imageData, transformations)
```

The transformations object contains `resize`, `crop`, `rotation`, `flipHorizontal`, and `flipVertical`. Processing order is crop, resize, rotation, then flip. Resize dimensions are pixels; aspect-ratio mode calculates a missing dimension and fits two provided dimensions proportionally. With aspect ratio disabled, both dimensions are required. Null resize dimensions preserve the current size. Null crop width/height use the remaining source area from the crop origin. Crop coordinates refer to the original source. Rotation accepts 0, 90, 180, and 270 degrees clockwise; 90/270 swap output dimensions.

### Image Adjuster — `src/js/core/image-adjuster.js`

Owner: `Adit1945-web`.

Public API:

```javascript
applyImageAdjustments(imageData, adjustments)
```

Defaults and ranges:

| Parameter | Range | Default |
|---|---:|---:|
| brightness | -100 to 100 | 0 |
| contrast | -100 to 100 | 0 |
| saturation | 0 to 200 | 100 |
| blur | 0 to 20 px | 0 |
| grayscale | Boolean | false |
| sepia | Boolean | false |

Unknown properties and invalid types/ranges are rejected. Processing order is brightness, contrast, saturation, grayscale, sepia, and Gaussian blur. Output dimensions remain unchanged and alpha values are preserved.

### Editor integration — `FarrelPtrv`

The editor's shared state contains separate `transformations` and `adjustments` objects. The processing pipeline is:

```text
decodeImage()
  → decoder source to owned ImageData
  → applyImageTransformations()
  → applyImageAdjustments()
  → ImageData to Canvas/encoder adapter
  → existing conversion service
```

The decoder result remains owned by the caller. The adapter copies decoded pixels into an owned ImageData buffer and releases only its temporary canvas. Processing modules own their temporary resources and return new ImageData. The adapter does not close the decoder result. Output ImageData is owned by the caller and can be copied into a caller-owned Canvas for preview or encoding.

The editor adapter uses dependency injection for the two processing functions so the UI branch can be prepared before the modules are merged. Until both functions are supplied, capabilities remain unavailable and processing rejects with `EDITOR_PROCESSING_UNAVAILABLE`. The editor Apply action must remain disabled until real modules and conversion handoff are integrated and tested.

The adapter checks cancellation between processing stages using AbortSignal. Cancellation raises AbortError. It validates ImageData structure, sRGB color space, buffer length, output dimensions, and project dimension limits. A module result must have the agreed `{ imageData, width, height }` shape with matching dimensions.

Invalid input types and malformed ImageData raise TypeError. Invalid values and dimensions raise RangeError; excessive dimensions use code `IMAGE_DIMENSIONS_EXCEEDED`. Unexpected internal adapter failures are wrapped as `ImageProcessingError` with code `IMAGE_PROCESSING_FAILED`. Module-specific errors that already carry a code are preserved. The modules use the agreed error codes `INVALID_IMAGE_DATA`, `INVALID_TRANSFORM_OPTIONS`, `INVALID_ADJUSTMENT_OPTIONS`, `INVALID_CROP_BOUNDS`, `IMAGE_DIMENSIONS_EXCEEDED`, and `IMAGE_PROCESSING_FAILED`.

The existing conversion service currently accepts a File/Blob and performs its own decoding and output validation. The final integration must hand the edited pixels into that established service without bypassing output signature/dimension validation or creating a parallel conversion engine. A lossless intermediate or a coordinated service entry point must be selected during final integration; do not silently route the original file back through conversion because that would discard edits.

## Queue → Editor event contract

The Queue and Editor communicate through the browser Custom Event `ifc:queue-change`. The event detail contains an `entries` array of lightweight snapshots with `id`, `name`, `file`, `format`, and `url`. The Queue owns the original File and preview object URL; the Editor consumes references and must not revoke Queue-owned URLs. Queue mutations (add, remove, clear) publish a fresh snapshot. This event bridge does not change the existing File/Blob conversion or Worker path.

## 26. Edited ImageData conversion handoff

The Editor integration uses the existing encoder and output-validation pipeline through this service entry point:

```javascript
convertImageDataToFormat(imageData, format, options)
```

- Input: the agreed sRGB ImageData representation.
- Supported formats: PNG, JPEG, WebP, BMP, TIFF, and SVG, matching the current `image-encoder.js` implementations.
- Animated GIF is intentionally excluded from this edited-pixel entry point. The existing GIF path accepts the original File and preserves its animation behavior; it must not be called with the original file after editing because that would discard the edited pixels.
- The service copies ImageData into a new Canvas-backed decoded-image-compatible object, then calls the existing `encodeImage()` implementation.
- The generated Blob is checked using `detectImageFormat()`, decoded again using `decodeImage()`, and checked for matching output dimensions, just like the File/Blob conversion path.
- The temporary Canvas-backed source and verification decode are released in `finally` blocks. The caller retains ownership of the input ImageData and returned Blob.
- This edited ImageData path currently runs on the main thread. The existing File/Blob conversion path and Worker routing remain unchanged.

The shared validation routine is `encodeAndValidateImage()`; both direct File/Blob conversion and edited ImageData conversion use it. Do not add a second encoder or bypass output signature/dimension validation.

## 27. Phase 5 Editor integration — current implementation status

This section records the Phase 5 Editor implementation that was developed on `phase-5-editor-ui` and merged into `main` through PR #5. It supersedes the earlier planning-only statements in Section 25 that describe the adapter as waiting for module integration or the conversion service as accepting only File/Blob input.

### Implemented editor pipeline

The Editor UI is connected to the actual Image Transformer and Image Adjuster modules through `createImageProcessingAdapter()` in `src/js/core/image-processing-adapter.js`. The adapter receives the processing functions through dependency injection, copies decoded source pixels into an owned sRGB ImageData buffer, applies transformations before adjustments, validates the returned image data and dimensions, and supports cancellation between processing stages.

The Editor UI in `src/js/ui/image-editor.js` provides queue-based image selection, original and processed previews, resize and aspect-ratio controls, crop controls, rotation and flips, brightness, contrast, saturation, blur, grayscale, sepia, Apply, and Reset. Apply processes the selected decoded source and publishes the edited ImageData to the application. Reset clears the edited result and returns conversion to the original File. The original File is retained and is not mutated.

The Queue publishes `ifc:queue-change` snapshots when files are added, removed, or cleared. The Editor consumes those snapshots and does not take ownership of or revoke Queue-owned input object URLs.

### Conversion handoff

The application stores edited ImageData separately from the original File. When an edited image is converted, `main.js` calls `convertImageDataToFormat(imageData, format, options)` through the existing conversion service. Supported edited-image output formats are PNG, JPEG, WebP, BMP, TIFF, and SVG. The shared encoder and output-validation path checks the output signature, decodes the result again, and verifies its dimensions.

Edited ImageData export to GIF is not supported. GIF conversion continues through the original File-based path to preserve the existing animated-GIF behavior. If the user has edited an image and selects GIF, the application reports that limitation instead of silently converting the unedited original and discarding the edits.

The edited ImageData conversion path currently runs on the main thread. The established File/Blob conversion path and its Worker orchestration remain unchanged.

### Verification recorded for 2026-11-22

- Automated tests: `npm test` — 86 tests passed, 0 failed.
- Production build: `npm run build` — successful with Vite. The build reports a large-chunk warning for HEIC-related bundles; this is a warning, not a build failure.
- Browser integration: the user reports that the Editor successfully processes an image, displays the expected result, and leaves the existing conversion features working.
- Queue preview selection was manually verified when switching between queued images.

PR #5 was merged into `main` on 2026-11-22. The PR reported 98 passing automated tests, a successful production build, and completed browser verification. The project owner also reported post-merge `npm test` and `npm run dev` checks passing on 2026-11-23. Phase 5 is complete.


## 28. Editor preview decoding and optional dimension inputs

The Editor must not depend on native `<img>` support for the selected source format. On selection, it calls `decodeImage(file)` directly, copies the decoded source into owned sRGB ImageData using `decodedImageToImageData()`, and generates the original preview through the ImageData-to-Canvas PNG preview pipeline. This is required for decoder-supported formats such as HEIC/HEIF and TIFF that may not load in a browser image element.

The Editor owns the decoder result and closes it when the selected source changes, decoding fails, or the page unloads. The adapter releases its temporary Canvas after copying pixels. The Editor owns generated preview object URLs and revokes them when replaced, when the selected source changes, and on page unload. Queue-owned source URLs remain owned by the Queue and are not revoked by the Editor.

Input semantics:

- Crop `x` and `y`: empty values normalize to `0`.
- Crop `width` and `height`: empty values normalize to `null`, meaning the crop extends to the remaining right or bottom edge.
- Resize `width` and `height`: empty values normalize to `null`; stale numeric values must not be retained.
- With resize aspect ratio locked, the user-entered dimension recalculates the opposite draft dimension. If one dimension is null at processing time, the Transformer derives it from the other dimension and the cropped source aspect ratio.
- With aspect ratio unlocked, both positive dimensions are required before Apply; a missing dimension must not be sent to the Transformer as a valid resize request.

Focused unit coverage is in `tests/editor-input-state.test.js`. The Phase 5 Editor UI document records user-reported browser verification for HEIC, TIFF, PNG, JPEG, and WebP, plus Apply behavior and queue thumbnail previews. The project owner confirmed completion of the broader cross-browser and mobile QA activities in Phase 7 on 2026-11-26. Detailed browser/device results are not duplicated in this technical contract.


## Phase 6 - Image Optimization Engine

The optimizer is implemented in `src/js/core/image-optimizer.js` and exposes:
- `optimizeImage(source, options)`
- `IMAGE_OPTIMIZATION_CAPABILITIES`

The module reuses the existing conversion service and encoder paths. It accepts a File/Blob source or an edited-image source object containing the original file and ImageData. Animated GIF remains on the original File-based path; edited ImageData is not silently discarded for GIF export.

Optimization capabilities:
- JPEG and WebP: Low, Medium, and High presets; best-effort target-size mode with bounded attempts.
- PNG, BMP, TIFF, GIF, and SVG: existing conversion path only, with optimization mode `none`.
- Results report actual source/output byte sizes, byte difference, percentage reduction or increase, output format/MIME type, dimensions, optimization metadata, and output-validation status.

The Export UI owns settings presentation, per-file orchestration, individual downloads, and ZIP export. The optimizer owns quality mapping and target-size search. The adapter validates the UI-to-optimizer contract and must not duplicate optimizer policy.

Integration status (2026-11-25): the optimizer module, API contract, focused tests, and browser harness were merged through PR #7. The production Export UI integration was subsequently merged through PR #9. Both are now part of `main`.


## Phase 6 production export integration (2026-11-25)

`src/js/main.js` now uses the Phase 6 optimizer for the production conversion queue:

- Import `optimizeImage()` from `src/js/core/image-optimizer.js` and call it through `runExportWithOptimizer()` from the Export UI adapter.
- Build optimizer options from each queue entry's own `exportSettingsByFile` state. Unsupported output formats are normalized to `mode: "none"` by `buildExportOptions()`.
- Unedited entries pass the original `entry.file`. Edited entries pass `{ file: entry.file, imageData }`, preserving the edited-pixel source while retaining the original file size as the source metric.
- The existing sequential `for...of` loop, per-entry `try/catch`, progress accounting, and cancellation checks between entries remain in place. The production queue does not use `runIndependentExports()` or `Promise.all()`.
- The validated optimizer result Blob is stored in `conversionResults`; individual download links and ZIP generation consume this stored Blob. ZIP generation does not call the optimizer again.
- Result cards display optimizer-reported original/output sizes, byte difference, percentage reduction or increase, output MIME type, and Target Size reached/not-reached status.
- Animated GIF remains on the File-based optimizer path. Edited ImageData to GIF remains unsupported and is rejected before optimizer invocation.

Verification status: PR #9 merged the production integration into `main`. The PR reports `npm test` 156/156 passed, `npm run build` successful, GitHub Actions checks passing, and integrated real-browser checks completed. The production queue retains sequential processing, per-file error isolation, progress reporting, and cancellation checks between files. The validated Blob is reused by individual downloads and ZIP export. No new conversion service or second ZIP encoder was introduced. The build continues to emit a non-fatal Vite chunk-size advisory for HEIC-related bundles (~3.2 MB each).

## Phase 6 verification record (2026-11-25)

- Optimizer implementation: PR #7, merged into `main`.
- Export UI and production integration: PR #9, merged into `main`.
- Automated tests: 156/156 passed, as reported in PR #9.
- Production build: successful, as reported in PR #9.
- GitHub Actions: all checks passed.
- Browser verification: contributor-reported successful checks covered JPEG/WebP presets, Target Size reached and not reached, unsupported-format `none` mode, animated GIF preservation, edited ImageData, mixed-format batches, per-file failure isolation, individual downloads, ZIP reuse, and existing conversion/Editor regressions.
- Evidence: [PR #9](https://github.com/andra-gs/Images-Format-Converter/pull/9), merge commit `17bb59628660d31bad64bb16eebb5337d9bf44a6`.

These verification results are contributor-reported in the Pull Request and were not independently rerun during this documentation update.

## 29. Stable release baseline (2026-11-26)

The implementation and contracts in this specification describe the first stable release, [`v1.0.0`](https://github.com/andra-gs/Images-Format-Converter/releases/tag/v1.0.0). The release tag points to commit `df882784d4bd18854067663191bc4b00dae5c0d5`.

The published release notes record 156/156 automated tests passing, a successful production build, passing GitHub Actions checks, and completed integrated browser verification. These are release-recorded results, not tests rerun as part of this documentation update.

Known release limitations remain in effect: the startup skeleton uses the light theme even when dark theme is selected; HEIC/HEIF is input-only; animated GIF preservation is limited to GIF-to-GIF; TIFF output is baseline uncompressed and processes only the first page; raster-to-SVG embeds PNG rather than vectorizing; JPEG/WebP optimization is best-effort; and Metadata Management is not included.


## 30. Planned document-processing architecture (post-v1.0.0)

This section records future architectural direction only. It does not describe implemented modules, approved dependencies, or currently supported conversion paths.

### Separation from the image pipeline

PDF and DOCX are document formats. Do not add them to the raster image decoder/encoder registry as if they were ordinary image codecs. Introduce a separate document-processing layer when Phase 8 begins.

Conceptual flow:

Presentation: Document UI
  -> Application: Document workflow controller
  -> Validation: Document capability and validation layer
  -> Adapters: PDF parser/renderer and PDF composer/editor
  -> Bridge: Page canvas or ImageData adapter
  -> Existing image encoders only for PDF-page-to-image export
  -> Local Blob, preview, and download

The exact module boundaries and worker ownership must be designed against the implementation that exists when the phase starts. This flow is a direction, not a prescribed file structure or API.

### Candidate libraries for evaluation

| Library | Candidate role | Evaluation notes |
|---|---|---|
| pdf-lib | Create PDFs, copy/merge pages, page manipulation | Verify image embedding, page operations, document feature preservation, memory, and browser behavior |
| jsPDF | Create PDFs from raster images and page layouts | Selected for Phase 8 on the `phase-8-image-to-pdf` feature branch at version 4.2.1. Verify page sizing, image quality, transparency, and production bundle impact |
| PDF.js | Parse PDFs and render pages to Canvas | Review worker setup, fonts, supported PDF features, memory, and rendering fidelity |
| Mammoth.js | Extract DOCX semantic content to HTML | Not a Microsoft Word layout engine; do not claim exact pagination or visual fidelity |
| docx-preview | Render DOCX content in a browser for preview | Preview does not establish a reliable PDF export path or Word-equivalent layout |
| LibreOffice | Reference renderer for DOCX fidelity evaluation | A remote service is outside the privacy model; local/WASM feasibility must be demonstrated before adoption |

jsPDF 4.2.1 is approved and pinned in the merged Phase 8 Image to PDF engine. pdf-lib is not installed. PDF.js `6.5.438` is the Phase 9 candidate only; it is not yet installed. Verify package/runtime compatibility, Vite local-worker emission, supporting local assets, production bundle contribution, browser support, and representative real-file behavior before adding it to application dependencies.

### Cross-pipeline contracts and constraints

- Image to PDF may reuse existing image decoders, but PDF page composition and PDF encoding belong to the document layer.
- PDF to Image should render one page at a time or use a bounded queue. It may hand rendered Canvas/ImageData to existing PNG, JPEG, and WebP encoders and optimization APIs after an explicit adapter contract is agreed.
- PDF page rendering must enforce page-count, scale, dimension, total-pixel, file-size, and memory limits.
- PDF creation must define page dimensions, orientation, margins, image fit/fill semantics, transparency behavior, and page ordering.
- DOCX-to-PDF requires a fidelity test corpus and a written compatibility matrix. HTML extraction or browser preview alone is insufficient evidence of Word-compatible PDF output.
- PDF merge and page editing must document which structures are retained or lost, including forms, annotations, bookmarks, links, metadata, and encryption.
- All processing remains local. No document bytes, page images, extracted text, or metadata may be transmitted to a remote service.
- Release temporary canvases, ImageBitmap objects, workers, object URLs, and large buffers. Isolate failures by document/page where practical.

Implementation must follow the phase-specific scope and acceptance criteria in docs/DEVELOPMENT_ROADMAP.md. Do not advertise planned document formats in the current supported-format matrix.

## 31. Phase 8–13 implementation contracts and release gates

This section records planning constraints only. It does not approve dependencies or make PDF/DOCX currently supported formats.

### Ownership and integration
- Andra (andra-gs) owns document engines, library evaluation, validation, page/document contracts, resource limits, and core automated tests.
- Farrel (FarrelPtrv) owns document workflow UI, interaction patterns, and UI integration with agreed engine contracts.
- Agree on API signatures, progress/cancellation, error shapes, and resource ownership before integration.
- Merge the engine PR before the UI PR. The UI branch must update from latest main before integration is finalized.

### Contracts to define before implementation
- Image to PDF: ordered image inputs, page dimensions, orientation, margins, fit/fill, transparency/background, output Blob, and validation errors.
- PDF to Image: loading, page selection, render scale/DPI, output format, page-level results, progress, cancellation, and per-page errors.
- PDF management: source documents, merge order, page references, reorder/remove/rotate operations, preservation warnings, and output Blob.
- DOCX to PDF: fidelity corpus and compatibility matrix before implementation. Preview or HTML extraction alone does not prove Word-compatible pagination.

### Resource and privacy requirements
- Process document bytes locally. Never transmit PDFs, DOCX files, rendered pages, extracted text, or document metadata to remote services.
- Enforce limits for input bytes, page count, render scale, output dimensions, total rendered pixels, and concurrent operations.
- Render large PDFs incrementally or through bounded queues. Avoid allocating every page canvas at once.
- Define cancellation and cleanup for workers, canvases, ImageBitmap objects, object URLs, and large buffers.
- Isolate page-level failures where possible. Handle encrypted PDFs and unsupported document structures explicitly.

### Phase 10 DOCX decision gate
A Go decision requires a representative fixture corpus, a compatibility matrix for fonts/margins/tables/images/headers/footers/page breaks/lists/embedded objects, visual comparison against reference rendering with an agreed fidelity threshold, and evidence of local operation within supported browser, bundle, and memory limits.

If these conditions are not met, defer production DOCX-to-PDF and keep it out of the supported-format matrix.

### v2.0.0 release gate
Release only after included workflows pass automated tests, representative real-file tests, browser QA, production build, CI, resource cleanup, and documentation review. DOCX-to-PDF is conditional. Legacy DOC, OCR, PDF-to-DOCX, cloud storage, and online collaboration are outside the planned baseline.


## 31. Phase 8 Image to PDF engine implementation

**Feature branch status:** `phase-8-image-to-pdf`. This section records branch work pending merge and does not imply that the stable `main` application already exposes PDF generation.

### Engine module

- Engine entry point: `src/js/documents/image-to-pdf.js`.
- PDF generator: `jspdf@4.2.1`, pinned in `package.json` and `package-lock.json`.
- The module imports the existing `validateImageFile()` and `decodeImage()` APIs. It does not modify the raster capability registry or conversion service.
- PDF generation runs locally in the browser. The module returns a PDF Blob and metadata. The UI owns preview/download Object URLs.
- Each input File creates one PDF page. Input order determines page order. GIF uses the existing first-frame decoder path; TIFF uses the existing first-page decoder path.
- Image sources are normalized through a temporary canvas and embedded as PNG data. Temporary canvases are reset after encoding, and decoded resources are closed in `finally`.
- `calculateImagePdfPageLayout()` is the sole source of truth for page dimensions, margins, contain placement, and centered cover crop. The PDF writer verifies the current jsPDF page dimensions against the returned layout before drawing.

### Limits and failure behavior

- 25 MiB per input file; 100 MiB combined input size.
- 50 pages maximum.
- 19,200 px maximum source dimension and 20 megapixels per image.
- 100 megapixels combined decoded pixels.
- 14,400 pt maximum page width or height.
- Image Size uses 96 PPI.
- Validation and decoding use fail-fast behavior. An input-specific error carries `imageId` and zero-based `imageIndex`. No partial PDF is returned.
- Processing is sequential. Cancellation is checked between safe processing steps. Browser decoding and synchronous PDF serialization cannot be interrupted mid-operation.
- White page background is the only enabled production background. Transparent output remains disabled until generated PDFs pass the agreed independent-viewer tests.

### Verification status on the feature branch

- Automated tests cover page geometry, page size presets, auto orientation, mixed page dimensions, margins, contain/cover crop, invalid settings, fail-fast validation/decode errors, cancellation before and during processing, resource cleanup, progress completion counts, callback isolation, and multi-page output.
- Manual browser QA harness: `tests/browser-image-to-pdf.html` and `tests/browser-image-to-pdf.js`. The checklist is `docs/PHASE_8_ENGINE_QA.md`.
- GitHub Actions runs on the engine branch have passed `npm ci`, `npm test`, and `npm run build`.
- Real-browser checks with representative source images, independent PDF viewer checks, actual bundle contribution measurement, mobile memory testing, and transparency verification are still pending.
- Do not mark Phase 8 complete until those checks and the UI integration acceptance criteria pass.
