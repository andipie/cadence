# CLAUDE.md — Projekt-Konventionen für Claude Code

## Projekt

Cadence — Persönliches kontextbasiertes Themen-Tracking-Tool.
Electron + React + TypeScript + SQLite + Markdown-Dateien.

Lies vor jeder Arbeit die relevanten Dokumente:
- `MEMORY.md` — Projektfortschritt, Lessons Learned, offene Probleme, Architekturentscheidungen
- `VISION.md` — Warum dieses Tool existiert, Designprinzipien, Abgrenzung
- `REQUIREMENTS.md` — Vollständiges Feature-Set, Datenmodell, UI-Konzept
- `ARCHITECTURE.md` — Technische Architektur, Projektstruktur, Typen, Datenflüsse
- `USER-STORIES.md` — User Stories mit Akzeptanzkriterien, Abhängigkeiten, Reihenfolge

## Tech-Stack

| Was | Technologie | Version |
|-----|-------------|---------|
| Runtime | Electron | Latest stable |
| Frontend | React | 18+ |
| Sprache | TypeScript | Strict mode |
| Styling | Tailwind CSS | 3.x |
| State | zustand | Latest |
| Editor | TipTap | Latest |
| SQLite | better-sqlite3 | Latest |
| File Watching | chokidar | 3.x |
| Frontmatter | gray-matter | Latest |
| Build | electron-vite | Latest |
| Distribution | electron-builder | Latest |

## Projektstruktur

```
src/
├── main/           # Electron Main Process (Node.js)
│   ├── ipc/        # IPC Handler
│   ├── store/      # FileStore, IndexDB, FileWatcher
│   └── services/   # Business-Logik
├── renderer/       # React Frontend
│   ├── components/ # UI-Komponenten
│   ├── hooks/      # Custom Hooks
│   ├── store/      # zustand App-State
│   └── styles/     # Tailwind globals
├── shared/         # Shared Types, Constants, Utilities
│   ├── types.ts
│   ├── constants.ts
│   ├── ipc-channels.ts
│   └── markdown.ts
└── preload/        # Electron Context Bridge
```

## Coding-Konventionen

### TypeScript

- **Strict Mode ist Pflicht.** `"strict": true` in tsconfig. Kein `any`, keine `as`-Casts ohne Kommentar warum.
- **Interfaces über Types** für Objekt-Shapes. `type` nur für Unions und Utility-Types.
- **Keine Klassen** im Frontend. Funktionale Komponenten + Hooks. Im Main Process sind Services als Module (Funktions-Exports) implementiert, nicht als Klassen.
- **Enum-Werte sind lowercase Strings**, nicht TypeScript `enum`. Siehe `shared/types.ts` — wir nutzen Union-Types: `type TopicStatus = 'neu' | 'follow-up' | 'erledigt'`.
- **Explizite Return-Types** bei exportierten Funktionen. Interne Funktionen dürfen inferiert werden.
- **Keine Default-Exports** außer bei React-Komponenten-Dateien die genau eine Komponente exportieren.

### React

- **Funktionale Komponenten** ausschließlich. Keine Klassen-Komponenten.
- **Ein Komponente pro Datei.** Dateiname = Komponentenname in PascalCase.
- **Props als Interface** definiert, direkt über der Komponente in der gleichen Datei.
- **Hooks-Reihenfolge:** zustand Store → eigene Hooks → useState → useEffect → useMemo/useCallback → Handler → JSX.
- **Event-Handler** heißen `handleXyz` in der Komponente, Props heißen `onXyz`.
- **Keine Inline-Styles.** Alles über Tailwind-Klassen. Ausnahme: dynamische Werte die von Daten abhängen (z.B. Drag-Position).
- **Keine `useEffect` für Datenlade-Logik.** Daten werden über IPC in zustand-Actions geladen, Komponenten subscriben auf den Store.

### Tailwind

- **Keine Magic Numbers.** Tailwind-Spacing-Skala nutzen (`p-2`, `gap-3`), keine `p-[13px]`.
- **Konsistente Farbpalette.** Semantic Colors definieren (z.B. `text-danger`, `bg-surface`) und in `tailwind.config.js` registrieren.
- **Dark Mode** über `dark:` Prefix. Jede Farbangabe braucht ein Dark-Mode-Pendant. System-Detection über Electron `nativeTheme`.
- **Responsive ist nicht nötig.** Desktop-only, feste Mindestbreite. Kein Mobile-Layout.

