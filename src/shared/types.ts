// --- Language ---

export type Language = 'de' | 'en';

// --- Enums (Union Types) ---

export type TopicStatus = 'new' | 'ready' | 'follow-up' | 'done' | 'canceled';
export type TopicPriority = 'high' | 'medium' | 'normal';
export type TopicDirection = 'discuss' | 'deliver' | 'waiting';
export type ContextType = 'person' | 'meeting' | 'group' | 'place' | 'other';
export type RecurringInterval = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
export type NoteMode = 'individual' | 'freetext';

// --- Topic ---

export interface Topic {
  id: string;
  title: string;
  status: TopicStatus;
  priority: TopicPriority;
  direction: TopicDirection;
  contexts: string[];
  dueDate: string | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  sortOrder: number | null;
  recurring: boolean;
  recurringInterval: RecurringInterval | null;
  recurringNext: string | null;
  bodyPreview: string | null;
  filePath: string;
}

export interface TopicDetail extends Topic {
  notes: NoteEntry[];
  /** Raw body content without frontmatter, for freetext note mode. */
  rawBody: string;
  /** Raw frontmatter data preserved for Obsidian coexistence. Runtime-only, not stored in DB. */
  _rawFrontmatter?: Record<string, unknown>;
}

export interface NoteEntry {
  date: string;
  content: string;
}

export interface CreateTopicInput {
  title: string;
  contexts?: string[];
  priority?: TopicPriority;
  direction?: TopicDirection;
  dueDate?: string;
}

export interface UpdateTopicInput {
  title?: string;
  status?: TopicStatus;
  priority?: TopicPriority;
  direction?: TopicDirection;
  contexts?: string[];
  dueDate?: string | null;
  followUpDate?: string | null;
  sortOrder?: number;
  recurring?: boolean;
  recurringInterval?: RecurringInterval | null;
}

export interface DuplicateTopicInput {
  sourceId: string;
  targetContexts: string[];
}

// --- Context ---

export interface Context {
  id: string;
  name: string;
  type: ContextType;
  group: string | null;
  topicCount?: number;
}

export interface ContextGroup {
  id: string;
  name: string;
  sortOrder: number;
  contexts: Context[];
}

export interface CreateContextInput {
  name: string;
  type: ContextType;
  group?: string;
}

export interface UpdateContextInput {
  name?: string;
  type?: ContextType;
  group?: string | null;
}

// --- Filter ---

export interface TopicFilter {
  contexts?: string[];
  status?: TopicStatus[];
  priority?: TopicPriority[];
  direction?: TopicDirection[];
  overdue?: boolean;
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  inbox?: boolean;
  groupBy?: 'context' | 'priority' | 'direction' | 'status' | 'none';
  sortBy?: 'priority' | 'due_date' | 'created_at' | 'updated_at';
}

// --- Saved View ---

export interface SavedView {
  id: string;
  name: string;
  icon?: string;
  filter: TopicFilter;
}

export interface CreateViewInput {
  name: string;
  icon?: string;
  filter: TopicFilter;
}

export interface UpdateViewInput {
  name?: string;
  icon?: string;
  filter?: TopicFilter;
}

// --- Settings ---

export interface Settings {
  dataDir: string;
  globalHotkey: string;
  defaultPriority: TopicPriority;
  confirmDelete: boolean;
  confirmComplete: boolean;
  warnWaitingDays: number;
  warnWaitingCritical: number;
  obsidianMode: boolean;
  language: Language;
  noteMode: NoteMode;
  sidebarWidth: number;
  detailPanelWidth: number;
}

// --- Switch Directory ---

export type SwitchDirResult =
  | { success: true; settings: Settings }
  | { success: false; error: string; needsSetup?: boolean };

// --- Undo ---

export interface UndoAction {
  type: 'update' | 'delete' | 'create';
  topicId: string;
  description: string;
  previousFileContent: string;
  previousFilePath: string;
}

// --- Search ---

export type SearchResultType = 'topic' | 'context';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  snippet: string | null;
  contexts: Array<{ id: string; name: string }>;
  contextType: ContextType | null;
  status: TopicStatus | null;
  priority: TopicPriority | null;
}

// --- Startup ---

export type StartupState =
  | { state: 'ready'; dataDir: string }
  | { state: 'no-dir' }
  | { state: 'unreachable'; path: string }
  | { state: 'invalid'; path: string; reason: string };

export type SetupDirResult =
  | { success: true; dataDir: string }
  | { success: false; error: string };

// --- Error ---

export type AppErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  severity: AppErrorSeverity;
  message: string;
  detail?: string;
  filePath?: string;
  autoDismiss?: boolean;
}
