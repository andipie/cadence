# Cadence — Sprint 3

Overall status: The tool works extremely well. This sprint focuses on filtering/sorting power, startup performance, and UI cleanup.

**Prompt pattern for Claude Code:**

```
Read VISION.md, REQUIREMENTS.md, ARCHITECTURE.md, and CLAUDE.md.
Then implement [TICKET-ID] from SPRINT-3.md.
```

---

## Improvements

### IMP-01: Extended Date Filters in Free View

**Priority:** High — core analytical capability

**Current state:** Free View supports filtering by context, status, direction, priority, and full-text search. Date-based filtering is limited.

**Required additions:**

**Due Date filters:**
- "Overdue" preset — all topics where `due_date < today` and `status ≠ erledigt | canceled`
- "Due this week" preset — `due_date` within current calendar week (Mon–Sun)
- "Due next week" preset
- Custom date range picker (from–to)
- "No due date" filter — topics without a `due_date` set

**Follow-Up Date filters:**
- "Follow-Up overdue" preset — all topics where `follow_up_date < today` and `status ≠ erledigt | canceled`
- Custom date range picker (from–to) for `follow_up_date`
- "No follow-up date" filter

**UI placement:** Additional filter dropdowns/chips in the Free View filter bar, consistent with the existing filter UI pattern. Date presets should be selectable via dropdown, custom range via inline date pickers.

**Acceptance criteria:**
- [ ] Free View filter bar includes "Due Date" and "Follow-Up Date" filter dropdowns
- [ ] "Overdue" preset filters topics with `due_date < today` (excluding done/canceled)
- [ ] "Due this week" and "Due next week" presets work correctly based on calendar week
- [ ] Custom due date range (from–to) filters correctly, both bounds inclusive
- [ ] "No due date" shows only topics without `due_date`
- [ ] "Follow-Up overdue" preset filters topics with `follow_up_date < today` (excluding done/canceled)
- [ ] Custom follow-up date range (from–to) filters correctly
- [ ] "No follow-up date" shows only topics without `follow_up_date`
- [ ] All date filters combinable with existing filters (context, status, direction, priority, search)
- [ ] Active date filters appear as removable chips in the filter bar
- [ ] Saved Views can include date filters
- [ ] Filter state resets cleanly via "Reset all"

**References:** REQUIREMENTS.md §3.3; ARCHITECTURE.md §6 (TopicFilter interface)

**Note:** The `TopicFilter` interface in `shared/types.ts` already has `dueBefore` and `dueAfter` fields. These need to be extended with equivalent `followUpBefore` / `followUpAfter` fields, plus boolean flags for the preset filters (`overdue`, `followUpOverdue`, `noDueDate`, `noFollowUpDate`).

---

### IMP-02: Filters in Context Views

**Priority:** High — daily workflow improvement

**Current state:** Context views show all topics for a context, grouped by direction. There is no way to filter within a context view.

**Required filters (where sensible):**

| Filter | Type | Rationale |
|--------|------|-----------|
| Status | Multi-select | Focus on `neu` + `follow-up` only, or include `ready` |
| Priority | Multi-select | Show only high-priority topics before a meeting |
| Direction | Multi-select | "Show me only what I'm waiting on from this person" |
| Due Date | Presets + range | Same presets as Free View (overdue, this week, next week, range) |
| Follow-Up Date | Presets + range | Same as Free View |
| Text search | String | Search within the current context's topics |

**Filters that do NOT make sense in context views:**
- Context filter (already scoped to one context)

**UI placement:** Collapsible filter bar below the context header in the middle panel. Collapsed by default to keep the clean look. Toggle via a filter icon button in the header. Active filters shown as chips. Filter state is per-context and non-persistent (resets when switching contexts — keeps things simple).

**Acceptance criteria:**
- [ ] Filter icon button in context view header toggles a filter bar
- [ ] Filter bar supports: status, priority, direction, due date presets/range, follow-up date presets/range, text search
- [ ] Active filters shown as removable chips
- [ ] Topic count in header updates to reflect filtered results (e.g. "3 of 12 topics")
- [ ] Filter state resets when switching to a different context
- [ ] Filters do not affect the "Done" section counter
- [ ] Empty state when filters exclude all topics: "No topics match these filters" + reset link
- [ ] Filter bar collapses cleanly and does not take up space when inactive

**References:** REQUIREMENTS.md §3.2, §4.3

---

### IMP-03: Sortable Context Views

**Priority:** Medium — quality of life

