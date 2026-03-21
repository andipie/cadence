import { ipcMain } from 'electron';
import type { BrowserWindow } from 'electron';
import type Database from 'better-sqlite3';
import { IPC } from '../../shared/ipc-channels';
import type { CreateContextInput, UpdateContextInput, AppError } from '../../shared/types';
import { getTranslations } from '../../shared/locales';
import { readSettings } from '../services/settings-service';
import {
  readContextsFile,
  createContext,
  updateContext,
  deleteContext,
  listGroupsWithContexts,
  reorderGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  moveContextToGroup,
  reorderContextsInGroup,
} from '../services/context-service';
import { getTopicCountByContext, getSystemViewCounts } from '../store/index-db';

function makeError(message: string, detail?: string): AppError {
  return { severity: 'error', message, detail };
}

/** Safe handler registration — removes existing handler first to survive HMR restarts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeHandle(channel: string, handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
}

/** Track whether the backup warning has already been shown this session. */
let backupWarningShown = false;

/**
 * Sends a backup-loaded warning to the renderer if not already shown.
 */
function notifyBackupLoaded(mainWindow: BrowserWindow, dataDir: string): void {
  if (backupWarningShown) return;
  backupWarningShown = true;

  if (!mainWindow.isDestroyed()) {
    const t = getTranslations(readSettings(dataDir).language);
    mainWindow.webContents.send(IPC.ERROR_OCCURRED, {
      severity: 'warning',
      message: t.errors.contextBackupLoaded,
    });
  }
}

/**
 * Registers IPC handlers for context and group operations.
 */
export function registerContextHandlers(db: Database.Database, dataDir: string, mainWindow: BrowserWindow): void {
  // List all contexts with topic counts
  safeHandle(IPC.CONTEXTS_LIST, () => {
    try {
      const result = readContextsFile(dataDir);
      if (result.loadedFromBackup) {
        notifyBackupLoaded(mainWindow, dataDir);
      }
      const { contexts } = result.data;
      const counts = getTopicCountByContext(db);

      return contexts.map((ctx) => ({
        ...ctx,
        topicCount: counts.get(ctx.id) ?? 0,
      }));
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.contextLoadFailed, String(err));
    }
  });

  // Create a new context
  safeHandle(IPC.CONTEXTS_CREATE, (_event, input: CreateContextInput) => {
    try {
      return createContext(dataDir, input);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.contextCreateFailed, String(err));
    }
  });

  // Update an existing context
  safeHandle(IPC.CONTEXTS_UPDATE, (_event, id: string, input: UpdateContextInput) => {
    try {
      return updateContext(dataDir, id, input);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.contextUpdateFailed, String(err));
    }
  });

  // Delete a context
  safeHandle(IPC.CONTEXTS_DELETE, (_event, id: string) => {
    try {
      deleteContext(dataDir, id);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.contextDeleteFailed, String(err));
    }
  });

  // List groups with embedded contexts and topic counts
  safeHandle(IPC.GROUPS_LIST, () => {
    try {
      const { groups, ungrouped } = listGroupsWithContexts(dataDir);
      const counts = getTopicCountByContext(db);

      // Enrich contexts with topic counts
      for (const group of groups) {
        for (const ctx of group.contexts) {
          ctx.topicCount = counts.get(ctx.id) ?? 0;
        }
      }
      for (const ctx of ungrouped) {
        ctx.topicCount = counts.get(ctx.id) ?? 0;
      }

      return { groups, ungrouped };
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.groupsLoadFailed, String(err));
    }
  });

  // Create a new group
  safeHandle(IPC.GROUPS_CREATE, (_event, name: string) => {
    try {
      return createGroup(dataDir, name);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.groupCreateFailed, String(err));
    }
  });

  // Update (rename) a group
  safeHandle(IPC.GROUPS_UPDATE, (_event, id: string, name: string) => {
    try {
      return updateGroup(dataDir, id, name);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.groupRenameFailed, String(err));
    }
  });

  // Delete a group (contexts become ungrouped)
  safeHandle(IPC.GROUPS_DELETE, (_event, id: string) => {
    try {
      deleteGroup(dataDir, id);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.groupDeleteFailed, String(err));
    }
  });

  // Reorder groups
  safeHandle(IPC.GROUPS_REORDER, (_event, groupIds: string[]) => {
    try {
      reorderGroups(dataDir, groupIds);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.groupsReorderFailed, String(err));
    }
  });

  // Move context to a group (or ungrouped)
  safeHandle(IPC.CONTEXTS_MOVE_TO_GROUP, (_event, contextId: string, groupId: string | null) => {
    try {
      moveContextToGroup(dataDir, contextId, groupId);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.contextMoveFailed, String(err));
    }
  });

  // Reorder contexts within a group
  safeHandle(IPC.CONTEXTS_REORDER, (_event, groupId: string | null, contextIds: string[]) => {
    try {
      reorderContextsInGroup(dataDir, groupId, contextIds);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.contextsReorderFailed, String(err));
    }
  });

  // System view counts (Inbox + Overdue)
  safeHandle(IPC.SYSTEM_COUNTS, () => {
    try {
      return getSystemViewCounts(db);
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.systemCountsFailed, String(err));
    }
  });
}
