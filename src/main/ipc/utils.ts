import { ipcMain } from 'electron';

/** Safe handler registration — removes existing handler first to survive HMR restarts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeHandle(channel: string, handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
}
