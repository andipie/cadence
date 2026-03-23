# Cadence — Bug Fixes & Feature Requests (Sprint 2)

Diese Datei enthält Bugs und neue Features zur Abarbeitung in Claude Code.
Bugs sind nach Kritikalität sortiert — **kritische Bugs zuerst**, da sie Datenintegrität gefährden.

**Prompt-Pattern für Claude Code:**

```
Lies VISION.md, REQUIREMENTS.md, ARCHITECTURE.md und CLAUDE.md.
Behebe dann [BUG-XX] / Setze [FR-XX] aus der Datei SPRINT-2.md um.
```

---

## Kritische Bugs

### BUG-01: Falsches Thema wird modifiziert (Detail ↔ Liste out of sync)

**Priorität:** KRITISCH — Datenintegrität betroffen

**Beobachtet:** Beim Ändern von Eigenschaften (z.B. Priority) im Detail-Panel wird gelegentlich ein anderes Thema modifiziert als das in der Liste ausgewählte. Die Zuordnung zwischen selektiertem Listenelement und Detail-Panel scheint nicht konsistent zu sein.

**Erwartetes Verhalten:** Das Detail-Panel zeigt und editiert immer exakt das in der Liste ausgewählte Thema. Die `selectedTopicId` im zustand-Store muss die Single Source of Truth für die Detail-Ansicht sein.

**Debugging-Hinweise:**
- Prüfen ob `selectedTopicId` und die im Detail-Panel geladenen Daten immer übereinstimmen
- Race Condition möglich: wenn Topics neu geladen werden (z.B. nach File-Watcher-Event), könnte die Selection auf einen veralteten Index zeigen
- Prüfen ob bei Bulk-Updates oder Statusänderungen die Selection korrekt aktualisiert wird

**Akzeptanzkriterien:**
- [ ] Detail-Panel zeigt zu jeder Zeit das korrekte Thema
- [ ] Nach jeder Datenänderung bleibt die Selection stabil
- [ ] Kein Szenario reproduzierbar in dem das falsche Thema editiert wird

---

### BUG-02: Neues Thema erscheint nicht im Detail-Panel

**Priorität:** Hoch

**Beobachtet:** Nach dem Anlegen eines neuen Themas ist es in der Liste ausgewählt (visuell hervorgehoben), aber das Detail-Panel zeigt den Inhalt nicht an. Möglicherweise wird das Thema selektiert bevor es vollständig im Index/Store verfügbar ist.

**Erwartetes Verhalten:** Nach dem Erstellen öffnet sich das neue Thema sofort im Detail-Panel, bereit zur Bearbeitung.

**Debugging-Hinweise:**
- Timing-Problem: Selection wird gesetzt bevor der IPC-Roundtrip (Create → FileStore → Index → Response) abgeschlossen ist
- Prüfen ob `selectTopic()` erst nach erfolgreichem `topics:create`-Response aufgerufen wird

**Akzeptanzkriterien:**
- [ ] Nach Erstellen eines Themas ist es in der Liste selektiert UND im Detail-Panel sichtbar
- [ ] Alle Felder sind sofort editierbar

---

### BUG-03: Default Priority wird nicht übernommen

**Priorität:** Hoch

**Beobachtet:** Neu angelegte Themen übernehmen nicht die in den Settings konfigurierte Default-Priorität.

**Erwartetes Verhalten:** Neue Themen erhalten die unter `Settings.defaultPriority` konfigurierte Priorität (Default: `normal`). Siehe REQUIREMENTS.md §2.1 und §6.

**Akzeptanzkriterien:**
- [ ] Neues Thema hat die konfigurierte Default-Priorität im Frontmatter
- [ ] Wird in der Liste und im Detail-Panel korrekt angezeigt

---

## UI-Bugs

### BUG-04: Panel-Resize springt auf Initialbreite

**Priorität:** Mittel

**Beobachtet:** Beim Ziehen der Panel-Trenner (Resize-Handle) springt das Panel zu Beginn des Drag-Vorgangs auf seine initiale Standardbreite zurück, bevor es dem Cursor folgt.

