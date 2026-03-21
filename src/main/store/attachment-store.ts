import fs from 'fs';
import path from 'path';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/**
 * Saves an image buffer to the attachments directory for a topic.
 * Returns the relative path for use in Markdown: ../attachments/{topicSlug}/img-{ts}.{ext}
 */
export function saveAttachment(
  dataDir: string,
  topicSlug: string,
  imageBuffer: Buffer,
  mimeType: string
): string {
  const ext = MIME_EXTENSIONS[mimeType] || 'png';
  const attachDir = path.join(dataDir, 'attachments', topicSlug);
  fs.mkdirSync(attachDir, { recursive: true });

  const timestamp = Date.now();
  const filename = `img-${timestamp}.${ext}`;
  const filePath = path.join(attachDir, filename);
  const tmpPath = path.join(attachDir, `.${filename}.tmp`);

  // Atomic write: tmp → rename
  fs.writeFileSync(tmpPath, imageBuffer);
  try {
    fs.renameSync(tmpPath, filePath);
  } catch {
    // Cleanup on failure
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw new Error(`Bild konnte nicht gespeichert werden: ${filePath}`);
  }

  // Return relative path from topics/ directory
  return `../attachments/${topicSlug}/${filename}`;
}

/**
 * Renames the attachments folder when a topic slug changes.
 * No-op if the old folder does not exist.
 */
export function renameAttachmentsFolder(
  dataDir: string,
  oldSlug: string,
  newSlug: string
): void {
  const oldDir = path.join(dataDir, 'attachments', oldSlug);
  const newDir = path.join(dataDir, 'attachments', newSlug);

  if (!fs.existsSync(oldDir)) return;

  fs.renameSync(oldDir, newDir);
}
