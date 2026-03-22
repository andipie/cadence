import { describe, it, expect, beforeEach } from 'vitest';
import { setLastUndo, getLastUndo, clearLastUndo } from './undo-service';
import type { UndoAction } from '../../shared/types';

const ACTION_A: UndoAction = {
  type: 'update',
  topicId: 'topic-a',
  description: 'Changed status',
  previousFileContent: '---\nstatus: new\n---\n',
  previousFilePath: 'topics/topic-a.md',
};

const ACTION_B: UndoAction = {
  type: 'delete',
  topicId: 'topic-b',
  description: 'Deleted topic',
  previousFileContent: '---\nstatus: done\n---\n',
  previousFilePath: 'topics/topic-b.md',
};

beforeEach(() => {
  clearLastUndo();
});

describe('undo-service', () => {
  it('returns null initially', () => {
    expect(getLastUndo()).toBeNull();
  });

  it('stores and retrieves an undo action', () => {
    setLastUndo(ACTION_A);
    expect(getLastUndo()).toEqual(ACTION_A);
  });

  it('clears the undo action', () => {
    setLastUndo(ACTION_A);
    clearLastUndo();
    expect(getLastUndo()).toBeNull();
  });

  it('new action overwrites previous', () => {
    setLastUndo(ACTION_A);
    setLastUndo(ACTION_B);
    expect(getLastUndo()).toEqual(ACTION_B);
  });
});
