# Cadence — User Stories

## Übersicht

Dieses Dokument steuert die Implementierung. Jede User Story liefert einen nutzbaren Mehrwert und ist ein eigenständiger Auftrag an Claude Code. Stories bauen aufeinander auf — die Reihenfolge ist verbindlich.

**Referenz-Dokumente:**
- `REQUIREMENTS.md` — Was gebaut wird (Features, Datenmodell, UI)
- `ARCHITECTURE.md` — Wie es technisch umgesetzt wird (Stack, Typen, Datenfluss)
- `CLAUDE.md` — Coding-Konventionen und Regeln
- `VISION.md` — Designprinzipien für Entscheidungen

**Prompt-Pattern für Claude Code:**

```
Lies VISION.md, REQUIREMENTS.md, ARCHITECTURE.md und CLAUDE.md.
Setze dann User Story [US-XX] aus USER-STORIES.md um.
Die relevanten Abschnitte sind dort referenziert.
```

---

## Phase 1 — MVP

### US-01: Projekt-Grundgerüst

**Als** Entwickler
**möchte ich** ein lauffähiges Electron-Projekt mit dem Drei-Panel-Layout starten können,
**damit** die Basis für alle weiteren Stories steht.

**Akzeptanzkriterien:**
- [ ] `npm run dev` startet die Electron-App mit Hot Reload
- [ ] Drei-Panel-Layout ist sichtbar (links, mitte, rechts) mit Platzhalter-Inhalten
- [ ] TopBar mit App-Name "Cadence" ist sichtbar
- [ ] Tailwind CSS funktioniert (verifizierbar an gestylten Platzhaltern)
- [ ] IPC-Grundstruktur existiert: `preload/index.ts`, `shared/ipc-channels.ts`, `shared/types.ts`
- [ ] `electron-rebuild` ist im `postinstall`-Script
- [ ] Dark Mode reagiert auf System-Theme (heller/dunkler Hintergrund)
- [ ] Projektstruktur entspricht ARCHITECTURE.md Abschnitt 2

**Referenzen:** ARCHITECTURE.md §1, §2, §10; REQUIREMENTS.md §4.1; CLAUDE.md Tech-Stack

---

### US-02: Markdown-Dateien lesen und indizieren

**Als** Entwickler
**möchte ich** Markdown-Dateien mit Frontmatter parsen und in SQLite indizieren können,
**damit** die Datengrundlage für alle UI-Features steht.

**Akzeptanzkriterien:**
- [ ] `shared/types.ts` enthält alle Interfaces aus ARCHITECTURE.md §6
- [ ] `shared/markdown.ts` kann Frontmatter + Body parsen und serialisieren
- [ ] `slug-service.ts` konvertiert Titel zu Dateinamen (Umlaute, Sonderzeichen)
- [ ] `file-store.ts` liest/schreibt Markdown-Dateien mit atomaren Writes (temp+rename)
- [ ] `index-db.ts` erstellt SQLite-Schema (ARCHITECTURE.md §5), indiziert Topics
- [ ] `file-watcher.ts` erkennt Dateiänderungen und aktualisiert den Index
- [ ] File-Watcher hat Debouncing für eigene Writes (kein Ping-Pong)
- [ ] 4-5 manuell erstellte Test-Dateien unter `data/topics/` werden korrekt indiziert
- [ ] Roundtrip-Test: Datei lesen → parsen → serialisieren → Byte-Vergleich ist stabil

**Referenzen:** ARCHITECTURE.md §5, §6, §7; REQUIREMENTS.md §2.1; CLAUDE.md Dateisystem, SQLite

---

### US-03: Kontexte verwalten

**Als** Nutzer
**möchte ich** Kontexte (Personen, Meetings, Gruppen) anlegen und im linken Panel sehen,
**damit** ich meine Gesprächspartner und Meetings organisieren kann.

**Akzeptanzkriterien:**
- [ ] `contexts.yaml` wird gelesen und geschrieben (mit `.bak`-Backup bei jedem Save)
- [ ] Linkes Panel zeigt Kontexte gruppiert nach Gruppen (REQUIREMENTS.md §4.2)
- [ ] Kontexte ohne Gruppe erscheinen unter "Ohne Gruppe"
- [ ] Neuen Kontext anlegen über "+ Kontext anlegen" (minimal: nur Name)
- [ ] Kontext umbenennen und löschen über Rechtsklick/Kontextmenü
- [ ] Gruppen anlegen, umbenennen, löschen
- [ ] Jeder Kontext zeigt einen Counter mit Anzahl offener Themen
- [ ] Fehlerbehandlung: Wenn `contexts.yaml` korrupt ist, wird Backup geladen

