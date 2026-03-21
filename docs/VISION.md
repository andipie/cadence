# Cadence — Vision

## Das Problem

Wissensarbeiter und Führungskräfte führen dutzende parallele Gespräche — 1:1s mit Direct Reports, Meetings mit Stakeholdern, Abstimmungen mit anderen Teams. In jedem dieser Kontexte gibt es offene Themen: Zusagen die eingehalten werden müssen, Entscheidungen die anstehen, Dinge auf die man wartet.

Diese Themen leben heute verstreut: in Notiz-Apps, in E-Mail-Drafts, auf Post-its, im Kopf. Das Ergebnis: Man geht in ein Meeting und vergisst die Hälfte. Man wartet auf eine Zulieferung und merkt erst nach Wochen, dass nichts kam. Man hat jemandem etwas zugesagt und erinnert sich zu spät.

Bestehende Tools lösen das Problem nicht:

- **To-Do-Apps** (Todoist, Things) sind aufgabenzentriert, nicht kontextzentriert. Sie beantworten "Was muss ich tun?" — aber nicht "Was muss ich mit Max besprechen?"
- **Notiz-Apps** (Obsidian, Notion) sind zu frei. Man kann alles bauen, aber nichts erzwingt Struktur. Das führt zu Systemen die man erst pflegen muss, bevor man sie nutzen kann.
- **Projektmanagement-Tools** (Jira, Asana) sind für Teams, nicht für persönliche Gesprächsführung. Sie sind zu schwergewichtig für "Muss ich bei Lisa nächste Woche nachfragen."

## Die Lösung

Cadence ist ein persönliches, kontextbasiertes Themen-Tracking-Tool. Es organisiert Themen nicht nach Projekten oder Deadlines, sondern nach den Menschen und Situationen, in denen sie relevant werden.

**Der Kern-Workflow:**
1. Ein Thema fällt dir ein → Quick Capture, 2 Sekunden, fertig.
2. Du gehst in ein Meeting / 1:1 → Du öffnest den Kontext und siehst sofort: Was muss ich ansprechen? Was muss ich liefern? Worauf warte ich?
3. Im Gespräch → Du machst schnelle Updates direkt am Thema.
4. Nach dem Gespräch → Thema erledigt, oder Wiedervorlage fürs nächste Mal.

## Designprinzipien

### 1. Speed over Completeness

Lieber ein Thema mit nur einem Titel erfassen als gar nicht, weil das Formular zu viele Felder hat. Die Inbox fängt alles auf. Aufräumen kann man später.

### 2. Context is King

Die primäre Navigation ist der Kontext, nicht die Aufgabe. "Ich bin jetzt bei Max" → alles Relevante erscheint. Das Tool denkt in Gesprächen, nicht in Aufgabenlisten.

### 3. Direction Matters

Jedes Thema hat eine Richtung: Bringe ich etwas ein, liefere ich etwas, oder warte ich? Diese Dreiteilung strukturiert jedes Gespräch und macht sofort klar, wer am Zug ist.

### 4. Progressive Disclosure

Die Themenliste zeigt das Minimum: Titel, Prio, Status. Details öffnen sich rechts. Updates sind chronologisch und scanbar. Kein Scrollen durch Walls of Text.

### 5. Filesystem First

Daten gehören dem Nutzer, nicht der App. Markdown-Dateien mit Frontmatter sind das Format — lesbar ohne Tool, versionierbar mit Git, synchronisierbar mit jedem Cloud-Dienst, kompatibel mit Obsidian.

### 6. No Babysitting

Das Tool braucht keine ständige Pflege. Es läuft auf dem Desktop, zeigt beim Öffnen was ansteht, und stört nicht wenn man es nicht braucht. Keine Push-Notifications, keine Gamification, keine Streaks.

## Zielgruppe

Primär: Führungskräfte und Senior Engineers mit 3-15 direkten Kommunikationspartnern, die regelmäßige 1:1s und Meetings führen.

Sekundär: Jeder Wissensarbeiter der kontextbezogen Themen tracken will — Projektleiter, Berater, Vertrieb.

**Nicht die Zielgruppe:** Teams die ein geteiltes Aufgabenmanagement brauchen. Cadence ist ein persönliches Tool, kein Kollaborations-Tool.

## Abgrenzung

| Aspekt | Cadence | To-Do-App | Notiz-App | Projekt-Tool |
|--------|-------------|-----------|-----------|-------------|
| Organisiert nach | Kontext (Person/Meeting) | Projekt/Liste | Frei | Projekt/Sprint |
| Kernfrage | "Was bespreche ich mit X?" | "Was muss ich tun?" | "Was habe ich notiert?" | "Wer macht was bis wann?" |
| Capture-Speed | < 2 Sekunden | ~5 Sekunden | ~10 Sekunden | ~30 Sekunden |
| Datenformat | Markdown (offen) | Proprietär | Markdown (teilw.) | Proprietär |
| Kollaboration | Nein (persönlich) | Teilweise | Teilweise | Ja |
| Lernkurve | Minimal | Niedrig | Hoch | Hoch |

## Erfolgskriterien

Cadence ist erfolgreich, wenn:

1. **Quick Capture funktioniert.** Vom Gedanken zum erfassten Thema vergehen weniger als 3 Sekunden. Kein Grund, jemals zu sagen "Das merke ich mir einfach."

2. **Meetings produktiver werden.** Man geht vorbereitet rein (alle Themen auf einen Blick), verpasst nichts (Follow-Ups sind sichtbar), und vergisst keine Nachverfolgung (Wiedervorlage).

3. **Nichts fällt durch.** Themen bei denen man auf jemanden wartet, werden sichtbar — mit Wartezeit. "Wartet seit 14 Tagen" ist ein klares Signal zum Nachhaken.

4. **Die Daten überleben das Tool.** Wenn Cadence morgen nicht mehr existiert, hat der Nutzer einen Ordner mit lesbaren Markdown-Dateien die alles enthalten.

## Langfrist-Vision

Phase 1-3 sind das Fundament. Darüber hinaus gibt es Richtungen, die bewusst noch nicht geplant, aber denkbar sind:

- **Statistiken:** "Wie viele Themen habe ich in den letzten 30 Tagen mit Lisa abgeräumt?" — Einblick in die eigene Gesprächseffizienz.
- **Templates:** Vordefinierte Themen-Sets für bestimmte Meeting-Typen (Sprint Retro Fragen, 1:1 Standardpunkte).
- **Kalender-Integration:** Automatisch den richtigen Kontext öffnen wenn ein Meeting im Kalender startet. Bewusst nicht in Phase 1-3, weil es Komplexität einführt die dem "No Babysitting"-Prinzip widerspricht.
- **Mobile Companion:** Leichtgewichtige Mobile-App für Read-Only + Quick Capture. Bis dahin: Obsidian Mobile als Brücke.

Diese Richtungen werden nur verfolgt, wenn sie die Kernprinzipien nicht verwässern.
