import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseTopicFile } from '../../shared/markdown';
import type { TopicDetail } from '../../shared/types';

const RETRY_DELAYS = [100, 500, 2000];

/**
 * Reads and parses a topic Markdown file.
 */
export function readTopicFile(filePath: string): TopicDetail {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.basename(filePath);
  return parseTopicFile(relativePath, content);
}

/**
 * Writes content to a file atomically:
 * 1. Write to temp file
 * 2. Rename temp → target
 * Retries with exponential backoff on rename failure (Windows/sync agents).
 */
export function writeTopicFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.tmp`);

  fs.writeFileSync(tmpPath, content, 'utf-8');

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      fs.renameSync(tmpPath, filePath);
      return;
    } catch (err) {
      if (attempt < RETRY_DELAYS.length - 1) {
        // Synchronous sleep for retry
        const delay = RETRY_DELAYS[attempt];
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
      } else {
        // Clean up temp file on final failure
        try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup error */ }
        throw err;
      }
    }
  }
}

/**
 * Deletes a topic Markdown file.
 */
export function deleteTopicFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Lists all .md files in a directory (non-recursive).
 * Returns absolute paths.
 */
export function listTopicFiles(topicsDir: string): string[] {
  if (!fs.existsSync(topicsDir)) {
    return [];
  }

  return fs
    .readdirSync(topicsDir)
    .filter((file) => file.endsWith('.md') && !file.startsWith('.'))
    .map((file) => path.join(topicsDir, file));
}

/**
 * Ensures the data directory structure exists.
 * Creates: topics/, attachments/, contexts/, views/, trash/, archive/
 */
export function ensureDataDirectories(dataDir: string): void {
  const dirs = [
    path.join(dataDir, 'topics'),
    path.join(dataDir, 'attachments'),
    path.join(dataDir, 'contexts'),
    path.join(dataDir, 'views'),
    path.join(dataDir, 'trash'),
    path.join(dataDir, 'trash', 'attachments'),
    path.join(dataDir, 'archive'),
    path.join(dataDir, 'archive', 'attachments'),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Moves a topic file to the trash directory instead of deleting it.
 * Also moves the attachments folder if it exists.
 */
export function moveTopicToTrash(filePath: string, dataDir: string): void {
  const fileName = path.basename(filePath);
  const slug = fileName.replace(/\.md$/, '');
  const trashPath = path.join(dataDir, 'trash', fileName);

  if (fs.existsSync(filePath)) {
    // If a file with the same name exists in trash, overwrite it
    fs.renameSync(filePath, trashPath);
  }

  // Move attachments folder to trash
  const attachmentsDir = path.join(dataDir, 'attachments', slug);
  const trashAttachmentsDir = path.join(dataDir, 'trash', 'attachments', slug);
  if (fs.existsSync(attachmentsDir) && fs.statSync(attachmentsDir).isDirectory()) {
    if (fs.existsSync(trashAttachmentsDir)) {
      fs.rmSync(trashAttachmentsDir, { recursive: true, force: true });
    }
    fs.renameSync(attachmentsDir, trashAttachmentsDir);
  }
}

/**
 * Moves a topic file from topics/ to archive/.
 * Also moves the attachments folder if it exists.
 */
export function moveTopicToArchive(filePath: string, dataDir: string): void {
  const fileName = path.basename(filePath);
  const slug = fileName.replace(/\.md$/, '');
  const archivePath = path.join(dataDir, 'archive', fileName);

  if (fs.existsSync(filePath)) {
    fs.renameSync(filePath, archivePath);
  }

  // Move attachments
  const attachmentsDir = path.join(dataDir, 'attachments', slug);
  const archiveAttachmentsDir = path.join(dataDir, 'archive', 'attachments', slug);
  if (fs.existsSync(attachmentsDir) && fs.statSync(attachmentsDir).isDirectory()) {
    if (fs.existsSync(archiveAttachmentsDir)) {
      fs.rmSync(archiveAttachmentsDir, { recursive: true, force: true });
    }
    fs.renameSync(attachmentsDir, archiveAttachmentsDir);
  }
}

/**
 * Moves a topic file from archive/ back to topics/.
 * Also moves the attachments folder back.
 */
export function moveTopicFromArchive(slug: string, dataDir: string): void {
  const fileName = `${slug}.md`;
  const archivePath = path.join(dataDir, 'archive', fileName);
  const topicsPath = path.join(dataDir, 'topics', fileName);

  if (fs.existsSync(archivePath)) {
    fs.renameSync(archivePath, topicsPath);
  }

  // Move attachments back
  const archiveAttachmentsDir = path.join(dataDir, 'archive', 'attachments', slug);
  const attachmentsDir = path.join(dataDir, 'attachments', slug);
  if (fs.existsSync(archiveAttachmentsDir) && fs.statSync(archiveAttachmentsDir).isDirectory()) {
    fs.renameSync(archiveAttachmentsDir, attachmentsDir);
  }
}

/**
 * Returns the default data directory path.
 */
export function getDefaultDataDir(): string {
  return path.join(os.homedir(), 'Cadence');
}
