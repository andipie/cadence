# Cadence — Requirements

## 1. Vision

Cadence is a personal, context-based topic tracking tool for managers and knowledge workers. It solves the problem of losing track of open topics, commitments, and waiting times across different contexts (1:1s, meetings, groups).

**Core Principles:**

- **Quick Capture first** — Capturing a new topic must take no more than 2 seconds.
- **Context-driven** — When opening a context, I immediately see everything relevant.
- **Minimal Friction** — Every property (priority, status, direction, context) is inline-editable. No edit mode, no modal, no extra click.
- **Filesystem as Source of Truth** — All data is stored as Markdown files with frontmatter. No proprietary database.
- **Desktop-first, cross-platform** — Windows and macOS.

---

## 2. Data Model

### 2.1 Topic

A topic is a single Markdown file with YAML frontmatter.

**Frontmatter Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (slug) | yes | Unique ID, derived from the title (e.g., `profinet-testkonzept-review`). Corresponds to the filename without `.md`. Changes when the title is renamed. |
| `title` | String | yes | Title of the topic |
| `status` | Enum | yes | `neu`, `follow-up`, `erledigt` |
| `priority` | Enum | no | `hoch`, `mittel`, `normal` (Default: `normal`) |
| `direction` | Enum | no | `ansprechen`, `liefern`, `warten` (Default: `ansprechen`) |
| `contexts` | List[String] | no | List of context IDs. Empty = Inbox |
| `due_date` | Date (ISO) | no | Due date |
| `follow_up_date` | Date (ISO) | no | Follow-up date |
| `created_at` | DateTime | yes | Creation timestamp |
| `updated_at` | DateTime | yes | Last modification timestamp |
| `completed_at` | DateTime | no | Completion timestamp |
| `sort_order` | Number | no | Manual sort order within a group |
| `recurring` | Boolean | no | `true` if recurring topic |
| `recurring_interval` | Enum | no | `weekly`, `biweekly`, `monthly`, `quarterly` (only when `recurring: true`) |
| `recurring_next` | Date (ISO) | no | Next due date (automatically calculated) |

**Body (Markdown):**

The body contains notes as chronological updates, each with a date header:

```markdown
## 2026-03-19

Max says IT-Sec needs to approve. Ticket is with IT-Sec, Max is handling it.

## 2026-03-05

Max needs access to the build pipelines for the new test runner.
Admin rights not needed, contributor access is sufficient.
```

Most recent update appears at the top.

**Filename Convention:** `{slug-from-title}.md` (e.g., `profinet-testkonzept-review.md`)

The slug is generated from the title (lowercase, umlauts resolved, special characters removed, spaces replaced with hyphens). When renaming a title, the file is renamed and the index is updated. This makes files human-readable in the filesystem and in Obsidian.

**Directory Structure:**

```
data/
├── topics/
│   ├── profinet-testkonzept-review.md
│   ├── azure-devops-pipeline-zugaenge.md
│   └── ...
├── attachments/
│   ├── profinet-testkonzept-review/
│   │   ├── img-001.png
│   │   └── img-002.png
│   └── ...
├── contexts/
│   └── contexts.yaml
└── views/
    └── saved-views.yaml
```

### 2.2 Context

Contexts are managed centrally in `contexts.yaml`.

```yaml
contexts:
  - id: "max-mustermann"
    name: "Max Mustermann"
    type: person        # person | meeting | group | place | other
    group: "team-embedded"

  - id: "devops-jf"
    name: "DevOps Jour Fixe"
    type: meeting
    group: "team-embedded"

  - id: "einkauf-it"
    name: "Einkauf IT"
    type: other
    group: null          # Without group

groups:
  - id: "team-embedded"
    name: "Team Embedded"
    sort_order: 1

  - id: "management"
    name: "Management"
    sort_order: 2
```

**Context Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (slug) | yes | Unique ID |
| `name` | String | yes | Display name |
| `type` | Enum | no | `person`, `meeting`, `group`, `place`, `other` |
| `group` | String | no | Reference to group ID. `null` = without group |

**Groups** are purely organizational (display in the left panel). Flat structure, no nesting.

