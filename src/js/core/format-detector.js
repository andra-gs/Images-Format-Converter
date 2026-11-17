const FORMAT_SIGNATURES = [
  {
    format: "png",
    mime: "image/png",
    label: "PNG",
    matches: (bytes) =>
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
  },
  {
    format: "jpeg",
    mime: "image/jpeg",
    label: "JPEG",
    matches: (bytes) =>
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
  },
  {
    format: "gif",
    mime: "image/gif",
    label: "GIF",
    matches: (bytes) =>
      bytes.length >= 6 &&
      String.fromCharCode(...bytes.subarray(0, 6)).match(/^GIF8[79]a$/)
  },
  {
    format: "webp",
    mime: "image/webp",
    label: "WebP",
    matches: (bytes) =>
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  },
  {
    format: "bmp",
    mime: "image/bmp",
    label: "BMP",
    matches: (bytes) =>
      bytes.length >= 2 &&
      bytes[0] === 0x42 &&
      bytes[1] === 0x4d
  },
  {
    format: "tiff",
    mime: "image/tiff",
    label: "TIFF",
    matches: (bytes) =>
      bytes.length >= 4 &&
      ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
        (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a))
  }
];

const readAscii = (bytes, start, length) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

const detectHeif = (bytes) => {
  if (bytes.length < 16 || readAscii(bytes, 4, 4) !== "ftyp") return null;

  const brands = [readAscii(bytes, 8, 4)];
  for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
    brands.push(readAscii(bytes, offset, 4));
  }

  const heicBrands = new Set(["heic", "heix", "hevc", "hevx"]);
  if (brands.some((brand) => heicBrands.has(brand))) {
    return { format: "heic", mime: "image/heic", label: "HEIC" };
  }

  const heifBrands = new Set(["mif1", "msf1", "heif"]);
  if (brands.some((brand) => heifBrands.has(brand))) {
    return { format: "heif", mime: "image/heif", label: "HEIF" };
  }

  return null;
};

const detectSvg = async (file) => {
  const text = await file.slice(0, 4096).text();
  const normalized = text.replace(/^\uFEFF/, "").trimStart();
  const svgStart = /^(?:<\?xml[\s\S]*?\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg(?:\s|>)/i;
  if (!svgStart.test(normalized)) return null;

  return { format: "svg", mime: "image/svg+xml", label: "SVG" };
};

export async function detectImageFormat(file) {
  if (!file || typeof file.slice !== "function") {
    throw new TypeError("A valid File or Blob is required.");
  }

  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer());

  for (const signature of FORMAT_SIGNATURES) {
    if (signature.matches(header)) {
      return {
        format: signature.format,
        mime: signature.mime,
        label: signature.label
      };
    }
  }

  const heif = detectHeif(header);
  if (heif) return heif;

  return detectSvg(file);
}
