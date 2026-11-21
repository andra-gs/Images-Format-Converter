/**
 * Build the minimal queue snapshot shared with the image editor.
 * File objects are passed by reference; the queue remains their owner.
 */
export function createEditorQueueSnapshot(entries) {
  return entries.map((entry) => ({
    id: entry.id,
    name: entry.file.name,
    file: entry.file,
    format: entry.format.format,
    url: entry.url
  }));
}

/**
 * Resolve a queue entry from a native select value.
 * HTMLSelectElement.value is always a string, while queue IDs are numeric.
 */
export function findEditorQueueEntry(entries, selectedId) {
  return entries.find((entry) => String(entry.id) === String(selectedId)) || null;
}