### 2.3 Saved Free Views

```yaml
saved_views:
  - id: "alles-warten-hoch"
    name: "Warten — Prio Hoch"
    icon: "clock"               # optional
    filters:
      direction: ["warten"]
      priority: ["hoch"]
      status: ["neu", "follow-up"]
    group_by: "context"
    sort_by: "due_date"

  - id: "ueberfaellig-alle"
    name: "Alles Überfällig"
    filters:
      overdue: true
    group_by: "priority"
```

---

## 3. Features

### 3.1 Quick Capture

| Aspect | Description |
|--------|-------------|
| **Global Hotkey** | Configurable system hotkey (e.g., `⌘+Shift+T`) opens a minimal capture window even when the tool is in the background |
| **Minimal Mode** | Only title field + Enter = topic lands in Inbox |
| **Context Mode** | Title + optional context field with typeahead/autocomplete. When a context is selected, it is pre-filled |
| **In-Context Capture** | `⌘N` creates a new topic directly in the active context |
| **Inbox Capture** | `⌘+Shift+N` creates a new topic in the Inbox, even when a context is active. Essential for meetings: a topic comes up that belongs to a different context — quickly put it in the Inbox, sort it later |
| **Inline Quick-Add** | Input field at the bottom of the middle panel, always visible. Optionally with context override via typeahead |

**Meeting Workflow:** During a 1:1 with Max, a topic for Lisa comes up. `⌘+Shift+N` → type title → Enter → lands in Inbox. Or: in the Quick-Add field, override the context via typeahead directly to "Lisa Schmidt". No context switch in the left panel needed.

### 3.2 Context View

The primary working view. Activated by selecting a context in the left panel.

**Topic List Grouping (fixed, not configurable):**

1. **Ansprechen (Bring Up)** — Topics I want to raise (discussion, decision, information)
2. **Liefern (Deliver)** — Topics where I owe something
3. **Warten (Waiting)** — Topics where I am waiting on someone
4. **Erledigt (Done)** — Completed topics, collapsed by default, chronological (most recent on top). Shows a maximum of 20 entries, with a "Load More" button for older ones. Prevents performance issues for contexts with long histories.

Within each group: sorted by priority (high → normal), then by due date (earliest first). Manual reordering via drag & drop is possible.

**Topic Row Displays:**
- Priority badge (colored)
- Status badge (Neu / Follow-Up)
- Title
- Due date (red if overdue)
- "Waiting since X days" (for direction: Warten)
- All badges/fields are inline-editable via click (dropdown)

**Follow-Up Highlighting:** Topics with status `follow-up` receive a visual marker ("deferred last time — address now").

### 3.3 Free View

Cross-context view with powerful filtering.

**Filter Dimensions:**

| Filter | Type | Description |
|--------|------|-------------|
| Context | Multi-Select | Select one or more contexts |
| Status | Multi-Select | `neu`, `follow-up`, `erledigt` |
| Direction | Multi-Select | `ansprechen`, `liefern`, `warten` |
| Priority | Multi-Select | `hoch`, `mittel`, `normal` |
| Due Date | Range / Preset | Overdue, this week, next week, range |
| Full-Text Search | String | Search in title and note text |

**Grouping (selectable):** Context, Priority, Direction, Status, Due Date (week), None.

**Sorting (selectable):** Due Date, Priority, Creation Date, Last Modified.

**Saved Views:**

- Filter combinations can be saved as named views
- Appear in the left panel under a collapsible "Saved Views" section
- Editable (rename, modify filters, delete)

### 3.4 System Views (built-in)

| View | Logic |
|------|-------|
| **Inbox** | All topics without an assigned context (`contexts` empty), status ≠ `erledigt` |
| **Overdue** | All topics with `due_date` < today, status ≠ `erledigt` |

These views always appear at the top of the left panel with a counter badge.

### 3.5 Detail Panel (right)

**Metadata Area (upper part):**

All fields directly editable as inline dropdowns / inline edits:

- Status (Dropdown)
- Priority (Dropdown)
- Direction (Dropdown)
- Due Date (Date Picker)
- Follow-Up Date (Date Picker)
- Contexts (Tag list with × to remove, + to add with typeahead)