**Referenzen:** REQUIREMENTS.md §2.2, §3.8; ARCHITECTURE.md §6 (Context, ContextGroup)

---

### US-04: Themen im Kontext anzeigen

**Als** Nutzer
**möchte ich** beim Klick auf einen Kontext alle zugehörigen Themen sehen, gruppiert nach Richtung,
**damit** ich sofort weiß was ich ansprechen, liefern und verfolgen muss.

**Akzeptanzkriterien:**
- [ ] Klick auf Kontext im linken Panel lädt Topics für diesen Kontext
- [ ] Mittleres Panel zeigt Topics gruppiert: Ansprechen → Liefern → Warten → Erledigt
- [ ] Erledigt-Abschnitt ist collapsed by default, expandierbar, limitiert auf 20 Einträge mit "Mehr laden"
- [ ] Innerhalb jeder Gruppe: Sortierung nach Prio (hoch → normal), dann Fälligkeit
- [ ] Jede Zeile zeigt: Prio-Badge, Status-Badge, Titel, Fälligkeit, "Wartet seit X Tagen"
- [ ] Follow-Up-Themen sind visuell hervorgehoben
- [ ] Überfällige Themen haben rotes Fälligkeitsdatum
- [ ] "Wartet seit X Tagen" zeigt Amber ab 7 Tagen, Rot ab 14 Tagen
- [ ] Header zeigt Kontextname und Anzahl offener Themen

**Referenzen:** REQUIREMENTS.md §3.2, §4.3, §4.5

---

### US-05: Thema erstellen

**Als** Nutzer
**möchte ich** schnell ein neues Thema erfassen können,
**damit** mir nichts entgeht — auch mitten im Meeting.

**Akzeptanzkriterien:**
- [ ] `⌘N` erstellt ein neues Thema im aktiven Kontext (Titel-Feld mit Autofokus)
- [ ] `⌘+Shift+N` erstellt ein neues Thema in der Inbox (auch wenn Kontext aktiv)
- [ ] Quick-Add-Feld am unteren Rand des Mittelpanels, immer sichtbar
- [ ] Quick-Add-Feld hat optionalen Kontext-Override per Typeahead
- [ ] Neues Thema: nur Titel ist Pflicht, Rest bekommt Defaults (REQUIREMENTS.md §2.1)
- [ ] Markdown-Datei wird mit Slug-Dateinamen erstellt
- [ ] Thema erscheint sofort in der Liste ohne Reload

**Referenzen:** REQUIREMENTS.md §3.1; ARCHITECTURE.md §7 (Serialisierung)

---

### US-06: Thema im Detail bearbeiten

**Als** Nutzer
**möchte ich** alle Eigenschaften eines Themas direkt im Detail-Panel editieren können,
**damit** ich ohne Umwege Prio, Status, Richtung und Kontexte anpassen kann.

**Akzeptanzkriterien:**
- [ ] Klick auf Thema zeigt Detail-Panel rechts
- [ ] Status editierbar per Dropdown (neu, follow-up, erledigt)
- [ ] Priorität editierbar per Dropdown (hoch, mittel, normal)
- [ ] Richtung editierbar per Dropdown (ansprechen, liefern, warten)
- [ ] Fälligkeitsdatum editierbar per Date-Picker
- [ ] Wiedervorlage-Datum editierbar per Date-Picker
- [ ] Kontexte als Tag-Liste: × zum Entfernen, + zum Hinzufügen (Typeahead)
- [ ] Entfernen des letzten Kontexts → Thema wandert in Inbox, Hinweis wird angezeigt
- [ ] Alle Änderungen schreiben sofort in die Markdown-Datei (kein Save-Button)
- [ ] Bei Titel-Änderung: Datei wird umbenannt (Slug-Update)

**Referenzen:** REQUIREMENTS.md §3.5, §3.13; ARCHITECTURE.md §4.2 (Datenfluss Schreiben)

---

### US-07: Notizen mit Updates

