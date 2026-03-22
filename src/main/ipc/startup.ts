import { dialog } from 'electron';
import type { BrowserWindow } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { safeHandle } from './utils';
import { checkStartupState, validateDataDirectory, isDirectoryEmpty, initializeNewDataDirectory } from '../services/startup-service';
import { writeDataDirPointer } from '../services/settings-service';
import type { SetupDirResult } from '../../shared/types';

/** Module-level reference to the main window for Phase 2 initialization. */
let mainWindowRef: BrowserWindow | null = null;

/** Callback to trigger Phase 2 data layer initialization. Set by registerStartupHandlers. */
let initDataLayerFn: ((mainWindow: BrowserWindow, dataDir: string) => void) | null = null;

/** Module-level reference to the current data directory (set after Phase 2). */
let currentDataDir: string | null = null;

/**
 * Returns the current data directory, or null if not yet initialized.
 * Used by the protocol handler in main/index.ts.
 */
export function getCurrentDataDir(): string | null {
  return currentDataDir;
}

/**
 * Sets the current data directory.
 * Called from main/index.ts when Phase 2 is triggered at startup.
 */
export function setCurrentDataDir(dataDir: string): void {
  currentDataDir = dataDir;
}

/**
 * Registers startup-related IPC handlers (Phase 1).
 * These handlers do not require a data directory to function.
 *
 * @param initDataLayer - Callback to trigger Phase 2 initialization. Breaks the circular
 *   dependency between startup.ts and index.ts by passing the function at runtime.
 */
export function registerStartupHandlers(
  mainWindow: BrowserWindow,
  initDataLayer: (mainWindow: BrowserWindow, dataDir: string) => void,
): void {
  mainWindowRef = mainWindow;
  initDataLayerFn = initDataLayer;

  // Return the startup state to the renderer
  safeHandle(IPC.STARTUP_GET_STATE, () => {
    return checkStartupState();
  });

  // Open a native folder picker dialog
  safeHandle(IPC.STARTUP_PICK_FOLDER, async () => {
    if (!mainWindowRef) return null;

    const result = await dialog.showOpenDialog(mainWindowRef, {
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Set up a new data directory
  safeHandle(IPC.STARTUP_SETUP_DIR, (_event, dirPath: string, force: boolean): SetupDirResult => {
    if (typeof dirPath !== 'string' || !dirPath.trim()) {
      return { success: false, error: 'invalid-path' };
    }

    try {
      // Check if directory is non-empty and force is not set
      if (!force && !isDirectoryEmpty(dirPath)) {
        return { success: false, error: 'not-empty' };
      }

      // Initialize the directory structure
      initializeNewDataDirectory(dirPath);

      // Persist the pointer file
      writeDataDirPointer(dirPath);

      // Run Phase 2 initialization
      currentDataDir = dirPath;
      if (mainWindowRef && initDataLayerFn) {
        initDataLayerFn(mainWindowRef, dirPath);
      }

      return { success: true, dataDir: dirPath };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  });

  // Open an existing data directory
  safeHandle(IPC.STARTUP_OPEN_DIR, (_event, dirPath: string): SetupDirResult => {
    if (typeof dirPath !== 'string' || !dirPath.trim()) {
      return { success: false, error: 'invalid-path' };
    }

    try {
      // Validate the directory
      const validation = validateDataDirectory(dirPath);
      if (!validation.valid) {
        return { success: false, error: validation.reason! };
      }

      // Persist the pointer file
      writeDataDirPointer(dirPath);

      // Run Phase 2 initialization
      currentDataDir = dirPath;
      if (mainWindowRef && initDataLayerFn) {
        initDataLayerFn(mainWindowRef, dirPath);
      }

      return { success: true, dataDir: dirPath };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  });
}
