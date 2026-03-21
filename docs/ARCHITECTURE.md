# Cadence — Architecture

## 1. Überblick

Cadence ist eine Electron-Anwendung mit React-Frontend. Der gesamte Stack ist TypeScript. Daten liegen als Markdown-Dateien im Filesystem, ein SQLite-Index dient als Read-Cache für schnelle Abfragen.

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

**Kernprinzip:** Das Filesystem ist die einzige Source of Truth. SQLite ist ein jederzeit wegwerfbarer Read-Cache. Jede Schreiboperation geht an die Markdown-Datei, der File-Watcher aktualisiert den Cache.

---

## 2. Projektstruktur

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
│   │   ├── index.ts               # App-Entry, Window-Management
│   │   ├── ipc/                   # IPC-Handler Registrierung
│   │   │   ├── index.ts           # Alle Handler exportieren
│   │   │   ├── topics.ts          # Topic CRUD Operationen
│   │   │   ├── contexts.ts        # Kontext CRUD Operationen
│   │   │   ├── views.ts           # Gespeicherte Views CRUD
│   │   │   └── system.ts          # Settings, Pfade, Export
│   │   │
│   │   ├── store/                 # Datenzugriff
│   │   │   ├── file-store.ts      # Markdown lesen/schreiben/löschen
│   │   │   ├── index-db.ts        # SQLite Index (Erstellen, Abfragen, Rebuild)
│   │   │   ├── file-watcher.ts    # chokidar Watcher, triggert Index-Updates
│   │   │   └── attachment-store.ts # Bild-Attachments verwalten
│   │   │
│   │   ├── services/              # Business-Logik
│   │   │   ├── topic-service.ts   # Topic-Operationen (inkl. Recurring-Logik)
│   │   │   ├── context-service.ts # Kontext-Operationen
│   │   │   ├── search-service.ts  # Volltextsuche über SQLite FTS5
│   │   │   ├── agenda-service.ts  # Agenda-Markdown-Generierung
│   │   │   ├── slug-service.ts    # Titel → Slug Konvertierung, Datei-Umbenennung
│   │   │   ├── undo-service.ts    # Letzte Aktion speichern und rückgängig machen
│   │   │   └── conflict-service.ts # Sync-Konflikt-Erkennung
│   │   │
│   │   ├── global-hotkey.ts       # Global Shortcut Registrierung
│   │   └── quick-capture-window.ts # Separates kleines Capture-Fenster
│   │
│   ├── renderer/                  # React Frontend
│   │   ├── index.html
│   │   ├── index.tsx              # React-Entry
│   │   ├── App.tsx                # Root-Komponente, Layout
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── ThreePanel.tsx       # Hauptlayout (3 Spalten)
│   │   │   │   ├── TopBar.tsx           # Header mit Badges und Suche
│   │   │   │   └── CommandPalette.tsx   # ⌘K Globale Suche
│   │   │   │
│   │   │   ├── context-nav/
│   │   │   │   ├── ContextNav.tsx       # Linkes Panel komplett
│   │   │   │   ├── ContextGroup.tsx     # Gruppe mit Kontexten
│   │   │   │   ├── ContextItem.tsx      # Einzelner Kontext-Eintrag
│   │   │   │   ├── SystemViews.tsx      # Inbox, Überfällig
│   │   │   │   ├── SavedViews.tsx       # Collapsible gespeicherte Views
│   │   │   │   └── ContextForm.tsx      # Kontext anlegen/bearbeiten
│   │   │   │
│   │   │   ├── topic-list/
│   │   │   │   ├── TopicList.tsx        # Mittleres Panel komplett
│   │   │   │   ├── TopicGroup.tsx       # Gruppenkopf (Ansprechen/Liefern/Warten/Erledigt)
│   │   │   │   ├── TopicRow.tsx         # Einzelne Zeile mit Inline-Edit
│   │   │   │   ├── TopicBadge.tsx       # Prio/Status/Richtung Badge
│   │   │   │   ├── QuickAdd.tsx         # Inline Quick-Add am unteren Rand
│   │   │   │   ├── BulkActions.tsx      # Toolbar bei Multi-Select
│   │   │   │   └── FilterBar.tsx        # Filter-UI für Free View
│   │   │   │
│   │   │   ├── detail/
│   │   │   │   ├── DetailPanel.tsx      # Rechtes Panel komplett
│   │   │   │   ├── MetadataGrid.tsx     # Inline-editierbare Felder
│   │   │   │   ├── ContextTags.tsx      # Kontext-Tags mit Add/Remove
│   │   │   │   ├── NotesFeed.tsx        # Chronologischer Notiz-Feed
│   │   │   │   ├── NoteEntry.tsx        # Einzelnes Update mit Datum
│   │   │   │   ├── NoteEditor.tsx       # TipTap WYSIWYG Editor
│   │   │   │   └── ActionFooter.tsx     # Erledigt/Wiedervorlage/Löschen
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── Badge.tsx
│   │   │       ├── Dropdown.tsx
│   │   │       ├── DatePicker.tsx
│   │   │       ├── Typeahead.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── Checkbox.tsx
│   │   │       ├── Toast.tsx             # Nicht-blockierende Benachrichtigungen (Info/Warnung/Fehler)
│   │   │       └── UndoSnackbar.tsx      # "Aktion — [Rückgängig]" nach Statusänderungen
│   │   │
│   │   ├── hooks/
│   │   │   ├── useTopics.ts          # Topic-Daten laden, filtern, sortieren
│   │   │   ├── useContexts.ts        # Kontextliste, aktiver Kontext
│   │   │   ├── useViews.ts           # Gespeicherte Views
│   │   │   ├── useKeyboard.ts        # Keyboard-Shortcut Handling
│   │   │   ├── useDragDrop.ts        # Drag & Drop Sortierung
│   │   │   └── useIpc.ts             # Wrapper für Electron IPC Calls
│   │   │
│   │   ├── store/
│   │   │   └── app-store.ts          # Zustand (zustand): UI-State, aktiver Kontext, Selection
│   │   │
│   │   └── styles/
│   │       └── globals.css           # Tailwind imports, Custom Properties
│   │
│   ├── shared/                    # Shared zwischen Main und Renderer
│   │   ├── types.ts               # Topic, Context, View, Filter Interfaces
│   │   ├── constants.ts           # Enums, Defaults
│   │   ├── ipc-channels.ts        # IPC Channel-Namen als Constants
│   │   └── markdown.ts            # Frontmatter Parser/Serializer
│   │
│   └── preload/
│       └── index.ts               # contextBridge API Exposition
│
├── resources/                     # App-Icons, native Assets
│   ├── icon.png
│   └── tray-icon.png
│
└── data/                          # Default-Datenverzeichnis (konfigurierbar)
    ├── topics/
    ├── attachments/
    ├── contexts/
    │   └── contexts.yaml
    └── views/
        └── saved-views.yaml
