# Changelog

All notable changes to Cadence will be documented in this file.

## [0.1.0] — 2026-03-21

### Initial Release

**Core Features**
- Topics with status (new, follow-up, waiting, done), priority (high, medium, low), and direction (discuss, deliver, waiting)
- Contexts organized in groups with drag & drop sorting
- Detail panel with metadata editing, notes feed, and context tags
- Markdown files with YAML frontmatter as data source — fully Obsidian compatible
- SQLite index as disposable cache (auto-rebuilt from files)

**Views & Navigation**
- System views: Inbox, Deliver, Overdue
- Free View with flexible grouping, sorting, and filtering
- Saved Views for reusable filter configurations
- Command Palette (⌘K) for quick search across topics and contexts

**Productivity**
- Quick Capture via global hotkey (⌘⇧T) — capture topics from any app
- Agenda generation — one-click clipboard export grouped by direction
- Bulk operations — multi-select for batch status changes, moves, or deletion
- Recurring topics (weekly, biweekly, monthly, quarterly)
- Undo for destructive actions via toast notification

**UI & Accessibility**
- Dark mode following system preferences
- Internationalization — German and English UI
- Keyboard navigation throughout
- Drag & drop for topics and contexts

**Technical**
- 100% offline — no cloud, no telemetry, no external services
- Atomic file writes with backup and retry logic
- File watcher for live updates from external editors
- Sync conflict detection for cloud-synced directories
