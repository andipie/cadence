import type { Translations } from './types';

export const en: Translations = {
  // --- Domain value labels ---
  status: {
    neu: 'New',
    'follow-up': 'Follow-Up',
    warten: 'Waiting',
    erledigt: 'Done',
  },
  priority: {
    hoch: 'High',
    mittel: 'Medium',
    normal: 'Low',
  },
  direction: {
    ansprechen: 'Discuss',
    liefern: 'Deliver',
    warten: 'Waiting',
  },
  contextType: {
    person: 'Person',
    meeting: 'Meeting',
    group: 'Group',
    place: 'Place',
    other: 'Other',
  },
  recurringInterval: {
    weekly: 'Weekly',
    biweekly: 'Biweekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
  },

  // --- Navigation ---
  nav: {
    inbox: 'Inbox',
    inboxTooltip: 'Topics without context assignment',
    liefern: 'Deliver',
    liefernTooltip: 'All open topics you need to deliver',
    overdue: 'Overdue',
    overdueTooltip: 'Topics past their due date',
    freeView: 'Free View',
    freeViewTooltip: 'Search and filter all topics',
    savedViews: 'Saved Views',
    savedViewsShow: 'Show saved views',
    savedViewsHide: 'Hide saved views',
    viewDeleteTooltip: 'Delete view',
    viewRenameHint: 'Double-click to rename',
    ungrouped: 'Ungrouped',
    dropUngrouped: 'Drop here for "Ungrouped"',
    newGroup: '+ New Group',
    newGroupPlaceholder: 'Group name…',
    newContext: '+ Create Context',
    contextPlaceholder: 'Context name…',
  },

  // --- Topic list ---
  topicList: {
    selectTopic: 'Select a topic',
    selectTopicHint: 'Select a topic from the list to see details.',
    selectContext: 'Select a context',
    selectContextHint: 'Select a context from the sidebar.',
    loading: 'Loading…',
    noTopics: 'No topics found.',
    allDone: 'All cleaned up.',
    noOverdue: 'No overdue topics.',
    nothingToDeliver: 'Nothing to deliver — all done!',
    noOpenTopics: 'No open topics.',
    tryOtherFilters: 'Try other filters or reset all.',
    completedExists: (count: number): string =>
      `${count} completed topic${count !== 1 ? 's' : ''} available.`,
    resultsCount: (count: number): string =>
      `${count} result${count !== 1 ? 's' : ''}`,
    openCount: (count: number): string =>
      `${count} open topic${count !== 1 ? 's' : ''}`,
    newTopicPlaceholder: 'Add new topic… (⌘N)',
    newTopicInboxPlaceholder: 'New topic in Inbox… (Esc to cancel)',
    newTopicQuick: 'Create new topic quickly (⌘N)',
    multiSelect: 'Multi-select',
    multiSelectEnd: 'End multi-select',
    agenda: 'Agenda',
    agendaTooltip: 'Copy agenda to clipboard (⌘⇧A)',
  },

  // --- Filter ---
  filter: {
    search: 'Search…',
    searchTooltip: 'Full-text search across all topics',
    status: 'Status',
    priority: 'Priority',
    direction: 'Direction',
    context: 'Context',
    due: 'Due:',
    dueFrom: 'Due from (earliest date)',
    dueTo: 'Due until (latest date)',
    groupBy: 'Group by:',
    groupByTooltip: 'Group topics by',
    sortBy: 'Sort by:',
    sortByTooltip: 'Sort topics by',
    resetAll: 'Reset all filters',
    saveView: 'Save View',
    viewNamePlaceholder: 'View name…',
    saveViewTooltip: 'Save current filters as view',
    groupByDirection: 'Direction',
    groupByStatus: 'Status',
    groupByPriority: 'Priority',
    groupByContext: 'Context',
    groupByNone: 'None',
    sortByPriority: 'Priority',
    sortByDueDate: 'Due date',
    sortByCreatedAt: 'Created at',
    sortByUpdatedAt: 'Updated at',
    dueOverdue: 'Overdue',
    dueToday: 'Today',
    dueTomorrow: 'Tomorrow',
    dueThisWeek: 'This Week',
    dueNextWeek: 'Next Week',
    dueLater: 'Later',
    dueNone: 'No due date',
    tomorrow: 'Tomorrow',
    oneWeek: '1 Week',
    twoWeeks: '2 Weeks',
    noDueDate: 'No due date',
    dueDateFilterTooltip: (label: string): string =>
      `Only topics due by ${label.toLowerCase()}`,
    reset: 'Reset',
  },

  // --- Filter chips ---
  chips: {
    status: (label: string): string => `Status: ${label}`,
    priority: (label: string): string => `Priority: ${label}`,
    direction: (label: string): string => `Direction: ${label}`,
    context: (name: string): string => `Context: ${name}`,
    search: (query: string): string => `Search: "${query}"`,
    dueAfter: (date: string): string => `Due from: ${date}`,
    dueBefore: (date: string): string => `Due until: ${date}`,
    removeFilter: 'Remove filter',
  },

  // --- Detail panel ---
  detail: {
    selectTopic: 'Select a topic',
    selectTopicHint: 'Select a topic from the list to see details.',
    loading: 'Loading…',
    notes: 'Notes',
    editHint: 'Click to edit',
    statusLabel: 'Status',
    statusTooltip: 'Change topic status',
    priorityLabel: 'Priority',
    priorityTooltip: 'Change priority (⌘1 High, ⌘2 Medium, ⌘3 Low)',
    directionLabel: 'Direction',
    directionTooltip: 'Change direction: Discuss, Deliver, or Waiting',
    dueLabel: 'Due',
    dueToggleTooltip: 'Enable/disable due date',
    dueDateTooltip: 'Set or change due date',
    dueRemoveTooltip: 'Remove due date',
    noDate: 'No date',
    followUpLabel: 'Follow-up',
    followUpToggleTooltip: 'Enable/disable follow-up',
    followUpDateTooltip: 'Set follow-up date',
    followUpRemoveTooltip: 'Remove follow-up',
    followUpWeeks: (weeks: number): string =>
      `Follow-up in ${weeks} week${weeks !== 1 ? 's' : ''}`,
    noFollowUp: 'No follow-up',
    recurringLabel: 'Recurring',
    yes: 'Yes',
    no: 'No',
    intervalLabel: 'Interval',
    intervalTooltip: 'Choose recurrence interval',
    nextLabel: 'Next',
  },

  // --- Notes ---
  notes: {
    addButton: '+ Update',
    addTooltip: 'Add new entry (⌘U)',
    empty: 'No notes yet.',
    editHint: 'Click to edit',
    placeholder: 'Enter note…',
    imageAlt: 'Image',
  },

  // --- Action footer ---
  actions: {
    complete: '✓ Done',
    followUp: '↻ Follow-up',
    delete: 'Delete',
    deleteConfirm: 'Really delete?',
  },

  // --- Context tags ---
  contextTags: {
    label: 'Contexts',
    addTooltip: 'Add context',
    inboxWarning: 'Topic has no more contexts and will move to Inbox.',
  },

  // --- Context menu ---
  contextMenu: {
    rename: 'Rename context',
    renameAction: 'Rename',
    moveToGroup: 'Move to a different group',
    moveToGroupAction: 'Move to group',
    noGroup: 'No group',
    delete: 'Delete context',
    deleteAction: 'Delete',
    groupRename: 'Rename group',
    groupRenameAction: 'Rename',
    groupNewContext: 'Create new context in this group',
    groupNewContextAction: 'New Context',
    groupDelete: 'Delete group (contexts will not be deleted)',
    groupDeleteAction: 'Delete',
  },

  // --- Settings ---
  settings: {
    title: 'Settings',
    close: 'Close',
    dataDir: 'Data directory',
    dataDirHint: 'All data is loaded from this folder',
    dataDirChange: 'Change…',
    defaultPriority: 'Default priority',
    defaultPriorityHint: 'Priority for new topics',
    confirmDelete: 'Confirm delete',
    confirmDeleteHint: 'Show confirmation dialog before deleting',
    confirmComplete: 'Confirm complete',
    confirmCompleteHint: 'Show confirmation dialog before completing',
    warnWaitingDays: 'Waiting warning (days)',
    warnWaitingDaysHint: 'When to start warning about "Waiting" topics',
    warnWaitingCritical: 'Waiting critical (days)',
    warnWaitingCriticalHint: 'When to mark "Waiting" topics as critical',
    obsidianMode: 'Obsidian mode',
    obsidianModeHint: 'Add frontmatter aliases for Obsidian compatibility',
    language: 'Language',
    languageHint: 'User interface language',
    autoSaveHint: 'Changes are saved automatically.',
    dataDirSwitched: 'Data directory switched',
    dataDirSwitchError: 'Directory switch failed',
    dataDirSetupConfirm: 'This folder is not a Cadence data directory. Set it up?',
    dataDirNotAccessible: 'Directory not accessible',
    recentDirs: 'Recently used',
    recentDirsEmpty: 'No other directories',
    switchDirError: 'Directory switch failed',
    switchDirSuccess: 'Data directory switched',
  },

  // --- Top bar ---
  topBar: {
    overdue: 'overdue',
    inbox: 'Inbox',
    searchTooltip: 'Search (⌘K)',
    search: 'Search',
    settingsTooltip: 'Settings (⌘,)',
  },

  // --- Quick capture ---
  capture: {
    title: 'Quick Capture',
    topicPlaceholder: 'Enter topic…',
    contextPlaceholder: 'Context (optional)…',
    contextRemove: 'Remove context',
    hint: 'Enter = Save · Esc = Cancel',
  },

  // --- Command palette ---
  commandPalette: {
    placeholder: 'Search topics and contexts…',
    noResults: (query: string): string =>
      `No results for "${query}"`,
  },

  // --- Conflict banner ---
  conflict: {
    title: (count: number): string =>
      `⚠ ${count} sync conflict file${count !== 1 ? 's' : ''} found`,
    recheckTooltip: 'Recheck for conflicts',
    recheck: 'Recheck',
    close: 'Close',
    showInFinder: '— Show in Finder',
    showMore: (count: number): string =>
      `+${count} more`,
    showLess: 'Show less',
  },

  // --- Bulk toolbar ---
  bulk: {
    selected: (count: number): string => `${count} selected`,
    selectAll: 'Select all topics',
    selectAllShort: 'All',
    deselectAll: 'Deselect all',
    deselectAllShort: 'None',
    context: 'Context',
    priority: 'Priority',
    status: 'Status',
    direction: 'Direction',
    delete: 'Delete',
    deleteConfirmTitle: 'Delete topics?',
    deleteConfirmMessage: (count: number): string =>
      `${count} topic${count !== 1 ? 's' : ''} will be permanently deleted. This action cannot be undone.`,
    cancel: 'Cancel',
    changeLabel: (label: string): string => `Change ${label}`,
  },

  // --- Topic row ---
  topicRow: {
    dragToSort: 'Drag to sort',
    selectForBulk: 'Select topic for bulk action',
    followUpOn: (date: string): string => `Follow-up on ${date}`,
    followUpDue: 'Follow-up due',
    followUp: 'Follow-Up',
    newTopic: 'New topic — not yet processed',
    newBadge: 'New',
    recurring: 'Recurring',
    overdueSince: (date: string): string => `Overdue since ${date}`,
    dueOn: (date: string): string => `Due on ${date}`,
    waitingSince: (days: number): string =>
      `Waiting for ${days} day${days !== 1 ? 's' : ''}`,
    priorityTitle: (label: string): string => `Priority: ${label}`,
  },

  // --- Toast messages ---
  toast: {
    statusChanged: (label: string): string => `Status → ${label}`,
    priorityChanged: (label: string): string => `Priority → ${label}`,
    directionChanged: (label: string): string => `Direction → ${label}`,
    contextsChanged: 'Contexts changed',
    topicDeleted: 'Topic deleted',
    topicCreateError: 'Could not create topic',
    topicUpdateError: 'Could not update topic',
    topicDeleteError: 'Could not delete topic',
    noteAddError: 'Could not add note',
    noteUpdateError: 'Could not update note',
    undone: 'Undone',
    nothingToUndo: 'Nothing to undo',
    settingsSaved: 'Settings saved',
    settingsError: 'Could not save settings',
    agendaCopied: 'Agenda copied',
    agendaError: 'Could not generate agenda',
    viewSaved: 'View saved',
    viewSaveError: 'Could not save view',
    viewDeleted: 'View deleted',
    viewDeleteError: 'Could not delete view',
    viewUpdateError: 'Could not update view',
    contextHasTopics: (count: number): string =>
      `Context still has ${count} topic${count !== 1 ? 's' : ''}. Please move or delete topics first.`,
    bulkUpdated: (count: number): string =>
      `${count} topic${count !== 1 ? 's' : ''} updated`,
    bulkUpdateError: 'Bulk update failed',
    bulkDeleted: (count: number): string =>
      `${count} topic${count !== 1 ? 's' : ''} deleted`,
    bulkDeleteError: 'Bulk delete failed',
    topicCopied: (count: number): string =>
      count === 1
        ? 'Topic copied to 1 context'
        : `Topic copied to ${count} contexts`,
    topicCopyError: 'Could not copy topic',
  },

  // --- Undo descriptions ---
  undo: {
    titleChanged: 'Title changed',
    contextsChanged: 'Contexts changed',
    dueDateChanged: 'Due date changed',
    followUpChanged: 'Follow-up changed',
    topicUpdated: 'Topic updated',
    topicDeleted: 'Topic deleted',
  },

  // --- Errors (main process) ---
  errors: {
    topicCreateFailed: 'Could not create topic',
    topicUpdateFailed: 'Could not update topic',
    topicDeleteFailed: 'Could not delete topic',
    noteAddFailed: 'Could not add note',
    noteUpdateFailed: 'Could not update note',
    noTopicsForBulkUpdate: 'No topics specified for update',
    invalidBulkData: 'Invalid update data',
    noTopicsForBulkDelete: 'No topics specified for deletion',
    noTopicsForReorder: 'No topics specified for reordering',
    invalidDuplicateParams: 'Invalid duplicate parameters',
    duplicateFailed: 'Could not duplicate topic',
    nothingToUndo: 'Nothing to undo',
    undoFailed: 'Undo failed',
    contextLoadFailed: 'Could not load contexts',
    contextCreateFailed: 'Could not create context',
    contextUpdateFailed: 'Could not update context',
    contextDeleteFailed: 'Could not delete context',
    groupsLoadFailed: 'Could not load groups',
    groupCreateFailed: 'Could not create group',
    groupRenameFailed: 'Could not rename group',
    groupDeleteFailed: 'Could not delete group',
    groupsReorderFailed: 'Could not reorder groups',
    contextMoveFailed: 'Could not move context',
    contextsReorderFailed: 'Could not reorder contexts',
    systemCountsFailed: 'Could not load system counts',
    agendaContextRequired: 'Context ID is required',
    agendaFailed: 'Could not generate agenda',
    contextBackupLoaded: 'Context configuration was corrupted. Backup has been loaded.',
    directoryLost: 'Data directory no longer accessible',
    directoryLostDetail: 'Please switch directories or check the connection.',
  },

  // --- Agenda ---
  agenda: {
    waitingSince: (days: number): string =>
      `Waiting for ${days} day${days !== 1 ? 's' : ''}`,
    dueOn: (date: string): string => `Due: ${date}`,
    lastUpdate: (date: string, content: string): string =>
      `Last update (${date}): ${content}`,
  },

  // --- Welcome screen ---
  welcome: {
    title: 'Welcome to Cadence',
    subtitle: 'Personal context-based topic tracking',
    setupNew: 'Set up new data directory',
    setupNewHint: 'Creates the required folder structure in a directory of your choice.',
    openExisting: 'Open existing data directory',
    openExistingHint: 'Choose a folder with existing Cadence data.',
    errorUnreachable: (path: string): string =>
      `The data directory "${path}" is not reachable. The folder may have been deleted or a drive may not be mounted.`,
    errorInvalid: (path: string): string =>
      `The directory "${path}" is not a valid Cadence data directory.`,
    errorNotEmpty: 'The selected folder is not empty. Set up anyway? Only Cadence subfolders will be created, existing files will not be modified.',
    setupAnyway: 'Set up anyway',
    setupAnywayHint: 'Existing files will not be modified.',
    errorMissingContexts: 'The file contexts/contexts.yaml is missing.',
    errorMissingTopics: 'The folder topics/ is missing.',
    chooseAnother: 'Choose another directory',
    setupOrChoose: 'Set up or choose another',
    back: 'Back',
    initializing: 'Initializing…',
  },

  // --- Common ---
  common: {
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    save: 'Save',
    noContext: 'No context',
    allTopics: 'All topics',
  },
};
