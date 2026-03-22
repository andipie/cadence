# Cadence — Architecture

## 1. Overview

Cadence is an Electron application with a React frontend. The entire stack is TypeScript. Data is stored as Markdown files in the filesystem, and a SQLite index serves as a read cache for fast queries.

```
┌─────────────────────────────────────────────────┐
│                  Electron App                    │
│                                                  │
│  ┌──────────────┐         ┌───────────────────┐ │
│  │ Main Process │◄──IPC──►│ Renderer Process  │ │
│  │ (Node.js)    │         │ (React + TipTap)  │ │
│  │              │         │                   │ │
│  │ - FileStore  │         │ - TopicList       │ │
│  │ - IndexDB    │         │ - DetailPanel     │ │
│  │ - FileWatch  │         │ - ContextNav      │ │
│  │ - GlobalKey  │         │ - FilterEngine    │ │
│  └──────┬───────┘         └───────────────────┘ │
│         │                                        │
│    ┌────▼────┐    ┌──────────┐                  │
│    │ SQLite  │    │ data/    │                   │
│    │ (Cache) │◄───│ topics/  │                   │
│    └─────────┘    │ contexts/│                   │
│                   │ views/   │                   │
│                   └──────────┘                   │
└─────────────────────────────────────────────────┘
```

**Core Principle:** The filesystem is the single source of truth. SQLite is a disposable read cache that can be rebuilt at any time. Every write operation targets the Markdown file, and the file watcher updates the cache.

---

## 2. Project Structure

