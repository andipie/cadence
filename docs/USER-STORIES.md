# Cadence — User Stories

## Overview

This document drives the implementation. Each user story delivers tangible user value and serves as a standalone assignment for Claude Code. Stories build upon each other — the order is binding.

**Reference documents:**
- `REQUIREMENTS.md` — What is being built (features, data model, UI)
- `ARCHITECTURE.md` — How it is technically implemented (stack, types, data flow)
- `CLAUDE.md` — Coding conventions and rules
- `VISION.md` — Design principles for decision-making

**Prompt pattern for Claude Code:**

```
Read VISION.md, REQUIREMENTS.md, ARCHITECTURE.md, and CLAUDE.md.
Then implement User Story [US-XX] from USER-STORIES.md.
The relevant sections are referenced there.
```

---

## Phase 1 — MVP

### US-01: Project Scaffolding

**As a** developer
**I want to** start a working Electron project with the three-panel layout,
**so that** the foundation for all subsequent stories is in place.

**Acceptance criteria:**
- [ ] `npm run dev` starts the Electron app with hot reload
- [ ] Three-panel layout is visible (left, center, right) with placeholder content
- [ ] TopBar with app name "Cadence" is visible
- [ ] Tailwind CSS is working (verifiable via styled placeholders)
- [ ] IPC base structure exists: `preload/index.ts`, `shared/ipc-channels.ts`, `shared/types.ts`
- [ ] `electron-rebuild` is in the `postinstall` script
- [ ] Dark mode responds to system theme (light/dark background)
- [ ] Project structure matches ARCHITECTURE.md section 2

**References:** ARCHITECTURE.md §1, §2, §10; REQUIREMENTS.md §4.1; CLAUDE.md Tech Stack

---

### US-02: Reading and Indexing Markdown Files

**As a** developer
**I want to** parse Markdown files with frontmatter and index them in SQLite,
**so that** the data foundation for all UI features is in place.

**Acceptance criteria:**
- [ ] `shared/types.ts` contains all interfaces from ARCHITECTURE.md §6
- [ ] `shared/markdown.ts` can parse and serialize frontmatter + body
- [ ] `slug-service.ts` converts titles to filenames (umlauts, special characters)
- [ ] `file-store.ts` reads/writes Markdown files with atomic writes (temp+rename)
- [ ] `index-db.ts` creates SQLite schema (ARCHITECTURE.md §5), indexes topics
- [ ] `file-watcher.ts` detects file changes and updates the index
- [ ] File watcher has debouncing for own writes (no ping-pong)
- [ ] 4-5 manually created test files under `data/topics/` are correctly indexed
- [ ] Roundtrip test: read file → parse → serialize → byte comparison is stable

**References:** ARCHITECTURE.md §5, §6, §7; REQUIREMENTS.md §2.1; CLAUDE.md Filesystem, SQLite

---

### US-03: Managing Contexts

**As a** user
**I want to** create contexts (people, meetings, groups) and see them in the left panel,
**so that** I can organize my conversation partners and meetings.

**Acceptance criteria:**
- [ ] `contexts.yaml` is read and written (with `.bak` backup on every save)
- [ ] Left panel shows contexts grouped by groups (REQUIREMENTS.md §4.2)
- [ ] Contexts without a group appear under "Ohne Gruppe" (Without Group)
- [ ] Create new context via "+ Kontext anlegen" (minimum: name only)
- [ ] Rename and delete context via right-click/context menu
- [ ] Create, rename, delete groups
- [ ] Each context shows a counter with the number of open topics
- [ ] Error handling: If `contexts.yaml` is corrupt, backup is loaded

**References:** REQUIREMENTS.md §2.2, §3.8; ARCHITECTURE.md §6 (Context, ContextGroup)

---

### US-04: Displaying Topics in Context

**As a** user
**I want to** see all related topics when clicking on a context, grouped by direction,
**so that** I immediately know what I need to bring up, deliver, and follow up on.

**Acceptance criteria:**
- [ ] Clicking a context in the left panel loads topics for that context
- [ ] Center panel shows topics grouped: Ansprechen (Bring Up) → Liefern (Deliver) → Warten (Waiting) → Erledigt (Done)
- [ ] Done section is collapsed by default, expandable, limited to 20 entries with "Load more"
- [ ] Within each group: sorted by priority (high → normal), then due date
- [ ] Each row shows: priority badge, status badge, title, due date, "Waiting for X days"
- [ ] Follow-up topics are visually highlighted
- [ ] Overdue topics have a red due date
- [ ] "Waiting for X days" shows amber from 7 days, red from 14 days
- [ ] Header shows context name and number of open topics