**Erwartetes Verhalten:** Der Drag beginnt an der aktuellen Panel-Breite, ohne Reset. Die Breite folgt dem Cursor ab dem ersten Pixel der Bewegung.

**Debugging-Hinweise:**
- Vermutlich wird beim `mousedown` der State mit dem Initialwert überschrieben statt die aktuelle Breite zu lesen
- Prüfen ob die Panel-Breite aus dem DOM (z.B. `getBoundingClientRect()`) oder aus dem State gelesen wird

**Akzeptanzkriterien:**
- [ ] Panel-Resize beginnt an der aktuellen Breite
- [ ] Kein Sprung oder Flicker beim Start des Drag-Vorgangs
- [ ] Funktioniert für alle Panel-Trenner (links ↔ mitte, mitte ↔ rechts)

---

### BUG-05: Rechtes Panel hat limitierte maximale Breite

**Priorität:** Mittel

**Beobachtet:** Das rechte Detail-Panel kann nicht über eine bestimmte Breite hinaus gezogen werden, obwohl Platz im Fenster vorhanden wäre.

**Erwartetes Verhalten:** Alle drei Panels haben eine Mindestbreite (damit nichts kollabiert), aber die Maximalbreite wird nur durch die Mindestbreiten der anderen Panels begrenzt. Der Nutzer kann frei entscheiden wie viel Platz er dem Detail-Panel gibt.

**Akzeptanzkriterien:**
- [ ] Rechtes Panel kann so breit gezogen werden wie das Fenster minus die Mindestbreiten der beiden linken Panels erlaubt
- [ ] Kein hardcodiertes `max-width` auf dem rechten Panel

---

### BUG-06: Detail-Panel flackert bei erneutem Klick

**Priorität:** Niedrig

**Beobachtet:** Klickt man in der Liste auf das bereits ausgewählte Thema, flackert das Detail-Panel (kurzer Re-Render / Neuladung), obwohl sich nichts geändert hat.

**Erwartetes Verhalten:** Wenn das angeklickte Thema bereits selektiert ist (`selectedTopicId === clickedId`), passiert nichts. Kein Re-Render, kein erneuter IPC-Call.

**Akzeptanzkriterien:**
- [ ] Klick auf das bereits selektierte Thema löst keinen Re-Render aus
- [ ] Kein erneuter `topics:get` IPC-Call wenn die ID sich nicht ändert

---

### BUG-07: Direction-Änderung hakelig

**Priorität:** Niedrig

**Beobachtet:** Das Umsetzen der Direction (z.B. von "Ansprechen" auf "Liefern") funktioniert, fühlt sich aber hakelig an — der Dropdown reagiert verzögert oder braucht mehrere Klicks.

**Erwartetes Verhalten:** Klick auf das Direction-Badge/Dropdown → Auswahl → sofortige Änderung. Maximal 2 Klicks (öffnen + auswählen).

**Debugging-Hinweise:**
- Prüfen ob der Dropdown korrekt positioniert wird und nicht durch andere Elemente verdeckt ist
- Prüfen ob nach der Auswahl ein Re-Render den Dropdown kurz schließt und wieder öffnet
- Click-Target-Größe prüfen — Badge eventuell zu klein

**Akzeptanzkriterien:**
- [ ] Direction-Dropdown öffnet bei erstem Klick
- [ ] Auswahl wird sofort übernommen, Dropdown schließt
- [ ] Kein Doppelklick oder Mehrfachklick nötig

---

### BUG-08: App-Icon unter Windows fehlerhaft

**Priorität:** Niedrig — Kosmetik

**Beobachtet:** Unter Windows wird das App-Icon in der Taskbar und/oder im Fenster-Header als schmaler Balken angezeigt statt als richtiges Icon.

**Erwartetes Verhalten:** App-Icon wird korrekt in allen Windows-Kontexten angezeigt (Taskbar, Fenster-Header, Alt+Tab, Startmenü).