**Notes Area (lower part):**

- Chronological updates, most recent on top
- Each update has a date header and a Markdown body
- **"+ Update" button** creates a new section with the current date, cursor jumps into it
- Markdown editor: simple WYSIWYG (bold, italic, lists, links, code)
- Current (most recent) update has a visually highlighted left border (blue), older ones gray

**Action Buttons (footer):**

- "Erledigt (Done)" — Sets status to `erledigt`, sets `completed_at`
- "Wiedervorlage (Follow-Up)" — Sets status to `follow-up`, optional date picker for `follow_up_date`
- "Löschen (Delete)" — Deletes the file (with confirmation dialog)

### 3.6 Agenda Export

Available in the context view via a button in the middle panel header.

**Generates:**
- Markdown-formatted agenda
- Grouped by direction (Ansprechen → Liefern → Warten)
- Per topic: title + last update (truncated)
- Follow-up topics marked

**Output:**
- Copy to clipboard (primary)
- Optional: Save as Markdown file

**Example Output:**

```markdown
# Agenda: Max Mustermann — 19.03.2026

## Ansprechen

- **PROFINET Testkonzept Review** [Follow-Up, Hoch]
  Letztes Update (19.03.): Max hat Review noch nicht fertig. Will bis Freitag liefern.

- **Urlaubsvertretung Q2 klären** [Neu, Mittel]

## Liefern

- **Feedback Testspezifikation Kap. 4** [Neu, Hoch]
  Fällig: 25.03.

## Warten

- **Azure DevOps Pipeline Zugänge** [Follow-Up]
  Wartet seit 14 Tagen
```

### 3.7 Bulk Operations

Available via checkboxes (appear on hover or via toggle) in the topic list.

**Actions on Multi-Select:**
- Assign / change context
- Set priority
- Change status
- Change direction
- Delete (with confirmation)

Primary use case: cleaning up the Inbox.

### 3.8 Context Management

**Create Context:**
- From the left panel ("+ Create Context")
- From the Inbox (when assigning, if context does not exist)
- From the detail panel (when adding a context)
- Minimum required fields: Name. Group and type are optional.

**Edit Context:**
- Right-click / context menu in the left panel
- Change name, type, group membership

**Delete Context:**
- Only possible when no active topics are assigned (or with an explicit warning)
- Topics lose the context assignment (→ move to Inbox)

**Manage Groups:**
- Create, rename, delete, reorder via drag & drop
- Contexts without a group appear under "Without Group"

### 3.9 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘+Shift+T` (global) | Quick Capture window (also in background) |
| `⌘+N` | New topic in the current context |
| `⌘+Shift+N` | New topic in Inbox (even when context is active) |
| `⌘+K` | Global search / Command Palette |
| `⌘+Z` | Undo last action |
| `↑` / `↓` | Navigate the topic list |
| `Enter` | Select topic → open detail |
| `Escape` | Back / close panel |
| `Tab` | Switch between panels |
| `⌘+1/2/3` | Set priority (High / Medium / Normal) |
| `⌘+E` | Status → Done |
| `⌘+F` | Status → Follow-Up |
| `⌘+U` | Create new update in the notes area |
| `⌘+Shift+A` | Agenda to clipboard |
| `⌘+Shift+F` | Open Free View |

### 3.10 Search

**Global Search (`⌘+K`):**
- Command palette style (similar to VS Code / Raycast)
- Searches in: topic titles, note text, context names
- Results as quick-select → jumps directly to the topic in the respective context

**Free View Full-Text Search:**
- Filters the current result list live

### 3.11 Recurring Topics

For recurring topics (e.g., "Project Status X" in the weekly team meeting).

**Behavior:**
- A topic can be marked as `recurring`
- When a recurring topic is set to "Done", it is automatically reset to status `neu` after a configurable pause
- The recurring cycle is defined in the frontmatter

**Frontmatter Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `recurring` | Boolean | `true` if recurring |
| `recurring_interval` | Enum | `weekly`, `biweekly`, `monthly`, `quarterly` |
| `recurring_next` | Date | Next due date (automatically calculated) |