**Als** Nutzer
**möchte ich** chronologische Notizen zu einem Thema führen und neue Updates per Knopfdruck hinzufügen,
**damit** ich den Verlauf eines Themas nachvollziehen kann.

**Akzeptanzkriterien:**
- [ ] Detail-Panel zeigt Notizen als chronologischen Feed (neuestes oben)
- [ ] Jedes Update hat Datums-Header und Markdown-Body
- [ ] "+ Update"-Button erstellt neuen Abschnitt mit aktuellem Datum, Cursor springt rein
- [ ] `⌘+U` als Shortcut für neues Update
- [ ] TipTap-Editor für WYSIWYG-Markdown (Fett, Kursiv, Listen, Links, Code)
- [ ] Nur der aktive Update-Block wird durch TipTap editiert, Rest bleibt Raw-Markdown
- [ ] Neuestes Update hat blauen linken Rand, ältere haben grauen Rand
- [ ] Änderungen werden in die Markdown-Datei geschrieben

**Referenzen:** REQUIREMENTS.md §3.5 (Notiz-Bereich); CLAUDE.md TipTap/Markdown

**Achtung:** Vor der Implementierung einen Roundtrip-Spike durchführen (CLAUDE.md, Abschnitt TipTap/Markdown). Wenn die Roundtrip-Qualität nicht stimmt, Alternative evaluieren (z.B. CodeMirror).

---

### US-08: Inbox und Überfällig

**Als** Nutzer
**möchte ich** eine Inbox für noch nicht zugeordnete Themen und eine Überfällig-Ansicht haben,
**damit** nichts verloren geht und ich Dringliches sofort sehe.

**Akzeptanzkriterien:**
- [ ] "Inbox" im linken Panel zeigt alle Themen ohne Kontext (status ≠ erledigt)
- [ ] "Überfällig" im linken Panel zeigt alle Themen mit Fälligkeit < heute (status ≠ erledigt)
- [ ] Beide Views haben Counter-Badges im linken Panel
- [ ] Badges sind auch in der TopBar sichtbar (immer, egal welcher Kontext aktiv)
- [ ] In der Inbox können Themen Kontexte zugewiesen werden (→ verschwinden aus Inbox)
- [ ] Überfällig-View zeigt Themen mit roter Fälligkeitsmarkierung

**Referenzen:** REQUIREMENTS.md §3.4, §4.2, §4.5 (Empty States)

---

### US-09: Thema erledigen, Follow-Up, Löschen

**Als** Nutzer
**möchte ich** Themen abschließen, auf Wiedervorlage setzen oder löschen können,
**damit** mein System sauber bleibt.

**Akzeptanzkriterien:**
- [ ] "Erledigt"-Button setzt Status auf `erledigt` und `completed_at`
- [ ] `⌘+E` als Shortcut
- [ ] Erledigtes Thema wandert in den Erledigt-Abschnitt
- [ ] "Wiedervorlage"-Button setzt Status auf `follow-up`, optionaler Date-Picker
- [ ] `⌘+F` als Shortcut
- [ ] Wiedervorlage ohne Datum: erscheint beim nächsten Öffnen des Kontexts
- [ ] Wiedervorlage mit Datum: erscheint erst ab dem Datum prominent
- [ ] "Löschen"-Button mit Bestätigungsdialog (konfigurierbar)
- [ ] Löschen entfernt die Markdown-Datei und den Attachments-Ordner

**Referenzen:** REQUIREMENTS.md §3.5 (Aktions-Buttons), §8 (Designfrage 4)

---

### US-10: Undo

**Als** Nutzer
**möchte ich** meine letzte Aktion rückgängig machen können,
**damit** ein versehentlicher Klick kein Problem ist.

**Akzeptanzkriterien:**
- [ ] Nach jeder Statusänderung, Prio-Änderung, Löschung: Toast erscheint am unteren Rand
- [ ] Toast zeigt: "Status → Erledigt — [Rückgängig]" (Beispiel)
- [ ] Klick auf "Rückgängig" oder `⌘+Z` macht die letzte Aktion rückgängig
- [ ] Toast verschwindet nach 5 Sekunden automatisch
- [ ] Nur die letzte Aktion wird gespeichert (kein Multi-Step-Undo)
- [ ] Undo bei Löschen stellt die Datei wieder her
- [ ] `undo-service.ts` speichert vorherigen Datei-Inhalt im Memory

**Referenzen:** REQUIREMENTS.md §3.12

