import test from "node:test";
import assert from "node:assert/strict";
import { createEditorQueueSnapshot } from "../src/js/core/editor-queue-events.js";

test("editor queue snapshot exposes file references and preview metadata", () => {
  const file = new Blob(["image"], { type: "image/png" });
  Object.defineProperty(file, "name", { value: "sample.png" });
  const entry = {
    id: 7,
    file,
    format: { format: "png", mime: "image/png", label: "PNG" },
    capabilities: { decode: true },
    url: "blob:sample"
  };

  const [snapshot] = createEditorQueueSnapshot([entry]);

  assert.deepEqual(Object.keys(snapshot), ["id", "name", "file", "format", "url"]);
  assert.equal(snapshot.id, 7);
  assert.equal(snapshot.name, "sample.png");
  assert.equal(snapshot.file, file);
  assert.equal(snapshot.format, "png");
  assert.equal(snapshot.url, "blob:sample");
  assert.equal("capabilities" in snapshot, false);
});

test("editor queue snapshot returns an independent array for an empty queue", () => {
  const snapshot = createEditorQueueSnapshot([]);
  assert.deepEqual(snapshot, []);
});

test("editor queue lookup matches numeric queue IDs from select string values", async () => {
  const { findEditorQueueEntry } = await import("../src/js/core/editor-queue-events.js");
  const first = { id: 1, name: "first.png" };
  const second = { id: 2, name: "second.png" };
  const entries = [first, second];

  assert.equal(findEditorQueueEntry(entries, "1"), first);
  assert.equal(findEditorQueueEntry(entries, "2"), second);
  assert.equal(findEditorQueueEntry(entries, "missing"), null);
});