**References:** REQUIREMENTS.md §3.2, §4.3, §4.5

---

### US-05: Creating a Topic

**As a** user
**I want to** quickly capture a new topic,
**so that** nothing slips through the cracks — even in the middle of a meeting.

**Acceptance criteria:**
- [ ] `⌘N` creates a new topic in the active context (title field with autofocus)
- [ ] `⌘+Shift+N` creates a new topic in the Inbox (even when a context is active)
- [ ] Quick-add field at the bottom of the center panel, always visible
- [ ] Quick-add field has an optional context override via typeahead
- [ ] New topic: only title is required, rest gets defaults (REQUIREMENTS.md §2.1)
- [ ] Markdown file is created with a slug filename
- [ ] Topic appears immediately in the list without reload

**References:** REQUIREMENTS.md §3.1; ARCHITECTURE.md §7 (Serialization)

---

### US-06: Editing a Topic in Detail

**As a** user
**I want to** edit all properties of a topic directly in the detail panel,
**so that** I can adjust priority, status, direction, and contexts without detours.

**Acceptance criteria:**
- [ ] Clicking a topic shows the detail panel on the right
- [ ] Status editable via dropdown (neu/new, follow-up, erledigt/done)
- [ ] Priority editable via dropdown (hoch/high, mittel/medium, normal)
- [ ] Direction editable via dropdown (ansprechen/bring up, liefern/deliver, warten/waiting)
- [ ] Due date editable via date picker
- [ ] Follow-up date editable via date picker
- [ ] Contexts as tag list: × to remove, + to add (typeahead)
- [ ] Removing the last context → topic moves to Inbox, notice is displayed
- [ ] All changes write immediately to the Markdown file (no save button)
- [ ] On title change: file is renamed (slug update)

**References:** REQUIREMENTS.md §3.5, §3.13; ARCHITECTURE.md §4.2 (Write Data Flow)

---

### US-07: Notes with Updates

**As a** user
**I want to** keep chronological notes on a topic and add new updates with the press of a button,
**so that** I can track the history of a topic.

**Acceptance criteria:**
- [ ] Detail panel shows notes as a chronological feed (newest on top)
- [ ] Each update has a date header and Markdown body
- [ ] "+ Update" button creates a new section with the current date, cursor jumps into it
- [ ] `⌘+U` as shortcut for new update
- [ ] TipTap editor for WYSIWYG Markdown (bold, italic, lists, links, code)
- [ ] Only the active update block is edited through TipTap, the rest remains as raw Markdown
- [ ] Newest update has a blue left border, older ones have a gray border
- [ ] Changes are written to the Markdown file

**References:** REQUIREMENTS.md §3.5 (Notes Section); CLAUDE.md TipTap/Markdown

**Note:** Before implementation, conduct a roundtrip spike (CLAUDE.md, TipTap/Markdown section). If the roundtrip quality is insufficient, evaluate alternatives (e.g., CodeMirror with Markdown preview instead of WYSIWYG).

---

### US-08: Inbox and Overdue

**As a** user
**I want to** have an Inbox for unassigned topics and an Overdue view,
**so that** nothing gets lost and I can immediately see urgent items.

**Acceptance criteria:**
- [ ] "Inbox" in the left panel shows all topics without a context (status ≠ erledigt/done)
- [ ] "Overdue" in the left panel shows all topics with due date < today (status ≠ erledigt/done)
- [ ] Both views have counter badges in the left panel
- [ ] Badges are also visible in the TopBar (always, regardless of which context is active)
- [ ] In the Inbox, topics can be assigned to contexts (→ they disappear from Inbox)
- [ ] Overdue view shows topics with red due date marking

**References:** REQUIREMENTS.md §3.4, §4.2, §4.5 (Empty States)

---

### US-09: Completing, Following Up, and Deleting Topics

**As a** user
**I want to** complete topics, set them for follow-up, or delete them,
**so that** my system stays clean.

**Acceptance criteria:**
- [ ] "Done" button sets status to `erledigt` (done) and `completed_at`
- [ ] `⌘+E` as shortcut
- [ ] Completed topic moves to the Done section
- [ ] "Follow-up" button sets status to `follow-up`, optional date picker
- [ ] `⌘+F` as shortcut
- [ ] Follow-up without date: appears the next time the context is opened
- [ ] Follow-up with date: appears prominently only from that date onward
- [ ] "Delete" button with confirmation dialog (configurable)
- [ ] Deletion removes the Markdown file and the attachments folder

