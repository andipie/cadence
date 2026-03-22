import fs from 'fs';
import path from 'path';
import { shell } from 'electron';
import { ensureDataDirectories } from '../store/file-store';
import { initDatabase, rebuildIndex } from '../store/index-db';
import { startWatcher } from '../store/file-watcher';
import type chokidar from 'chokidar';
import { registerTopicHandlers } from './topics';
import { registerContextHandlers } from './contexts';
import { registerViewHandlers } from './views';
import { registerAgendaHandlers } from './agenda';
import { registerSearchHandlers } from './search';
import { registerAttachmentHandlers } from './attachments';
import { registerSettingsHandlers } from './settings';
import { registerStartupHandlers } from './startup';
import { safeHandle } from './utils';
import { scanConflictFiles } from '../services/conflict-service';
import { IPC } from '../../shared/ipc-channels';
import type { BrowserWindow } from 'electron';
import type Database from 'better-sqlite3';
import type { AppError } from '../../shared/types';

let db: Database.Database | null = null;
let watcher: chokidar.FSWatcher | null = null;
let isDataLayerInitialized = false;

// Startup issues collected during initialization
let startupIssues: AppError[] = [];

/**
 * Phase 1: Registers only startup IPC handlers.
 * Called immediately at app start — does not require a data directory.
 */
export function registerPhase1Handlers(mainWindow: BrowserWindow): void {
  registerStartupHandlers(mainWindow, initializeDataLayer);

  // Health check handler — returns startup issues to the renderer
  safeHandle(IPC.HEALTH_CHECK, () => {
    return startupIssues;
  });
}

/**
 * Phase 2: Initializes the data layer and registers all domain IPC handlers.
 * Called after a valid data directory is known — either immediately on startup
 * (if pointer file is valid) or after user selects a directory on the welcome screen.
 * Guard prevents double-initialization.
 */
export function initializeDataLayer(mainWindow: BrowserWindow, dataDir: string): void {
  if (isDataLayerInitialized) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Cadence] Data layer already initialized, skipping');
    }
    return;
  }

  startupIssues = [];
  const topicsDir = path.join(dataDir, 'topics');
  const dbPath = path.join(dataDir, 'cadence-index.db');

  // Validate data directory accessibility
  try {
    const parentDir = path.dirname(dataDir);
    fs.accessSync(parentDir, fs.constants.R_OK | fs.constants.W_OK);
  } catch {
    startupIssues.push({
      severity: 'critical',
      message: 'Data directory not accessible',
      detail: dataDir,
    });
  }

  // Ensure data directory structure exists
  ensureDataDirectories(dataDir);

  // Initialize SQLite database
  db = initDatabase(dbPath);

  // Build index from filesystem
  const result = rebuildIndex(db, topicsDir);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Cadence] ${result.indexed} Topics indexed from ${topicsDir}`);
  }

  // Track corrupt files from index rebuild
  if (result.corruptFiles.length > 0) {
    startupIssues.push({
      severity: 'warning',
      message: `${result.corruptFiles.length} file(s) could not be read`,
      detail: result.corruptFiles.join(', '),
    });
  }

  // Start file watcher
  watcher = startWatcher(topicsDir, db, mainWindow);

  // Register domain IPC handlers
  registerTopicHandlers(db, dataDir);
  registerContextHandlers(db, dataDir, mainWindow);
  registerViewHandlers(dataDir);
  registerAgendaHandlers(db, dataDir);
  registerSearchHandlers(db, dataDir);
  registerAttachmentHandlers(dataDir);
  registerSettingsHandlers(dataDir, switchDataLayer);

  // Conflict check handler — scans for sync conflict files
  safeHandle(IPC.CONFLICT_CHECK, () => {
    return scanConflictFiles(dataDir);
  });

  // Show file in OS file manager (Finder/Explorer)
  safeHandle(IPC.SHOW_IN_FOLDER, (_event, filePath: string) => {
    if (typeof filePath !== 'string' || !filePath.startsWith(dataDir)) {
      throw new Error('Invalid file path');
    }
    shell.showItemInFolder(filePath);
  });

  // Scan for conflict files at startup — send to renderer after load
  const conflictFiles = scanConflictFiles(dataDir);
  if (conflictFiles.length > 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Cadence] ${conflictFiles.length} sync conflict file(s) found`);
    }
    mainWindow.webContents.once('did-finish-load', () => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC.CONFLICT_DETECTED, conflictFiles);
      }
    });
  }

  isDataLayerInitialized = true;
}

/**
 * Switches to a different data directory at runtime.
 * Tears down the current data layer (watcher, DB) and re-initializes on the new directory.
 */
export function switchDataLayer(mainWindow: BrowserWindow, newDataDir: string): void {
  cleanup();
  initializeDataLayer(mainWindow, newDataDir);
}

/**
 * Returns the database instance (for use by other modules).
 */
export function getDatabase(): Database.Database | null {
  return db;
}

/**
 * Cleans up resources before app quit.
 * Closes the file watcher and SQLite database.
 * With useFsEvents:false, watcher.close() completes synchronously
 * (no native CFRunLoop thread to tear down).
 */
export function cleanup(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  if (db) {
    db.close();
    db = null;
  }
  isDataLayerInitialized = false;
}
