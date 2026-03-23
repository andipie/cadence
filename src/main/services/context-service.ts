import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { titleToSlug, ensureUniqueSlug } from './slug-service';
import type { Context, ContextGroup, CreateContextInput, UpdateContextInput, ContextType } from '../../shared/types';

const CONTEXTS_FILENAME = 'contexts.yaml';
const CONTEXTS_BACKUP = 'contexts.yaml.bak';
const RETRY_DELAYS = [100, 500, 2000];

// --- YAML file I/O ---

interface ContextsFileData {
  contexts: Context[];
  groups: ContextGroup[];
}

interface ContextYaml {
  id: string;
  name: string;
  type: string;
  group: string | null;
}

interface GroupYaml {
  id: string;
  name: string;
  sort_order: number;
}

interface ContextsFileRaw {
  contexts?: ContextYaml[];
  groups?: GroupYaml[];
}

function contextsFilePath(dataDir: string): string {
  return path.join(dataDir, 'contexts', CONTEXTS_FILENAME);
}

function backupFilePath(dataDir: string): string {
  return path.join(dataDir, 'contexts', CONTEXTS_BACKUP);
}

function parseContextYaml(raw: ContextYaml): Context {
  return {
    id: raw.id,
    name: raw.name,
    type: (raw.type as ContextType) || 'other',
    group: raw.group ?? null,
  };
}

function parseGroupYaml(raw: GroupYaml): ContextGroup {
  return {
    id: raw.id,
    name: raw.name,
    sortOrder: raw.sort_order ?? 0,
    contexts: [], // populated later
  };
}

function contextToYaml(ctx: Context): ContextYaml {
  return {
    id: ctx.id,
    name: ctx.name,
    type: ctx.type,
    group: ctx.group,
  };
}

function groupToYaml(group: ContextGroup): GroupYaml {
  return {
    id: group.id,
    name: group.name,
    sort_order: group.sortOrder,
  };
}

export interface ContextsReadResult {
  data: ContextsFileData;
  loadedFromBackup: boolean;
}

/**
 * Reads and parses contexts.yaml.
 * Falls back to .bak if the primary file is missing or corrupt.
 * Returns empty data if neither file is usable.
 */
export function readContextsFile(dataDir: string): ContextsReadResult {
  const primary = contextsFilePath(dataDir);
  const backup = backupFilePath(dataDir);

  // Try primary file first
  const primaryResult = tryReadContextsYaml(primary);
  if (primaryResult !== null) {
    return { data: primaryResult, loadedFromBackup: false };
  }

  // Try backup
  const backupResult = tryReadContextsYaml(backup);
  if (backupResult !== null) {
    console.warn('[ContextService] Primary contexts.yaml unreadable, loaded from backup');
    return { data: backupResult, loadedFromBackup: true };
  }

  // Neither file exists or both are corrupt
  return { data: { contexts: [], groups: [] }, loadedFromBackup: false };
}

function tryReadContextsYaml(filePath: string): ContextsFileData | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const raw = YAML.parse(content) as ContextsFileRaw | null;

    if (!raw) {
      return { contexts: [], groups: [] };
    }

    const contexts = (raw.contexts || []).map(parseContextYaml);
    const groups = (raw.groups || []).map(parseGroupYaml);

    return { contexts, groups };
  } catch (err) {
    console.error(`[ContextService] Error parsing ${filePath}:`, err);
    return null;
  }
}

/**
 * Writes contexts and groups to contexts.yaml with atomic write and backup.
 */
export function writeContextsFile(dataDir: string, contexts: Context[], groups: ContextGroup[]): void {
  const filePath = contextsFilePath(dataDir);
  const backup = backupFilePath(dataDir);
  const dir = path.dirname(filePath);

  // Create backup of existing file before writing
  if (fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, backup);
    } catch (err) {
      console.error('[ContextService] Failed to create backup:', err);
    }
  }

  // Build YAML data
  const data: ContextsFileRaw = {
    contexts: contexts.map(contextToYaml),
    groups: groups.map(groupToYaml),
  };

  const yamlContent = YAML.stringify(data, { lineWidth: 0 });

  // Atomic write: temp file → rename
  const tmpPath = path.join(dir, `.${CONTEXTS_FILENAME}.tmp`);
  fs.writeFileSync(tmpPath, yamlContent, 'utf-8');

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      fs.renameSync(tmpPath, filePath);
      return;
    } catch (err) {
      if (attempt < RETRY_DELAYS.length - 1) {
        const delay = RETRY_DELAYS[attempt];
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
      } else {
        try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup error */ }
        throw err;
      }
    }
  }
}

// --- CRUD operations ---

/**
 * Creates a new context and saves to contexts.yaml.
 */
export function createContext(dataDir: string, input: CreateContextInput): Context {
  const { contexts, groups } = readContextsFile(dataDir).data;

  const existingIds = contexts.map((c) => c.id);
  const slug = titleToSlug(input.name);
  const id = ensureUniqueSlug(slug, existingIds);

  const newContext: Context = {
    id,
    name: input.name,
    type: input.type,
    group: input.group ?? null,
  };

  contexts.push(newContext);
  writeContextsFile(dataDir, contexts, groups);

  return newContext;
}

/**
 * Updates an existing context and saves to contexts.yaml.
 */