**Debugging-Hinweise:**
- Windows benötigt `.ico`-Format mit mehreren Auflösungen (16x16, 32x32, 48x48, 256x256)
- Prüfen ob `electron-builder.yml` den richtigen Icon-Pfad referenziert
- Prüfen ob das Quell-Icon die richtige Auflösung und Seitenverhältnis hat (muss quadratisch sein)
- `electron-builder` konvertiert `.png` automatisch zu `.ico`, aber das Quellbild muss mindestens 256x256 sein

**Akzeptanzkriterien:**
- [ ] Icon wird in der Windows-Taskbar korrekt angezeigt
- [ ] Icon wird im Fenster-Header korrekt angezeigt
- [ ] Icon wird in Alt+Tab korrekt angezeigt
- [ ] Quell-Icon ist mindestens 256x256px, quadratisch

---

## Verbesserungen

### IMP-01: Context-Sortierung

**Beobachtet:** Kontexte innerhalb einer Gruppe und auch ungruppierte Kontexte haben keine erkennbare Sortierung.

**Erwartetes Verhalten:** Kontexte werden innerhalb ihrer Gruppe alphabetisch sortiert. Ungruppierte Kontexte (unter "Ohne Gruppe") ebenfalls alphabetisch. Gruppen selbst werden nach `sort_order` sortiert (bestehendes Feld in `contexts.yaml`).

**Akzeptanzkriterien:**
- [ ] Kontexte innerhalb einer Gruppe sind alphabetisch sortiert (nach `name`)
- [ ] Ungruppierte Kontexte sind alphabetisch sortiert
- [ ] Gruppen-Reihenfolge bleibt über `sort_order` steuerbar
- [ ] Sortierung aktualisiert sich nach Umbenennung eines Kontexts

---

## Neue Features

### FR-01: Neue Status-Werte — Ready und Canceled

**Als** Nutzer
**möchte ich** Themen als "Ready" (vorbereitet) oder "Canceled" (hinfällig) markieren können,
**damit** ich sehe welche Themen besprechungsreif sind und welche sich erledigt haben ohne abgeschlossen worden zu sein.

**Änderungen am Datenmodell:**

```typescript
// shared/types.ts — Erweiterung
export type TopicStatus = 'neu' | 'ready' | 'follow-up' | 'erledigt' | 'canceled';
```

**Ready:**
- Bedeutet: "Das Thema ist vorbereitet und kann besprochen werden"
- Erscheint in der Kontextansicht wie `neu` und `follow-up` — unter der jeweiligen Richtungsgruppe (Ansprechen / Liefern / Warten)
- Visuell: eigenes Badge (z.B. grün oder blaugrün), klar unterscheidbar von `neu`
- Kann direkt aus `neu` oder `follow-up` gesetzt werden

**Canceled:**
- Bedeutet: "Das Thema hat sich aus welchen Gründen auch immer erledigt — ohne dass es aktiv abgeschlossen wurde"
- Erscheint **unter** dem Erledigt-Abschnitt in einer eigenen kollabierbaren Gruppe "Storniert"
- Setzt `completed_at` auf den Zeitpunkt der Stornierung
- Due Date, Follow-Up Date und Recurring haben **keinen Effekt** mehr auf stornierte Themen
- Stornierte Themen erscheinen **nicht** in der Überfällig-View
- Stornierte Themen erscheinen **nicht** im Inbox-Counter (auch wenn kein Kontext)
- Kann aus jedem Status gesetzt werden

**Akzeptanzkriterien:**
- [ ] `TopicStatus` enthält `ready` und `canceled`
- [ ] Ready-Badge in der Liste und im Detail-Panel, Status per Dropdown setzbar
- [ ] Canceled-Themen erscheinen unter "Erledigt" in eigener "Storniert"-Sektion (collapsed by default)
- [ ] Canceled-Themen ignorieren Due Date und Follow-Up (keine Überfällig-Markierung, kein Recurring-Trigger)
- [ ] Free View Filter berücksichtigt die neuen Status-Werte
- [ ] Frontmatter `status: ready` bzw. `status: canceled` wird korrekt gelesen und geschrieben
- [ ] Undo funktioniert für Statuswechsel zu/von `ready` und `canceled`
- [ ] Bestehende Markdown-Dateien ohne die neuen Werte funktionieren weiterhin (Rückwärtskompatibilität)

