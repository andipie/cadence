import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { titleToSlug, ensureUniqueSlug } from './slug-service';
import type { SavedView, CreateViewInput, UpdateViewInput, TopicFilter } from '../../shared/types';

const VIEWS_FILENAME = 'saved-views.yaml';
const VIEWS_BACKUP = 'saved-views.yaml.bak';
const RETRY_DELAYS = [100, 500, 2000];

// --- YAML types (snake_case) ---

interface ViewFilterYaml {
  contexts?: string[];
  status?: string[];
  priority?: string[];
  direction?: string[];
  overdue?: boolean;
  due_before?: string;
  due_after?: string;
  search?: string;
  inbox?: boolean;
  group_by?: string;
  sort_by?: string;
}

interface ViewYaml {
  id: string;
  name: string;
  icon?: string;
  filter: ViewFilterYaml;
}

interface ViewsFileRaw {
  saved_views?: ViewYaml[];
}

// --- Path helpers ---

function viewsFilePath(dataDir: string): string {
  return path.join(dataDir, 'views', VIEWS_FILENAME);
}

function backupFilePath(dataDir: string): string {
  return path.join(dataDir, 'views', VIEWS_BACKUP);
}

// --- Serialization ---

function filterFromYaml(raw: ViewFilterYaml): TopicFilter {
  const filter: TopicFilter = {};
  if (raw.contexts) filter.contexts = raw.contexts;
  if (raw.status) filter.status = raw.status as TopicFilter['status'];
  if (raw.priority) filter.priority = raw.priority as TopicFilter['priority'];
  if (raw.direction) filter.direction = raw.direction as TopicFilter['direction'];
  if (raw.overdue !== undefined) filter.overdue = raw.overdue;
  if (raw.due_before) filter.dueBefore = raw.due_before;
  if (raw.due_after) filter.dueAfter = raw.due_after;
  if (raw.search) filter.search = raw.search;
  if (raw.inbox !== undefined) filter.inbox = raw.inbox;
  if (raw.group_by) filter.groupBy = raw.group_by as TopicFilter['groupBy'];
  if (raw.sort_by) filter.sortBy = raw.sort_by as TopicFilter['sortBy'];
  return filter;
}

function filterToYaml(filter: TopicFilter): ViewFilterYaml {
  const yaml: ViewFilterYaml = {};
  if (filter.contexts && filter.contexts.length > 0) yaml.contexts = filter.contexts;
  if (filter.status && filter.status.length > 0) yaml.status = filter.status;
  if (filter.priority && filter.priority.length > 0) yaml.priority = filter.priority;
  if (filter.direction && filter.direction.length > 0) yaml.direction = filter.direction;
  if (filter.overdue !== undefined) yaml.overdue = filter.overdue;
  if (filter.dueBefore) yaml.due_before = filter.dueBefore;
  if (filter.dueAfter) yaml.due_after = filter.dueAfter;
  if (filter.search) yaml.search = filter.search;
  if (filter.inbox !== undefined) yaml.inbox = filter.inbox;
  if (filter.groupBy) yaml.group_by = filter.groupBy;
  if (filter.sortBy) yaml.sort_by = filter.sortBy;
  return yaml;
}

function viewFromYaml(raw: ViewYaml): SavedView {
  return {
    id: raw.id,
    name: raw.name,
    icon: raw.icon,
    filter: filterFromYaml(raw.filter ?? {}),
  };
}

function viewToYaml(view: SavedView): ViewYaml {
  const yaml: ViewYaml = {
    id: view.id,
    name: view.name,
    filter: filterToYaml(view.filter),
  };
  if (view.icon) yaml.icon = view.icon;
  return yaml;
}

// --- File I/O ---

function tryReadViewsYaml(filePath: string): SavedView[] | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const raw = YAML.parse(content) as ViewsFileRaw | null;

    if (!raw) {
      return [];
    }

    return (raw.saved_views || []).map(viewFromYaml);
  } catch (err) {
    console.error(`[ViewService] Error parsing ${filePath}:`, err);
    return null;
  }
}

/**
 * Reads saved views from YAML file.
 * Falls back to .bak if the primary file is corrupt.
 */
function readViewsFile(dataDir: string): SavedView[] {
  const primary = viewsFilePath(dataDir);
  const backup = backupFilePath(dataDir);

  const primaryResult = tryReadViewsYaml(primary);
  if (primaryResult !== null) {
    return primaryResult;
  }

  const backupResult = tryReadViewsYaml(backup);
  if (backupResult !== null) {
    console.warn('[ViewService] Primary saved-views.yaml unreadable, loaded from backup');
    return backupResult;
  }

  return [];
}

/**
 * Writes saved views to YAML with atomic write and backup.
 */
function writeViewsFile(dataDir: string, views: SavedView[]): void {
  const filePath = viewsFilePath(dataDir);
  const backup = backupFilePath(dataDir);
  const dir = path.dirname(filePath);

  // Create backup of existing file before writing
  if (fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, backup);
    } catch (err) {
      console.error('[ViewService] Failed to create backup:', err);
    }
  }

  // Build YAML data
  const data: ViewsFileRaw = {
    saved_views: views.map(viewToYaml),
  };

  const yamlContent = YAML.stringify(data, { lineWidth: 0 });

  // Atomic write: temp file → rename
  const tmpPath = path.join(dir, `.${VIEWS_FILENAME}.tmp`);
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
 * Lists all saved views.
 */
export function listViews(dataDir: string): SavedView[] {
  return readViewsFile(dataDir);
}

/**
 * Creates a new saved view and persists to YAML.
 */
export function createView(dataDir: string, input: CreateViewInput): SavedView {
  const views = readViewsFile(dataDir);

  const existingIds = views.map((v) => v.id);
  const slug = titleToSlug(input.name);
  const id = ensureUniqueSlug(slug, existingIds);

  const newView: SavedView = {
    id,
    name: input.name,
    icon: input.icon,
    filter: input.filter,
  };

  views.push(newView);
  writeViewsFile(dataDir, views);

  return newView;
}

/**
 * Updates an existing saved view and persists to YAML.
 */
export function updateView(dataDir: string, id: string, input: UpdateViewInput): SavedView {
  const views = readViewsFile(dataDir);

  const index = views.findIndex((v) => v.id === id);
  if (index === -1) {
    throw new Error(`Saved view not found: ${id}`);
  }

  const view = views[index];

  if (input.name !== undefined) {
    view.name = input.name;
  }
  if (input.icon !== undefined) {
    view.icon = input.icon;
  }
  if (input.filter !== undefined) {
    view.filter = input.filter;
  }

  views[index] = view;
  writeViewsFile(dataDir, views);

  return view;
}

/**
 * Deletes a saved view and persists to YAML.
 */
export function deleteView(dataDir: string, id: string): void {
  const views = readViewsFile(dataDir);

  const filtered = views.filter((v) => v.id !== id);
  if (filtered.length === views.length) {
    throw new Error(`Saved view not found: ${id}`);
  }

  writeViewsFile(dataDir, filtered);
}