export function updateContext(dataDir: string, id: string, input: UpdateContextInput): Context {
  const { contexts, groups } = readContextsFile(dataDir).data;

  const index = contexts.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error(`Context not found: ${id}`);
  }

  const ctx = contexts[index];

  if (input.name !== undefined) {
    ctx.name = input.name;
  }
  if (input.type !== undefined) {
    ctx.type = input.type;
  }
  if (input.group !== undefined) {
    ctx.group = input.group;
  }

  contexts[index] = ctx;
  writeContextsFile(dataDir, contexts, groups);

  return ctx;
}

/**
 * Deletes a context and saves to contexts.yaml.
 */
export function deleteContext(dataDir: string, id: string): void {
  const { contexts, groups } = readContextsFile(dataDir).data;

  const filtered = contexts.filter((c) => c.id !== id);
  if (filtered.length === contexts.length) {
    throw new Error(`Context not found: ${id}`);
  }

  writeContextsFile(dataDir, filtered, groups);
}

/**
 * Returns groups with their contexts populated, plus ungrouped contexts.
 */
export function listGroupsWithContexts(dataDir: string): { groups: ContextGroup[]; ungrouped: Context[] } {
  const { contexts, groups } = readContextsFile(dataDir).data;

  // Sort groups by sortOrder
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // Populate each group with its contexts
  const groupedContextIds = new Set<string>();
  for (const group of sortedGroups) {
    group.contexts = contexts.filter((c) => c.group === group.id).sort((a, b) => a.name.localeCompare(b.name));
    for (const c of group.contexts) {
      groupedContextIds.add(c.id);
    }
  }

  // Find ungrouped contexts
  const ungrouped = contexts.filter((c) => !groupedContextIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));

  return { groups: sortedGroups, ungrouped };
}

/**
 * Reorders groups by assigning new sortOrder values based on array position.
 */
export function reorderGroups(dataDir: string, groupIds: string[]): void {
  const { contexts, groups } = readContextsFile(dataDir).data;

  for (let i = 0; i < groupIds.length; i++) {
    const group = groups.find((g) => g.id === groupIds[i]);
    if (group) {
      group.sortOrder = i + 1;
    }
  }

  writeContextsFile(dataDir, contexts, groups);
}

/**
 * Creates a new group and saves to contexts.yaml.
 */
export function createGroup(dataDir: string, name: string): ContextGroup {
  const { contexts, groups } = readContextsFile(dataDir).data;

  const existingIds = groups.map((g) => g.id);
  const slug = titleToSlug(name);
  const id = ensureUniqueSlug(slug, existingIds);

  const maxSortOrder = groups.reduce((max, g) => Math.max(max, g.sortOrder), 0);

  const newGroup: ContextGroup = {
    id,
    name,
    sortOrder: maxSortOrder + 1,
    contexts: [],
  };

  groups.push(newGroup);
  writeContextsFile(dataDir, contexts, groups);

  return newGroup;
}

/**
 * Renames an existing group.
 */
export function updateGroup(dataDir: string, id: string, name: string): ContextGroup {
  const { contexts, groups } = readContextsFile(dataDir).data;

  const group = groups.find((g) => g.id === id);
  if (!group) {
    throw new Error(`Group not found: ${id}`);
  }

  group.name = name;
  writeContextsFile(dataDir, contexts, groups);

  return { ...group, contexts: [] };
}

/**
 * Deletes a group and moves its contexts to ungrouped.
 */
export function deleteGroup(dataDir: string, id: string): void {
  const { contexts, groups } = readContextsFile(dataDir).data;

  const index = groups.findIndex((g) => g.id === id);
  if (index === -1) {
    throw new Error(`Group not found: ${id}`);
  }

  // Move contexts in this group to ungrouped
  for (const ctx of contexts) {
    if (ctx.group === id) {
      ctx.group = null;
    }
  }

  groups.splice(index, 1);
  writeContextsFile(dataDir, contexts, groups);
}

/**
 * Moves a context to a different group (or to ungrouped if groupId is null).
 */
export function moveContextToGroup(dataDir: string, contextId: string, groupId: string | null): void {
  const { contexts, groups } = readContextsFile(dataDir).data;

  const ctx = contexts.find((c) => c.id === contextId);
  if (!ctx) {
    throw new Error(`Context not found: ${contextId}`);
  }

  if (groupId !== null) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }
  }

  ctx.group = groupId;
  writeContextsFile(dataDir, contexts, groups);
}

/**
 * Reorders contexts within a group (or ungrouped if groupId is null).
 */
export function reorderContextsInGroup(dataDir: string, groupId: string | null, contextIds: string[]): void {
  const { contexts, groups } = readContextsFile(dataDir).data;

  // Build a position map from the new order
  const positionMap = new Map(contextIds.map((id, i) => [id, i]));

  // Sort only contexts that belong to this group
  contexts.sort((a, b) => {
    const aInGroup = a.group === groupId;
    const bInGroup = b.group === groupId;

    if (aInGroup && bInGroup) {
      const posA = positionMap.get(a.id) ?? Infinity;
      const posB = positionMap.get(b.id) ?? Infinity;
      return posA - posB;
    }
    // Keep relative order of contexts not in this group
    return 0;
  });

  writeContextsFile(dataDir, contexts, groups);
}
