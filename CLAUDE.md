# CLAUDE.md — Project Conventions for Claude Code

## Project

Cadence — Personal context-based topic tracking tool.
Electron + React + TypeScript + SQLite + Markdown files.

Read the relevant documents before any work:
- `MEMORY.md` — Project progress, lessons learned, open issues, architectural decisions
- `VISION.md` — Why this tool exists, design principles, scope
- `REQUIREMENTS.md` — Complete feature set, data model, UI concept
- `ARCHITECTURE.md` — Technical architecture, project structure, types, data flows
- `USER-STORIES.md` — User stories with acceptance criteria, dependencies, order

## Tech Stack

| What | Technology | Version |
|------|-----------|---------|
| Runtime | Electron | Latest stable |
| Frontend | React | 18+ |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | 3.x |
| State | zustand | Latest |
| Editor | TipTap | Latest |
| SQLite | better-sqlite3 | Latest |
| File Watching | chokidar | 3.x |
| Frontmatter | gray-matter | Latest |
| Build | electron-vite | Latest |
| Distribution | electron-builder | Latest |

## Project Structure

```
src/
├── main/           # Electron Main Process (Node.js)
│   ├── ipc/        # IPC Handlers
│   ├── store/      # FileStore, IndexDB, FileWatcher
│   └── services/   # Business Logic
├── renderer/       # React Frontend
│   ├── components/ # UI Components
│   ├── hooks/      # Custom Hooks
│   ├── store/      # zustand App State
│   └── styles/     # Tailwind globals
├── shared/         # Shared Types, Constants, Utilities
│   ├── types.ts
│   ├── constants.ts
│   ├── ipc-channels.ts
│   └── markdown.ts
└── preload/        # Electron Context Bridge
```

## Coding Conventions

### TypeScript

- **Strict mode is mandatory.** `"strict": true` in tsconfig. No `any`, no `as` casts without a comment explaining why.
- **Interfaces over types** for object shapes. `type` only for unions and utility types.
- **No classes** in the frontend. Functional components + hooks. In the main process, services are implemented as modules (function exports), not classes.
- **Enum values are lowercase strings**, not TypeScript `enum`. See `shared/types.ts` — we use union types: `type TopicStatus = 'new' | 'follow-up' | 'done'`.
- **Explicit return types** on exported functions. Internal functions may use inference.
- **No default exports** except for React component files that export exactly one component.

### React

- **Functional components** exclusively. No class components.
- **One component per file.** Filename = component name in PascalCase.
- **Props as interface** defined directly above the component in the same file.
- **Hooks order:** zustand store → custom hooks → useState → useEffect → useMemo/useCallback → handlers → JSX.
- **Event handlers** are named `handleXyz` in the component, props are named `onXyz`.
- **No inline styles.** Everything via Tailwind classes. Exception: dynamic values dependent on data (e.g., drag position).
- **No `useEffect` for data loading logic.** Data is loaded via IPC in zustand actions, components subscribe to the store.

### Tailwind

- **No magic numbers.** Use Tailwind spacing scale (`p-2`, `gap-3`), not `p-[13px]`.
- **Consistent color palette.** Define semantic colors (e.g., `text-danger`, `bg-surface`) and register them in `tailwind.config.js`.
- **Dark mode** via `dark:` prefix. Every color declaration needs a dark mode counterpart. System detection via Electron `nativeTheme`.
- **Responsive is not needed.** Desktop only, fixed minimum width. No mobile layout.

### Electron / IPC

- **Main process is stateless.** No UI state in the main process. It is a data service.
- **All IPC channels** are defined as constants in `shared/ipc-channels.ts`. Never use string literals in `ipcRenderer.invoke()`.
- **IPC handlers** validate their inputs. Never blindly trust data from the renderer.
- **Errors in the main process** are returned as structured errors, not as exceptions that crash the process.
- **Context Bridge** exposes a typed API. The renderer never accesses `ipcRenderer` directly.

### SQLite