```

---

## 3. Prozessarchitektur

### 3.1 Main Process (Node.js)

Verantwortlich für:
- Dateisystem-Operationen (Lesen, Schreiben, Watchen)
- SQLite-Index-Management
- Global Hotkey Registrierung
- Quick-Capture-Window Management
- IPC-Handler für alle Datenoperationen

**Kein Business-State im Main Process.** Der Main Process ist ein reiner Daten-Service. UI-State (aktiver Kontext, Selection, Filter) lebt ausschließlich im Renderer.

### 3.2 Renderer Process (React)

Verantwortlich für:
- Gesamte UI-Darstellung
- UI-State-Management (zustand)
- Keyboard-Shortcut-Handling (lokale Shortcuts)
- TipTap Editor-Instanzen
- Drag & Drop

### 3.3 IPC-Kommunikation

Alle Datenoperationen laufen über typisierte IPC-Channels:

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

**Pattern:** Renderer ruft `window.api.topics.list(filter)` → preload bridge → Main Process IPC Handler → Service → FileStore/IndexDB → Response zurück.

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

## 4. Datenfluss im Detail

### 4.1 Lesen (Kontextansicht öffnen)

```
User klickt Kontext "Max Mustermann"
  → Renderer: useTopics({ contexts: ['max-mustermann'], status: ['neu', 'follow-up'] })
    → IPC: topics:list(filter)
      → Main: IndexDB.query(filter)    // SQL gegen SQLite
        → SELECT * FROM topics WHERE ... ORDER BY ...
      ← Topic[] zurück
    ← Topic[] an Renderer
  → React rendert TopicList gruppiert nach direction
```

### 4.2 Schreiben (Prio ändern)

```
User klickt Prio-Badge → wählt "Hoch"
  → Renderer: api.topics.update(id, { priority: 'hoch' })
    → IPC: topics:update
      → Main: TopicService.update(id, { priority: 'hoch' })
        → FileStore.read(id)              // Markdown laden
        → Frontmatter priority ändern
        → FileStore.write(id, content)     // Markdown speichern
        → File-Watcher erkennt Änderung
        → IndexDB.updateTopic(topic)       // SQLite updaten
      ← Updated Topic zurück
    ← Updated Topic an Renderer
  → React aktualisiert TopicRow
