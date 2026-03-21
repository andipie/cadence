import type { Translations } from './types';

export const de: Translations = {
  // --- Domain value labels ---
  status: {
    neu: 'Neu',
    'follow-up': 'Follow-Up',
    warten: 'Warten',
    erledigt: 'Erledigt',
  },
  priority: {
    hoch: 'Hoch',
    mittel: 'Mittel',
    normal: 'Niedrig',
  },
  direction: {
    ansprechen: 'Ansprechen',
    liefern: 'Liefern',
    warten: 'Warten',
  },
  contextType: {
    person: 'Person',
    meeting: 'Meeting',
    group: 'Gruppe',
    place: 'Ort',
    other: 'Sonstiges',
  },
  recurringInterval: {
    weekly: 'Wöchentlich',
    biweekly: 'Zweiwöchentlich',
    monthly: 'Monatlich',
    quarterly: 'Quartalsweise',
  },

  // --- Navigation ---
  nav: {
    inbox: 'Inbox',
    inboxTooltip: 'Themen ohne Kontext-Zuordnung',
    liefern: 'Liefern',
    liefernTooltip: 'Alle offenen Themen die du liefern musst',
    overdue: 'Überfällig',
    overdueTooltip: 'Themen mit überschrittenem Fälligkeitsdatum',
    freeView: 'Free View',
    freeViewTooltip: 'Alle Themen durchsuchen und filtern',
    savedViews: 'Gespeicherte Views',
    savedViewsShow: 'Gespeicherte Views anzeigen',
    savedViewsHide: 'Gespeicherte Views zuklappen',
    viewDeleteTooltip: 'View löschen',
    viewRenameHint: 'Doppelklick zum Umbenennen',
    ungrouped: 'Ohne Gruppe',
    dropUngrouped: 'Hier ablegen für "Ohne Gruppe"',
    newGroup: '+ Neue Gruppe',
    newGroupPlaceholder: 'Gruppenname…',
    newContext: '+ Kontext anlegen',
    contextPlaceholder: 'Kontextname…',
  },

  // --- Topic list ---
  topicList: {
    selectTopic: 'Thema auswählen',
    selectTopicHint: 'Wähle ein Thema aus der Liste, um Details zu sehen.',
    selectContext: 'Kontext auswählen',
    selectContextHint: 'Wähle einen Kontext aus der Seitenleiste.',
    loading: 'Laden…',
    noTopics: 'Keine Themen gefunden.',
    allDone: 'Alles aufgeräumt.',
    noOverdue: 'Keine überfälligen Themen.',
    nothingToDeliver: 'Nichts zu liefern — alles erledigt!',
    noOpenTopics: 'Keine offenen Themen.',
    tryOtherFilters: 'Versuche andere Filter oder setze alle zurück.',
    completedExists: (count: number): string =>
      `${count} erledigte Themen vorhanden.`,
    resultsCount: (count: number): string =>
      `${count} ${count === 1 ? 'Ergebnis' : 'Ergebnisse'}`,
    openCount: (count: number): string =>
      `${count} ${count === 1 ? 'offenes Thema' : 'offene Themen'}`,
    newTopicPlaceholder: 'Neues Thema hinzufügen… (⌘N)',
    newTopicInboxPlaceholder: 'Neues Thema in Inbox… (Esc zum Abbrechen)',
    newTopicQuick: 'Neues Thema schnell anlegen (⌘N)',
    multiSelect: 'Mehrfachauswahl',
    multiSelectEnd: 'Mehrfachauswahl beenden',
    agenda: 'Agenda',
    agendaTooltip: 'Agenda in Zwischenablage kopieren (⌘⇧A)',
  },

  // --- Filter ---
  filter: {
    search: 'Suchen…',
    searchTooltip: 'Volltextsuche über alle Themen',
    status: 'Status',
    priority: 'Prio',
    direction: 'Richtung',
    context: 'Kontext',
    due: 'Fällig:',
    dueFrom: 'Fällig ab (frühestes Datum)',
    dueTo: 'Fällig bis (spätestes Datum)',
    groupBy: 'Gruppierung:',
    groupByTooltip: 'Themen gruppieren nach',
    sortBy: 'Sortierung:',
    sortByTooltip: 'Themen sortieren nach',
    resetAll: 'Alle Filter zurücksetzen',
    saveView: 'View speichern',
    viewNamePlaceholder: 'View-Name…',
    saveViewTooltip: 'Aktuelle Filter als View speichern',
    groupByDirection: 'Richtung',
    groupByStatus: 'Status',
    groupByPriority: 'Priorität',
    groupByContext: 'Kontext',
    groupByNone: 'Keine',
    sortByPriority: 'Priorität',
    sortByDueDate: 'Fälligkeitsdatum',
    sortByCreatedAt: 'Erstellt am',
    sortByUpdatedAt: 'Aktualisiert am',
    dueOverdue: 'Überfällig',
    dueToday: 'Heute',
    dueTomorrow: 'Morgen',
    dueThisWeek: 'Diese Woche',
    dueNextWeek: 'Nächste Woche',
    dueLater: 'Später',
    dueNone: 'Ohne Datum',
    tomorrow: 'Morgen',
    oneWeek: '1 Woche',
    twoWeeks: '2 Wochen',
    noDueDate: 'Ohne Fälligkeitsdatum',
    dueDateFilterTooltip: (label: string): string =>
      `Nur Themen mit Fälligkeit bis ${label.toLowerCase()}`,
    reset: 'Zurücksetzen',
  },

  // --- Filter chips ---
  chips: {
    status: (label: string): string => `Status: ${label}`,
    priority: (label: string): string => `Priorität: ${label}`,
    direction: (label: string): string => `Richtung: ${label}`,
    context: (name: string): string => `Kontext: ${name}`,
    search: (query: string): string => `Suche: "${query}"`,
    dueAfter: (date: string): string => `Fällig ab: ${date}`,
    dueBefore: (date: string): string => `Fällig bis: ${date}`,
    removeFilter: 'Filter entfernen',
  },

  // --- Detail panel ---
  detail: {
    selectTopic: 'Thema auswählen',
    selectTopicHint: 'Wähle ein Thema aus der Liste, um Details zu sehen.',
    loading: 'Laden…',
    notes: 'Notizen',
    editHint: 'Klicken zum Bearbeiten',
    statusLabel: 'Status',
    statusTooltip: 'Status des Themas ändern',
    priorityLabel: 'Priorität',
    priorityTooltip: 'Priorität ändern (⌘1 Hoch, ⌘2 Mittel, ⌘3 Normal)',
    directionLabel: 'Richtung',
    directionTooltip: 'Richtung ändern: Ansprechen, Liefern oder Warten',
    dueLabel: 'Fällig',
    dueToggleTooltip: 'Fälligkeitsdatum aktivieren/deaktivieren',
    dueDateTooltip: 'Fälligkeitsdatum setzen oder ändern',
    dueRemoveTooltip: 'Fälligkeitsdatum entfernen',
    noDate: 'Kein Datum',
    followUpLabel: 'Wiedervorlage',
    followUpToggleTooltip: 'Wiedervorlage aktivieren/deaktivieren',
    followUpDateTooltip: 'Wiedervorlagedatum für Follow-Up setzen',
    followUpRemoveTooltip: 'Wiedervorlage entfernen',
    followUpWeeks: (weeks: number): string =>
      `Wiedervorlage in ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'}`,
    noFollowUp: 'Keine Wiedervorlage',
    recurringLabel: 'Wiederkehrend',
    yes: 'Ja',
    no: 'Nein',
    intervalLabel: 'Intervall',
    intervalTooltip: 'Wiederholungsintervall wählen',
    nextLabel: 'Nächste',
  },

  // --- Notes ---
  notes: {
    addButton: '+ Update',
    addTooltip: 'Neuen Eintrag hinzufügen (⌘U)',
    empty: 'Noch keine Notizen.',
    editHint: 'Klicken zum Bearbeiten',
    placeholder: 'Notiz eingeben…',
    imageAlt: 'Bild',
  },

  // --- Action footer ---
  actions: {
    complete: '✓ Erledigt',
    followUp: '↻ Wiedervorlage',
    delete: 'Löschen',
    deleteConfirm: 'Wirklich löschen?',
  },

  // --- Context tags ---
  contextTags: {
    label: 'Kontexte',
    addTooltip: 'Kontext hinzufügen',
    inboxWarning: 'Thema hat keine Kontexte mehr und wandert in die Inbox.',
  },

  // --- Context menu ---
  contextMenu: {
    rename: 'Kontext umbenennen',
    renameAction: 'Umbenennen',
    moveToGroup: 'In eine andere Gruppe verschieben',
    moveToGroupAction: 'In Gruppe verschieben',
    noGroup: 'Ohne Gruppe',
    delete: 'Kontext löschen',
    deleteAction: 'Löschen',
    groupRename: 'Gruppe umbenennen',
    groupRenameAction: 'Umbenennen',
    groupNewContext: 'Neuen Kontext in dieser Gruppe erstellen',
    groupNewContextAction: 'Neuer Kontext',
    groupDelete: 'Gruppe löschen (Kontexte werden nicht gelöscht)',
    groupDeleteAction: 'Löschen',
  },

  // --- Settings ---
  settings: {
    title: 'Einstellungen',
    close: 'Schließen',
    dataDir: 'Datenverzeichnis',
    dataDirHint: 'Erfordert App-Neustart zum Ändern',
    defaultPriority: 'Standard-Priorität',
    defaultPriorityHint: 'Priorität für neue Themen',
    confirmDelete: 'Löschen bestätigen',
    confirmDeleteHint: 'Bestätigungsdialog vor dem Löschen',
    confirmComplete: 'Erledigt bestätigen',
    confirmCompleteHint: 'Bestätigungsdialog vor dem Erledigen',
    warnWaitingDays: 'Wartezeit-Warnung (Tage)',
    warnWaitingDaysHint: 'Ab wann "Warten"-Themen farblich warnen',
    warnWaitingCritical: 'Wartezeit kritisch (Tage)',
    warnWaitingCriticalHint: 'Ab wann "Warten"-Themen rot markiert werden',
    obsidianMode: 'Obsidian-Modus',
    obsidianModeHint: 'Ergänzt Frontmatter mit aliases für Obsidian-Kompatibilität',
    language: 'Sprache',
    languageHint: 'Sprache der Benutzeroberfläche',
    autoSaveHint: 'Änderungen werden automatisch gespeichert.',
  },

  // --- Top bar ---
  topBar: {
    overdue: 'überfällig',
    inbox: 'Inbox',
    searchTooltip: 'Suche (⌘K)',
    search: 'Suchen',
    settingsTooltip: 'Einstellungen (⌘,)',
  },

  // --- Quick capture ---
  capture: {
    title: 'Schnellerfassung',
    topicPlaceholder: 'Thema eingeben…',
    contextPlaceholder: 'Kontext (optional)…',
    contextRemove: 'Kontext entfernen',
    hint: 'Enter = Speichern · Esc = Abbrechen',
  },

  // --- Command palette ---
  commandPalette: {
    placeholder: 'Themen und Kontexte durchsuchen…',
    noResults: (query: string): string =>
      `Keine Ergebnisse für „${query}"`,
  },

  // --- Conflict banner ---
  conflict: {
    title: (count: number): string =>
      `⚠ ${count} Sync-Konfliktdatei${count !== 1 ? 'en' : ''} gefunden`,
    recheckTooltip: 'Erneut auf Konflikte prüfen',
    recheck: 'Erneut prüfen',
    close: 'Schließen',
    showInFinder: '— Im Finder anzeigen',
    showMore: (count: number): string =>
      `+${count} weitere anzeigen`,
    showLess: 'Weniger anzeigen',
  },

  // --- Bulk toolbar ---
  bulk: {
    selected: (count: number): string => `${count} ausgewählt`,
    selectAll: 'Alle Themen auswählen',
    selectAllShort: 'Alle',
    deselectAll: 'Auswahl aufheben',
    deselectAllShort: 'Keine',
    context: 'Kontext',
    priority: 'Prio',
    status: 'Status',
    direction: 'Richtung',
    delete: 'Löschen',
    deleteConfirmTitle: 'Themen löschen?',
    deleteConfirmMessage: (count: number): string =>
      `${count} ${count === 1 ? 'Thema' : 'Themen'} werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`,
    cancel: 'Abbrechen',
    changeLabel: (label: string): string => `${label} ändern`,
  },

  // --- Topic row ---
  topicRow: {
    dragToSort: 'Ziehen zum Sortieren',
    selectForBulk: 'Thema für Mehrfachaktion auswählen',
    followUpOn: (date: string): string => `Wiedervorlage am ${date}`,
    followUpDue: 'Follow-Up fällig',
    followUp: 'Follow-Up',
    newTopic: 'Neues Thema — noch nicht bearbeitet',
    newBadge: 'Neu',
    recurring: 'Wiederkehrend',
    overdueSince: (date: string): string => `Überfällig seit ${date}`,
    dueOn: (date: string): string => `Fällig am ${date}`,
    waitingSince: (days: number): string =>
      `Wartet seit ${days} ${days === 1 ? 'Tag' : 'Tagen'}`,
    priorityTitle: (label: string): string => `Priorität: ${label}`,
  },

  // --- Toast messages ---
  toast: {
    statusChanged: (label: string): string => `Status → ${label}`,
    priorityChanged: (label: string): string => `Priorität → ${label}`,
    directionChanged: (label: string): string => `Richtung → ${label}`,
    contextsChanged: 'Kontexte geändert',
    topicDeleted: 'Thema gelöscht',
    topicCreateError: 'Thema konnte nicht erstellt werden',
    topicUpdateError: 'Thema konnte nicht aktualisiert werden',
    topicDeleteError: 'Thema konnte nicht gelöscht werden',
    noteAddError: 'Notiz konnte nicht hinzugefügt werden',
    noteUpdateError: 'Notiz konnte nicht aktualisiert werden',
    undone: 'Rückgängig gemacht',
    nothingToUndo: 'Nichts zum Rückgängig machen',
    settingsSaved: 'Einstellungen gespeichert',
    settingsError: 'Einstellungen konnten nicht gespeichert werden',
    agendaCopied: 'Agenda kopiert',
    agendaError: 'Agenda konnte nicht generiert werden',
    viewSaved: 'View gespeichert',
    viewSaveError: 'View konnte nicht gespeichert werden',
    viewDeleted: 'View gelöscht',
    viewDeleteError: 'View konnte nicht gelöscht werden',
    viewUpdateError: 'View konnte nicht aktualisiert werden',
    contextHasTopics: (count: number): string =>
      `Kontext hat noch ${count} ${count === 1 ? 'Thema' : 'Themen'}. Bitte erst Themen verschieben oder löschen.`,
    bulkUpdated: (count: number): string =>
      `${count} Themen aktualisiert`,
    bulkUpdateError: 'Bulk-Update fehlgeschlagen',
    bulkDeleted: (count: number): string =>
      `${count} Themen gelöscht`,
    bulkDeleteError: 'Bulk-Löschung fehlgeschlagen',
    topicCopied: (count: number): string =>
      count === 1
        ? 'Thema in 1 Kontext kopiert'
        : `Thema in ${count} Kontexte kopiert`,
    topicCopyError: 'Thema konnte nicht kopiert werden',
  },

  // --- Undo descriptions ---
  undo: {
    titleChanged: 'Titel geändert',
    contextsChanged: 'Kontexte geändert',
    dueDateChanged: 'Fälligkeit geändert',
    followUpChanged: 'Wiedervorlage geändert',
    topicUpdated: 'Thema aktualisiert',
    topicDeleted: 'Thema gelöscht',
  },

  // --- Errors (main process) ---
  errors: {
    topicCreateFailed: 'Thema konnte nicht erstellt werden',
    topicUpdateFailed: 'Thema konnte nicht aktualisiert werden',
    topicDeleteFailed: 'Thema konnte nicht gelöscht werden',
    noteAddFailed: 'Notiz konnte nicht hinzugefügt werden',
    noteUpdateFailed: 'Notiz konnte nicht aktualisiert werden',
    noTopicsForBulkUpdate: 'Keine Themen zum Aktualisieren angegeben',
    invalidBulkData: 'Ungültige Aktualisierungsdaten',
    noTopicsForBulkDelete: 'Keine Themen zum Löschen angegeben',
    noTopicsForReorder: 'Keine Themen zum Sortieren angegeben',
    invalidDuplicateParams: 'Ungültige Duplikat-Parameter',
    duplicateFailed: 'Thema konnte nicht dupliziert werden',
    nothingToUndo: 'Nichts zum Rückgängig machen',
    undoFailed: 'Rückgängig machen fehlgeschlagen',
    contextLoadFailed: 'Kontexte konnten nicht geladen werden',
    contextCreateFailed: 'Kontext konnte nicht erstellt werden',
    contextUpdateFailed: 'Kontext konnte nicht aktualisiert werden',
    contextDeleteFailed: 'Kontext konnte nicht gelöscht werden',
    groupsLoadFailed: 'Gruppen konnten nicht geladen werden',
    groupCreateFailed: 'Gruppe konnte nicht erstellt werden',
    groupRenameFailed: 'Gruppe konnte nicht umbenannt werden',
    groupDeleteFailed: 'Gruppe konnte nicht gelöscht werden',
    groupsReorderFailed: 'Gruppen konnten nicht umsortiert werden',
    contextMoveFailed: 'Kontext konnte nicht verschoben werden',
    contextsReorderFailed: 'Kontexte konnten nicht umsortiert werden',
    systemCountsFailed: 'System-Counts konnten nicht geladen werden',
    agendaContextRequired: 'Kontext-ID ist erforderlich',
    agendaFailed: 'Agenda konnte nicht generiert werden',
    contextBackupLoaded: 'Kontext-Konfiguration war beschädigt. Backup wurde geladen.',
  },

  // --- Agenda ---
  agenda: {
    waitingSince: (days: number): string =>
      `Wartet seit ${days} ${days === 1 ? 'Tag' : 'Tagen'}`,
    dueOn: (date: string): string => `Fällig: ${date}`,
    lastUpdate: (date: string, content: string): string =>
      `Letztes Update (${date}): ${content}`,
  },

  // --- Common ---
  common: {
    cancel: 'Abbrechen',
    close: 'Schließen',
    delete: 'Löschen',
    save: 'Speichern',
    noContext: 'Ohne Kontext',
    allTopics: 'Alle Themen',
  },
};
