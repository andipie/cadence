# MEMORY.md — Project Memory for Claude Code

## Implementation Status

### Completed
- [x] Phase 1: Base structure (Electron + React + TypeScript + SQLite)
- [x] Topics CRUD (Create, Read, Update, Delete)
- [x] Contexts & Groups (Drag & Drop sorting)
- [x] Markdown files as data source (Frontmatter + Notes)
- [x] File Watcher (chokidar) for live updates
- [x] SQLite Index as cache
- [x] System Views: Inbox, Deliver, Overdue
- [x] Free View with flexible grouping/sorting/filtering
- [x] Saved Views
- [x] Detail Panel with Metadata, Notes, Context Tags
- [x] Quick Capture (Global Hotkey)
- [x] Command Palette (⌘K)
- [x] Agenda Export
- [x] Bulk Actions (Multi-Select)
- [x] Undo (last action)
- [x] Recurring Topics
- [x] Drag & Drop (Topics + Contexts)
- [x] Dark Mode
- [x] Obsidian Compatibility
- [x] i18n (German + English)
- [x] Release Preparation (README, LICENSE, Build Scripts)
- [x] US-26: Welcome Screen on first launch (choose/set up data directory)
- [x] US-27: Switch data directory at runtime (no app restart needed)
- [x] MRU list (last 5 directories, quick selection in Settings)
- [x] Data directory shown in TopBar + window title
- [x] Production Build Icon Fix (app.isPackaged + extraResources)
- [x] Runtime Error Recovery (Health Check on directory loss)
- [x] Automated Tests with vitest (52 tests: Markdown Parser, Slug Service, Startup, Settings)
- [x] German→English data value migration (frontmatter values, internal constants, translation keys)

### Open / Known Issues
- [x] ~~Crash on close (SIGABRT)~~ → Resolved via `useFsEvents: false` in chokidar
- [x] ~~Production Build: Icon path crash~~ → Fixed via `app.isPackaged` guard + extraResources
- [ ] Dock name shows "Electron" instead of "Cadence" in dev mode (works in production build)
- [ ] Code Signing missing (no Apple Developer certificate)
- [ ] US-21: Images in notes section (paste from clipboard) not yet implemented

## Architecture Decisions

| Decision | Reason | Date |
|---|---|---|
| fsevents disabled (`useFsEvents: false`) | SIGABRT crash on close caused by native fsevents module | 2026-03 |
| Retrospective feature removed | GDPR concerns with personal observations | 2026-03 |
| i18n without library (custom solution) | Only 2 languages, ~200 strings — i18next would be over-engineering | 2026-03 |
| TypeScript modules instead of JSON for translations | Compiler catches missing keys, functions for interpolation | 2026-03 |
| Frontmatter values in English | `status: new`, `priority: high` etc. — migrated from German in v0.2.0 with lazy migration on read | 2026-03 |
| Contexts = Projects, not People | GDPR + product positioning | 2026-03 |
| Two-phase startup (Phase 1 + Phase 2) | Welcome Screen needs IPC without data layer; Phase 2 only after directory selection | 2026-03 |
| Runtime directory switch instead of relaunch | Cleanup + re-init is more seamless than app.relaunch() | 2026-03 |
| safeHandle extracted to utils.ts | Resolved circular dependency between ipc/index.ts and ipc/startup.ts | 2026-03 |
| MRU in ~/.cadence-mru.json | Separate from Settings (which live in data directory); home dir is always reachable | 2026-03 |
| Vitest instead of Jest | Fits the Vite ecosystem (electron-vite), faster execution | 2026-03 |
| Pure-function tests only | better-sqlite3 is compiled for Electron — doesn't run in vitest Node environment | 2026-03 |

## Lessons Learned / Gotchas

- **chokidar + fsevents + Electron**: Native modules crash on shutdown. Use `useFsEvents: false` instead of `usePolling: true` — uses `fs.watch` instead of fsevents.
- **Electron Dock Name**: `app.name` and Info.plist patching don't work in dev mode. Only the production build shows the correct name.
- **Icon in Production Build**: Use `app.isPackaged` for guards, not `process.env.ELECTRON_RENDERER_URL`. Provide icons via `extraResources` in electron-builder.yml.
- **`before-quit` + async**: Electron doesn't wait for Promises in event handlers. `event.preventDefault()` + later `app.quit()` has race conditions.
- **electron-rebuild**: Must run after every Electron version change, otherwise cryptic native module errors.
- **TipTap Roundtripping**: Only serialize the active update block through TipTap, not the entire body — otherwise whitespace drift.
- **MRU Tests**: Test on the real home dir (for `~/.cadence-mru.json`) — save and restore the original.

- [x] GitHub release preparation (package.json, README, CHANGELOG, .gitignore, git init)
- [x] Example project created (example/ with 4 contexts, 8 topics)
- [x] Console.log statements conditioned on dev mode
- [x] HTML lang attribute set to "en"
- [x] docs/ and example/ excluded from app bundle
- [x] German code strings in file-watcher.ts replaced with English

## Next Steps

- Production build test (`npm run build:mac`)
- Manual test: Welcome Screen, directory switch, MRU, Error Recovery
- US-21: Images in notes section (optional for v0.2.0)
- Update CHANGELOG.md for v0.2.0