---

### US-11: Keyboard-Navigation

**Als** Nutzer
**möchte ich** das Tool vollständig per Tastatur bedienen können,
**damit** ich effizient arbeiten kann ohne zur Maus greifen zu müssen.

**Akzeptanzkriterien:**
- [ ] `↑`/`↓` navigiert durch die Themenliste
- [ ] `Enter` öffnet das ausgewählte Thema im Detail-Panel
- [ ] `Escape` schließt das Detail-Panel / geht zurück
- [ ] `Tab` wechselt zwischen Panels
- [ ] `⌘+1/2/3` setzt Prio (Hoch/Mittel/Normal)
- [ ] Alle Shortcuts aus REQUIREMENTS.md §3.9 sind implementiert
- [ ] Aktiver Listeneintrag ist visuell hervorgehoben

**Referenzen:** REQUIREMENTS.md §3.9 (vollständige Shortcut-Tabelle)

---

### US-12: Error Handling und Robustheit

**Als** Nutzer
**möchte ich** dass die App auch bei korrupten Dateien oder fehlenden Ordnern stabil läuft,
**damit** ich meinen Daten vertrauen kann.

**Akzeptanzkriterien:**
- [ ] Toast/Notification-System: Info (blau), Warnung (amber), Fehler (rot)
- [ ] Auto-Dismiss nach 5 Sekunden für Info, manuell schließen für Warnung/Fehler
- [ ] Korrupte Markdown-Datei: Warnung, Thema ausgegraut, App läuft weiter
- [ ] Korrupte `contexts.yaml`: Backup wird geladen, Warnung angezeigt
- [ ] Datenverzeichnis nicht erreichbar: Kritischer Fehler-Dialog mit Pfadangabe
- [ ] SQLite-Index korrupt: automatischer Rebuild, Toast "Index wird neu aufgebaut..."
- [ ] Kritische Fehler bekommen persistenten Banner am oberen Fensterrand

**Referenzen:** REQUIREMENTS.md §3.14

---

## Phase 2 — Power Features

### US-13: Free View mit Filtern

**Als** Nutzer
**möchte ich** kontextübergreifend alle Themen filtern und gruppieren können,
**damit** ich analytische Fragen beantworten kann wie "Worauf warte ich überall?"

**Akzeptanzkriterien:**
- [ ] "Free View" als eigener Eintrag im linken Panel
- [ ] Filter-Dimensionen: Kontext (Multi), Status (Multi), Richtung (Multi), Prio (Multi), Fälligkeit (Range), Volltextsuche
- [ ] Aktive Filter als Chips mit × zum Entfernen
- [ ] Gruppierung wählbar: Kontext, Prio, Richtung, Status, Keine
- [ ] Sortierung wählbar: Fälligkeit, Prio, Erstelldatum, letzte Änderung
- [ ] Ergebniszähler sichtbar
- [ ] "Alle zurücksetzen"-Link

**Referenzen:** REQUIREMENTS.md §3.3, §4.3 (Free View)

---

### US-14: Gespeicherte Views

**Als** Nutzer
**möchte ich** häufig genutzte Filter-Kombinationen als Views speichern,
**damit** ich mit einem Klick meine wichtigsten Perspektiven aufrufen kann.

**Akzeptanzkriterien:**
- [ ] Aktuelle Filter-Kombination als Named View speichern
- [ ] Gespeicherte Views erscheinen im linken Panel unter collapsible Sektion
- [ ] Views bearbeitbar (Umbenennen, Filter ändern, Löschen)
- [ ] Gespeichert in `saved-views.yaml`
- [ ] Klick auf gespeicherten View aktiviert Free View mit den gespeicherten Filtern

**Referenzen:** REQUIREMENTS.md §2.3, §3.3 (Gespeicherte Views)

---

### US-15: Agenda-Export

**Als** Nutzer
**möchte ich** aus einem Kontext eine Agenda generieren und in die Zwischenablage kopieren,
**damit** ich vorbereitet ins Meeting gehe.

**Akzeptanzkriterien:**
- [ ] "Agenda"-Button im Header des Mittelpanels (Kontextansicht)
- [ ] `⌘+Shift+A` als Shortcut
- [ ] Generiertes Markdown: gruppiert nach Richtung, mit Titel + letztem Update
- [ ] Format entspricht Beispiel in REQUIREMENTS.md §3.6
- [ ] Kopiert in Zwischenablage, Toast bestätigt "Agenda kopiert"

