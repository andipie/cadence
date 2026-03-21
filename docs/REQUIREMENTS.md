# Cadence — Requirements

## 1. Vision

Cadence ist ein persönliches, kontextbasiertes Themen-Tracking-Tool für Führungskräfte und Wissensarbeiter. Es löst das Problem, dass man in verschiedenen Kontexten (1:1s, Meetings, Gruppen) den Überblick über offene Themen, Zusagen und Wartezeiten verliert.

**Kernprinzipien:**

- **Quick Capture first** — Ein neues Thema erfassen darf maximal 2 Sekunden dauern.
- **Kontextgetrieben** — Beim Öffnen eines Kontexts sehe ich sofort alles Relevante.
- **Minimal Friction** — Jede Eigenschaft (Prio, Status, Richtung, Kontext) ist inline editierbar. Kein Edit-Mode, kein Modal, kein Extra-Klick.
- **Filesystem als Source of Truth** — Alle Daten liegen als Markdown-Dateien mit Frontmatter vor. Keine proprietäre Datenbank.
- **Desktop-first, plattformunabhängig** — Windows und macOS.

---

## 2. Datenmodell

### 2.1 Thema (Topic)

Ein Thema ist eine einzelne Markdown-Datei mit YAML-Frontmatter.

**Frontmatter-Felder:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | String (slug) | ja | Eindeutige ID, abgeleitet aus dem Titel (z.B. `profinet-testkonzept-review`). Entspricht dem Dateinamen ohne `.md`. Ändert sich bei Titel-Umbenennung. |
| `title` | String | ja | Titel des Themas |
| `status` | Enum | ja | `neu`, `follow-up`, `erledigt` |
| `priority` | Enum | nein | `hoch`, `mittel`, `normal` (Default: `normal`) |
| `direction` | Enum | nein | `ansprechen`, `liefern`, `warten` (Default: `ansprechen`) |
| `contexts` | List[String] | nein | Liste von Kontext-IDs. Leer = Inbox |
| `due_date` | Date (ISO) | nein | Fälligkeitsdatum |
| `follow_up_date` | Date (ISO) | nein | Wiedervorlage-Datum |
| `created_at` | DateTime | ja | Erstellungszeitpunkt |
| `updated_at` | DateTime | ja | Letzter Änderungszeitpunkt |
| `completed_at` | DateTime | nein | Zeitpunkt der Erledigung |
| `sort_order` | Number | nein | Manuelle Sortierung innerhalb einer Gruppe |
| `recurring` | Boolean | nein | `true` wenn wiederkehrendes Thema |
| `recurring_interval` | Enum | nein | `weekly`, `biweekly`, `monthly`, `quarterly` (nur wenn `recurring: true`) |
| `recurring_next` | Date (ISO) | nein | Nächstes Fälligkeitsdatum (automatisch berechnet) |

**Body (Markdown):**

Der Body enthält die Notizen als chronologische Updates, jeweils mit Datum-Header:

```markdown
## 2026-03-19

Max sagt IT-Sec braucht Freigabe. Ticket ist bei IT-Sec, Max kümmert sich.

## 2026-03-05

Max braucht Zugang zu den Build-Pipelines für den neuen Testrunner.
Admin-Rechte nicht nötig, Contributor reicht.
```

Neuestes Update steht oben.

**Dateiname-Konvention:** `{slug-from-title}.md` (z.B. `profinet-testkonzept-review.md`)

Der Slug wird aus dem Titel generiert (lowercase, Umlaute aufgelöst, Sonderzeichen entfernt, Leerzeichen → Bindestriche). Bei Titel-Umbenennung wird die Datei umbenannt und der Index aktualisiert. Das macht die Dateien im Filesystem und in Obsidian menschenlesbar.

**Verzeichnisstruktur:**

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

### 2.2 Kontext (Context)

Kontexte werden zentral in `contexts.yaml` verwaltet.

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
    group: null          # Ohne Gruppe