```
cadence/
├── package.json
├── tsconfig.json
├── electron-builder.yml
├── tailwind.config.js
├── postcss.config.js
│
├── src/
│   ├── main/                      # Electron Main Process
│   │   ├── index.ts               # App entry, window management
│   │   ├── ipc/                   # IPC handler registration
│   │   │   ├── index.ts           # Export all handlers
│   │   │   ├── topics.ts          # Topic CRUD operations
│   │   │   ├── contexts.ts        # Context CRUD operations
│   │   │   ├── views.ts           # Saved views CRUD
│   │   │   └── system.ts          # Settings, paths, export
│   │   │
│   │   ├── store/                 # Data access
│   │   │   ├── file-store.ts      # Markdown read/write/delete
│   │   │   ├── index-db.ts        # SQLite index (create, query, rebuild)
│   │   │   ├── file-watcher.ts    # chokidar watcher, triggers index updates
│   │   │   └── attachment-store.ts # Image attachment management
│   │   │
│   │   ├── services/              # Business logic
│   │   │   ├── topic-service.ts   # Topic operations (incl. recurring logic)
│   │   │   ├── context-service.ts # Context operations
│   │   │   ├── search-service.ts  # Full-text search via SQLite FTS5
│   │   │   ├── agenda-service.ts  # Agenda Markdown generation
│   │   │   ├── slug-service.ts    # Title → slug conversion, file renaming
│   │   │   ├── undo-service.ts    # Store and revert last action
│   │   │   └── conflict-service.ts # Sync conflict detection
│   │   │
│   │   ├── global-hotkey.ts       # Global shortcut registration
│   │   └── quick-capture-window.ts # Separate small capture window
│   │
│   ├── renderer/                  # React Frontend
│   │   ├── index.html
│   │   ├── index.tsx              # React entry
│   │   ├── App.tsx                # Root component, layout
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── ThreePanel.tsx       # Main layout (3 columns)
│   │   │   │   ├── TopBar.tsx           # Header with badges and search
│   │   │   │   └── CommandPalette.tsx   # ⌘K global search
│   │   │   │
│   │   │   ├── context-nav/
│   │   │   │   ├── ContextNav.tsx       # Left panel complete
│   │   │   │   ├── ContextGroup.tsx     # Group with contexts
│   │   │   │   ├── ContextItem.tsx      # Single context entry
│   │   │   │   ├── SystemViews.tsx      # Inbox, Overdue
│   │   │   │   ├── SavedViews.tsx       # Collapsible saved views
│   │   │   │   └── ContextForm.tsx      # Create/edit context
│   │   │   │
│   │   │   ├── topic-list/
│   │   │   │   ├── TopicList.tsx        # Middle panel complete
│   │   │   │   ├── TopicGroup.tsx       # Group header (Bring Up/Deliver/Waiting/Done)
│   │   │   │   ├── TopicRow.tsx         # Single row with inline edit
│   │   │   │   ├── TopicBadge.tsx       # Priority/Status/Direction badge
│   │   │   │   ├── QuickAdd.tsx         # Inline quick-add at bottom
│   │   │   │   ├── BulkActions.tsx      # Toolbar for multi-select
│   │   │   │   └── FilterBar.tsx        # Filter UI for free view
│   │   │   │
│   │   │   ├── detail/
│   │   │   │   ├── DetailPanel.tsx      # Right panel complete
│   │   │   │   ├── MetadataGrid.tsx     # Inline-editable fields
│   │   │   │   ├── ContextTags.tsx      # Context tags with add/remove
│   │   │   │   ├── NotesFeed.tsx        # Chronological notes feed
│   │   │   │   ├── NoteEntry.tsx        # Single update with date
│   │   │   │   ├── NoteEditor.tsx       # TipTap WYSIWYG editor
│   │   │   │   └── ActionFooter.tsx     # Done/Follow-up/Delete
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── Badge.tsx
│   │   │       ├── Dropdown.tsx
│   │   │       ├── DatePicker.tsx
│   │   │       ├── Typeahead.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── Checkbox.tsx
│   │   │       ├── Toast.tsx             # Non-blocking notifications (Info/Warning/Error)
│   │   │       └── UndoSnackbar.tsx      # "Action — [Undo]" after status changes
│   │   │
│   │   ├── hooks/
│   │   │   ├── useTopics.ts          # Load, filter, sort topic data
│   │   │   ├── useContexts.ts        # Context list, active context
│   │   │   ├── useViews.ts           # Saved views
│   │   │   ├── useKeyboard.ts        # Keyboard shortcut handling
│   │   │   ├── useDragDrop.ts        # Drag & drop sorting
│   │   │   └── useIpc.ts             # Wrapper for Electron IPC calls
│   │   │
│   │   ├── store/
│   │   │   └── app-store.ts          # Zustand (zustand): UI state, active context, selection
│   │   │
│   │   └── styles/
│   │       └── globals.css           # Tailwind imports, custom properties
│   │
│   ├── shared/                    # Shared between Main and Renderer
│   │   ├── types.ts               # Topic, Context, View, Filter interfaces
│   │   ├── constants.ts           # Enums, defaults
│   │   ├── ipc-channels.ts        # IPC channel names as constants
│   │   └── markdown.ts            # Frontmatter parser/serializer
│   │
│   └── preload/
│       └── index.ts               # contextBridge API exposition
│
├── resources/                     # App icons, native assets
│   ├── icon.png
│   └── tray-icon.png
│
└── data/                          # Default data directory (configurable)
    ├── topics/
    ├── attachments/
    ├── contexts/
    │   └── contexts.yaml
    └── views/
        └── saved-views.yaml
```

---

## 3. Process Architecture

### 3.1 Main Process (Node.js)

Responsible for:
- Filesystem operations (reading, writing, watching)
- SQLite index management
- Global hotkey registration
- Quick capture window management
- IPC handlers for all data operations

**No business state in the Main Process.** The Main Process is a pure data service. UI state (active context, selection, filters) lives exclusively in the Renderer.

### 3.2 Renderer Process (React)

Responsible for:
- All UI rendering
- UI state management (zustand)
- Keyboard shortcut handling (local shortcuts)
- TipTap editor instances
- Drag & drop

### 3.3 IPC Communication

All data operations run through typed IPC channels:

