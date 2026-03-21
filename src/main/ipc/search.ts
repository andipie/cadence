import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { IPC } from '../../shared/ipc-channels';
import type { AppError } from '../../shared/types';
import { globalSearch } from '../services/search-service';

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
 * Registers IPC handlers for global search operations.
 */
export function registerSearchHandlers(db: Database.Database, dataDir: string): void {
  safeHandle(IPC.SEARCH_GLOBAL, (_event, query: string) => {
    if (typeof query !== 'string') {
      throw makeError('Ungültige Suchanfrage');
    }
    return globalSearch(db, dataDir, query);
  });
}