**References:** REQUIREMENTS.md §3.5 (Action Buttons), §8 (Design Question 4)

---

### US-10: Undo

**As a** user
**I want to** undo my last action,
**so that** an accidental click is not a problem.

**Acceptance criteria:**
- [ ] After every status change, priority change, deletion: a toast appears at the bottom
- [ ] Toast shows: "Status → Erledigt — [Undo]" (example)
- [ ] Clicking "Undo" or `⌘+Z` undoes the last action
- [ ] Toast disappears after 5 seconds automatically
- [ ] Only the last action is saved (no multi-step undo)
- [ ] Undo on deletion restores the file
- [ ] `undo-service.ts` stores previous file content in memory

**References:** REQUIREMENTS.md §3.12

---

### US-11: Keyboard Navigation

**As a** user
**I want to** operate the tool entirely via keyboard,
**so that** I can work efficiently without reaching for the mouse.

**Acceptance criteria:**
- [ ] `↑`/`↓` navigates through the topic list
- [ ] `Enter` opens the selected topic in the detail panel
- [ ] `Escape` closes the detail panel / goes back
- [ ] `Tab` switches between panels
- [ ] `⌘+1/2/3` sets priority (High/Medium/Normal)
- [ ] All shortcuts from REQUIREMENTS.md §3.9 are implemented
- [ ] Active list entry is visually highlighted

**References:** REQUIREMENTS.md §3.9 (complete shortcut table)

---

### US-12: Error Handling and Robustness

**As a** user
**I want** the app to run stably even with corrupt files or missing folders,
**so that** I can trust my data.

**Acceptance criteria:**
- [ ] Toast/notification system: Info (blue), Warning (amber), Error (red)
- [ ] Auto-dismiss after 5 seconds for Info, manual close for Warning/Error
- [ ] Corrupt Markdown file: warning, topic grayed out, app continues running
- [ ] Corrupt `contexts.yaml`: backup is loaded, warning displayed
- [ ] Data directory unreachable: critical error dialog with path information
- [ ] SQLite index corrupt: automatic rebuild, toast "Index is being rebuilt..."
- [ ] Critical errors get a persistent banner at the top of the window

**References:** REQUIREMENTS.md §3.14

---

## Phase 2 — Power Features

### US-13: Free View with Filters

**As a** user
**I want to** filter and group all topics across contexts,
**so that** I can answer analytical questions like "What am I waiting for everywhere?"

**Acceptance criteria:**
- [ ] "Free View" as its own entry in the left panel
- [ ] Filter dimensions: Context (multi), Status (multi), Direction (multi), Priority (multi), Due date (range), Full-text search
- [ ] Active filters as chips with × to remove
- [ ] Grouping selectable: Context, Priority, Direction, Status, None
- [ ] Sorting selectable: Due date, Priority, Creation date, Last modified
- [ ] Result counter visible
- [ ] "Reset all" link

**References:** REQUIREMENTS.md §3.3, §4.3 (Free View)

---

### US-14: Saved Views

**As a** user
**I want to** save frequently used filter combinations as views,
**so that** I can access my most important perspectives with a single click.

**Acceptance criteria:**
- [ ] Current filter combination can be saved as a named view
- [ ] Saved views appear in the left panel under a collapsible section
- [ ] Views are editable (rename, change filters, delete)
- [ ] Saved in `saved-views.yaml`
- [ ] Clicking a saved view activates the Free View with the saved filters

**References:** REQUIREMENTS.md §2.3, §3.3 (Saved Views)

---

### US-15: Agenda Export

**As a** user
**I want to** generate an agenda from a context and copy it to the clipboard,
**so that** I go into meetings prepared.

**Acceptance criteria:**
- [ ] "Agenda" button in the header of the center panel (context view)
- [ ] `⌘+Shift+A` as shortcut
- [ ] Generated Markdown: grouped by direction, with title + last update
- [ ] Format matches the example in REQUIREMENTS.md §3.6
- [ ] Copied to clipboard, toast confirms "Agenda copied"

**References:** REQUIREMENTS.md §3.6

---

### US-16: Global Hotkey and Quick-Capture Window

**As a** user
**I want to** capture a topic via hotkey even when Cadence is in the background,
**so that** I never forget anything regardless of context.

