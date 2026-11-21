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