```typescript
// shared/ipc-channels.ts
export const IPC = {
  // Topics
  TOPICS_LIST:          'topics:list',
  TOPICS_GET:           'topics:get',
  TOPICS_CREATE:        'topics:create',
  TOPICS_UPDATE:        'topics:update',
  TOPICS_DELETE:        'topics:delete',
  TOPICS_BULK_UPDATE:   'topics:bulk-update',
  TOPICS_REORDER:       'topics:reorder',

  // Contexts
  CONTEXTS_LIST:        'contexts:list',
  CONTEXTS_CREATE:      'contexts:create',
  CONTEXTS_UPDATE:      'contexts:update',
  CONTEXTS_DELETE:      'contexts:delete',
  GROUPS_LIST:          'groups:list',
  GROUPS_REORDER:       'groups:reorder',

  // Views
  VIEWS_LIST:           'views:list',
  VIEWS_CREATE:         'views:create',
  VIEWS_UPDATE:         'views:update',
  VIEWS_DELETE:         'views:delete',

  // Search
  SEARCH_GLOBAL:        'search:global',

  // Agenda
  AGENDA_GENERATE:      'agenda:generate',

  // Undo
  UNDO_LAST:            'undo:last',

  // System
  SETTINGS_GET:         'settings:get',
  SETTINGS_UPDATE:      'settings:update',
  CONFLICT_CHECK:       'conflict:check',
  INDEX_REBUILD:        'index:rebuild',

  // Events (Main → Renderer)
  FILE_CHANGED:         'event:file-changed',
  CONFLICT_DETECTED:    'event:conflict-detected',
  ERROR_OCCURRED:       'event:error',
} as const;
```

**Pattern:** Renderer calls `window.api.topics.list(filter)` → preload bridge → Main Process IPC handler → Service → FileStore/IndexDB → response back.

### 3.4 Preload / Context Bridge

```typescript
// preload/index.ts
contextBridge.exposeInMainWorld('api', {
  topics: {
    list: (filter: TopicFilter) => ipcRenderer.invoke(IPC.TOPICS_LIST, filter),
    get: (id: string) => ipcRenderer.invoke(IPC.TOPICS_GET, id),
    create: (data: CreateTopicInput) => ipcRenderer.invoke(IPC.TOPICS_CREATE, data),
    update: (id: string, data: UpdateTopicInput) => ipcRenderer.invoke(IPC.TOPICS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.TOPICS_DELETE, id),
    bulkUpdate: (ids: string[], data: Partial<UpdateTopicInput>) => ipcRenderer.invoke(IPC.TOPICS_BULK_UPDATE, ids, data),
    reorder: (ids: string[], groupKey: string) => ipcRenderer.invoke(IPC.TOPICS_REORDER, ids, groupKey),
  },
  contexts: {
    list: () => ipcRenderer.invoke(IPC.CONTEXTS_LIST),
    create: (data: CreateContextInput) => ipcRenderer.invoke(IPC.CONTEXTS_CREATE, data),
    update: (id: string, data: UpdateContextInput) => ipcRenderer.invoke(IPC.CONTEXTS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.CONTEXTS_DELETE, id),
  },
  views: {
    list: () => ipcRenderer.invoke(IPC.VIEWS_LIST),
    create: (data: CreateViewInput) => ipcRenderer.invoke(IPC.VIEWS_CREATE, data),
    update: (id: string, data: UpdateViewInput) => ipcRenderer.invoke(IPC.VIEWS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.VIEWS_DELETE, id),
  },
  search: {
    global: (query: string) => ipcRenderer.invoke(IPC.SEARCH_GLOBAL, query),
  },
  agenda: {
    generate: (contextId: string) => ipcRenderer.invoke(IPC.AGENDA_GENERATE, contextId),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
    update: (data: Partial<Settings>) => ipcRenderer.invoke(IPC.SETTINGS_UPDATE, data),
  },
  system: {
    rebuildIndex: () => ipcRenderer.invoke(IPC.INDEX_REBUILD),
    checkConflicts: () => ipcRenderer.invoke(IPC.CONFLICT_CHECK),
    undo: () => ipcRenderer.invoke(IPC.UNDO_LAST),
  },
  on: {
    fileChanged: (callback: (topic: Topic) => void) =>
      ipcRenderer.on(IPC.FILE_CHANGED, (_e, topic) => callback(topic)),
    conflictDetected: (callback: (files: string[]) => void) =>
      ipcRenderer.on(IPC.CONFLICT_DETECTED, (_e, files) => callback(files)),
    error: (callback: (error: AppError) => void) =>
      ipcRenderer.on(IPC.ERROR_OCCURRED, (_e, error) => callback(error)),
  },
});
```

