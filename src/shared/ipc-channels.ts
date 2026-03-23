export const IPC = {
  // Topics
  TOPICS_LIST:          'topics:list',
  TOPICS_GET:           'topics:get',
  TOPICS_CREATE:        'topics:create',
  TOPICS_UPDATE:        'topics:update',
  TOPICS_DELETE:        'topics:delete',
  TOPICS_BULK_UPDATE:   'topics:bulk-update',
  TOPICS_BULK_DELETE:   'topics:bulk-delete',
  TOPICS_REORDER:       'topics:reorder',
  TOPICS_ADD_NOTE:      'topics:add-note',
  TOPICS_UPDATE_NOTE:   'topics:update-note',
  TOPICS_DELETE_NOTE:   'topics:delete-note',
  TOPICS_UPDATE_BODY:   'topics:update-body',
  TOPICS_DUPLICATE:     'topics:duplicate',

  // Attachments
  ATTACHMENTS_SAVE:     'attachments:save',

  // Contexts
  CONTEXTS_LIST:        'contexts:list',
  CONTEXTS_CREATE:      'contexts:create',
  CONTEXTS_UPDATE:      'contexts:update',
  CONTEXTS_DELETE:      'contexts:delete',
  GROUPS_LIST:          'groups:list',
  GROUPS_CREATE:        'groups:create',
  GROUPS_UPDATE:        'groups:update',
  GROUPS_DELETE:        'groups:delete',
  GROUPS_REORDER:       'groups:reorder',
  CONTEXTS_MOVE_TO_GROUP: 'contexts:move-to-group',
  CONTEXTS_REORDER:     'contexts:reorder',
  SYSTEM_COUNTS:        'system:counts',

  // Views
  VIEWS_LIST:           'views:list',
  VIEWS_CREATE:         'views:create',
  VIEWS_UPDATE:         'views:update',
  VIEWS_DELETE:         'views:delete',

  // Search
  SEARCH_GLOBAL:        'search:global',

  // Agenda
  AGENDA_GENERATE:      'agenda:generate',

  // Undo
  UNDO_LAST:            'undo:last',

  // System
  SETTINGS_GET:         'settings:get',
  SETTINGS_UPDATE:      'settings:update',
  SETTINGS_SWITCH_DIR:  'settings:switch-dir',
  SETTINGS_MRU_LIST:    'settings:mru-list',
  SETTINGS_SWITCH_TO_DIR: 'settings:switch-to-dir',
  CONFLICT_CHECK:       'conflict:check',
  SHOW_IN_FOLDER:       'system:show-in-folder',
  INDEX_REBUILD:        'index:rebuild',
  HEALTH_CHECK:         'system:health-check',

  // Startup
  STARTUP_GET_STATE:    'startup:get-state',
  STARTUP_PICK_FOLDER:  'startup:pick-folder',
  STARTUP_SETUP_DIR:    'startup:setup-dir',
  STARTUP_OPEN_DIR:     'startup:open-dir',

  // Capture
  CAPTURE_SHOW:         'capture:show',

  // Events (Main → Renderer)
  FILE_CHANGED:         'event:file-changed',
  CONFLICT_DETECTED:    'event:conflict-detected',
  ERROR_OCCURRED:       'event:error',
} as const;