groups:
  - id: "team-embedded"
    name: "Team Embedded"
    sort_order: 1

  - id: "management"
    name: "Management"
    sort_order: 2
```

**Kontext-Eigenschaften:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `id` | String (slug) | ja | Eindeutige ID |
| `name` | String | ja | Anzeigename |
| `type` | Enum | nein | `person`, `meeting`, `group`, `place`, `other` |
| `group` | String | nein | Referenz auf Gruppen-ID. `null` = ohne Gruppe |

**Gruppen** sind rein organisatorisch (Anzeige im linken Panel). Flache Struktur, kein Nesting.

### 2.3 Gespeicherte Free Views

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

| Aspekt | Beschreibung |
|--------|--------------|
| **Global Hotkey** | Konfigurierbarer System-Hotkey (z.B. `⌘+Shift+T`) öffnet ein minimales Capture-Fenster auch wenn das Tool im Hintergrund ist |
| **Minimal-Modus** | Nur Titel-Feld + Enter = Thema landet in Inbox |
| **Kontext-Modus** | Titel + optionales Kontext-Feld mit Typeahead/Autocomplete. Wenn ein Kontext ausgewählt ist, wird er vorbelegt |
| **In-Context Capture** | `⌘N` legt ein neues Thema direkt im aktiven Kontext an |
| **Inbox Capture** | `⌘+Shift+N` legt ein neues Thema in der Inbox an, auch wenn ein Kontext aktiv ist. Essentiell für Meetings: ein Thema fällt, das zu einem anderen Kontext gehört — schnell in die Inbox, später einsortieren |
| **Inline Quick-Add** | Eingabefeld am unteren Rand des Mittelpanels, immer sichtbar. Optional mit Kontext-Override per Typeahead |

**Meeting-Workflow:** Im 1:1 mit Max fällt ein Thema für Lisa. `⌘+Shift+N` → Titel tippen → Enter → landet in Inbox. Oder: im Quick-Add-Feld den Kontext überschreiben per Typeahead direkt auf "Lisa Schmidt". Kein Kontextwechsel im linken Panel nötig.

### 3.2 Kontextansicht

Die primäre Arbeitsansicht. Wird aktiv durch Auswahl eines Kontexts im linken Panel.

**Gruppierung der Themenliste (fest, nicht konfigurierbar):**

1. **Ansprechen** — Themen die ich einbringen will (Diskussion, Entscheidung, Info)
2. **Liefern** — Themen wo ich etwas schulde
3. **Warten** — Themen wo ich auf jemanden warte
4. **Erledigt** — Abgeschlossene Themen, collapsed by default, chronologisch (neuestes oben). Zeigt maximal 20 Einträge, mit "Mehr laden"-Button für ältere. Verhindert Performance-Probleme bei Kontexten mit langer Historie.

Innerhalb jeder Gruppe: Sortierung nach Prio (hoch → normal), dann nach Fälligkeit (früheste zuerst). Manuelle Umsortierung per Drag & Drop möglich.

**Thema-Zeile zeigt:**
- Prio-Badge (farbig)
- Status-Badge (Neu / Follow-Up)
- Titel
- Fälligkeitsdatum (rot wenn überfällig)
- "Wartet seit X Tagen" (bei Richtung: Warten)
- Alle Badges/Felder sind per Klick inline editierbar (Dropdown)

**Follow-Up Hervorhebung:** Themen mit Status `follow-up` erhalten eine visuelle Markierung ("beim letzten Mal vertagt — jetzt dran").

### 3.3 Free View

Kontextübergreifende Ansicht mit mächtiger Filterung.

**Filter-Dimensionen:**

| Filter | Typ | Beschreibung |
|--------|-----|--------------|
| Kontext | Multi-Select | Einen oder mehrere Kontexte auswählen |
| Status | Multi-Select | `neu`, `follow-up`, `erledigt` |
| Richtung | Multi-Select | `ansprechen`, `liefern`, `warten` |
| Priorität | Multi-Select | `hoch`, `mittel`, `normal` |
| Fälligkeit | Range / Preset | Überfällig, diese Woche, nächste Woche, Bereich |
| Volltextsuche | String | Suche in Titel und Notiztext |

**Gruppierung (wählbar):** Kontext, Priorität, Richtung, Status, Fälligkeit (Woche), Keine.

**Sortierung (wählbar):** Fälligkeit, Priorität, Erstelldatum, Letzte Änderung.

**Gespeicherte Views:**

- Filterkombination kann als Named View gespeichert werden
- Erscheint im linken Panel unter einer collapsible "Gespeicherte Views"-Sektion
- Bearbeitbar (Umbenennen, Filter ändern, Löschen)

### 3.4 System-Views (fest eingebaut)

| View | Logik |
|------|-------|
| **Inbox** | Alle Themen ohne zugewiesenen Kontext (`contexts` leer), Status ≠ `erledigt` |
| **Überfällig** | Alle Themen mit `due_date` < heute, Status ≠ `erledigt` |

Diese Views erscheinen immer oben im linken Panel mit Counter-Badge.

### 3.5 Detail-Panel (rechts)

**Metadaten-Bereich (oberer Teil):**

Alle Felder als Inline-Dropdowns / Inline-Edit direkt editierbar:

- Status (Dropdown)
- Priorität (Dropdown)
- Richtung (Dropdown)
- Fälligkeitsdatum (Date-Picker)
- Wiedervorlage-Datum (Date-Picker)
- Kontexte (Tag-Liste mit × zum Entfernen, + zum Hinzufügen mit Typeahead)

**Notiz-Bereich (unterer Teil):**

- Chronologische Updates, neuestes oben
- Jedes Update hat einen Datums-Header und einen Markdown-Body
- **"+ Update"-Button** erzeugt einen neuen Abschnitt mit aktuellem Datum, Cursor springt rein
- Markdown-Editor: einfaches WYSIWYG (Fett, Kursiv, Listen, Links, Code)
- Aktuelles (neuestes) Update hat visuell hervorgehobenen linken Rand (blau), ältere grau

**Aktions-Buttons (Footer):**

- "Erledigt" — Setzt Status auf `erledigt`, setzt `completed_at`
- "Wiedervorlage" — Setzt Status auf `follow-up`, optionaler Date-Picker für `follow_up_date`
- "Löschen" — Löscht die Datei (mit Bestätigungsdialog)

### 3.6 Agenda-Export

Verfügbar in der Kontextansicht über einen Button im Header des Mittelpanels.

**Generiert:**
- Markdown-formatierte Agenda
- Gruppiert nach Richtung (Ansprechen → Liefern → Warten)
- Pro Thema: Titel + letztes Update (gekürzt)
- Follow-Up-Themen markiert

**Ausgabe:**
- In die Zwischenablage kopieren (primär)
- Optional: Als Markdown-Datei speichern

**Beispiel-Output:**

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

### 3.7 Bulk-Operationen

Verfügbar über Checkboxen (erscheinen bei Hover oder per Toggle) in der Themenliste.

**Aktionen bei Multi-Select:**
- Kontext zuweisen / ändern
- Prio setzen
- Status ändern
- Richtung ändern
- Löschen (mit Bestätigung)

Primärer Use Case: Inbox aufräumen.

### 3.8 Kontextverwaltung

**Kontext anlegen:**
- Aus dem linken Panel ("+ Kontext anlegen")
- Aus der Inbox heraus (beim Zuweisen, wenn Kontext nicht existiert)
- Aus dem Detail-Panel (beim Hinzufügen eines Kontexts)
- Minimale Pflichtangaben: Name. Gruppe und Typ optional.

**Kontext bearbeiten:**
- Rechtsklick / Kontextmenü im linken Panel
- Name, Typ, Gruppenzugehörigkeit ändern

**Kontext löschen:**
- Nur möglich wenn keine aktiven Themen zugeordnet sind (oder mit expliziter Warnung)
- Themen verlieren die Kontext-Zuordnung (→ wandern in Inbox)

**Gruppen verwalten:**
- Anlegen, Umbenennen, Löschen, Reihenfolge per Drag & Drop
- Kontexte ohne Gruppe erscheinen unter "Ohne Gruppe"

### 3.9 Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| `⌘+Shift+T` (global) | Quick Capture Fenster (auch im Hintergrund) |
| `⌘+N` | Neues Thema im aktuellen Kontext |
| `⌘+Shift+N` | Neues Thema in Inbox (auch wenn Kontext aktiv) |
| `⌘+K` | Globale Suche / Command Palette |
| `⌘+Z` | Letzte Aktion rückgängig machen |
| `↑` / `↓` | Navigation in der Themenliste |
| `Enter` | Thema auswählen → Detail öffnen |
| `Escape` | Zurück / Panel schließen |
| `Tab` | Zwischen Panels wechseln |
| `⌘+1/2/3` | Prio setzen (Hoch / Mittel / Normal) |
| `⌘+E` | Status → Erledigt |
| `⌘+F` | Status → Follow-Up |
| `⌘+U` | Neues Update im Notizbereich anlegen |
| `⌘+Shift+A` | Agenda in Zwischenablage |
| `⌘+Shift+F` | Free View öffnen |

### 3.10 Suche

**Globale Suche (`⌘+K`):**
- Command-Palette-Stil (à la VS Code / Raycast)
- Sucht in: Themen-Titel, Notiztext, Kontext-Namen
- Ergebnisse als Schnellauswahl → springt direkt zum Thema im jeweiligen Kontext

**Free View Volltextsuche:**
- Filtert die aktuelle Ergebnisliste live

### 3.11 Recurring Topics

Für wiederkehrende Themen (z.B. "Projektstatus X" im wöchentlichen Team-Meeting).

**Verhalten:**
- Ein Thema kann als `recurring` markiert werden
- Wenn ein Recurring Topic auf "Erledigt" gesetzt wird, wird es automatisch nach einer konfigurierbaren Pause wieder auf Status `neu` gesetzt
- Der Recurring-Zyklus wird im Frontmatter definiert

**Frontmatter-Felder:**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `recurring` | Boolean | `true` wenn wiederkehrend |
| `recurring_interval` | Enum | `weekly`, `biweekly`, `monthly`, `quarterly` |
| `recurring_next` | Date | Nächstes Fälligkeitsdatum (wird automatisch berechnet) |

**Ablauf:**
1. Thema wird auf "Erledigt" gesetzt
2. System erkennt `recurring: true`
3. Neues Update wird automatisch angelegt: "— Erledigt am {Datum}, nächste Wiedervorlage {nächstes Datum} —"
4. Status wird auf `follow-up` gesetzt, `recurring_next` wird berechnet
5. Ab `recurring_next` erscheint das Thema wieder als aktiv

**UI:** Recurring Topics erhalten ein kleines Wiederkehr-Icon in der Themenliste.

### 3.12 Undo

Einfaches Undo für die letzte Aktion — kein vollständiger Undo-Stack.

**Unterstützte Aktionen:**
- Status-Änderung (z.B. versehentlich "Erledigt" geklickt)
- Prio-Änderung
- Richtungs-Änderung
- Kontext-Zuweisung / -Entfernung
- Löschen (stellt die Datei wieder her)

**Mechanik:**
- `⌘+Z` macht die letzte Aktion rückgängig
- Nur die allerletzten Aktion wird gespeichert (kein Multi-Step-Undo)
- Nach einer neuen Aktion verfällt das vorherige Undo
- Temporäre Speicherung des vorherigen Datei-Inhalts im Memory (kein Papierkorb-Konzept nötig)

**UI:** Nach einer Aktion erscheint kurzzeitig ein Toast/Snackbar: "Erledigt — [Rückgängig]" mit klickbarem Undo-Link. Verschwindet nach 5 Sekunden.

### 3.13 Kontext-Entfernung und Inbox-Rückfall

Wenn der letzte Kontext von einem Thema entfernt wird, wandert das Thema automatisch in die Inbox.

**Verhalten:**
- User entfernt letzten Kontext-Tag im Detail-Panel
- UI zeigt Hinweis: "Letzter Kontext entfernt — Thema ist jetzt in der Inbox"
- Thema erscheint sofort in der Inbox-Liste
- Thema verschwindet aus der Kontextansicht (falls gerade geöffnet)

### 3.14 Error Handling

**Fehlerquellen und UI-Reaktion:**

| Fehler | Reaktion |
|--------|----------|
| Markdown-Datei nicht lesbar / korrupt | Toast-Warnung mit Dateiname. Thema wird im Index als "fehlerhaft" markiert, in der Liste ausgegraut mit Hinweis. Andere Themen bleiben nutzbar. |
| YAML-Frontmatter ungültig | Wie korrupte Datei. Frontmatter-Fehler wird im Toast gezeigt. User kann die Datei manuell reparieren. |
| `contexts.yaml` nicht lesbar | Kritischer Fehler. Startbildschirm zeigt Fehlermeldung mit Pfad zur Datei. App startet im Notmodus (nur Inbox, keine Kontexte). |
| `contexts.yaml` Backup | Bei jedem erfolgreichen Schreiben wird eine Backup-Kopie `contexts.yaml.bak` angelegt. Bei Lese-Fehler wird automatisch das Backup versucht. |
| Datenverzeichnis nicht erreichbar | Kritischer Fehler. Dialog: "Datenverzeichnis nicht gefunden: {Pfad}. Bitte prüfen oder in den Einstellungen ändern." |
| Datei-Schreibfehler | Toast-Warnung: "Speichern fehlgeschlagen: {Grund}". Änderung bleibt im UI sichtbar, Retry nach 2 Sekunden. Nach 3 Fehlversuchen: persistente Warnung. |
| SQLite-Index korrupt | Automatischer Rebuild aus dem Filesystem. Toast: "Index wird neu aufgebaut..." Kein Datenverlust möglich da Index nur Cache ist. |
| Sync-Konflikt-Dateien | Warnung beim Start (nicht-blockierend). Liste der Konflikt-Dateien mit Links zum Öffnen im Dateimanager. |

**Toast/Notification-System:**
- Nicht-blockierende Benachrichtigungen am unteren Rand des Fensters
- Drei Stufen: Info (blau), Warnung (amber), Fehler (rot)
- Auto-Dismiss nach 5 Sekunden (Info) bzw. manuell schließen (Warnung/Fehler)
- Kritische Fehler bekommen einen persistenten Banner am oberen Fensterrand

---

## 4. UI-Konzept

### 4.1 Layout — Drei-Panel

```
┌──────────────────────────────────────────────────────┐
│  Cadence          [3 überfällig] [5 Inbox] ⌘K  │
├──────────┬─────────────────────┬─────────────────────┤
│ Kontexte │ Themenliste         │ Detail / Notizen    │
│          │                     │                     │
│ Inbox (5)│ [Gruppenkopf]       │ Titel               │
│ Überfällig│ □ Prio Status Titel│ Status  [Dropdown]  │
│          │ □ Prio Status Titel │ Prio    [Dropdown]  │
│ ─────── │                     │ Richtung [Dropdown] │
│ Gruppe A │ [Gruppenkopf]       │ Fällig  [Picker]    │
│  Kontext │ □ Prio Status Titel │ Kontexte [Tags]     │
│  Kontext │                     │                     │
│ ─────── │ [Erledigt ▶] (3)    │ ── Notizen ──────── │
│ Gruppe B │                     │ + Update            │
│  Kontext │                     │                     │
│ ─────── │                     │ 19.03.2026           │
│ Free View│                     │ │ Notiztext...       │
│ ▶ Views  │                     │                     │
│ ─────── │                     │ 14.03.2026           │
│ +Kontext │ [⌘N Quick-Add]      │ │ Notiztext...       │
│          │                     │                     │
│          │                     │ [Erledigt][Follow][X]│
└──────────┴─────────────────────┴─────────────────────┘
```

### 4.2 Linkes Panel — Kontext-Navigation

**Reihenfolge (top-down):**

1. System-Views: Inbox (mit Counter), Überfällig (mit Counter)
2. Trenner
3. Free View (fester Eintrag)
4. Gespeicherte Views (collapsible, mit Anzahl)
5. Trenner
6. Gruppen mit ihren Kontexten (jeweils mit Themen-Counter)
7. "Ohne Gruppe" Kontexte
8. Trenner
9. "+ Kontext anlegen"

### 4.3 Mittleres Panel — Themenliste

**Kontextansicht:**
- Header: Kontextname, Anzahl offene Themen, [Agenda]-Button, [+ Thema]-Button
- Gruppierung: Ansprechen → Liefern → Warten → Erledigt (collapsed)
- Innerhalb Gruppe: Prio-Sortierung, dann Fälligkeit, Drag & Drop für manuelle Reihenfolge
- Footer: Quick-Add-Feld

**Free View:**
- Header: Filterleiste (Suchfeld, aktive Filter-Chips, Filter-Dropdowns, Gruppierung)
- Ergebniszähler
- Gruppierte Liste nach gewählter Dimension

### 4.4 Rechtes Panel — Detail

- Metadaten als kompaktes Grid mit Inline-Edits
- Notizen als chronologischer Feed (neueste oben)
- Aktions-Footer (Erledigt, Wiedervorlage, Löschen)

### 4.5 Besondere UI-Zustände

**Empty States:**

| Zustand | Anzeige |
|---------|---------|
| Kontext ohne offene Themen | "Keine offenen Themen." + Link zum Erledigt-Abschnitt mit Anzahl ("X erledigte Themen") |
| Inbox leer | "Alles aufgeräumt." |
| Free View ohne Ergebnisse | "Keine Themen für diese Filter." + "Filter zurücksetzen"-Link |
| Kein Thema ausgewählt | Rechtes Panel zeigt Hinweis: "Thema auswählen" |

**Überfällig-Markierung:**
- Fälligkeitsdatum in Rot
- Optional: Zeile bekommt subtilen roten linken Rand

**"Wartet seit X Tagen":**
- Wird bei Richtung `warten` automatisch berechnet (ab letztem Update oder Erstelldatum)
- In Warnfarbe (Amber) ab 7 Tagen, Rot ab 14 Tagen

---

## 5. Technische Architektur

### 5.1 Tech-Stack

| Komponente | Technologie | Begründung |
|------------|-------------|------------|
| **Runtime** | Electron | Gesamter Stack in TypeScript, maximale Produktivität mit Claude Code, riesiges Ökosystem, stabil dokumentiert |
| **Frontend** | React + TypeScript | Bewährtes Ökosystem, schnelle Iteration |
| **Styling** | Tailwind CSS | Utility-first, konsistentes Design |
| **Markdown-Editor** | TipTap | WYSIWYG mit Markdown-Serialisierung, aktiv gepflegt, gute Plugin-Architektur |
| **Index/Cache** | SQLite via `better-sqlite3` | Schnelle synchrone Abfragen, Read-Only-Cache, nativer Node-Zugriff |
| **Dateisystem-Watching** | chokidar | Bewährtes File-Watching für Node.js, Cross-Platform |
| **Build/Bundle** | electron-builder | Standard-Tooling für Electron-Distribution (Win/Mac) |
| **IPC** | Electron IPC (contextBridge) | Sicherer Kommunikationskanal zwischen Main und Renderer Process |

### 5.2 Datenfluss

```
Markdown-Dateien (Source of Truth)
        │
        ▼
   File Watcher ──────────────────┐
        │                         │
        ▼                         ▼
  YAML/Frontmatter Parser    SQLite Index
        │                    (Read-Cache)
        ▼                         │
   In-Memory State ◄──────────────┘
        │
        ▼
    React UI
        │
        ▼ (User-Aktion)
   Write to Markdown-Datei
        │
        ▼
   File Watcher triggert Index-Update