**Referenzen:** REQUIREMENTS.md §3.6

---

### US-16: Globaler Hotkey und Quick-Capture-Fenster

**Als** Nutzer
**möchte ich** auch wenn Cadence im Hintergrund ist per Hotkey ein Thema erfassen,
**damit** ich aus jedem Kontext heraus nichts vergesse.

**Akzeptanzkriterien:**
- [ ] `⌘+Shift+T` (konfigurierbar) öffnet minimales Capture-Fenster
- [ ] Fenster: frameless, zentriert, ~400x150px
- [ ] Titel-Feld mit Autofokus
- [ ] Optionales Kontext-Feld mit Typeahead
- [ ] Enter = Speichern + Schließen, Escape = Abbrechen
- [ ] Ohne Kontext → Inbox

**Referenzen:** REQUIREMENTS.md §3.1; ARCHITECTURE.md §9

---

### US-17: Globale Suche / Command Palette

**Als** Nutzer
**möchte ich** per `⌘+K` über alle Themen, Kontexte und Notizen suchen können,
**damit** ich alles sofort finde.

**Akzeptanzkriterien:**
- [ ] `⌘+K` öffnet Command-Palette (VS Code / Raycast Stil)
- [ ] Sucht in: Themen-Titel, Notiztext, Kontext-Namen (via SQLite FTS5)
- [ ] Ergebnisse als Schnellauswahl-Liste
- [ ] Auswahl springt direkt zum Thema im jeweiligen Kontext
- [ ] Escape schließt die Palette

**Referenzen:** REQUIREMENTS.md §3.10; ARCHITECTURE.md §5 (FTS5)

---

### US-18: Bulk-Operationen

**Als** Nutzer
**möchte ich** mehrere Themen gleichzeitig bearbeiten können,
**damit** ich die Inbox effizient aufräumen kann.

**Akzeptanzkriterien:**
- [ ] Checkboxen erscheinen bei Hover oder per Toggle in der Themenliste
- [ ] Multi-Select: Kontext zuweisen, Prio setzen, Status ändern, Richtung ändern, Löschen
- [ ] Bulk-Toolbar erscheint bei aktiver Multi-Selection
- [ ] Löschen mit Bestätigung

**Referenzen:** REQUIREMENTS.md §3.7

---

### US-19: Drag & Drop Sortierung

**Als** Nutzer
**möchte ich** Themen innerhalb einer Richtungsgruppe per Drag & Drop umsortieren können,
**damit** ich die Gesprächsreihenfolge für ein Meeting festlegen kann.

**Akzeptanzkriterien:**
- [ ] Themen innerhalb einer Gruppe (Ansprechen/Liefern/Warten) sind per Drag & Drop sortierbar
- [ ] Reihenfolge wird im Frontmatter als `sort_order` gespeichert
- [ ] Manuelle Reihenfolge hat Vorrang vor Prio-Sortierung

**Referenzen:** REQUIREMENTS.md §3.2

---

### US-20: Recurring Topics

**Als** Nutzer
**möchte ich** wiederkehrende Themen definieren können,
**damit** regelmäßige Statusabfragen automatisch wieder auftauchen.

**Akzeptanzkriterien:**
- [ ] Thema kann als `recurring` markiert werden (Toggle im Detail-Panel)
- [ ] Intervall wählbar: wöchentlich, zweiwöchentlich, monatlich, quartalsweise
- [ ] Bei "Erledigt": automatisches Update, Status → follow-up, `recurring_next` berechnet
- [ ] Ab `recurring_next` erscheint das Thema wieder als aktiv
- [ ] Wiederkehr-Icon in der Themenliste

**Referenzen:** REQUIREMENTS.md §3.11

---

### US-21: Bilder im Notizteil

**Als** Nutzer
**möchte ich** Screenshots und Bilder in den Notizteil einfügen können,
**damit** ich visuelle Informationen direkt am Thema festhalten kann.

**Akzeptanzkriterien:**
- [ ] Paste aus Zwischenablage fügt Bild ein
- [ ] Bild wird unter `data/attachments/{topic-slug}/` gespeichert
- [ ] Markdown-Referenz als relativer Pfad
- [ ] Bild wird im TipTap-Editor inline angezeigt
- [ ] Bei Titel-Umbenennung wird der Attachments-Ordner mitumbenannt

