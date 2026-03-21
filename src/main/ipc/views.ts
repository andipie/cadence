import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import type { CreateViewInput, UpdateViewInput, AppError } from '../../shared/types';
import {
  listViews,
  createView,
  updateView,
  deleteView,
} from '../services/view-service';

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
 * Registers IPC handlers for saved view operations.
 */
export function registerViewHandlers(dataDir: string): void {
  // List all saved views
  safeHandle(IPC.VIEWS_LIST, () => {
    try {
      return listViews(dataDir);
    } catch (err) {
      throw makeError('Gespeicherte Views konnten nicht geladen werden', String(err));
    }
  });

  // Create a new saved view
  safeHandle(IPC.VIEWS_CREATE, (_event, input: CreateViewInput) => {
    try {
      if (!input || !input.name || !input.filter) {
        throw makeError('Name und Filter sind erforderlich');
      }
      return createView(dataDir, input);
    } catch (err) {
      if ((err as AppError).severity) throw err;
      throw makeError('View konnte nicht erstellt werden', String(err));
    }
  });

  // Update an existing saved view
  safeHandle(IPC.VIEWS_UPDATE, (_event, id: string, input: UpdateViewInput) => {
    try {
      if (!id) {
        throw makeError('View-ID ist erforderlich');
      }
      return updateView(dataDir, id, input);
    } catch (err) {
      if ((err as AppError).severity) throw err;
      throw makeError('View konnte nicht aktualisiert werden', String(err));
    }
  });

  // Delete a saved view
  safeHandle(IPC.VIEWS_DELETE, (_event, id: string) => {
    try {
      if (!id) {
        throw makeError('View-ID ist erforderlich');
      }
      deleteView(dataDir, id);
    } catch (err) {
      if ((err as AppError).severity) throw err;
      throw makeError('View konnte nicht gelöscht werden', String(err));
    }
  });
}
