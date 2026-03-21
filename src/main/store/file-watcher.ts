import chokidar from 'chokidar';
import path from 'path';
import type Database from 'better-sqlite3';
import type { BrowserWindow } from 'electron';
import { readTopicFile } from './file-store';
import { indexTopic, removeTopic, queryTopicById } from './index-db';
import { slugFromFilePath } from '../services/slug-service';
import { IPC } from '../../shared/ipc-channels';
import type { Topic } from '../../shared/types';

// Paths to ignore (own writes). Prevents ping-pong between write and watch.
const ignorePaths = new Set<string>();

/**
 * Add a path to the ignore list before writing.
 * Call removeFromIgnoreList() after the write completes.
 */
export function addToIgnoreList(filePath: string): void {
  ignorePaths.add(path.resolve(filePath));
}

/**
 * Remove a path from the ignore list after writing.
 */
export function removeFromIgnoreList(filePath: string): void {
  ignorePaths.delete(path.resolve(filePath));
}

/**
 * Starts a chokidar file watcher on the topics directory.
 * On file changes, updates the SQLite index and notifies the renderer.
 */
export function startWatcher(
  topicsDir: string,
  db: Database.Database,
  mainWindow: BrowserWindow | null
): chokidar.FSWatcher {
  // Watch both topics/ and archive/ directories
  const archiveDir = path.join(path.dirname(topicsDir), 'archive');
  const watcher = chokidar.watch(
    [path.join(topicsDir, '*.md'), path.join(archiveDir, '*.md')],
    {
      ignoreInitial: true,
      // Disable native fsevents on macOS — its CFRunLoop thread causes SIGABRT
      // during Electron shutdown (fse_instance_destroy → uv_mutex_lock → abort).
      // fs.watch is stable enough for our use case.
      useFsEvents: false,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    }
  );

  watcher.on('add', (filePath) => handleFileChange(filePath, db, mainWindow));
  watcher.on('change', (filePath) => handleFileChange(filePath, db, mainWindow));
  watcher.on('unlink', (filePath) => handleFileRemove(filePath, db, mainWindow));

  watcher.on('error', (error) => {
    console.error('[FileWatcher] Fehler:', error);
  });

  return watcher;
}

function handleFileChange(
  filePath: string,
  db: Database.Database,
  mainWindow: BrowserWindow | null
): void {
  const resolved = path.resolve(filePath);

  // Skip if this is our own write
  if (ignorePaths.has(resolved)) {
    return;
  }

  try {
    const topic = readTopicFile(filePath);

    // Detect external frontmatter changes (Obsidian coexistence warning)
    const existing = queryTopicById(db, topic.id);
    if (existing) {
      const changed = detectFrontmatterChanges(existing, topic);
      if (changed.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC.ERROR_OCCURRED, {
          severity: 'warning',
          message: `Frontmatter von „${topic.title}" wurde extern geändert`,
          detail: `Geänderte Felder: ${changed.join(', ')}`,
          autoDismiss: false,
        });
      }
    }

    indexTopic(db, topic);

    // Notify renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC.FILE_CHANGED, topic);
    }
  } catch (err) {
    console.error(`[FileWatcher] Fehler beim Verarbeiten von ${filePath}:`, err);
    // Notify renderer about corrupt file
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC.ERROR_OCCURRED, {
        severity: 'warning',
        message: 'Datei konnte nicht gelesen werden',
        detail: path.basename(filePath),
      });
    }
  }
}

function handleFileRemove(
  filePath: string,
  db: Database.Database,
  mainWindow: BrowserWindow | null
): void {
  const resolved = path.resolve(filePath);

  if (ignorePaths.has(resolved)) {
    return;
  }

  try {
    const topicId = slugFromFilePath(filePath);
    removeTopic(db, topicId);

    // Notify renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC.FILE_CHANGED, { id: topicId, deleted: true });
    }
  } catch (err) {
    console.error(`[FileWatcher] Fehler beim Entfernen von ${filePath}:`, err);
  }
}

// --- Frontmatter change detection ---

const FRONTMATTER_FIELDS: Array<{ key: keyof Topic; label: string }> = [
  { key: 'title', label: 'Titel' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priorität' },
  { key: 'direction', label: 'Richtung' },
  { key: 'dueDate', label: 'Fälligkeit' },
  { key: 'followUpDate', label: 'Wiedervorlage' },
];

/**
 * Compares critical frontmatter fields between the indexed topic and
 * the externally modified topic. Returns a list of changed field labels.
 */
function detectFrontmatterChanges(existing: Topic, updated: Topic): string[] {
  const changed: string[] = [];

  for (const { key, label } of FRONTMATTER_FIELDS) {
    const oldVal = existing[key];
    const newVal = updated[key];

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changed.push(label);
      }
    } else if (oldVal !== newVal) {
      changed.push(label);
    }
  }

  // Check contexts separately (array comparison)
  const oldContexts = [...existing.contexts].sort().join(',');
  const newContexts = [...updated.contexts].sort().join(',');
  if (oldContexts !== newContexts) {
    changed.push('Kontexte');
  }

  return changed;
}
