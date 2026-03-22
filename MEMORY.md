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
- [x] US-26: Welcome Screen bei Erststart (Datenverzeichnis auswählen/einrichten)
- [x] US-27: Datenverzeichnis wechseln (Runtime, ohne App-Neustart)
- [x] MRU-Liste (letzte 5 Verzeichnisse, Schnellauswahl in Settings)
- [x] Datenverzeichnis in TopBar + Fenstertitel anzeigen
- [x] Production Build Icon-Fix (app.isPackaged + extraResources)
- [x] Runtime Error Recovery (Health Check bei Verzeichnisverlust)
- [x] Automated Tests mit vitest (52 Tests: Markdown-Parser, Slug-Service, Startup, Settings)

### Offen / Bekannte Probleme
- [x] ~~Crash beim Schließen (SIGABRT)~~ → Resolved via `useFsEvents: false` in chokidar
- [x] ~~Production Build: Icon-Pfad crasht~~ → Fixed via `app.isPackaged` Guard + extraResources
- [ ] Dock-Name zeigt "Electron" statt "Cadence" im Dev-Modus (funktioniert im Production Build)
- [ ] Code Signing fehlt (kein Apple Developer Zertifikat)
- [ ] US-21: Bilder im Notizteil (Paste aus Zwischenablage) noch nicht implementiert

## Architekturentscheidungen

| Entscheidung | Warum | Datum |
|---|---|---|
| fsevents deaktiviert (`useFsEvents: false`) | SIGABRT-Crash beim Schließen durch native fsevents-Modul | 2026-03 |
| Retrospektive-Feature entfernt | DSGVO-Bedenken bei personenbezogenen Beobachtungen | 2026-03 |
| i18n ohne Library (eigene Lösung) | Nur 2 Sprachen, ~200 Strings — i18next wäre Over-Engineering | 2026-03 |
| TypeScript-Module statt JSON für Übersetzungen | Compiler fängt fehlende Keys ab, Funktionen für Interpolation | 2026-03 |
| Frontmatter-Werte bleiben deutsch | `status: neu`, `priority: hoch` etc. sind Datenformat, nicht UI | 2026-03 |
| Kontexte = Projekte, nicht Personen | DSGVO + Produktpositionierung | 2026-03 |
| Zwei-Phasen-Startup (Phase 1 + Phase 2) | Welcome Screen braucht IPC ohne Daten-Layer; Phase 2 erst nach Verzeichniswahl | 2026-03 |
| Runtime-Verzeichniswechsel statt Relaunch | Cleanup + Re-Init ist nahtloser als app.relaunch() | 2026-03 |
| safeHandle in utils.ts extrahiert | Zirkuläre Abhängigkeit zwischen ipc/index.ts und ipc/startup.ts aufgelöst | 2026-03 |
| MRU in ~/.cadence-mru.json | Getrennt von Settings (die im Datenverzeichnis liegen); Home-Dir ist immer erreichbar | 2026-03 |
| Vitest statt Jest | Passt zum Vite-Ökosystem (electron-vite), schnellere Ausführung | 2026-03 |
| Nur Pure-Function-Tests | better-sqlite3 ist für Electron kompiliert — läuft nicht in vitest Node-Umgebung | 2026-03 |

## Lessons Learned / Gotchas

- **chokidar + fsevents + Electron**: Native Module crashen beim Shutdown. `useFsEvents: false` statt `usePolling: true` — nutzt `fs.watch` statt fsevents.
- **Electron Dock-Name**: `app.name` und Info.plist-Patching wirken nicht im Dev-Modus. Nur der Production Build zeigt den richtigen Namen.
- **Icon im Production Build**: `app.isPackaged` für Guards verwenden, nicht `process.env.ELECTRON_RENDERER_URL`. Icons über `extraResources` in electron-builder.yml bereitstellen.
- **`before-quit` + async**: Electron wartet nicht auf Promises in Event-Handlern. `event.preventDefault()` + späteres `app.quit()` hat Race Conditions.
- **electron-rebuild**: Muss nach jeder Electron-Version-Änderung laufen, sonst kryptische native-Module-Fehler.
- **TipTap Roundtripping**: Nur den aktiven Update-Block durch TipTap serialisieren, nicht den gesamten Body — sonst Whitespace-Drift.
- **MRU-Tests**: Testen auf dem echten Home-Dir (für `~/.cadence-mru.json`) — Original sichern und wiederherstellen.

- [x] GitHub-Release-Vorbereitung (package.json, README, CHANGELOG, .gitignore, git init)
- [x] Beispielprojekt erstellt (example/ mit 4 Kontexten, 8 Topics)
- [x] Console.log Statements auf Dev-Mode konditioniert
- [x] HTML lang-Attribute auf "en" gesetzt
- [x] docs/ und example/ vom App-Bundle ausgeschlossen
- [x] Deutsche Code-Strings in file-watcher.ts durch englische ersetzt

## Nächste Schritte

- GitHub Repo erstellen (`andipie/Cadence`) und `git remote add origin` + `git push`
- Production Build testen (`npm run build:mac`)
- Manueller Test: Welcome Screen, Verzeichniswechsel, MRU, Error Recovery
- US-21: Bilder im Notizteil (optional für v0.2.0)
- CHANGELOG.md für v0.2.0 aktualisieren