**Process:**
1. Topic is set to "Done"
2. System detects `recurring: true`
3. A new update is automatically created: "— Completed on {date}, next follow-up {next date} —"
4. Status is set to `follow-up`, `recurring_next` is calculated
5. From `recurring_next` onwards, the topic appears as active again

**UI:** Recurring topics receive a small recurrence icon in the topic list.

### 3.12 Undo

Simple undo for the last action — not a full undo stack.

**Supported Actions:**
- Status change (e.g., accidentally clicked "Done")
- Priority change
- Direction change
- Context assignment / removal
- Deletion (restores the file)

**Mechanics:**
- `⌘+Z` undoes the last action
- Only the very last action is stored (no multi-step undo)
- After a new action, the previous undo expires
- Temporary storage of the previous file content in memory (no trash concept needed)

**UI:** After an action, a toast/snackbar briefly appears: "Done — [Undo]" with a clickable undo link. Disappears after 5 seconds.

### 3.13 Context Removal and Inbox Fallback

When the last context is removed from a topic, the topic automatically moves to the Inbox.

**Behavior:**
- User removes the last context tag in the detail panel
- UI shows notification: "Last context removed — topic is now in the Inbox"
- Topic immediately appears in the Inbox list
- Topic disappears from the context view (if currently open)

### 3.14 Error Handling

**Error Sources and UI Reactions:**

| Error | Reaction |
|-------|----------|
| Markdown file not readable / corrupt | Toast warning with filename. Topic is marked as "faulty" in the index, grayed out in the list with a hint. Other topics remain usable. |
| YAML frontmatter invalid | Same as corrupt file. Frontmatter error is shown in the toast. User can repair the file manually. |
| `contexts.yaml` not readable | Critical error. Start screen shows error message with path to the file. App starts in emergency mode (only Inbox, no contexts). |
| `contexts.yaml` backup | On every successful write, a backup copy `contexts.yaml.bak` is created. On read error, the backup is automatically attempted. |
| Data directory not reachable | Critical error. Dialog: "Data directory not found: {path}. Please verify or change in settings." |
| File write error | Toast warning: "Save failed: {reason}". Change remains visible in the UI, retry after 2 seconds. After 3 failed attempts: persistent warning. |
| SQLite index corrupt | Automatic rebuild from the filesystem. Toast: "Rebuilding index..." No data loss possible since the index is only a cache. |
| Sync conflict files | Warning at startup (non-blocking). List of conflict files with links to open in the file manager. |

**Toast/Notification System:**
- Non-blocking notifications at the bottom of the window
- Three levels: Info (blue), Warning (amber), Error (red)
- Auto-dismiss after 5 seconds (Info) or manual close (Warning/Error)
- Critical errors get a persistent banner at the top of the window

---

## 4. UI Concept

### 4.1 Layout — Three-Panel

```
┌──────────────────────────────────────────────────────┐
│  Cadence          [3 overdue] [5 Inbox] ⌘K       │
├──────────┬─────────────────────┬─────────────────────┤
│ Contexts │ Topic List          │ Detail / Notes      │
│          │                     │                     │
│ Inbox (5)│ [Group Header]      │ Title               │
│ Overdue  │ □ Prio Status Title │ Status  [Dropdown]  │
│          │ □ Prio Status Title │ Prio    [Dropdown]  │
│ ─────── │                     │ Direction [Dropdown] │
│ Group A  │ [Group Header]      │ Due     [Picker]    │
│  Context │ □ Prio Status Title │ Contexts [Tags]     │
│  Context │                     │                     │
│ ─────── │ [Done ▶] (3)        │ ── Notes ────────── │
│ Group B  │                     │ + Update            │
│  Context │                     │                     │
│ ─────── │                     │ 19.03.2026           │
│ Free View│                     │ │ Note text...       │
│ ▶ Views  │                     │                     │
│ ─────── │                     │ 14.03.2026           │
│ +Context │ [⌘N Quick-Add]      │ │ Note text...       │
│          │                     │                     │
│          │                     │ [Done][Follow-Up][X] │
└──────────┴─────────────────────┴─────────────────────┘
```

