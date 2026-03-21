# MEMORY.md — Projektgedächtnis für Claude Code

## Implementierungsstatus

### Abgeschlossen
- [x] Phase 1: Grundstruktur (Electron + React + TypeScript + SQLite)
- [x] Topics CRUD (Erstellen, Lesen, Aktualisieren, Löschen)
- [x] Kontexte & Gruppen (Drag & Drop Sortierung)
- [x] Markdown-Dateien als Datenquelle (Frontmatter + Notes)
- [x] File-Watcher (chokidar) für Live-Updates
- [x] SQLite Index als Cache
- [x] System-Views: Inbox, Liefern, Überfällig
- [x] Free View mit flexibler Gruppierung/Sortierung/Filterung
- [x] Saved Views
- [x] Detail-Panel mit Metadata, Notes, Context-Tags
- [x] Quick Capture (Global Hotkey)
- [x] Command Palette (⌘K)
- [x] Agenda-Export
- [x] Bulk-Aktionen (Multi-Select)
- [x] Undo (letzte Aktion)
- [x] Wiederkehrende Themen
- [x] Drag & Drop (Topics + Kontexte)
- [x] Dark Mode
- [x] Obsidian-Kompatibilität
- [x] i18n (Deutsch + Englisch)
- [x] Release-Vorbereitung (README, LICENSE, Build-Scripts)

### Offen / Bekannte Probleme
- [ ] Crash beim Schließen (SIGABRT von fsevents/chokidar) — `usePolling: true` als Workaround, aber grundsätzliches Shutdown-Problem nicht gelöst
- [ ] Dock-Name zeigt "Electron" statt "Cadence" im Dev-Modus (funktioniert im Production Build)
- [ ] DevTools öffnen sich automatisch im Dev-Modus
- [ ] Production Build: Icon-Pfad crasht (`dock.setIcon()` findet icon.png nicht im asar)
- [ ] Code Signing fehlt (kein Apple Developer Zertifikat)

## Architekturentscheidungen

| Entscheidung | Warum | Datum |
|---|---|---|
| fsevents deaktiviert (`usePolling: true`) | SIGABRT-Crash beim Schließen durch native fsevents-Modul | 2026-03 |
| Retrospektive-Feature entfernt | DSGVO-Bedenken bei personenbezogenen Beobachtungen | 2026-03 |
| i18n ohne Library (eigene Lösung) | Nur 2 Sprachen, ~200 Strings — i18next wäre Over-Engineering | 2026-03 |
| TypeScript-Module statt JSON für Übersetzungen | Compiler fängt fehlende Keys ab, Funktionen für Interpolation | 2026-03 |
| Frontmatter-Werte bleiben deutsch | `status: neu`, `priority: hoch` etc. sind Datenformat, nicht UI | 2026-03 |
| Kontexte = Projekte, nicht Personen | DSGVO + Produktpositionierung | 2026-03 |

## Lessons Learned / Gotchas

- **chokidar + fsevents + Electron**: Native Module crashen beim Shutdown. `watcher.close()` vor `app.quit()` reicht nicht — der native Thread läuft weiter. `usePolling: true` umgeht das Problem.
- **Electron Dock-Name**: `app.name` und Info.plist-Patching wirken nicht im Dev-Modus. Nur der Production Build zeigt den richtigen Namen.
- **Icon im Production Build**: `__dirname` zeigt ins asar-Archiv. Icon-Pfade müssen für Dev und Prod unterschiedlich aufgelöst werden (`app.isPackaged` prüfen).
- **`before-quit` + async**: Electron wartet nicht auf Promises in Event-Handlern. `event.preventDefault()` + späteres `app.quit()` hat Race Conditions.
- **electron-rebuild**: Muss nach jeder Electron-Version-Änderung laufen, sonst kryptische native-Module-Fehler.
- **TipTap Roundtripping**: Nur den aktiven Update-Block durch TipTap serialisieren, nicht den gesamten Body — sonst Whitespace-Drift.

## Nächste Schritte

- Production Build testen (Icon-Pfad-Fix für `dock.setIcon()`)
- DevTools im Dev-Modus nicht automatisch öffnen
- Crash-Fix für Shutdown evaluieren (Alternative zu chokidar?)