---

## 4. Data Flow in Detail

### 4.1 Reading (Opening a Context View)

```
User clicks context "Max Mustermann"
  → Renderer: useTopics({ contexts: ['max-mustermann'], status: ['neu', 'follow-up'] })
    → IPC: topics:list(filter)
      → Main: IndexDB.query(filter)    // SQL query against SQLite
        → SELECT * FROM topics WHERE ... ORDER BY ...
      ← Topic[] returned
    ← Topic[] to Renderer
  → React renders TopicList grouped by direction
```

### 4.2 Writing (Changing Priority)

```
User clicks priority badge → selects "Hoch"
  → Renderer: api.topics.update(id, { priority: 'hoch' })
    → IPC: topics:update
      → Main: TopicService.update(id, { priority: 'hoch' })
        → FileStore.read(id)              // Load Markdown
        → Modify frontmatter priority
        → FileStore.write(id, content)     // Save Markdown
        → File watcher detects change
        → IndexDB.updateTopic(topic)       // Update SQLite
      ← Updated Topic returned
    ← Updated Topic to Renderer
  → React updates TopicRow
```

### 4.3 External Change (Obsidian Edits a File)

```
Obsidian modifies the notes section of a topic file
  → chokidar detects 'change' event
    → FileStore.read(id)
    → Parse frontmatter + body
    → IndexDB.updateTopic(parsedTopic)
    → IPC event: FILE_CHANGED to Renderer
      → Renderer updates UI if topic is visible
```

---

## 5. SQLite Schema

```sql
CREATE TABLE topics (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'neu',
  priority      TEXT NOT NULL DEFAULT 'normal',
  direction     TEXT NOT NULL DEFAULT 'ansprechen',
  due_date      TEXT,                    -- ISO date
  follow_up_date TEXT,                   -- ISO date
  created_at    TEXT NOT NULL,           -- ISO datetime
  updated_at    TEXT NOT NULL,           -- ISO datetime
  completed_at  TEXT,                    -- ISO datetime
  sort_order    REAL,                    -- For manual sorting
  recurring     INTEGER DEFAULT 0,       -- Boolean
  recurring_interval TEXT,               -- weekly/biweekly/monthly/quarterly
  recurring_next TEXT,                   -- ISO date
  body_preview  TEXT,                    -- First update truncated for search/display
  file_path     TEXT NOT NULL            -- Relative path to .md file
);

CREATE TABLE topic_contexts (
  topic_id    TEXT NOT NULL,
  context_id  TEXT NOT NULL,
  PRIMARY KEY (topic_id, context_id)
);

-- Full-text index for search
CREATE VIRTUAL TABLE topics_fts USING fts5(
  title,
  body_text,
  content=topics,
  content_rowid=rowid
);

-- Indexes for frequent queries
CREATE INDEX idx_topics_status ON topics(status);
CREATE INDEX idx_topics_priority ON topics(priority);
CREATE INDEX idx_topics_direction ON topics(direction);
CREATE INDEX idx_topics_due_date ON topics(due_date);
CREATE INDEX idx_topic_contexts_context ON topic_contexts(context_id);
```

**Important:** The SQLite index contains no data that cannot be reproduced from the filesystem. `body_preview` is a cache of the first update block. Complete notes are read directly from the Markdown file when needed.

---

## 6. Core Types