### Electron / IPC

- **Main Process ist stateless.** Kein UI-State im Main Process. Er ist ein Daten-Service.
- **Alle IPC-Channels** sind in `shared/ipc-channels.ts` als Constants definiert. Nie String-Literals in `ipcRenderer.invoke()`.
- **IPC-Handler** validieren ihre Inputs. Nie Daten aus dem Renderer blind vertrauen.
- **Fehler im Main Process** werden als strukturierte Fehler zurückgegeben, nicht als Exceptions die den Prozess crashen.
- **Context Bridge** exponiert eine typisierte API. Der Renderer greift nie direkt auf `ipcRenderer` zu.

### SQLite

- **Index ist ein wegwerfbarer Cache.** Alles was im Index steht, muss aus dem Filesystem reproduzierbar sein.
- **Keine Schreiboperationen** die nur den Index ändern. Jeder Write geht ans Filesystem, der File-Watcher aktualisiert den Index.
- **Prepared Statements** für alle Queries. Nie String-Concatenation für SQL.
- **Synchrone API** von `better-sqlite3` nutzen. Das ist im Main Process OK und vermeidet async-Komplexität.
- **`electron-rebuild`** ist Pflicht nach jeder Electron-Version-Änderung. `better-sqlite3` ist ein nativer Node-Modul der für die Electron-Node-Version kompiliert werden muss. Im `postinstall`-Script verankern: `"postinstall": "electron-rebuild"`.

### TipTap / Markdown

- **Roundtrip-Qualität ist kritisch.** TipTap arbeitet intern mit ProseMirror, nicht mit Markdown. Die Serialisierung über `tiptap-markdown` kann Formatierung leicht verändern.
- **Whitespace-Stabilität testen.** Beim Laden und Speichern dürfen keine Leerzeilen hinzugefügt oder entfernt werden. Sonst entstehen unnötige Diffs in Git und Cloud-Sync.
- **Nur den editierten Update-Block serialisieren.** Nicht den gesamten Body durch TipTap jagen — nur der aktive Update-Block wird via TipTap editiert, der Rest bleibt als Raw-Markdown unangetastet.
- **Frühzeitig Spike machen:** Vor dem Bau des Detail-Panels einen isolierten Test: Markdown laden → TipTap → zurück nach Markdown → Byte-Vergleich. Wenn das nicht stabil ist, Alternativen evaluieren (z.B. CodeMirror mit Markdown-Vorschau statt WYSIWYG).

### Dateisystem

- **Atomare Writes.** Beim Schreiben einer Markdown-Datei: In temporäre Datei schreiben, dann rename. Nie direkt überschreiben — das kann bei Absturz zu Datenverlust führen.
- **Windows-Caveat bei Rename:** `fs.rename()` kann fehlschlagen wenn die Zieldatei von einem anderen Prozess offen ist (z.B. Obsidian, Cloud-Sync-Agent). Retry-Logik mit exponentiellem Backoff implementieren (3 Versuche, 100ms → 500ms → 2000ms).
- **File-Watcher Debouncing.** Eigene Schreiboperationen erzeugen File-Events. Debounce implementieren um Ping-Pong zwischen Write und Watch zu vermeiden. Pattern: Vor dem Write den erwarteten Pfad in eine Ignore-Liste eintragen, nach dem Write wieder entfernen.
- **Pfade immer über `path.join()`**. Nie String-Concatenation für Dateipfade.
- **Relative Pfade** in der Datenbank und im Frontmatter. Der absolute Basis-Pfad (`dataDir`) wird nur einmal aufgelöst.
- **Slug-basierte Dateinamen.** Titel → Slug via `slug-service.ts`. Bei Titel-Umbenennung: Datei umbenennen, Attachments-Ordner umbenennen, Index aktualisiert sich via File-Watcher. Bei Slug-Kollision: Suffix anhängen (`-2`, `-3`, ...).
- **`contexts.yaml` Backup.** Bei jedem erfolgreichen Schreiben eine Kopie als `contexts.yaml.bak` anlegen. Beim Laden: wenn Original korrupt, automatisch Backup versuchen.

### Undo