**Referenzen:** REQUIREMENTS.md §2.1, §3.2, §3.4; ARCHITECTURE.md §6

---

### FR-02: Umschaltbarer Notiz-Modus (Einzel-Notizen vs. Freitext)

**Als** Nutzer
**möchte ich** zwischen zwei Notiz-Modi wechseln können — einzelne datierte Updates oder ein freies Markdown-Dokument,
**damit** ich je nach Thema die passende Dokumentationsform wählen kann.

**Zwei Modi:**

**Modus A — Einzel-Notizen (bisheriges Verhalten):**
- Chronologische Updates mit Datums-Header (`## 2026-03-19`)
- "+ Update"-Button für neuen Eintrag
- Jede Notiz einzeln editierbar
- Jede Notiz einzeln löschbar (Neu — siehe Akzeptanzkriterien)

**Modus B — Freitext:**
- Ein einzelner großer Markdown-Bereich
- Frei editierbar ohne erzwungene Struktur
- Der gesamte Body der Markdown-Datei (unterhalb des Frontmatter) wird als ein Block im Editor geladen
- Fallback: wenn das Parsen in Einzel-Notizen fehlschlägt (z.B. weil die Formatierung nicht dem `## YYYY-MM-DD`-Schema folgt), wird automatisch der Freitext-Modus angezeigt

**Umschalter:**
- Position: direkt rechts neben dem "Notes"-Label im Detail-Panel
- Darstellung: Icon-Toggle oder segmented Control (z.B. Listen-Icon / Dokument-Icon)
- Einstellung ist **global** — gilt für alle Themen, nicht pro Thema
- Einstellung wird **persistent** gespeichert (überlebt App-Neustart)

**Akzeptanzkriterien:**
- [ ] Toggle neben "Notes"-Label schaltet zwischen Einzel-Notizen und Freitext
- [ ] Einzel-Notizen-Modus: bisheriges Verhalten (datierte Updates, "+ Update"-Button)
- [ ] Einzel-Notizen-Modus: jede Notiz hat einen Löschen-Button (mit Undo via Toast)
- [ ] Freitext-Modus: gesamter Body als ein editierbarer Markdown-Block
- [ ] Freitext-Modus: Änderungen werden in die Markdown-Datei geschrieben (gleicher Roundtrip wie bisher)
- [ ] Toggle-Einstellung wird global und persistent gespeichert
- [ ] Wenn Einzel-Notizen-Modus aktiv aber das Parsen in einzelne Notizen fehlschlägt → automatischer Fallback auf Freitext mit Hinweis ("Notizen konnten nicht als einzelne Einträge geparst werden — Freitext-Modus aktiv")
- [ ] Wechsel zwischen Modi verändert den Dateiinhalt nicht (nur die Darstellung ändert sich)
- [ ] Notiz-Löschung: Undo funktioniert (Toast mit "Rückgängig")
- [ ] Dark Mode funktioniert für beide Modi

**Referenzen:** REQUIREMENTS.md §3.5; CLAUDE.md TipTap/Markdown

---

## Abarbeitungsreihenfolge (empfohlen)

| # | Ticket | Begründung |
|---|--------|------------|
| 1 | BUG-01 | Kritisch — falsches Thema editieren = Datenverlust |
| 2 | BUG-02 | Hoch — blockiert flüssiges Arbeiten |
| 3 | BUG-03 | Hoch — Default-Werte sind Grundfunktionalität |
| 4 | BUG-04 | Mittel — UI-Qualität |
| 5 | BUG-05 | Mittel — UI-Qualität |
| 6 | BUG-06 | Niedrig — Kosmetik |
| 7 | BUG-07 | Niedrig — UX-Feinschliff |
| 8 | BUG-08 | Niedrig — Kosmetik, Windows-spezifisch |
| 9 | IMP-01 | Verbesserung — schnell umgesetzt |
| 10 | FR-01 | Feature — Datenmodell-Erweiterung, vor FR-02 weil Status-Änderungen das Undo betreffen |
| 11 | FR-02 | Feature — größter Umbau, am Ende wenn alles andere stabil ist |