**Current state:** Context views are grouped by direction (Discuss → Deliver → Wait → Done) with fixed sort order within groups: priority descending, then due date ascending. No user control.

**Required sorting options:**

| Sort criterion | Description |
|----------------|-------------|
| Priority (default) | High → Medium → Normal |
| Due date | Earliest first, topics without due date at the end |
| Created date | Newest first |
| Last updated | Most recently changed first |
| Alphabetical | A–Z by title |

**Behavior:**
- Sort applies **within** each direction group — the direction grouping itself stays fixed (Discuss → Deliver → Wait → Done)
- Sort selector in the context view header (small dropdown or segmented control)
- Manual drag & drop order (existing `sort_order` field) takes precedence over any sort — if a topic has a `sort_order` set, it pins to that position regardless of selected sort
- Sort preference is **global and persistent** (not per-context) — if the user prefers "by due date", that applies in all context views

**Acceptance criteria:**
- [ ] Sort selector visible in context view header
- [ ] Sorting by priority, due date, created date, last updated, and alphabetical works correctly
- [ ] Sort applies within direction groups, not across them
- [ ] Topics with manual `sort_order` are pinned to their position regardless of sort
- [ ] Sort preference persists across app restarts
- [ ] Sort preference applies to all context views (global setting)
- [ ] Default sort is "Priority" (current behavior)

**References:** REQUIREMENTS.md §3.2

---

## UI Cleanup

### UI-01: Remove Application Menu Bar

**Priority:** Low — cosmetic

**Current state:** The Electron default menu bar (File, Edit, View, etc.) is visible but provides no Cadence-specific functionality. It takes up vertical space and looks generic.

**Required behavior:** Remove the default menu bar entirely. Cadence uses keyboard shortcuts and in-app UI for all interactions.

**Implementation notes:**
- `Menu.setApplicationMenu(null)` in the main process — but this also disables standard shortcuts like `Cmd+C`, `Cmd+V`, `Cmd+A`
- Better approach: create a minimal hidden menu that preserves clipboard and window shortcuts but shows no menu bar
- On macOS: the system menu bar is expected and should retain the app name menu with Quit, Hide, etc. Only remove the menu bar on Windows/Linux
- `win.setMenuBarVisibility(false)` on Windows may be the cleaner option

**Acceptance criteria:**
- [ ] No visible menu bar on Windows and Linux
- [ ] Standard clipboard shortcuts (`Ctrl+C/V/X/A`) still work on all platforms
- [ ] macOS retains the system menu bar with app name, Quit (`Cmd+Q`), Hide (`Cmd+H`)
- [ ] All existing Cadence keyboard shortcuts remain functional
- [ ] Window management shortcuts (minimize, close) remain functional

---

## Performance

### PERF-01: Slow Startup of Portable Executable on Windows x64

**Priority:** Medium — first impression matters

**Observed:** The portable `.exe` build has noticeably slow startup time on Windows x64. The app takes several seconds before the window appears.

**Possible causes (investigate in order):**
1. **Antivirus scanning** — unsigned portable executables are commonly scanned by Windows Defender on every launch. This is the most likely cause and not fully solvable without code signing.
2. **asar unpacking** — `better-sqlite3` is a native module and may need to be unpacked from the asar archive at runtime. Check if `asarUnpack` is configured correctly in `electron-builder.yml` for native modules.
3. **SQLite index rebuild** — if the index is rebuilt on every start instead of reused, that adds startup time. Verify that the index file persists between launches and is only rebuilt when necessary.
4. **Electron cold start** — inherent to Electron, but can be improved with a splash screen or deferred loading.

**Acceptance criteria:**
- [ ] Investigate and document the primary cause of slow startup
- [ ] If asar-related: configure `asarUnpack` for `better-sqlite3` and other native modules
- [ ] If index-related: ensure index is reused when valid, not rebuilt every start
- [ ] Splash screen or loading indicator if startup takes > 2 seconds (so the user knows the app is launching)
- [ ] Document findings and any remaining limitations (e.g. "unsigned exe will always be slower due to Defender scanning")

**References:** ARCHITECTURE.md §10 (Build & Distribution)

---

## Recommended Order

| # | Ticket | Rationale |
|---|--------|-----------|
| 1 | IMP-01 | Extends the filter model — IMP-02 reuses the same date filter components |
| 2 | IMP-02 | Depends on IMP-01's date filter UI components |
| 3 | IMP-03 | Independent, quick win |
| 4 | UI-01 | Independent, quick win |
| 5 | PERF-01 | Investigation task, may or may not yield actionable fixes |