- **Index is a disposable cache.** Everything in the index must be reproducible from the filesystem.
- **No write operations** that only change the index. Every write goes to the filesystem, the file watcher updates the index.
- **Prepared statements** for all queries. Never use string concatenation for SQL.
- **Synchronous API** from `better-sqlite3`. This is fine in the main process and avoids async complexity.
- **`electron-rebuild`** is mandatory after every Electron version change. `better-sqlite3` is a native Node module that must be compiled for the Electron Node version. Anchor it in the `postinstall` script: `"postinstall": "electron-rebuild"`.

### TipTap / Markdown

- **Roundtrip quality is critical.** TipTap works internally with ProseMirror, not Markdown. Serialization via `tiptap-markdown` can slightly alter formatting.
- **Test whitespace stability.** Loading and saving must not add or remove blank lines. Otherwise unnecessary diffs appear in Git and cloud sync.
- **Only serialize the edited update block.** Don't run the entire body through TipTap — only the active update block is edited via TipTap, the rest stays as raw Markdown.
- **Do an early spike:** Before building the detail panel, run an isolated test: load Markdown → TipTap → back to Markdown → byte comparison. If this isn't stable, evaluate alternatives (e.g., CodeMirror with Markdown preview instead of WYSIWYG).

### Filesystem

- **Atomic writes.** When writing a Markdown file: write to a temporary file, then rename. Never overwrite directly — this can lead to data loss on crash.
- **Windows caveat with rename:** `fs.rename()` can fail if the target file is held open by another process (e.g., Obsidian, cloud sync agent). Implement retry logic with exponential backoff (3 attempts, 100ms → 500ms → 2000ms).
- **File watcher debouncing.** Our own write operations generate file events. Implement debouncing to avoid ping-pong between write and watch. Pattern: before the write, add the expected path to an ignore list; after the write, remove it.
- **Paths always via `path.join()`**. Never use string concatenation for file paths.
- **Relative paths** in the database and frontmatter. The absolute base path (`dataDir`) is resolved only once.
- **Slug-based filenames.** Title → slug via `slug-service.ts`. On title rename: rename file, rename attachments folder, index updates via file watcher. On slug collision: append suffix (`-2`, `-3`, ...).
- **`contexts.yaml` backup.** On every successful write, create a copy as `contexts.yaml.bak`. On load: if the original is corrupt, automatically try the backup.

### Undo

- **Always before a destructive action** save the complete file content and path in the `UndoAction` object.
- **Only save the last action** — no multi-step undo stack.
- **Toast with undo link** after every status change, deletion, priority/direction change. Auto-dismiss after 5 seconds.
- **New action overwrites** the previous undo.

### Error Handling

- **Never swallow errors.** Every error in the main process is sent as a structured `AppError` object to the renderer.
- **Isolate corrupt files.** A broken Markdown file must not block the rest of the app. Mark file as erroneous, load the rest normally.
- **Observe toast severity:** Info (auto-dismiss 5s), Warning (manual close), Error (manual close), Critical (persistent banner at top).
- **SQLite index is disposable.** For any unexplainable index problem: delete and rebuild. Never try to repair a corrupt index.

### Electron Setup

- **`better-sqlite3` needs `electron-rebuild`.** Native Node modules must be compiled for Electron's Node version. In the `postinstall` script: `electron-rebuild -f -w better-sqlite3`. Without this, cryptic runtime errors occur.
- **Test TipTap ↔ Markdown roundtripping early.** TipTap works internally with ProseMirror, not Markdown. The `tiptap-markdown` extension has serialization quirks. Write a roundtrip test early: Markdown → TipTap → Markdown must not produce unintended formatting changes. Critical for Obsidian coexistence and Git diffs.

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Files (Components) | PascalCase | `TopicRow.tsx` |
| Files (Modules) | kebab-case | `file-store.ts` |
| Files (Hooks) | camelCase with `use` | `useTopics.ts` |
| Interfaces | PascalCase | `TopicFilter` |
| Type Aliases | PascalCase | `TopicStatus` |
| Functions | camelCase | `parseTopicFile()` |
| Constants | UPPER_SNAKE_CASE | `IPC.TOPICS_LIST` |
| React Props | PascalCase + `Props` | `TopicRowProps` |
| CSS Classes | Tailwind Utilities | — |
| IPC Channels | `domain:action` | `topics:list` |
| Frontmatter Keys | snake_case | `due_date`, `follow_up_date` |
| TypeScript Properties | camelCase | `dueDate`, `followUpDate` |

