// Translation interface — the contract for all language files.
// Both de.ts and en.ts must satisfy this interface.

export interface Translations {
  // --- Domain value labels ---
  status: Record<string, string>;
  priority: Record<string, string>;
  direction: Record<string, string>;
  contextType: Record<string, string>;
  recurringInterval: Record<string, string>;

  // --- Navigation ---
  nav: {
    inbox: string;
    inboxTooltip: string;
    deliver: string;
    deliverTooltip: string;
    overdue: string;
    overdueTooltip: string;
    freeView: string;
    freeViewTooltip: string;
    savedViews: string;
    savedViewsShow: string;
    savedViewsHide: string;
    viewDeleteTooltip: string;
    viewRenameHint: string;
    ungrouped: string;
    dropUngrouped: string;
    newGroup: string;
    newGroupPlaceholder: string;
    newContext: string;
    contextPlaceholder: string;
  };

  // --- Topic list ---
  topicList: {
    selectTopic: string;
    selectTopicHint: string;
    selectContext: string;
    selectContextHint: string;
    loading: string;
    noTopics: string;
    allDone: string;
    noOverdue: string;
    nothingToDeliver: string;
    noOpenTopics: string;
    tryOtherFilters: string;
    completedExists: (count: number) => string;
    resultsCount: (count: number) => string;
    openCount: (count: number) => string;
    filteredOpenCount: (filtered: number, total: number) => string;
    noFilterMatch: string;
    resetFilters: string;
    filterTooltip: string;
    newTopicPlaceholder: string;
    newTopicInboxPlaceholder: string;
    newTopicQuick: string;
    multiSelect: string;
    multiSelectEnd: string;
    agenda: string;
    agendaTooltip: string;
  };

  // --- Filter ---
  filter: {
    search: string;
    searchTooltip: string;
    status: string;
    priority: string;
    direction: string;
    context: string;
    due: string;
    dueFrom: string;
    dueTo: string;
    groupBy: string;
    groupByTooltip: string;
    sortBy: string;
    sortByTooltip: string;
    resetAll: string;
    saveView: string;
    viewNamePlaceholder: string;
    saveViewTooltip: string;
    // groupBy options
    groupByDirection: string;
    groupByStatus: string;
    groupByPriority: string;
    groupByContext: string;
    groupByNone: string;
    // sortBy options
    sortByPriority: string;
    sortByDueDate: string;
    sortByCreatedAt: string;
    sortByUpdatedAt: string;
    sortByTitle: string;
    sortByManual: string;
    // due proximity groups
    dueOverdue: string;
    dueToday: string;
    dueTomorrow: string;
    dueThisWeek: string;
    dueNextWeek: string;
    dueLater: string;
    dueNone: string;
    // liefern filter
    tomorrow: string;
    oneWeek: string;
    twoWeeks: string;
    noDueDate: string;
    dueDateFilterTooltip: (label: string) => string;
    reset: string;
    // follow-up date filter
    followUpDate: string;
    followUpOverdue: string;
    followUpThisWeek: string;
    followUpNextWeek: string;
    noFollowUpDate: string;
    // date filter dropdown
    customRange: string;
    clearFilter: string;
  };

  // --- Filter chips ---
  chips: {
    status: (label: string) => string;
    priority: (label: string) => string;
    direction: (label: string) => string;
    context: (name: string) => string;
    search: (query: string) => string;
    dueAfter: (date: string) => string;
    dueBefore: (date: string) => string;
    dueOverdue: string;
    dueThisWeek: string;
    dueNextWeek: string;
    noDueDate: string;
    followUpOverdue: string;
    followUpThisWeek: string;
    followUpNextWeek: string;
    noFollowUpDate: string;
    followUpAfter: (date: string) => string;
    followUpBefore: (date: string) => string;
    removeFilter: string;
  };

  // --- Detail panel ---
  detail: {
    selectTopic: string;
    selectTopicHint: string;
    loading: string;
    notes: string;
    editHint: string;
    // metadata labels
    statusLabel: string;
    statusTooltip: string;
    priorityLabel: string;
    priorityTooltip: string;
    directionLabel: string;
    directionTooltip: string;
    dueLabel: string;
    dueToggleTooltip: string;
    dueDateTooltip: string;
    dueRemoveTooltip: string;
    noDate: string;
    followUpLabel: string;
    followUpToggleTooltip: string;
    followUpDateTooltip: string;
    followUpRemoveTooltip: string;
    followUpWeeks: (weeks: number) => string;
    noFollowUp: string;
    recurringLabel: string;
    yes: string;
    no: string;
    intervalLabel: string;
    intervalTooltip: string;
    nextLabel: string;
  };

  // --- Notes ---
  notes: {
    addButton: string;
    addTooltip: string;
    empty: string;
    editHint: string;
    placeholder: string;
    imageAlt: string;
  };

  // --- Action footer ---
  actions: {
    complete: string;
    followUp: string;
    delete: string;
    deleteConfirm: string;
  };

  // --- Context tags ---
  contextTags: {
    label: string;
    addTooltip: string;
    inboxWarning: string;
  };

  // --- Context menu ---
  contextMenu: {
    rename: string;
    renameAction: string;
    moveToGroup: string;
    moveToGroupAction: string;
    noGroup: string;
    delete: string;
    deleteAction: string;
    groupRename: string;
    groupRenameAction: string;
    groupNewContext: string;
    groupNewContextAction: string;
    groupDelete: string;
    groupDeleteAction: string;
  };

