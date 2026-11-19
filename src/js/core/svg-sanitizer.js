const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MAX_EMBEDDED_PNG_BASE64_LENGTH = 64 * 1024 * 1024;

const ALLOWED_ELEMENTS = new Set([
  "svg", "g", "defs", "title", "desc",
  "rect", "circle", "ellipse", "line", "polyline", "polygon", "path",
  "text", "tspan",
  "linearGradient", "radialGradient", "stop",
  "clipPath", "mask", "image"
]);

const ALLOWED_ATTRIBUTES = new Set([
  "xmlns", "version", "id", "width", "height", "viewBox", "preserveAspectRatio",
  "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry",
  "d", "points", "transform",
  "fill", "fill-rule", "fill-opacity",
  "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
  "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset", "stroke-opacity",
  "opacity", "clip-path", "clip-rule", "mask",
  "offset", "stop-color", "stop-opacity",
  "gradientUnits", "gradientTransform", "spreadMethod",
  "text-anchor", "dominant-baseline", "font-family", "font-size",
  "font-weight", "font-style", "letter-spacing", "word-spacing",
  "xml:space", "href"
]);

const TEXT_ELEMENTS = new Set(["title", "desc", "text", "tspan"]);
const LOCAL_REFERENCE_ATTRIBUTES = new Set(["fill", "stroke", "clip-path", "mask"]);

function removeNode(node) {
  node.parentNode?.removeChild(node);
}

function sanitizeElement(element, inheritedNamespace) {
  for (const attribute of [...element.attributes]) {
    const name = attribute.name;
    const value = attribute.value.trim();

    if (!ALLOWED_ATTRIBUTES.has(name)) {
      element.removeAttributeNode(attribute);
      continue;
    }

    if (name === "xmlns") {
      if (value !== SVG_NAMESPACE) element.removeAttributeNode(attribute);
      continue;
    }

    if (name === "href") {
      const isEmbeddedPng = element.localName === "image" &&
        value.length <= MAX_EMBEDDED_PNG_BASE64_LENGTH &&
        value.length % 4 === 0 &&
        /^data:image\\/png;base64,[A-Za-z0-9+/]+={0,2}$/i.test(value);
      if (!isEmbeddedPng) element.removeAttributeNode(attribute);
      continue;
    }

    if (LOCAL_REFERENCE_ATTRIBUTES.has(name) && value.toLowerCase().includes("url(")) {
      if (!/^url\(\s*#[\w:.-]+\s*\)$/i.test(value)) {
        element.removeAttributeNode(attribute);
      }
      continue;
    }

    if (/javascript:|data:|https?:|file:|\/\//i.test(value)) {
      element.removeAttributeNode(attribute);
    }
  }

  for (const child of [...element.childNodes]) {
    if (child.nodeType === 1) {
      if (!ALLOWED_ELEMENTS.has(child.localName) || (child.namespaceURI && child.namespaceURI !== SVG_NAMESPACE) || (child.namespaceURI !== inheritedNamespace && child.namespaceURI !== SVG_NAMESPACE)) {
        removeNode(child);
      } else {
        sanitizeElement(child, inheritedNamespace);
      }
    } else if (child.nodeType === 8 || (child.nodeType === 3 && !TEXT_ELEMENTS.has(element.localName))) {
      removeNode(child);
    }
  }
}

function parseSvgLength(value) {
  if (typeof value !== "string" || !/^\s*(?:\d+(?:\.\d*)?|\.\d+)(?:px)?\s*$/i.test(value)) {
    return null;
  }

  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeSvgDimensions(root) {
  const viewBoxValue = root.getAttribute("viewBox");
  const viewBox = (viewBoxValue || "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  const hasValidViewBox = viewBox.length === 4 &&
    viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0;

  if (viewBoxValue && !hasValidViewBox) {
    root.removeAttribute("viewBox");
  }

  let width = parseSvgLength(root.getAttribute("width"));
  let height = parseSvgLength(root.getAttribute("height"));

  if (hasValidViewBox) {
    const aspectRatio = viewBox[2] / viewBox[3];
    if (!width && !height) {
      width = viewBox[2];
      height = viewBox[3];
    } else if (!width) {
      width = height * aspectRatio;
    } else if (!height) {
      height = width / aspectRatio;
    }
  }

  if (!width || !height) {
    throw new Error("SVG dimensions are missing or unsupported. Add numeric width and height or a valid viewBox.");
  }

  const pixelCount = width * height;
  if (width > 16384 || height > 16384 || pixelCount > 40_000_000) {
    throw new Error("The SVG dimensions exceed the supported rasterization limit.");
  }

  root.setAttribute("width", String(Math.ceil(width)));
  root.setAttribute("height", String(Math.ceil(height)));
}

/**
 * Sanitize an SVG document without inserting its untrusted markup into the live DOM.
 * Only basic vector shapes, text, gradients, local clipping/mask references, and embedded PNG image data remain.
 * External resources, CSS, scripts, embedded HTML, and animation are removed.
 */
export function sanitizeSvgText(source) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("The SVG file is empty.");
  }

  if (/<!DOCTYPE|<!ENTITY/i.test(source)) {
    throw new Error("SVG documents with DOCTYPE or entity declarations are not supported.");
  }

  if (typeof globalThis.DOMParser !== "function" || typeof globalThis.XMLSerializer !== "function") {
    throw new Error("Safe SVG parsing is not available in this browser.");
  }

  const document = new globalThis.DOMParser().parseFromString(source, "image/svg+xml");
  const root = document.documentElement;

  if (!root || root.localName !== "svg" ||
      (root.namespaceURI && root.namespaceURI !== SVG_NAMESPACE) ||
      document.querySelector("parsererror")) {
    throw new Error("The selected file is not a valid SVG document.");
  }

  if (!root.namespaceURI) {
    root.setAttribute("xmlns", SVG_NAMESPACE);
  }

  for (const attribute of [...root.attributes]) {
    if (attribute.name !== "xmlns" && !ALLOWED_ATTRIBUTES.has(attribute.name)) {
      root.removeAttributeNode(attribute);
    }
  }

  sanitizeElement(root, root.namespaceURI || null);
  normalizeSvgDimensions(root);

  return new globalThis.XMLSerializer().serializeToString(root);
}
