import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  readContextsFile,
  writeContextsFile,
  createContext,
  updateContext,
  deleteContext,
  listGroupsWithContexts,
  createGroup,
  deleteGroup,
  moveContextToGroup,
  reorderContextsInGroup,
  reorderGroups,
} from './context-service';
import type { Context, ContextGroup } from '../../shared/types';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cadence-ctx-'));
  fs.mkdirSync(path.join(tmpDir, 'contexts'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeYaml(content: string): void {
  fs.writeFileSync(path.join(tmpDir, 'contexts', 'contexts.yaml'), content, 'utf-8');
}

function writeBackup(content: string): void {
  fs.writeFileSync(path.join(tmpDir, 'contexts', 'contexts.yaml.bak'), content, 'utf-8');
}

const VALID_YAML = `contexts:
  - id: ctx-alpha
    name: Alpha
    type: person
    group: null
  - id: ctx-beta
    name: Beta
    type: meeting
    group: grp-1
groups:
  - id: grp-1
    name: Group One
    sort_order: 1
`;

const CORRUPT_YAML = `contexts: [{{{invalid yaml`;

// --- readContextsFile ---

describe('readContextsFile', () => {
  it('loads valid primary file', () => {
    writeYaml(VALID_YAML);
    const result = readContextsFile(tmpDir);
    expect(result.loadedFromBackup).toBe(false);
    expect(result.data.contexts).toHaveLength(2);
    expect(result.data.contexts[0].id).toBe('ctx-alpha');
    expect(result.data.groups).toHaveLength(1);
    expect(result.data.groups[0].id).toBe('grp-1');
  });

  it('falls back to backup if primary is corrupt', () => {
    writeYaml(CORRUPT_YAML);
    writeBackup(VALID_YAML);
    const result = readContextsFile(tmpDir);
    expect(result.loadedFromBackup).toBe(true);
    expect(result.data.contexts).toHaveLength(2);
  });

  it('falls back to backup if primary is missing', () => {
    writeBackup(VALID_YAML);
    const result = readContextsFile(tmpDir);
    expect(result.loadedFromBackup).toBe(true);
    expect(result.data.contexts).toHaveLength(2);
  });

  it('returns empty data if both missing', () => {
    const result = readContextsFile(tmpDir);
    expect(result.loadedFromBackup).toBe(false);
    expect(result.data.contexts).toEqual([]);
    expect(result.data.groups).toEqual([]);
  });

  it('returns empty data if both corrupt', () => {
    writeYaml(CORRUPT_YAML);
    writeBackup(CORRUPT_YAML);
    const result = readContextsFile(tmpDir);
    expect(result.data.contexts).toEqual([]);
    expect(result.data.groups).toEqual([]);
  });
});

// --- writeContextsFile ---

describe('writeContextsFile', () => {
  it('creates backup before write', () => {
    // Write initial file
    writeYaml(VALID_YAML);
    const contexts: Context[] = [{ id: 'new-ctx', name: 'New', type: 'other', group: null }];
    writeContextsFile(tmpDir, contexts, []);

    const backupPath = path.join(tmpDir, 'contexts', 'contexts.yaml.bak');
    expect(fs.existsSync(backupPath)).toBe(true);
    // Backup should contain the old content
    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    expect(backupContent).toBe(VALID_YAML);
  });

  it('leaves no leftover .tmp file', () => {
    const contexts: Context[] = [{ id: 'ctx', name: 'Ctx', type: 'other', group: null }];
    writeContextsFile(tmpDir, contexts, []);
    const tmpFile = path.join(tmpDir, 'contexts', '.contexts.yaml.tmp');
    expect(fs.existsSync(tmpFile)).toBe(false);
  });
});

// --- createContext ---

describe('createContext', () => {
  it('creates and persists a context', () => {
    writeYaml(VALID_YAML);
    const ctx = createContext(tmpDir, { name: 'Gamma', type: 'group' });
    expect(ctx.id).toBe('gamma');
    expect(ctx.name).toBe('Gamma');
    expect(ctx.type).toBe('group');

    // Verify persisted
    const result = readContextsFile(tmpDir);
    expect(result.data.contexts).toHaveLength(3);
  });

  it('handles slug collision with -2 suffix', () => {
    writeYaml(VALID_YAML);
    // Create a context whose slug would collide with 'ctx-alpha'
    // First, create one named "Alpha" — slug 'alpha' doesn't collide with 'ctx-alpha'
    // Let's create "Ctx Alpha" to test, but slug is 'ctx-alpha' which exists
    // Actually, existing IDs are 'ctx-alpha' and 'ctx-beta'
    // titleToSlug('Ctx Alpha') = 'ctx-alpha', which collides
    const ctx = createContext(tmpDir, { name: 'Ctx Alpha', type: 'other' });
    expect(ctx.id).toBe('ctx-alpha-2');
  });
});

// --- updateContext ---

describe('updateContext', () => {
  it('updates a field and persists', () => {
    writeYaml(VALID_YAML);
    const updated = updateContext(tmpDir, 'ctx-alpha', { name: 'Alpha Renamed' });
    expect(updated.name).toBe('Alpha Renamed');

    const result = readContextsFile(tmpDir);
    const ctx = result.data.contexts.find((c) => c.id === 'ctx-alpha');
    expect(ctx!.name).toBe('Alpha Renamed');
  });

  it('throws for non-existent ID', () => {
    writeYaml(VALID_YAML);
    expect(() => updateContext(tmpDir, 'nonexistent', { name: 'X' })).toThrow('Context not found');
  });
});

// --- deleteContext ---

describe('deleteContext', () => {
  it('removes context from YAML', () => {
    writeYaml(VALID_YAML);
    deleteContext(tmpDir, 'ctx-alpha');
    const result = readContextsFile(tmpDir);
    expect(result.data.contexts).toHaveLength(1);
    expect(result.data.contexts[0].id).toBe('ctx-beta');
  });

  it('throws for non-existent ID', () => {
    writeYaml(VALID_YAML);
    expect(() => deleteContext(tmpDir, 'nonexistent')).toThrow('Context not found');
  });
});

// --- listGroupsWithContexts ---

describe('listGroupsWithContexts', () => {
  it('returns groups with contexts populated and ungrouped contexts', () => {
    writeYaml(VALID_YAML);
    const { groups, ungrouped } = listGroupsWithContexts(tmpDir);

    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('grp-1');
    expect(groups[0].contexts).toHaveLength(1);
    expect(groups[0].contexts[0].id).toBe('ctx-beta');

    expect(ungrouped).toHaveLength(1);
    expect(ungrouped[0].id).toBe('ctx-alpha');
  });
});

// --- createGroup ---

describe('createGroup', () => {
  it('creates a group with auto-incremented sortOrder', () => {
    writeYaml(VALID_YAML);
    const group = createGroup(tmpDir, 'Group Two');
    expect(group.id).toBe('group-two');
    expect(group.sortOrder).toBe(2); // max existing is 1

    const result = readContextsFile(tmpDir);
    expect(result.data.groups).toHaveLength(2);
  });
});

// --- deleteGroup ---

describe('deleteGroup', () => {
  it('deletes group and moves its contexts to ungrouped', () => {
    writeYaml(VALID_YAML);
    deleteGroup(tmpDir, 'grp-1');

    const result = readContextsFile(tmpDir);
    expect(result.data.groups).toHaveLength(0);
    // ctx-beta was in grp-1, should now be ungrouped
    const beta = result.data.contexts.find((c) => c.id === 'ctx-beta');
    expect(beta!.group).toBeNull();
  });

  it('throws for non-existent group', () => {
    writeYaml(VALID_YAML);
    expect(() => deleteGroup(tmpDir, 'nonexistent')).toThrow('Group not found');
  });
});

// --- moveContextToGroup ---

describe('moveContextToGroup', () => {
  it('moves context to a group', () => {
    writeYaml(VALID_YAML);
    moveContextToGroup(tmpDir, 'ctx-alpha', 'grp-1');
    const result = readContextsFile(tmpDir);
    const alpha = result.data.contexts.find((c) => c.id === 'ctx-alpha');
    expect(alpha!.group).toBe('grp-1');
  });

  it('throws for non-existent group', () => {
    writeYaml(VALID_YAML);
    expect(() => moveContextToGroup(tmpDir, 'ctx-alpha', 'nonexistent')).toThrow('Group not found');
  });

  it('throws for non-existent context', () => {
    writeYaml(VALID_YAML);
    expect(() => moveContextToGroup(tmpDir, 'nonexistent', 'grp-1')).toThrow('Context not found');
  });
});

// --- reorderContextsInGroup ---

describe('reorderContextsInGroup', () => {
  it('reorders contexts within a group', () => {
    // Setup: two contexts in same group
    const yaml = `contexts:
  - id: a
    name: A
    type: other
    group: grp-1
  - id: b
    name: B
    type: other
    group: grp-1
  - id: c
    name: C
    type: other
    group: null
groups:
  - id: grp-1
    name: Group
    sort_order: 1
`;
    writeYaml(yaml);
    reorderContextsInGroup(tmpDir, 'grp-1', ['b', 'a']);

    const result = readContextsFile(tmpDir);
    const inGroup = result.data.contexts.filter((c) => c.group === 'grp-1');
    expect(inGroup[0].id).toBe('b');
    expect(inGroup[1].id).toBe('a');
    // Ungrouped context 'c' should still be there
    expect(result.data.contexts.find((c) => c.id === 'c')).toBeDefined();
  });
});

// --- reorderGroups ---

describe('reorderGroups', () => {
  it('updates sortOrder based on array position', () => {
    const yaml = `contexts: []
groups:
  - id: g1
    name: One
    sort_order: 1
  - id: g2
    name: Two
    sort_order: 2
`;
    writeYaml(yaml);
    reorderGroups(tmpDir, ['g2', 'g1']);

    const result = readContextsFile(tmpDir);
    const g1 = result.data.groups.find((g) => g.id === 'g1');
    const g2 = result.data.groups.find((g) => g.id === 'g2');
    expect(g2!.sortOrder).toBe(1);
    expect(g1!.sortOrder).toBe(2);
  });
});
