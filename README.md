# Cadence

A personal topic and task tracker organized by project contexts. Built as a desktop app with Electron, React, and plain Markdown files.

Cadence helps you keep track of topics, tasks, and action items across different project contexts — such as teams, workstreams, departments, or projects. Each context holds its own set of topics with priorities, directions, due dates, and status tracking.

All data is stored as human-readable Markdown files with YAML frontmatter, fully compatible with Obsidian and version control systems.

<!-- ![Cadence Screenshot](docs/screenshot.png) -->

## Features

- **Contexts & Groups** — Organize topics by project, team, workstream, or department. Group related contexts together.
- **Topic Directions** — Classify topics as _bring up_, _deliver_, _waiting_, or _inform_ to track communication flow.
- **Priority & Status** — Three priority levels (high, medium, normal) and status tracking (new, follow-up, waiting, done).
- **Due Dates & Follow-Ups** — Set deadlines and follow-up dates with visual overdue indicators.
- **Recurring Topics** — Automatically re-create topics on a weekly, biweekly, monthly, or quarterly schedule.
- **Quick Capture** — Global hotkey (`Cmd+Shift+T` / `Ctrl+Shift+T`) to capture topics from anywhere without switching windows.
- **Drag & Drop** — Reorder topics within groups. Drag topics onto contexts or context groups to duplicate them.
- **Agenda Generation** — One-click agenda export to clipboard, grouped by direction — ready for meetings.
- **Free View** — Cross-context search and filtering with custom saved views.
- **Inbox** — Capture topics without assigning a context. Triage later.
- **Bulk Operations** — Multi-select topics for batch status changes, moves, or deletion.
- **Undo** — Every destructive action can be undone via toast notification.
- **Internationalization** — Full German and English UI. Switch languages in settings.
- **Dark Mode** — Automatic dark mode following system preferences.
- **100% Offline** — No cloud, no telemetry, no external services. Your data stays on your machine.
- **Obsidian Compatible** — Plain Markdown files with YAML frontmatter. Open your data directory in Obsidian anytime.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Electron |
| Frontend | React 18 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State | zustand |
| Database | SQLite (better-sqlite3) — disposable index cache |
| Data Format | Markdown + YAML frontmatter |
| Build | electron-vite + electron-builder |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/andipie/Cadence.git
cd Cadence

# Install dependencies (automatically rebuilds native modules)
npm install
```

### Development

```bash
# Start in development mode with hot reload
npm run dev
```

### Build

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac      # macOS (.dmg + .zip)
npm run build:win      # Windows (.exe installer + portable)
npm run build:linux    # Linux (.AppImage + .deb)

# Build for all platforms
npm run build:all
```

> **Note:** Cross-platform builds may require additional tools. Building Windows on macOS requires Wine, and building Linux on macOS requires Docker or a Linux VM. For best results, build on the target platform.

## Data Storage

Cadence stores all data in `~/cadence-data/`:

```
~/cadence-data/
├── topics/           # Active topics as .md files
├── archive/          # Completed/archived topics
├── contexts/         # Context definitions (contexts.yaml)
├── views/            # Saved Free View filters
├── trash/            # Soft-deleted topics (recoverable)
└── cadence-index.db  # SQLite index (auto-rebuilt from files)
```

Each topic is a standalone Markdown file:

```markdown
---
title: Review Q1 roadmap
status: follow-up
priority: hoch
direction: ansprechen
contexts:
  - product-team
due_date: "2026-03-25"
follow_up_date: "2026-03-20"
created_at: "2026-03-15T10:00:00Z"
updated_at: "2026-03-18T14:30:00Z"
---

## Updates

### 2026-03-18

Discussed initial priorities. Need to align with engineering on timeline.
```

> **Note:** Frontmatter values like `status`, `priority`, and `direction` use fixed German keys (`neu`, `hoch`, `ansprechen`, etc.) as part of the data format. The UI displays these in the selected language (German or English).

The SQLite database is a **disposable cache** — delete it anytime, and Cadence will rebuild it from your Markdown files on next launch.

## Example Project

The `example/` directory contains a sample data set with fictional project contexts and topics. To try it out, set your data directory in Settings to point to the `example/` folder.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+N` | Quick-add topic |
| `Cmd/Ctrl+Shift+T` | Quick capture (global, works from any app) |
| `Cmd/Ctrl+Shift+A` | Generate agenda to clipboard |
| `Cmd/Ctrl+F` | Global search |
| `Cmd/Ctrl+Z` | Undo last action |
| `Arrow Up/Down` | Navigate topic list |
| `Escape` | Close detail panel / cancel action |

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── ipc/        # IPC handlers
│   ├── store/      # FileStore, SQLite index, file watcher
│   └── services/   # Business logic
├── renderer/       # React frontend
│   ├── components/ # UI components
│   ├── store/      # zustand state
│   └── styles/     # Tailwind globals
├── shared/         # Shared types, constants, utilities
└── preload/        # Electron context bridge
```

## Known Limitations

- **macOS Code Signing** — The app is not code-signed. macOS Gatekeeper may show a warning on first launch. Right-click → Open to bypass.
- **Dev Mode Dock Name** — In development mode, macOS shows "Electron" in the dock instead of "Cadence". This is correct in production builds.
- **Cross-Platform Builds** — Building for other platforms requires additional tools (Wine for Windows on macOS, Docker for Linux).

## License

[MIT](LICENSE)