```typescript
// shared/types.ts

// --- Enums ---
export type TopicStatus = 'neu' | 'follow-up' | 'erledigt';
export type TopicPriority = 'hoch' | 'mittel' | 'normal';
export type TopicDirection = 'ansprechen' | 'liefern' | 'warten';
export type ContextType = 'person' | 'meeting' | 'group' | 'place' | 'other';
export type RecurringInterval = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

// --- Topic ---
export interface Topic {
  id: string;
  title: string;
  status: TopicStatus;
  priority: TopicPriority;
  direction: TopicDirection;
  contexts: string[];           // Context IDs
  dueDate: string | null;       // ISO date
  followUpDate: string | null;  // ISO date
  createdAt: string;            // ISO datetime
  updatedAt: string;            // ISO datetime
  completedAt: string | null;   // ISO datetime
  sortOrder: number | null;
  recurring: boolean;
  recurringInterval: RecurringInterval | null;
  recurringNext: string | null;
  bodyPreview: string | null;   // From index cache
  filePath: string;
}

export interface TopicDetail extends Topic {
  notes: NoteEntry[];           // Complete notes from file
}

export interface NoteEntry {
  date: string;                 // ISO date
  content: string;              // Markdown string
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

// --- Context ---
export interface Context {
  id: string;
  name: string;
  type: ContextType;
  group: string | null;         // Group ID
  topicCount?: number;          // Computed from index
}

export interface ContextGroup {
  id: string;
  name: string;
  sortOrder: number;
  contexts: Context[];
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
  inbox?: boolean;              // contexts empty
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

// --- Settings ---
export interface Settings {
  dataDir: string;
  globalHotkey: string;
  defaultPriority: TopicPriority;
  confirmDelete: boolean;
  confirmComplete: boolean;
  warnWaitingDays: number;      // When to show amber (default: 7)
  warnWaitingCritical: number;  // When to show red (default: 14)
  obsidianMode: boolean;
}

// --- Undo ---
export interface UndoAction {
  type: 'update' | 'delete' | 'create';
  topicId: string;
  description: string;          // e.g. "Status → Erledigt" — displayed in toast
  previousFileContent: string;  // Complete file content before the change
  previousFilePath: string;     // Path before the change (relevant for title rename)
}

// --- Error ---
export type AppErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  severity: AppErrorSeverity;
  message: string;              // User-facing message (German)
  detail?: string;              // Technical detail (for debugging)
  filePath?: string;            // Affected file, if relevant
  autoDismiss?: boolean;        // true = disappears after 5s (default for info)
}

// --- Slug ---
// Utility: Title → filename slug
// "PROFINET Testkonzept Review" → "profinet-testkonzept-review"
// Rules: lowercase, resolve umlauts (ä→ae, ö→oe, ü→ue, ß→ss),
// remove special characters, spaces → hyphens, deduplicate hyphens
```

---

## 7. Frontmatter Parser

The core of data persistence. Converts between Markdown files and Topic objects.

```typescript
// shared/markdown.ts — Concept

// Parse: File → Topic
function parseTopicFile(filePath: string, content: string): TopicDetail {
  // 1. Extract YAML frontmatter (between --- markers)
  // 2. Map frontmatter fields to Topic interface
  // 3. Split body by ## YYYY-MM-DD headers → NoteEntry[]
  // 4. Extract newest NoteEntry as bodyPreview
}

// Serialize: Topic → file content
function serializeTopicFile(topic: TopicDetail): string {
  // 1. Frontmatter as YAML between --- markers
  // 2. Body: NoteEntries as ## Date + Content, newest on top
}

// Update a single field (without rewriting the body)
function updateFrontmatterField(
  content: string,
  field: string,
  value: unknown
): string {
  // Only modify the frontmatter section, leave body untouched
}

// Insert a new update
function addNoteEntry(content: string, noteContent: string): string {
  // Insert new ## YYYY-MM-DD block at the top of the body
}

// Title → filename slug
function titleToSlug(title: string): string {
  // "PROFINET Testkonzept Review" → "profinet-testkonzept-review"
  // Umlauts: ä→ae, ö→oe, ü→ue, ß→ss
  // Remove special characters, spaces → hyphens, deduplicate hyphens
}

// Rename file on title change
function renameTopicFile(oldSlug: string, newSlug: string): void {
  // 1. Check if new slug already exists as file (→ append suffix: -2, -3, ...)
  // 2. Rename Markdown file
  // 3. Rename attachments folder (if present)
  // 4. Index updates automatically via file watcher
}
```