```

**Prinzipien:**

- **Filesystem → Index:** Beim Start wird der gesamte `topics/`-Ordner geparst und in SQLite indiziert. File-Watcher aktualisiert den Index bei Änderungen.
- **Index → UI:** Alle Abfragen (Kontextansicht, Filter, Suche) laufen gegen den SQLite-Index für Performance.
- **UI → Filesystem:** Jede Änderung (Status, Prio, neues Update) schreibt direkt in die Markdown-Datei. Der File-Watcher aktualisiert dann den Index.
- **Kein Sync-Problem:** Der Index ist jederzeit aus dem Filesystem reproduzierbar. Bei Inkonsistenz: Index löschen, neu aufbauen.

### 5.3 Sync-Konflikt-Erkennung

Wenn das Datenverzeichnis in einem Cloud-Sync-Ordner liegt (OneDrive, iCloud, Dropbox):

- Beim Start: Scan auf Konflikt-Dateien (Pattern: `* (Konflikt)*`, `* (conflict)*`, `*.sync-conflict-*`)
- Bei Fund: Warnung anzeigen mit Liste der betroffenen Dateien
- Keine automatische Auflösung — User entscheidet

### 5.4 Obsidian-Koexistenz

**Strategie: Shared Filesystem, getrennte Verantwortung.**

- Das Cadence-Datenverzeichnis kann ein Unterordner eines Obsidian-Vaults sein (konfigurierbar)
- Cadence ist **Master** für: Frontmatter, Dateistruktur, Dateinamen, `contexts.yaml`, `saved-views.yaml`
- Obsidian darf: Lesen, Verlinken (`[[Topic-Titel]]`), Suchen, Graph-View nutzen
- Obsidian sollte nicht: Frontmatter-Felder ändern (kann zu Inkonsistenzen führen)

**Empfohlene Obsidian-Konfiguration:**

- Cadence-Ordner als Subfolder im Vault
- Obsidian-Templates für manuelle Notizen die auf Topics verlinken
- Tags in Obsidian können Cadence-Kontexte referenzieren

**Mobile-Zugriff:** Über Obsidian Mobile als Read-Only-Layer (Suche, Lesen, Verlinkung). Keine Bearbeitung von Frontmatter über Obsidian empfohlen.

---

## 6. Einstellungen

| Einstellung | Beschreibung | Default |
|-------------|--------------|---------|
| Datenverzeichnis | Pfad zum `data/`-Ordner | `~/Cadence/` |
| Global Hotkey | Tastenkombination für Quick Capture | `⌘+Shift+T` (Mac) / `Ctrl+Shift+T` (Win) |
| Standard-Priorität | Default-Prio für neue Themen | `normal` |
| Erledigt-Bestätigung | Dialog vor "Erledigt"-Markierung | Aus |
| Löschen-Bestätigung | Dialog vor Löschen | An |
| Wartet-Warnung | Ab wie vielen Tagen Wartezeit farblich warnen | 7 Tage (Amber), 14 Tage (Rot) |
| Obsidian-Modus | Frontmatter mit Obsidian-kompatiblen Feldern anreichern | Aus |

---

## 7. Priorisierung

### Phase 1 — MVP

- Drei-Panel-Layout
- Themen CRUD (Erstellen, Lesen, Bearbeiten, Löschen)
- Kontexte verwalten (CRUD, Gruppen)
- Kontextansicht mit Richtungsgruppierung
- Inline-Editing aller Felder
- Notizen mit Update-Funktion
- Inbox und Überfällig System-Views
- Quick Capture (`⌘N` im Kontext, `⌘+Shift+N` für Inbox)
- Markdown-Dateien als Storage (Slug-Dateinamen)
- SQLite Index mit File-Watcher
- Keyboard-Navigation (Basics)
- Erledigt-Abschnitt in Kontextansicht (limitiert auf 20, "Mehr laden")
- Undo für letzte Aktion (`⌘+Z` mit Toast/Snackbar)
- Kontext-Entfernung → Inbox-Rückfall mit Hinweis
- Error Handling (Toast-System, korrupte Dateien, contexts.yaml Backup)
- Slug-basierte Dateinamen (menschenlesbar, Obsidian-kompatibel)
- Dark Mode (System-Theme-Detection via Electron nativeTheme)
- Empty States (leere Kontexte, leere Inbox, kein Thema ausgewählt)

### Phase 2 — Power Features

- Free View mit Filtern und Gruppierung
- Gespeicherte Views
- Agenda-Export
- Globaler Hotkey (Quick Capture im Hintergrund)
- Globale Suche / Command Palette (`⌘K`)
- Bulk-Operationen
- Drag & Drop Sortierung
- Vollständige Keyboard Shortcuts
- Recurring Topics
- Bilder im Notizteil (Paste aus Zwischenablage)

### Phase 3 — Polish & Integration

- Obsidian-Koexistenz (kompatibles Frontmatter, Vault-Konfiguration)
- Sync-Konflikt-Erkennung
- Einstellungs-Dialog
- Onboarding (Erststart-Erlebnis, Willkommensbildschirm)
- Performance-Optimierung für große Datenmengen (500+ Themen)

---

## 8. Entschiedene Designfragen

| # | Frage | Entscheidung |
|---|-------|-------------|
| 1 | Bilder im Notizteil | **Ja.** Paste aus Zwischenablage unterstützen. Bilder werden im Datenverzeichnis unter `data/attachments/{topic-id}/` abgelegt und im Markdown als relativer Pfad referenziert (`![](../attachments/{topic-id}/img-001.png)`). |
| 2 | Aktivitätslog | **Nein.** Kein Changelog im Frontmatter. Die chronologischen Updates im Notizteil reichen als Historie. |
| 3 | Move vs. Multi-Assign | **Multi-Assign.** Themen können mehreren Kontexten gleichzeitig zugeordnet sein. Kein explizites "Verschieben" nötig. |
| 4 | Wiedervorlage ohne Datum | **Erscheint immer** wenn der zugehörige Kontext geöffnet wird, visuell prominent markiert ("Follow-Up — beim letzten Mal vertagt"). Wiedervorlage mit Datum erscheint erst ab dem gesetzten Datum prominent. |
| 5 | Dark Mode | **Ja.** System-Theme-Detection (Electron `nativeTheme` API). Kein manueller Toggle nötig, System-Einstellung wird übernommen. |
| 6 | Recurring Topics | **Ja, Phase 2.** Siehe Abschnitt 3.11. |
| 7 | Dateinamen | **Slug-from-Title** (`profinet-testkonzept-review.md`). Menschenlesbar im Filesystem und in Obsidian. Bei Titel-Umbenennung wird die Datei umbenannt. |
| 8 | Quick Capture im Meeting | **Zwei Modi:** `⌘N` = aktueller Kontext, `⌘+Shift+N` = Inbox. Zusätzlich Kontext-Override per Typeahead im Quick-Add-Feld. |
| 9 | Undo | **Ja, einfach.** Letzte Aktion rückgängig per `⌘+Z`. Kein Multi-Step-Undo. Toast mit "Rückgängig"-Link nach jeder Aktion. |
| 10 | Erledigt-Skalierung | **Limitiert auf 20 Einträge** mit "Mehr laden"-Button. Verhindert Performance-Probleme bei langer Nutzung. |
