import { globalShortcut } from 'electron';

let currentAccelerator: string | null = null;

/**
 * Register a global keyboard shortcut.
 * Returns true if registration was successful, false otherwise.
 */
export function registerGlobalHotkey(accelerator: string, callback: () => void): boolean {
  try {
    // Unregister any existing hotkey first
    if (currentAccelerator) {
      globalShortcut.unregister(currentAccelerator);
      currentAccelerator = null;
    }

    const success = globalShortcut.register(accelerator, callback);
    if (success) {
      currentAccelerator = accelerator;
    } else {
      console.warn(`[global-hotkey] Failed to register hotkey: ${accelerator} (may be held by another app)`);
    }
    return success;
  } catch (err) {
    console.warn(`[global-hotkey] Error registering hotkey: ${accelerator}`, err);
    return false;
  }
}

/**
 * Unregister the current global hotkey.
 */
export function unregisterGlobalHotkey(): void {
  if (currentAccelerator) {
    try {
      globalShortcut.unregister(currentAccelerator);
    } catch {
      // Ignore errors during cleanup
    }
    currentAccelerator = null;
  }
}
