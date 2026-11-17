import test from "node:test";
import assert from "node:assert/strict";
import { decodeImage } from "../src/js/core/image-decoder.js";

function mockGlobal(t, key, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);

  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value
  });

  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  });
}

test("decodes a supported raster image with createImageBitmap", async (t) => {
  let closeCalls = 0;
  const bitmap = {
    width: 1280,
    height: 720,
    close() {
      closeCalls += 1;
    }
  };

  mockGlobal(t, "createImageBitmap", async () => bitmap);

  const result = await decodeImage(new Blob(["image"]), { format: "png" });

  assert.equal(result.source, bitmap);
  assert.equal(result.width, 1280);
  assert.equal(result.height, 720);
  assert.equal(result.format, "png");

  result.close();
  result.close();
  assert.equal(closeCalls, 1);
});

test("falls back to an HTML image when createImageBitmap fails", async (t) => {
  let revokedUrl = null;
  const originalUrlDescriptor = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
  const originalRevokeDescriptor = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");

  mockGlobal(t, "createImageBitmap", async () => {
    throw new Error("Native bitmap decoding failed.");
  });

  class FakeImage {
    naturalWidth = 640;
    naturalHeight = 480;
    src = "";

    async decode() {}
    removeAttribute(name) {
      if (name === "src") this.src = "";
    }
  }

  mockGlobal(t, "Image", FakeImage);

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: () => "blob:test-image"
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: (url) => {
      revokedUrl = url;
    }
  });

  t.after(() => {
    if (originalUrlDescriptor) Object.defineProperty(URL, "createObjectURL", originalUrlDescriptor);
    else delete URL.createObjectURL;

    if (originalRevokeDescriptor) Object.defineProperty(URL, "revokeObjectURL", originalRevokeDescriptor);
    else delete URL.revokeObjectURL;
  });

  const result = await decodeImage(new Blob(["image"]), { format: "jpeg" });

  assert.equal(result.width, 640);
  assert.equal(result.height, 480);
  assert.equal(result.format, "jpeg");

  result.close();
  assert.equal(revokedUrl, "blob:test-image");
});

test("rejects formats outside the initial browser decoder scope", async (t) => {
  mockGlobal(t, "createImageBitmap", async () => {
    throw new Error("This should not run.");
  });

  await assert.rejects(
    decodeImage(new Blob(["image"]), { format: "svg" }),
    /Decoding is not available for the svg format/
  );
});

test("rejects invalid and empty input", async () => {
  await assert.rejects(decodeImage({}), /valid File or Blob/);
  await assert.rejects(decodeImage(new Blob([])), /file is empty/);
});

test("rejects decoded sources with invalid dimensions and releases them", async (t) => {
  let closeCalls = 0;

  mockGlobal(t, "createImageBitmap", async () => ({
    width: 0,
    height: 100,
    close() {
      closeCalls += 1;
    }
  }));

  mockGlobal(t, "Image", undefined);

  await assert.rejects(
    decodeImage(new Blob(["image"]), { format: "webp" }),
    /could not decode the selected image/
  );
  assert.equal(closeCalls, 1);
});