**Library:** `gray-matter` for frontmatter parsing, proven and stable.

---

## 8. State Management (Renderer)

**zustand** as state library — lightweight, TypeScript-first, no boilerplate.

```typescript
// renderer/store/app-store.ts — Concept

interface AppState {
  // Navigation
  activeView: 'context' | 'inbox' | 'overdue' | 'free-view' | 'saved-view';
  activeContextId: string | null;
  activeSavedViewId: string | null;
  selectedTopicId: string | null;

  // Data (loaded via IPC)
  topics: Topic[];
  contexts: Context[];
  groups: ContextGroup[];
  savedViews: SavedView[];

  // UI State
  freeViewFilter: TopicFilter;
  bulkSelectedIds: Set<string>;
  commandPaletteOpen: boolean;

  // Computed Counts
  inboxCount: number;
  overdueCount: number;

  // Actions
  setActiveContext: (id: string) => void;
  setActiveView: (view: AppState['activeView']) => void;
  selectTopic: (id: string | null) => void;
  loadTopics: (filter?: TopicFilter) => Promise<void>;
  loadContexts: () => Promise<void>;
  updateTopic: (id: string, data: UpdateTopicInput) => Promise<void>;
  // ...
}
```

---

## 9. Quick Capture Window

Separate Electron `BrowserWindow` — minimalist, no chrome.

```
┌──────────────────────────────────┐
│ New Topic                        │
│ ┌──────────────────────────────┐ │
│ │ Enter title...               │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Context (optional)     ▼    │ │
│ └──────────────────────────────┘ │
│                    [Enter = OK]  │
└──────────────────────────────────┘
```

- Opens via global hotkey
- Frameless window, centered, ~400x150px
- Title field has autofocus
- Context field with typeahead (optional)
- Enter = save + close
- Escape = cancel + close
- If no context selected → Inbox

---

## 10. Build & Distribution

```yaml
# electron-builder.yml
appId: com.cadence.app
productName: Cadence
directories:
  output: dist
mac:
  target: [dmg, zip]
  category: public.app-category.productivity
win:
  target: [nsis, portable]
```

**Development:**
- `npm run dev` — Vite dev server + Electron in watch mode
- Hot reload for Renderer, auto-restart for Main Process

**Production Build:**
- `npm run build` — Vite build + electron-builder
- Outputs: `.dmg` (Mac), `.exe` installer + portable (Win)

---

## 11. Dependencies (Core)

| Package | Purpose | Process |
|---------|---------|---------|
| `electron` | Runtime | - |
| `react`, `react-dom` | UI framework | Renderer |
| `typescript` | Type safety | Both |
| `tailwindcss` | Styling | Renderer |
| `zustand` | State management | Renderer |
| `@tiptap/react`, `@tiptap/starter-kit` | Markdown WYSIWYG | Renderer |
| `better-sqlite3` | SQLite access | Main |
| `chokidar` | File watching | Main |
| `gray-matter` | Frontmatter parsing | Main |
| `yaml` | contexts.yaml / views.yaml | Main |
| `electron-builder` | Distribution | Build |
| `vite`, `@vitejs/plugin-react` | Bundling / dev server | Build |
| `electron-vite` | Electron + Vite integration | Build |

---

## 12. Implementation

The implementation order is driven by user stories in **USER-STORIES.md**. Each story has acceptance criteria, references to this document and REQUIREMENTS.md, as well as defined dependencies.

This document (ARCHITECTURE.md) is a technical reference document — not a project plan.
