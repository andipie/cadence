import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { saveAttachment } from '../store/attachment-store';
import type { AppError } from '../../shared/types';

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
 * Registers IPC handlers for attachment operations.
 */
export function registerAttachmentHandlers(dataDir: string): void {
  // Save an image attachment for a topic
  safeHandle(IPC.ATTACHMENTS_SAVE, (_event, topicSlug: string, base64Data: string, mimeType: string) => {
    if (!topicSlug || !base64Data || !mimeType) {
      throw makeError('Ungültige Attachment-Daten');
    }

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      return saveAttachment(dataDir, topicSlug, buffer, mimeType);
    } catch (err) {
      throw makeError('Bild konnte nicht gespeichert werden', String(err));
    }
  });
}