**Referenzen:** REQUIREMENTS.md §8 (Designfrage 1)

---

## Phase 3 — Polish & Integration

### US-22: Obsidian-Koexistenz

**Als** Nutzer
**möchte ich** das Cadence-Datenverzeichnis als Teil meines Obsidian-Vaults nutzen können,
**damit** ich über Obsidian suchen, verlinken und mobil zugreifen kann.

**Akzeptanzkriterien:**
- [ ] Datenverzeichnis ist als Obsidian-Subfolder konfigurierbar
- [ ] Obsidian-Modus in Einstellungen: ergänzt Frontmatter um `aliases` (lesbarer Titel)
- [ ] Slug-Dateinamen funktionieren in Obsidian-Links
- [ ] Externe Änderungen am Body (via Obsidian) werden korrekt erkannt und indiziert
- [ ] Frontmatter-Änderungen via Obsidian werden toleriert (kein Crash), aber gewarnt

**Referenzen:** REQUIREMENTS.md §5.4

---

### US-23: Sync-Konflikt-Erkennung

**Als** Nutzer
**möchte ich** beim Start gewarnt werden wenn Cloud-Sync-Konflikte existieren,
**damit** ich keine Daten verliere.

**Akzeptanzkriterien:**
- [ ] Beim Start: Scan auf Konflikt-Dateien (Pattern aus REQUIREMENTS.md §5.3)
- [ ] Warnung mit Liste der betroffenen Dateien
- [ ] Links zum Öffnen im Dateimanager
- [ ] Nicht-blockierend (App bleibt nutzbar)

**Referenzen:** REQUIREMENTS.md §5.3

---

### US-24: Einstellungs-Dialog

**Als** Nutzer
**möchte ich** Cadence konfigurieren können,
**damit** das Tool zu meinem Workflow passt.

**Akzeptanzkriterien:**
- [ ] Einstellungs-Dialog über Menü oder Shortcut
- [ ] Alle Einstellungen aus REQUIREMENTS.md §6 sind konfigurierbar
- [ ] Einstellungen werden persistent gespeichert
- [ ] Datenverzeichnis-Pfad änderbar mit Validierung

**Referenzen:** REQUIREMENTS.md §6

---

### US-25: Performance-Optimierung

**Als** Nutzer mit 500+ Themen
**möchte ich** dass Cadence schnell bleibt,
**damit** das Tool auch nach einem Jahr intensiver Nutzung flüssig läuft.

**Akzeptanzkriterien:**
- [ ] Kontextansicht lädt in < 100ms (auch bei 500+ Topics im Index)
- [ ] Free View mit komplexen Filtern lädt in < 200ms
- [ ] Virtualisierte Listen falls nötig (nur sichtbare Zeilen rendern)
- [ ] SQLite-Queries optimiert (EXPLAIN QUERY PLAN prüfen)
- [ ] File-Watcher erzeugt keine spürbaren UI-Freezes

**Referenzen:** ARCHITECTURE.md §5 (Indizes)

# Cadence — Neue User Stories: Datenverzeichnis-Management

Diese Stories erweitern die bestehende USER-STORIES.md und gehören thematisch zu **Phase 1 — MVP** (nachträglich), da sie eine Grundvoraussetzung für die Nutzung sind.

**Prompt-Pattern für Claude Code:**

```
Lies VISION.md, REQUIREMENTS.md, ARCHITECTURE.md und CLAUDE.md.
Setze dann User Story [US-XX] aus USER-STORIES.md um.
Die relevanten Abschnitte sind dort referenziert.
```

---

## US-26: Startup — Datenverzeichnis Auswahl und Validierung

**Als** Nutzer
**möchte ich** beim Start von Cadence automatisch mein letztes Datenverzeichnis öffnen — oder bei Erststart eines auswählen,
**damit** ich sofort arbeiten kann ohne jedes Mal den Pfad konfigurieren zu müssen.

### Definitionen

Ein Datenverzeichnis ist **gültig** wenn:
- Der Pfad existiert und lesbar ist
- Eine `contexts/contexts.yaml` vorhanden ist (darf leer sein)
- Ein `topics/`-Unterordner existiert

Ein Datenverzeichnis ist **initialisierbar** wenn:
- Der Pfad existiert und beschreibbar ist
- Es entweder leer ist oder keines der Cadence-Unterverzeichnisse enthält (kein versehentliches Überschreiben)

