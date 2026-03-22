import fs from 'fs';
import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { readSettings, writeSettings, writeDataDirPointer } from '../services/settings-service';
import { validateDataDirectory } from '../services/startup-service';
import { setCurrentDataDir } from './startup';
import type { Settings, AppError, SwitchDirResult } from '../../shared/types';

function makeError(message: string, detail?: string): AppError {
  return { severity: 'error', message, detail };
}

/** Safe handler registration — removes existing handler first to survive HMR restarts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeHandle(channel: string, handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
}

/**
 * Registers IPC handlers for settings operations.
 * @param switchDataLayerFn - Callback to switch the data layer at runtime. Breaks the
 *   circular dependency between settings.ts and index.ts.
 */
export function registerSettingsHandlers(
  dataDir: string,
  switchDataLayerFn?: (mainWindow: BrowserWindow, newDataDir: string) => void,
): void {
  safeHandle(IPC.SETTINGS_GET, () => {
    try {
      return readSettings(dataDir);
    } catch (err) {
      throw makeError('Could not read settings', String(err));
    }
  });

  safeHandle(IPC.SETTINGS_UPDATE, (_event, data: Partial<Settings>) => {
    try {
      if (!data || typeof data !== 'object') {
        throw makeError('Invalid settings data');
      }

      const current = readSettings(dataDir);

      // Merge partial update into current settings
      const updated: Settings = {
        ...current,
        ...data,
        dataDir: current.dataDir, // dataDir is read-only via this handler
      };

      writeSettings(dataDir, updated);
      return updated;
    } catch (err) {
      throw makeError('Could not save settings', String(err));
    }
  });

  // Switch data directory at runtime (no app relaunch)
  safeHandle(IPC.SETTINGS_SWITCH_DIR, async (): Promise<SwitchDirResult> => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false, error: 'canceled' };

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose data directory',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'canceled' };
    }

    const chosenDir = result.filePaths[0];

    // Verify the directory is accessible
    try {
      fs.accessSync(chosenDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      return { success: false, error: 'not-accessible' };
    }

    // Validate whether it's a valid Cadence data directory
    const validation = validateDataDirectory(chosenDir);
    if (!validation.valid) {
      return { success: false, error: validation.reason!, needsSetup: true };
    }

    try {
      // Persist pointer file
      writeDataDirPointer(chosenDir);

      // Switch data layer: cleanup old → init new
      setCurrentDataDir(chosenDir);
      if (switchDataLayerFn) {
        switchDataLayerFn(win, chosenDir);
      }

      // Read settings from the new directory
      const newSettings = readSettings(chosenDir);
      return { success: true, settings: newSettings };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  });
}