  // --- Settings ---
  settings: {
    title: string;
    close: string;
    dataDir: string;
    dataDirHint: string;
    dataDirChange: string;
    defaultPriority: string;
    defaultPriorityHint: string;
    confirmDelete: string;
    confirmDeleteHint: string;
    confirmComplete: string;
    confirmCompleteHint: string;
    warnWaitingDays: string;
    warnWaitingDaysHint: string;
    warnWaitingCritical: string;
    warnWaitingCriticalHint: string;
    obsidianMode: string;
    obsidianModeHint: string;
    language: string;
    languageHint: string;
    autoSaveHint: string;
    dataDirSwitched: string;
    dataDirSwitchError: string;
    dataDirSetupConfirm: string;
    dataDirNotAccessible: string;
    recentDirs: string;
    recentDirsEmpty: string;
    switchDirError: string;
    switchDirSuccess: string;
  };

  // --- Top bar ---
  topBar: {
    overdue: string;
    inbox: string;
    searchTooltip: string;
    search: string;
    settingsTooltip: string;
  };

  // --- Quick capture ---
  capture: {
    title: string;
    topicPlaceholder: string;
    contextPlaceholder: string;
    contextRemove: string;
    hint: string;
  };

  // --- Command palette ---
  commandPalette: {
    placeholder: string;
    noResults: (query: string) => string;
  };

  // --- Conflict banner ---
  conflict: {
    title: (count: number) => string;
    recheckTooltip: string;
    recheck: string;
    close: string;
    showInFinder: string;
    showMore: (count: number) => string;
    showLess: string;
  };

  // --- Bulk toolbar ---
  bulk: {
    selected: (count: number) => string;
    selectAll: string;
    selectAllShort: string;
    deselectAll: string;
    deselectAllShort: string;
    context: string;
    priority: string;
    status: string;
    direction: string;
    delete: string;
    deleteConfirmTitle: string;
    deleteConfirmMessage: (count: number) => string;
    cancel: string;
    changeLabel: (label: string) => string;
  };

  // --- Topic row ---
  topicRow: {
    dragToSort: string;
    selectForBulk: string;
    followUpOn: (date: string) => string;
    followUpDue: string;
    followUp: string;
    newTopic: string;
    newBadge: string;
    recurring: string;
    overdueSince: (date: string) => string;
    dueOn: (date: string) => string;
    waitingSince: (days: number) => string;
    priorityTitle: (label: string) => string;
  };

  // --- Toast messages ---
  toast: {
    statusChanged: (label: string) => string;
    priorityChanged: (label: string) => string;
    directionChanged: (label: string) => string;
    contextsChanged: string;
    topicDeleted: string;
    topicCreateError: string;
    topicUpdateError: string;
    topicDeleteError: string;
    noteAddError: string;
    noteUpdateError: string;
    undone: string;
    nothingToUndo: string;
    settingsSaved: string;
    settingsError: string;
    agendaCopied: string;
    agendaError: string;
    viewSaved: string;
    viewSaveError: string;
    viewDeleted: string;
    viewDeleteError: string;
    viewUpdateError: string;
    contextHasTopics: (count: number) => string;
    bulkUpdated: (count: number) => string;
    bulkUpdateError: string;
    bulkDeleted: (count: number) => string;
    bulkDeleteError: string;
    topicCopied: (count: number) => string;
    topicCopyError: string;
  };

  // --- Undo descriptions (main process) ---
  undo: {
    titleChanged: string;
    contextsChanged: string;
    dueDateChanged: string;
    followUpChanged: string;
    topicUpdated: string;
    topicDeleted: string;
  };

  // --- Errors (main process) ---
  errors: {
    topicCreateFailed: string;
    topicUpdateFailed: string;
    topicDeleteFailed: string;
    noteAddFailed: string;
    noteUpdateFailed: string;
    noTopicsForBulkUpdate: string;
    invalidBulkData: string;
    noTopicsForBulkDelete: string;
    noTopicsForReorder: string;
    invalidDuplicateParams: string;
    duplicateFailed: string;
    nothingToUndo: string;
    undoFailed: string;
    contextLoadFailed: string;
    contextCreateFailed: string;
    contextUpdateFailed: string;
    contextDeleteFailed: string;
    groupsLoadFailed: string;
    groupCreateFailed: string;
    groupRenameFailed: string;
    groupDeleteFailed: string;
    groupsReorderFailed: string;
    contextMoveFailed: string;
    contextsReorderFailed: string;
    systemCountsFailed: string;
    agendaContextRequired: string;
    agendaFailed: string;
    contextBackupLoaded: string;
    directoryLost: string;
    directoryLostDetail: string;
  };

  // --- Agenda (main process) ---
  agenda: {
    waitingSince: (days: number) => string;
    dueOn: (date: string) => string;
    lastUpdate: (date: string, content: string) => string;
  };

  // --- Welcome screen ---
  welcome: {
    title: string;
    subtitle: string;
    setupNew: string;
    setupNewHint: string;
    openExisting: string;
    openExistingHint: string;
    errorUnreachable: (path: string) => string;
    errorInvalid: (path: string) => string;
    errorNotEmpty: string;
    setupAnyway: string;
    setupAnywayHint: string;
    errorMissingContexts: string;
    errorMissingTopics: string;
    chooseAnother: string;
    setupOrChoose: string;
    back: string;
    initializing: string;
  };

  // --- Common ---
  common: {
    cancel: string;
    close: string;
    delete: string;
    save: string;
    noContext: string;
    allTopics: string;
  };
}