### 4.2 Left Panel — Context Navigation

**Order (top-down):**

1. System Views: Inbox (with counter), Overdue (with counter)
2. Separator
3. Free View (fixed entry)
4. Saved Views (collapsible, with count)
5. Separator
6. Groups with their contexts (each with topic counter)
7. "Without Group" contexts
8. Separator
9. "+ Create Context"

### 4.3 Middle Panel — Topic List

**Context View:**
- Header: Context name, number of open topics, [Agenda] button, [+ Topic] button
- Grouping: Ansprechen → Liefern → Warten → Erledigt (collapsed)
- Within group: Priority sorting, then due date, drag & drop for manual reordering
- Footer: Quick-Add field

**Free View:**
- Header: Filter bar (search field, active filter chips, filter dropdowns, grouping)
- Result counter
- Grouped list by selected dimension

### 4.4 Right Panel — Detail

- Metadata as compact grid with inline edits
- Notes as chronological feed (most recent on top)
- Action footer (Done, Follow-Up, Delete)

### 4.5 Special UI States

**Empty States:**

| State | Display |
|-------|---------|
| Context without open topics | "No open topics." + link to Done section with count ("X completed topics") |
| Inbox empty | "All cleaned up." |
| Free View without results | "No topics for these filters." + "Reset Filters" link |
| No topic selected | Right panel shows hint: "Select a topic" |

**Overdue Marking:**
- Due date in red
- Optional: row gets a subtle red left border

**"Waiting since X days":**
- Automatically calculated for direction `warten` (from last update or creation date)
- Warning color (amber) from 7 days, red from 14 days

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | Electron | Entire stack in TypeScript, maximum productivity with Claude Code, huge ecosystem, well-documented |
| **Frontend** | React + TypeScript | Proven ecosystem, fast iteration |
| **Styling** | Tailwind CSS | Utility-first, consistent design |
| **Markdown Editor** | TipTap | WYSIWYG with Markdown serialization, actively maintained, good plugin architecture |
| **Index/Cache** | SQLite via `better-sqlite3` | Fast synchronous queries, read-only cache, native Node access |
| **Filesystem Watching** | chokidar | Proven file watching for Node.js, cross-platform |
| **Build/Bundle** | electron-builder | Standard tooling for Electron distribution (Win/Mac) |
| **IPC** | Electron IPC (contextBridge) | Secure communication channel between Main and Renderer Process |

### 5.2 Data Flow

```
Markdown Files (Source of Truth)
        │
        ▼
   File Watcher ──────────────────┐
        │                         │
        ▼                         ▼
  YAML/Frontmatter Parser    SQLite Index
        │                    (Read Cache)
        ▼                         │
   In-Memory State ◄──────────────┘
        │
        ▼
    React UI
        │
        ▼ (User Action)
   Write to Markdown File
        │
        ▼
   File Watcher triggers Index Update
```

**Principles:**

- **Filesystem → Index:** At startup, the entire `topics/` directory is parsed and indexed in SQLite. The file watcher updates the index on changes.
- **Index → UI:** All queries (context view, filters, search) run against the SQLite index for performance.
- **UI → Filesystem:** Every change (status, priority, new update) writes directly to the Markdown file. The file watcher then updates the index.
- **No Sync Problem:** The index is reproducible from the filesystem at any time. On inconsistency: delete the index, rebuild.

### 5.3 Sync Conflict Detection

When the data directory is located in a cloud sync folder (OneDrive, iCloud, Dropbox):

- At startup: scan for conflict files (pattern: `* (Konflikt)*`, `* (conflict)*`, `*.sync-conflict-*`)
- On detection: show warning with list of affected files
- No automatic resolution — user decides

### 5.4 Obsidian Coexistence

**Strategy: Shared filesystem, separated responsibilities.**

- The Cadence data directory can be a subfolder of an Obsidian vault (configurable)
- Cadence is **master** for: frontmatter, file structure, filenames, `contexts.yaml`, `saved-views.yaml`
- Obsidian may: read, link (`[[Topic-Title]]`), search, use Graph View
- Obsidian should not: modify frontmatter fields (can lead to inconsistencies)