- **Immer vor einer destruktiven Aktion** den vollständigen Datei-Inhalt und Pfad im `UndoAction`-Objekt sichern.
- **Nur die letzte Aktion** speichern — kein Multi-Step-Undo-Stack.
- **Toast mit Rückgängig-Link** nach jeder Statusänderung, Löschung, Prio-/Richtungsänderung. Auto-dismiss nach 5 Sekunden.
- **Neue Aktion überschreibt** das vorherige Undo.

### Error Handling

- **Fehler nie verschlucken.** Jeder Fehler im Main Process wird als strukturiertes `AppError`-Objekt an den Renderer gesendet.
- **Korrupte Dateien isolieren.** Eine kaputte Markdown-Datei darf nicht den Rest der App blockieren. Datei als fehlerhaft markieren, Rest normal laden.
- **Toast-Severity beachten:** Info (auto-dismiss 5s), Warning (manuell schließen), Error (manuell schließen), Critical (persistenter Banner oben).
- **SQLite-Index ist wegwerfbar.** Bei jedem unerklärlichen Index-Problem: löschen und neu aufbauen. Nie versuchen einen korrupten Index zu reparieren.

### Electron Setup

- **`better-sqlite3` braucht `electron-rebuild`.** Native Node-Module müssen für Electrons Node-Version kompiliert werden. Im `postinstall`-Script: `electron-rebuild -f -w better-sqlite3`. Ohne das gibt es kryptische Laufzeitfehler.
- **TipTap ↔ Markdown Roundtripping früh testen.** TipTap arbeitet intern mit ProseMirror, nicht Markdown. Die `tiptap-markdown`-Extension hat Eigenheiten bei der Serialisierung. Früh einen Roundtrip-Test schreiben: Markdown → TipTap → Markdown darf keine unbeabsichtigten Formatierungsänderungen erzeugen. Kritisch für Obsidian-Koexistenz und Git-Diffs.

## Benennungen

| Was | Konvention | Beispiel |
|-----|-----------|---------|
| Dateien (Komponenten) | PascalCase | `TopicRow.tsx` |
| Dateien (Module) | kebab-case | `file-store.ts` |
| Dateien (Hooks) | camelCase mit `use` | `useTopics.ts` |
| Interfaces | PascalCase | `TopicFilter` |
| Type-Aliases | PascalCase | `TopicStatus` |
| Funktionen | camelCase | `parseTopicFile()` |
| Konstanten | UPPER_SNAKE_CASE | `IPC.TOPICS_LIST` |
| React Props | PascalCase + `Props` | `TopicRowProps` |
| CSS-Klassen | Tailwind Utilities | — |
| IPC-Channels | `domain:action` | `topics:list` |
| Frontmatter-Keys | snake_case | `due_date`, `follow_up_date` |
| TypeScript-Properties | camelCase | `dueDate`, `followUpDate` |

## Do's

- **Lies die VISION.md** wenn du unsicher bist, ob ein Feature reingehört. Die Designprinzipien sind der Maßstab.
- **Filesystem zuerst.** Bei jedem neuen Feature frag dich: "Wie sieht das in der Markdown-Datei aus?" Dann erst: "Wie sieht das in der UI aus?"
- **Kleine, fokussierte Commits.** Ein Feature, ein logischer Schritt. Nicht drei Features in einem Durchgang.
- **Fehler abfangen.** Dateien können fehlen, YAML kann kaputt sein, Frontmatter kann unerwartete Werte haben. Defensive Programmierung im FileStore und Parser.
- **Typen aus `shared/types.ts` verwenden.** Nie eigene Interfaces für die gleichen Datenstrukturen im Renderer oder Main Process definieren.
- **Tests für den Daten-Layer.** FileStore, Markdown-Parser, IndexDB-Queries sind testbar und müssen getestet werden. UI-Tests sind optional.
- **User-facing Strings auf Deutsch.** Die UI ist Deutsch. Variablen, Code-Kommentare und Dokumentation auf Englisch.

## Don'ts