```

### 4.3 Externer Change (Obsidian editiert Datei)

```
Obsidian ändert Notizteil einer Topic-Datei
  → chokidar erkennt 'change' Event
    → FileStore.read(id)
    → Frontmatter + Body parsen
    → IndexDB.updateTopic(parsedTopic)
    → IPC Event: FILE_CHANGED an Renderer
      → Renderer aktualisiert UI wenn Topic sichtbar
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
  sort_order    REAL,                    -- Für manuelle Sortierung
  recurring     INTEGER DEFAULT 0,       -- Boolean
  recurring_interval TEXT,               -- weekly/biweekly/monthly/quarterly
  recurring_next TEXT,                   -- ISO date
  body_preview  TEXT,                    -- Erstes Update gekürzt für Suche/Anzeige
  file_path     TEXT NOT NULL            -- Relativer Pfad zur .md Datei
);

CREATE TABLE topic_contexts (
  topic_id    TEXT NOT NULL,
  context_id  TEXT NOT NULL,
  PRIMARY KEY (topic_id, context_id)
);

-- Volltext-Index für Suche
CREATE VIRTUAL TABLE topics_fts USING fts5(
  title,
  body_text,
  content=topics,
  content_rowid=rowid
);

-- Indizes für häufige Abfragen
CREATE INDEX idx_topics_status ON topics(status);
CREATE INDEX idx_topics_priority ON topics(priority);
CREATE INDEX idx_topics_direction ON topics(direction);
CREATE INDEX idx_topics_due_date ON topics(due_date);
CREATE INDEX idx_topic_contexts_context ON topic_contexts(context_id);
```

**Wichtig:** Der SQLite-Index enthält keine Daten die nicht aus dem Filesystem reproduzierbar sind. `body_preview` ist ein Cache des ersten Update-Blocks. Die vollständigen Notizen werden bei Bedarf direkt aus der Markdown-Datei gelesen.

---

## 6. Kern-Typen

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
  contexts: string[];           // Context-IDs
  dueDate: string | null;       // ISO date
  followUpDate: string | null;  // ISO date
  createdAt: string;            // ISO datetime
  updatedAt: string;            // ISO datetime
  completedAt: string | null;   // ISO datetime
  sortOrder: number | null;
  recurring: boolean;
  recurringInterval: RecurringInterval | null;
  recurringNext: string | null;
  bodyPreview: string | null;   // Aus Index-Cache
  filePath: string;
}

export interface TopicDetail extends Topic {
  notes: NoteEntry[];           // Vollständige Notizen aus Datei
}

export interface NoteEntry {
  date: string;                 // ISO date
  content: string;              // Markdown-String
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
  group: string | null;         // Group-ID
  topicCount?: number;          // Berechnet aus Index
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
  inbox?: boolean;              // contexts leer
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
  warnWaitingDays: number;      // Ab wann Amber (Default: 7)
  warnWaitingCritical: number;  // Ab wann Rot (Default: 14)
  obsidianMode: boolean;
}

// --- Undo ---
export interface UndoAction {
  type: 'update' | 'delete' | 'create';
  topicId: string;
  description: string;          // z.B. "Status → Erledigt" — wird im Toast angezeigt
  previousFileContent: string;  // Vollständiger Datei-Inhalt vor der Änderung
  previousFilePath: string;     // Pfad vor der Änderung (relevant bei Titel-Rename)
}

// --- Error ---
export type AppErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  severity: AppErrorSeverity;
  message: string;              // User-facing Nachricht (Deutsch)
  detail?: string;              // Technisches Detail (für Debugging)
  filePath?: string;            // Betroffene Datei, falls relevant
  autoDismiss?: boolean;        // true = verschwindet nach 5s (Default für info)
}

// --- Slug ---
// Utility: Titel → Dateiname-Slug
// "PROFINET Testkonzept Review" → "profinet-testkonzept-review"
// Regeln: lowercase, Umlaute auflösen (ä→ae, ö→oe, ü→ue, ß→ss),
// Sonderzeichen entfernen, Leerzeichen → Bindestriche, Mehrfach-Bindestriche → einfach
```

---

## 7. Frontmatter Parser

Das Herzstück der Datenpersistenz. Konvertiert zwischen Markdown-Dateien und Topic-Objekten.

