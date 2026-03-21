import type { UndoAction } from '../../shared/types';

/**
 * In-memory storage for the last undoable action.
 * Only one action is stored at a time — new actions overwrite the previous one.
 */

let lastUndo: UndoAction | null = null;

/**
 * Stores an undo action, replacing any previous one.
 */
export function setLastUndo(action: UndoAction): void {
  lastUndo = action;
}

/**
 * Returns the last stored undo action, or null if none exists.
 */
export function getLastUndo(): UndoAction | null {
  return lastUndo;
}

/**
 * Clears the stored undo action.
 */
export function clearLastUndo(): void {
  lastUndo = null;
}