**Recommended Obsidian Configuration:**

- Cadence folder as subfolder in the vault
- Obsidian templates for manual notes that link to topics
- Tags in Obsidian can reference Cadence contexts

**Mobile Access:** Via Obsidian Mobile as a read-only layer (search, read, linking). Editing frontmatter via Obsidian is not recommended.

---

## 6. Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Data Directory | Path to the `data/` folder | `~/Cadence/` |
| Global Hotkey | Key combination for Quick Capture | `⌘+Shift+T` (Mac) / `Ctrl+Shift+T` (Win) |
| Default Priority | Default priority for new topics | `normal` |
| Done Confirmation | Dialog before marking as "Done" | Off |
| Delete Confirmation | Dialog before deletion | On |
| Waiting Warning | After how many days of waiting to show color warning | 7 days (Amber), 14 days (Red) |
| Obsidian Mode | Enrich frontmatter with Obsidian-compatible fields | Off |

---

## 7. Prioritization

### Phase 1 — MVP

- Three-panel layout
- Topic CRUD (Create, Read, Update, Delete)
- Context management (CRUD, groups)
- Context view with direction grouping
- Inline editing of all fields
- Notes with update functionality
- Inbox and Overdue system views
- Quick Capture (`⌘N` in context, `⌘+Shift+N` for Inbox)
- Markdown files as storage (slug filenames)
- SQLite index with file watcher
- Keyboard navigation (basics)
- Done section in context view (limited to 20, "Load More")
- Undo for last action (`⌘+Z` with toast/snackbar)
- Context removal → Inbox fallback with notification
- Error handling (toast system, corrupt files, contexts.yaml backup)
- Slug-based filenames (human-readable, Obsidian-compatible)
- Dark Mode (system theme detection via Electron nativeTheme)
- Empty states (empty contexts, empty inbox, no topic selected)

### Phase 2 — Power Features

- Free View with filters and grouping
- Saved Views
- Agenda Export
- Global Hotkey (Quick Capture in background)
- Global Search / Command Palette (`⌘K`)
- Bulk Operations
- Drag & Drop sorting
- Complete keyboard shortcuts
- Recurring Topics
- Images in notes (paste from clipboard)

### Phase 3 — Polish & Integration

- Obsidian coexistence (compatible frontmatter, vault configuration)
- Sync conflict detection
- Settings dialog
- Onboarding (first-start experience, welcome screen)
- Performance optimization for large datasets (500+ topics)

---

## 8. Decided Design Questions

| # | Question | Decision |
|---|----------|----------|
| 1 | Images in notes | **Yes.** Support paste from clipboard. Images are stored in the data directory under `data/attachments/{topic-id}/` and referenced in Markdown as a relative path (`![](../attachments/{topic-id}/img-001.png)`). |
| 2 | Activity log | **No.** No changelog in frontmatter. The chronological updates in the notes section are sufficient as history. |
| 3 | Move vs. Multi-Assign | **Multi-Assign.** Topics can be assigned to multiple contexts simultaneously. No explicit "move" needed. |
| 4 | Follow-up without date | **Always appears** when the associated context is opened, visually prominent ("Follow-Up — deferred last time"). Follow-up with date only appears prominently from the set date onwards. |
| 5 | Dark Mode | **Yes.** System theme detection (Electron `nativeTheme` API). No manual toggle needed, system setting is adopted. |
| 6 | Recurring Topics | **Yes, Phase 2.** See section 3.11. |
| 7 | Filenames | **Slug-from-Title** (`profinet-testkonzept-review.md`). Human-readable in the filesystem and in Obsidian. File is renamed when the title is renamed. |
| 8 | Quick Capture in meetings | **Two modes:** `⌘N` = current context, `⌘+Shift+N` = Inbox. Additionally context override via typeahead in the Quick-Add field. |
| 9 | Undo | **Yes, simple.** Undo last action via `⌘+Z`. No multi-step undo. Toast with "Undo" link after every action. |
| 10 | Done scaling | **Limited to 20 entries** with "Load More" button. Prevents performance issues with long-term usage. |
