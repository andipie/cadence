import { ipcMain } from 'electron';
import type Database from 'better-sqlite3';
import { IPC } from '../../shared/ipc-channels';
import type { AppError } from '../../shared/types';
import { getTranslations } from '../../shared/locales';
import { readSettings } from '../services/settings-service';
import { generateAgenda } from '../services/agenda-service';

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
 * Registers IPC handlers for agenda operations.
 */
export function registerAgendaHandlers(db: Database.Database, dataDir: string): void {
  safeHandle(IPC.AGENDA_GENERATE, (_event, contextId: string) => {
    const t = getTranslations(readSettings(dataDir).language);
    try {
      if (!contextId) {
        throw makeError(t.errors.agendaContextRequired);
      }
      return generateAgenda(db, dataDir, contextId, t);
    } catch (err) {
      if ((err as AppError).severity) throw err;
      throw makeError(t.errors.agendaFailed, String(err));
    }
  });
}