## Do's

- **Read VISION.md** when unsure whether a feature belongs. The design principles are the standard.
- **Filesystem first.** For every new feature ask: "How does this look in the Markdown file?" Only then: "How does this look in the UI?"
- **Small, focused commits.** One feature, one logical step. Not three features in one go.
- **Catch errors.** Files can be missing, YAML can be broken, frontmatter can have unexpected values. Defensive programming in FileStore and Parser.
- **Use types from `shared/types.ts`.** Never define your own interfaces for the same data structures in the renderer or main process.
- **Tests for the data layer.** FileStore, Markdown parser, IndexDB queries are testable and must be tested. UI tests are optional.
- **UI strings are localized.** The UI supports German and English via the translation system. Default language is English.

## Don'ts

- **No over-engineering.** No abstraction layers that have only one implementation. No DI container, no event bus, no Redux.
- **No external services.** No analytics, no telemetry, no auto-update server, no cloud API. The tool is 100% offline.
- **Don't cache data in main memory** that comes from SQLite. SQLite is fast enough. The renderer has its zustand store, the main process queries SQLite.
- **No over-fetching.** The context view loads only topics for the active context, not all topics. The index makes this cheap.
- **No breaking changes to frontmatter** without a migration path. If the schema changes, there must be a migrator that updates existing files.
- **No circular dependencies** between `main/`, `renderer/`, `shared/`. Shared never imports from main or renderer. Renderer never imports directly from main.
- **No `console.log` as error handling.** Errors are handled structurally and returned to the renderer as error responses.
- **No UI frameworks** like Material UI, Chakra, Ant Design. Everything is Tailwind + custom components. This keeps bundle size small and design consistent.

## Development Workflow

### Session Start & End

**At the start of every session:**
1. Read `MEMORY.md` — it contains the current project status, open issues, and lessons learned

**At the end of every productive session (feature, bugfix, refactoring):**
1. Update `MEMORY.md`:
   - Implementation status: What was completed?
   - New known issues or gotchas?
   - New architectural decisions?
   - Update next steps

### Implementing a New Feature

1. Check which user story in `USER-STORIES.md` is being implemented
2. Read the referenced sections in `REQUIREMENTS.md` and `ARCHITECTURE.md`
3. Check the acceptance criteria of the story — they define "done"
4. Start with the data layer (shared types → main service → IPC handler)
5. Then UI (hook → component → integration)
6. Go through acceptance criteria one by one and verify

### Fixing a Bug

1. Reproduce the bug
2. Identify whether main or renderer is affected
3. Fix the cause, not the symptom
4. Check whether the fix has side effects on the file watcher or index

### Refactoring

1. Only when a concrete improvement is the goal (performance, readability, bug-proneness)
2. Never simultaneously with feature work
3. Tests must be green before and after refactoring

## Slash Commands

The following slash commands can be used in Claude Code:

- `/plan` — Before complex tasks: create a plan based on the current user story, check against REQUIREMENTS.md and ARCHITECTURE.md
- `/review` — Code review: check against the conventions in this file and the acceptance criteria of the current user story
- `/test` — Write tests for the most recently changed files in the data layer

## Quality Criteria

Code is done when:

- [ ] All acceptance criteria of the user story are met
- [ ] TypeScript compiles without errors (`strict: true`)
- [ ] No `any` types without documented reason
- [ ] IPC handlers validate inputs
- [ ] Errors are handled structurally as `AppError` objects (no unhandled rejection, no `console.log` only)
- [ ] Destructive actions save previous state for undo
- [ ] UI strings use the translation system
- [ ] Dark mode works (all colors have `dark:` counterpart)
- [ ] Keyboard navigation works where specified
- [ ] Markdown files that are written are valid and Obsidian-compatible
- [ ] Filenames are correct slugs (no special characters, umlauts resolved)
- [ ] No state leak between main and renderer
- [ ] TipTap → Markdown roundtrip does not alter existing formatting