**Acceptance criteria:**
- [ ] `⌘+Shift+T` (configurable) opens a minimal capture window
- [ ] Window: frameless, centered, ~400x150px
- [ ] Title field with autofocus
- [ ] Optional context field with typeahead
- [ ] Enter = Save + Close, Escape = Cancel
- [ ] Without context → Inbox

**References:** REQUIREMENTS.md §3.1; ARCHITECTURE.md §9

---

### US-17: Global Search / Command Palette

**As a** user
**I want to** search across all topics, contexts, and notes via `⌘+K`,
**so that** I can find everything instantly.

**Acceptance criteria:**
- [ ] `⌘+K` opens command palette (VS Code / Raycast style)
- [ ] Searches in: topic titles, note text, context names (via SQLite FTS5)
- [ ] Results as a quick-selection list
- [ ] Selection jumps directly to the topic in its respective context
- [ ] Escape closes the palette

**References:** REQUIREMENTS.md §3.10; ARCHITECTURE.md §5 (FTS5)

---

### US-18: Bulk Operations

**As a** user
**I want to** edit multiple topics at once,
**so that** I can efficiently clean up the Inbox.

**Acceptance criteria:**
- [ ] Checkboxes appear on hover or via toggle in the topic list
- [ ] Multi-select: assign context, set priority, change status, change direction, delete
- [ ] Bulk toolbar appears when multi-selection is active
- [ ] Deletion with confirmation

**References:** REQUIREMENTS.md §3.7

---

### US-19: Drag & Drop Sorting

**As a** user
**I want to** reorder topics within a direction group via drag & drop,
**so that** I can set the conversation order for a meeting.

**Acceptance criteria:**
- [ ] Topics within a group (Ansprechen/Liefern/Warten) are sortable via drag & drop
- [ ] Order is stored in frontmatter as `sort_order`
- [ ] Manual order takes precedence over priority sorting

**References:** REQUIREMENTS.md §3.2

---

### US-20: Recurring Topics

**As a** user
**I want to** define recurring topics,
**so that** regular status checks automatically resurface.

**Acceptance criteria:**
- [ ] Topic can be marked as `recurring` (toggle in the detail panel)
- [ ] Interval selectable: weekly, biweekly, monthly, quarterly
- [ ] On "Done": automatic update, status → follow-up, `recurring_next` calculated
- [ ] From `recurring_next` onward, the topic reappears as active
- [ ] Recurrence icon in the topic list

**References:** REQUIREMENTS.md §3.11

---

### US-21: Images in the Notes Section

**As a** user
**I want to** insert screenshots and images into the notes section,
**so that** I can capture visual information directly on the topic.

**Acceptance criteria:**
- [ ] Paste from clipboard inserts image
- [ ] Image is saved under `data/attachments/{topic-slug}/`
- [ ] Markdown reference as relative path
- [ ] Image is displayed inline in the TipTap editor
- [ ] On title rename, the attachments folder is renamed along with it

**References:** REQUIREMENTS.md §8 (Design Question 1)

---

## Phase 3 — Polish & Integration

### US-22: Obsidian Coexistence

**As a** user
**I want to** use the Cadence data directory as part of my Obsidian vault,
**so that** I can search, link, and access it on mobile via Obsidian.

**Acceptance criteria:**
- [ ] Data directory is configurable as an Obsidian subfolder
- [ ] Obsidian mode in settings: adds `aliases` (human-readable title) to frontmatter
- [ ] Slug filenames work in Obsidian links
- [ ] External changes to the body (via Obsidian) are correctly detected and indexed
- [ ] Frontmatter changes via Obsidian are tolerated (no crash), but warned

**References:** REQUIREMENTS.md §5.4

---

### US-23: Sync Conflict Detection

**As a** user
**I want to** be warned on startup when cloud sync conflicts exist,
**so that** I don't lose any data.

**Acceptance criteria:**
- [ ] On startup: scan for conflict files (pattern from REQUIREMENTS.md §5.3)
- [ ] Warning with list of affected files
- [ ] Links to open in file manager
- [ ] Non-blocking (app remains usable)

**References:** REQUIREMENTS.md §5.3

---

### US-24: Settings Dialog

**As a** user
**I want to** configure Cadence,
**so that** the tool fits my workflow.

**Acceptance criteria:**
- [ ] Settings dialog via menu or shortcut
- [ ] All settings from REQUIREMENTS.md §6 are configurable
- [ ] Settings are persistently saved
- [ ] Data directory path changeable with validation