### Startup-Flow

```
App startet
  │
  ├─ Gespeicherter Pfad vorhanden?
  │   ├─ Ja → Pfad gültig?
  │   │        ├─ Ja → Öffnen, fertig
  │   │        └─ Nein → Pfad erreichbar aber ungültig?
  │   │                  ├─ Ja → Dialog: "Verzeichnis einrichten oder anderes wählen?"
  │   │                  └─ Nein (nicht erreichbar) → Fehler-Dialog mit Pfadangabe,
  │   │                         "Anderes Verzeichnis wählen"
  │   └─ Nein (Erststart) → Welcome-Screen
  │
  Welcome-Screen:
    ├─ "Neues Datenverzeichnis einrichten" → Ordner-Auswahl → Initialisierung → Öffnen
    └─ "Bestehendes Datenverzeichnis öffnen" → Ordner-Auswahl → Validierung → Öffnen
```

### Akzeptanzkriterien

- [ ] Erststart (kein gespeicherter Pfad): Welcome-Screen mit "Neu einrichten" und "Bestehendes öffnen"
- [ ] "Neu einrichten": OS-Ordnerauswahl-Dialog, gewählter Ordner wird initialisiert (Unterordner `topics/`, `archive/`, `contexts/`, `views/`, `trash/` anlegen, leere `contexts/contexts.yaml` erstellen)
- [ ] "Bestehendes öffnen": OS-Ordnerauswahl-Dialog, gewählter Ordner wird validiert
- [ ] Validierung fehlgeschlagen bei "Bestehendes": Fehlermeldung mit konkretem Grund ("contexts.yaml fehlt" / "topics/ Ordner fehlt"), zurück zur Auswahl
- [ ] Bei gültigem Verzeichnis: Pfad wird persistent gespeichert (`electron-store` oder ähnlich), App startet normal
- [ ] Nächster Start: Gespeicherter Pfad wird automatisch geöffnet, kein Dialog
- [ ] Gespeicherter Pfad nicht mehr erreichbar (Ordner gelöscht, Laufwerk nicht gemountet): Fehler-Dialog mit Pfadangabe und Button "Anderes Verzeichnis wählen"
- [ ] Gespeicherter Pfad erreichbar aber nicht mehr gültig (z.B. `contexts.yaml` gelöscht): Dialog "Verzeichnis ist kein gültiges Cadence-Verzeichnis. Einrichten oder anderes wählen?"
- [ ] Einrichten eines nicht-leeren Ordners der bereits Cadence-fremde Dateien enthält: Warnung "Ordner ist nicht leer. Trotzdem einrichten?" mit Hinweis dass nur Cadence-Unterordner angelegt werden und bestehende Dateien nicht verändert werden
- [ ] Kein Datenverlust: Initialisierung überschreibt niemals bestehende Dateien oder Ordner
- [ ] Welcome-Screen und Fehler-Dialoge funktionieren in Dark Mode

### Referenzen

- REQUIREMENTS.md §6 (Datenverzeichnis-Einstellung)
- ARCHITECTURE.md §2 (Datenverzeichnis-Struktur)

---

## US-27: Datenverzeichnis wechseln

**Als** Nutzer
**möchte ich** im laufenden Betrieb zu einem anderen Datenverzeichnis wechseln können,
**damit** ich verschiedene Kontexte getrennt halten kann (z.B. Arbeit / Privat / Projekt).

**Abhängigkeit:** US-26

### Akzeptanzkriterien

- [ ] Menüpunkt "Datenverzeichnis wechseln" (oder über Command Palette)
- [ ] Gleiche Logik wie beim Start: Ordner-Auswahl → Validierung oder Initialisierung
- [ ] Bei Wechsel: File-Watcher stoppen, SQLite-Index schließen, neues Verzeichnis öffnen, Index neu aufbauen
- [ ] Zuletzt genutztes Verzeichnis wird als neuer Default gespeichert
- [ ] Optional: Liste der letzten 3-5 genutzten Verzeichnisse als Schnellauswahl (MRU-Liste)
- [ ] UI zeigt aktuelles Datenverzeichnis an (z.B. im Fenster-Titel oder in der TopBar)

### Referenzen

- REQUIREMENTS.md §6
- VISION.md (Filesystem First)