- **Kein Over-Engineering.** Keine Abstraction-Layer die nur eine Implementierung haben. Kein DI-Container, kein Event-Bus, kein Redux.
- **Keine externen Dienste.** Kein Analytics, kein Telemetry, kein Auto-Update-Server, keine Cloud-API. Das Tool ist 100% offline.
- **Keine Daten im Main-Memory cachen** die aus SQLite kommen. SQLite ist schnell genug. Der Renderer hat seinen zustand-Store, der Main Process fragt SQLite.
- **Kein Over-Fetching.** Die Kontextansicht lädt nur Topics für den aktiven Kontext, nicht alle Topics. Der Index macht das billig.
- **Keine Breaking Changes am Frontmatter** ohne Migrationspfad. Wenn sich das Schema ändert, muss es einen Migrator geben der bestehende Dateien aktualisiert.
- **Keine Circular Dependencies** zwischen `main/`, `renderer/`, `shared/`. Shared importiert nie aus Main oder Renderer. Renderer importiert nie direkt aus Main.
- **Kein `console.log` als Error-Handling.** Fehler werden strukturiert behandelt und dem Renderer als Fehler-Responses zurückgegeben.
- **Keine UI-Frameworks** wie Material UI, Chakra, Ant Design. Alles ist Tailwind + eigene Komponenten. Das hält die Bundle-Size klein und das Design konsistent.

## Entwicklungs-Workflow

### Session-Start & -Ende

**Am Anfang jeder Session:**
1. Lies `MEMORY.md` — dort steht der aktuelle Projektstand, offene Probleme und Lessons Learned

**Am Ende jeder produktiven Session (Feature, Bugfix, Refactoring):**
1. Aktualisiere `MEMORY.md`:
   - Implementierungsstatus: Was wurde abgeschlossen?
   - Neue bekannte Probleme oder Gotchas?
   - Neue Architekturentscheidungen?
   - Nächste Schritte aktualisieren

### Neue Feature implementieren

1. Prüfe welche User Story in `USER-STORIES.md` umgesetzt wird
2. Lies die referenzierten Abschnitte in `REQUIREMENTS.md` und `ARCHITECTURE.md`
3. Prüfe die Akzeptanzkriterien der Story — sie definieren "fertig"
4. Starte mit dem Daten-Layer (shared Types → Main Service → IPC Handler)
5. Dann UI (Hook → Komponente → Integration)
6. Gehe die Akzeptanzkriterien einzeln durch und verifiziere

### Bug fixen

1. Reproduziere den Bug
2. Identifiziere ob Main oder Renderer betroffen ist
3. Fixe die Ursache, nicht das Symptom
4. Prüfe ob der Fix Seiteneffekte auf den File-Watcher oder Index hat

### Refactoring

1. Nur wenn eine konkrete Verbesserung das Ziel ist (Performance, Lesbarkeit, Bug-Anfälligkeit)
2. Nie gleichzeitig mit Feature-Arbeit
3. Tests müssen vor und nach dem Refactoring grün sein

## Slash Commands

Folgende Slash Commands können in Claude Code verwendet werden:

- `/plan` — Vor komplexen Aufgaben: Erstelle einen Plan basierend auf der aktuellen User Story, prüfe gegen REQUIREMENTS.md und ARCHITECTURE.md
- `/review` — Code-Review: Prüfe gegen die Konventionen in dieser Datei und die Akzeptanzkriterien der aktuellen User Story
- `/test` — Tests schreiben für die zuletzt geänderten Dateien im Daten-Layer

## Qualitätskriterien

Code ist fertig wenn:

- [ ] Alle Akzeptanzkriterien der User Story sind erfüllt
- [ ] TypeScript kompiliert ohne Fehler (`strict: true`)
- [ ] Keine `any` Types ohne dokumentierten Grund
- [ ] IPC-Handler validiert Inputs
- [ ] Fehler werden als `AppError`-Objekte strukturiert behandelt (kein unhandled rejection, kein `console.log`-only)
- [ ] Destruktive Aktionen speichern vorherigen Zustand für Undo
- [ ] UI-Strings sind Deutsch
- [ ] Dark Mode funktioniert (alle Farben haben `dark:` Pendant)
- [ ] Keyboard-Navigation funktioniert wo spezifiziert
- [ ] Markdown-Dateien die geschrieben werden, sind valide und mit Obsidian kompatibel
- [ ] Dateinamen sind korrekte Slugs (keine Sonderzeichen, Umlaute aufgelöst)
- [ ] Kein State-Leak zwischen Main und Renderer
- [ ] TipTap → Markdown Roundtrip verändert keine bestehende Formatierung