**References:** REQUIREMENTS.md §6

---

### US-25: Performance Optimization

**As a** user with 500+ topics
**I want** Cadence to remain fast,
**so that** the tool still runs smoothly after a year of intensive use.

**Acceptance criteria:**
- [ ] Context view loads in < 100ms (even with 500+ topics in the index)
- [ ] Free View with complex filters loads in < 200ms
- [ ] Virtualized lists if needed (only render visible rows)
- [ ] SQLite queries optimized (check EXPLAIN QUERY PLAN)
- [ ] File watcher causes no noticeable UI freezes

**References:** ARCHITECTURE.md §5 (Indices)

# Cadence — New User Stories: Data Directory Management

These stories extend the existing USER-STORIES.md and thematically belong to **Phase 1 — MVP** (added retroactively), as they are a prerequisite for usage.

**Prompt pattern for Claude Code:**

```
Read VISION.md, REQUIREMENTS.md, ARCHITECTURE.md, and CLAUDE.md.
Then implement User Story [US-XX] from USER-STORIES.md.
The relevant sections are referenced there.
```

---

## US-26: Startup — Data Directory Selection and Validation

**As a** user
**I want to** automatically open my last data directory when starting Cadence — or choose one on first launch,
**so that** I can start working immediately without having to configure the path every time.

### Definitions

A data directory is **valid** when:
- The path exists and is readable
- A `contexts/contexts.yaml` is present (may be empty)
- A `topics/` subdirectory exists

A data directory is **initializable** when:
- The path exists and is writable
- It is either empty or does not contain any Cadence subdirectories (no accidental overwriting)

### Startup Flow

```
App starts
  │
  ├─ Saved path exists?
  │   ├─ Yes → Path valid?
  │   │        ├─ Yes → Open, done
  │   │        └─ No → Path reachable but invalid?
  │   │                  ├─ Yes → Dialog: "Set up directory or choose another?"
  │   │                  └─ No (not reachable) → Error dialog with path info,
  │   │                         "Choose another directory"
  │   └─ No (first launch) → Welcome screen
  │
  Welcome screen:
    ├─ "Set up new data directory" → Folder selection → Initialization → Open
    └─ "Open existing data directory" → Folder selection → Validation → Open
```

### Acceptance Criteria

- [ ] First launch (no saved path): Welcome screen with "Set up new" and "Open existing"
- [ ] "Set up new": OS folder selection dialog, selected folder is initialized (create subdirectories `topics/`, `archive/`, `contexts/`, `views/`, `trash/`, create empty `contexts/contexts.yaml`)
- [ ] "Open existing": OS folder selection dialog, selected folder is validated
- [ ] Validation failed on "Open existing": Error message with specific reason ("contexts.yaml missing" / "topics/ folder missing"), back to selection
- [ ] On valid directory: path is persistently saved (`electron-store` or similar), app starts normally
- [ ] Next launch: saved path is automatically opened, no dialog
- [ ] Saved path no longer reachable (folder deleted, drive not mounted): Error dialog with path info and "Choose another directory" button
- [ ] Saved path reachable but no longer valid (e.g., `contexts.yaml` deleted): Dialog "Directory is not a valid Cadence directory. Set up or choose another?"
- [ ] Setting up a non-empty folder that already contains non-Cadence files: Warning "Folder is not empty. Set up anyway?" with note that only Cadence subdirectories will be created and existing files will not be modified
- [ ] No data loss: initialization never overwrites existing files or folders
- [ ] Welcome screen and error dialogs work in dark mode

### References

- REQUIREMENTS.md §6 (Data Directory Setting)
- ARCHITECTURE.md §2 (Data Directory Structure)

---

## US-27: Switching Data Directory

**As a** user
**I want to** switch to a different data directory during runtime,
**so that** I can keep different contexts separate (e.g., Work / Personal / Project).

**Dependency:** US-26

### Acceptance Criteria

- [ ] Menu item "Switch data directory" (or via command palette)
- [ ] Same logic as on startup: folder selection → validation or initialization
- [ ] On switch: stop file watcher, close SQLite index, open new directory, rebuild index
- [ ] Most recently used directory is saved as the new default
- [ ] Optional: list of last 3-5 used directories as quick selection (MRU list)
- [ ] UI shows current data directory (e.g., in window title or in the TopBar)

### References

- REQUIREMENTS.md §6
- VISION.md (Filesystem First)
