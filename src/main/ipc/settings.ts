import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { readSettings, writeSettings } from '../services/settings-service';
import type { Settings, AppError } from '../../shared/types';

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
 */
export function registerSettingsHandlers(dataDir: string): void {
  safeHandle(IPC.SETTINGS_GET, () => {
    try {
      return readSettings(dataDir);
    } catch (err) {
      throw makeError('Einstellungen konnten nicht gelesen werden', String(err));
    }
  });

  safeHandle(IPC.SETTINGS_UPDATE, (_event, data: Partial<Settings>) => {
    try {
      if (!data || typeof data !== 'object') {
        throw makeError('Ungültige Einstellungsdaten');
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
      throw makeError('Einstellungen konnten nicht gespeichert werden', String(err));
    }
  });
}