```typescript
// shared/markdown.ts — Konzept

// Parsen: Datei → Topic
function parseTopicFile(filePath: string, content: string): TopicDetail {
  // 1. YAML Frontmatter extrahieren (zwischen --- Markern)
  // 2. Frontmatter-Felder auf Topic-Interface mappen
  // 3. Body nach ## YYYY-MM-DD Headers splitten → NoteEntry[]
  // 4. Neuestes NoteEntry als bodyPreview extrahieren
}

// Serialisieren: Topic → Datei-Inhalt
function serializeTopicFile(topic: TopicDetail): string {
  // 1. Frontmatter als YAML zwischen --- Marker
  // 2. Body: NoteEntries als ## Datum + Content, neueste oben
}

// Einzelnes Feld updaten (ohne Body neu zu schreiben)
function updateFrontmatterField(
  content: string,
  field: string,
  value: unknown
): string {
  // Nur Frontmatter-Bereich modifizieren, Body unangetastet lassen
}

// Neues Update einfügen
function addNoteEntry(content: string, noteContent: string): string {
  // Neuen ## YYYY-MM-DD Block oben im Body einfügen
}

// Titel → Dateiname-Slug
function titleToSlug(title: string): string {
  // "PROFINET Testkonzept Review" → "profinet-testkonzept-review"
  // Umlaute: ä→ae, ö→oe, ü→ue, ß→ss
  // Sonderzeichen entfernen, Spaces → Hyphens, deduplicate Hyphens
}

// Datei umbenennen bei Titel-Änderung
function renameTopicFile(oldSlug: string, newSlug: string): void {
  // 1. Prüfen ob neuer Slug als Datei bereits existiert (→ Suffix anhängen: -2, -3, ...)
  // 2. Markdown-Datei umbenennen
  // 3. Attachments-Ordner umbenennen (falls vorhanden)
  // 4. Index aktualisiert sich automatisch über File-Watcher
}
```

**Bibliothek:** `gray-matter` für Frontmatter-Parsing, bewährt und stabil.

---

## 8. State Management (Renderer)

**zustand** als State-Library — leichtgewichtig, TypeScript-first, kein Boilerplate.

```typescript
// renderer/store/app-store.ts — Konzept

interface AppState {
  // Navigation
  activeView: 'context' | 'inbox' | 'overdue' | 'free-view' | 'saved-view';
  activeContextId: string | null;
  activeSavedViewId: string | null;
  selectedTopicId: string | null;

  // Daten (aus IPC geladen)
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

## 9. Quick-Capture-Window

Separates Electron `BrowserWindow` — minimalistisch, kein Chrome.

```
┌──────────────────────────────────┐
│ Neues Thema                      │
│ ┌──────────────────────────────┐ │
│ │ Titel eingeben...            │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Kontext (optional)     ▼    │ │
│ └──────────────────────────────┘ │
│                    [Enter = OK]  │
└──────────────────────────────────┘
```

- Öffnet über Global Hotkey
- Frameless Window, zentriert, ~400x150px
- Titel-Feld hat Autofokus
- Kontext-Feld mit Typeahead (optional)
- Enter = Speichern + Schließen
- Escape = Abbrechen + Schließen
- Wenn kein Kontext gewählt → Inbox

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
- `npm run dev` — Vite Dev Server + Electron in Watch-Mode
- Hot Reload für Renderer, Auto-Restart für Main Process

**Production Build:**
- `npm run build` — Vite Build + electron-builder
- Outputs: `.dmg` (Mac), `.exe` Installer + Portable (Win)

---

## 11. Abhängigkeiten (Kern)

| Paket | Zweck | Prozess |
|-------|-------|---------|
| `electron` | Runtime | - |
| `react`, `react-dom` | UI Framework | Renderer |
| `typescript` | Typsicherheit | Beide |
| `tailwindcss` | Styling | Renderer |
| `zustand` | State Management | Renderer |
| `@tiptap/react`, `@tiptap/starter-kit` | Markdown WYSIWYG | Renderer |
| `better-sqlite3` | SQLite Zugriff | Main |
| `chokidar` | File Watching | Main |
| `gray-matter` | Frontmatter Parsing | Main |
| `yaml` | contexts.yaml / views.yaml | Main |
| `electron-builder` | Distribution | Build |
| `vite`, `@vitejs/plugin-react` | Bundling / Dev Server | Build |
| `electron-vite` | Electron + Vite Integration | Build |

---

## 12. Implementierung

Die Implementierungsreihenfolge wird über User Stories in **USER-STORIES.md** gesteuert. Jede Story hat Akzeptanzkriterien, Referenzen auf dieses Dokument und die REQUIREMENTS.md, sowie definierte Abhängigkeiten.

Dieses Dokument (ARCHITECTURE.md) ist ein technisches Referenzdokument — kein Projektplan.
