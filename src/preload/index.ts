import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';
import type {
  TopicFilter,
  CreateTopicInput,
  UpdateTopicInput,
  CreateContextInput,
  UpdateContextInput,
  CreateViewInput,
  UpdateViewInput,
  Settings,
  Topic,
  AppError
} from '../shared/types';

contextBridge.exposeInMainWorld('api', {
  topics: {
    list: (filter: TopicFilter) => ipcRenderer.invoke(IPC.TOPICS_LIST, filter),
    get: (id: string) => ipcRenderer.invoke(IPC.TOPICS_GET, id),
    create: (data: CreateTopicInput) => ipcRenderer.invoke(IPC.TOPICS_CREATE, data),
    update: (id: string, data: UpdateTopicInput) => ipcRenderer.invoke(IPC.TOPICS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.TOPICS_DELETE, id),
    bulkUpdate: (ids: string[], data: Partial<UpdateTopicInput>) => ipcRenderer.invoke(IPC.TOPICS_BULK_UPDATE, ids, data),
    bulkDelete: (ids: string[]) => ipcRenderer.invoke(IPC.TOPICS_BULK_DELETE, ids),
    reorder: (ids: string[], groupKey: string) => ipcRenderer.invoke(IPC.TOPICS_REORDER, ids, groupKey),
    addNote: (id: string, content: string) => ipcRenderer.invoke(IPC.TOPICS_ADD_NOTE, id, content),
    updateNote: (id: string, noteIndex: number, content: string) => ipcRenderer.invoke(IPC.TOPICS_UPDATE_NOTE, id, noteIndex, content),
    deleteNote: (id: string, noteIndex: number) => ipcRenderer.invoke(IPC.TOPICS_DELETE_NOTE, id, noteIndex),
    updateBody: (id: string, body: string) => ipcRenderer.invoke(IPC.TOPICS_UPDATE_BODY, id, body),
    duplicate: (sourceId: string, targetContexts: string[]) => ipcRenderer.invoke(IPC.TOPICS_DUPLICATE, { sourceId, targetContexts }),
  },
  contexts: {
    list: () => ipcRenderer.invoke(IPC.CONTEXTS_LIST),
    create: (data: CreateContextInput) => ipcRenderer.invoke(IPC.CONTEXTS_CREATE, data),
    update: (id: string, data: UpdateContextInput) => ipcRenderer.invoke(IPC.CONTEXTS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.CONTEXTS_DELETE, id),
    moveToGroup: (contextId: string, groupId: string | null) => ipcRenderer.invoke(IPC.CONTEXTS_MOVE_TO_GROUP, contextId, groupId),
    reorder: (groupId: string | null, contextIds: string[]) => ipcRenderer.invoke(IPC.CONTEXTS_REORDER, groupId, contextIds),
  },
  groups: {
    list: () => ipcRenderer.invoke(IPC.GROUPS_LIST),
    create: (name: string) => ipcRenderer.invoke(IPC.GROUPS_CREATE, name),
    update: (id: string, name: string) => ipcRenderer.invoke(IPC.GROUPS_UPDATE, id, name),
    delete: (id: string) => ipcRenderer.invoke(IPC.GROUPS_DELETE, id),
    reorder: (groupIds: string[]) => ipcRenderer.invoke(IPC.GROUPS_REORDER, groupIds),
  },
  views: {
    list: () => ipcRenderer.invoke(IPC.VIEWS_LIST),
    create: (data: CreateViewInput) => ipcRenderer.invoke(IPC.VIEWS_CREATE, data),
    update: (id: string, data: UpdateViewInput) => ipcRenderer.invoke(IPC.VIEWS_UPDATE, id, data),
    delete: (id: string) => ipcRenderer.invoke(IPC.VIEWS_DELETE, id),
  },
  attachments: {
    save: (topicSlug: string, base64Data: string, mimeType: string) => ipcRenderer.invoke(IPC.ATTACHMENTS_SAVE, topicSlug, base64Data, mimeType),
  },
  search: {
    global: (query: string) => ipcRenderer.invoke(IPC.SEARCH_GLOBAL, query),
  },
  agenda: {
    generate: (contextId: string) => ipcRenderer.invoke(IPC.AGENDA_GENERATE, contextId),
  },
  startup: {
    getState: () => ipcRenderer.invoke(IPC.STARTUP_GET_STATE),
    pickFolder: () => ipcRenderer.invoke(IPC.STARTUP_PICK_FOLDER),
    setupDir: (dirPath: string, force: boolean) => ipcRenderer.invoke(IPC.STARTUP_SETUP_DIR, dirPath, force),
    openDir: (dirPath: string) => ipcRenderer.invoke(IPC.STARTUP_OPEN_DIR, dirPath),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
    update: (data: Partial<Settings>) => ipcRenderer.invoke(IPC.SETTINGS_UPDATE, data),
    switchDir: () => ipcRenderer.invoke(IPC.SETTINGS_SWITCH_DIR),
    mruList: () => ipcRenderer.invoke(IPC.SETTINGS_MRU_LIST),
    switchToDir: (dirPath: string) => ipcRenderer.invoke(IPC.SETTINGS_SWITCH_TO_DIR, dirPath),
  },
  system: {
    rebuildIndex: () => ipcRenderer.invoke(IPC.INDEX_REBUILD),
    healthCheck: () => ipcRenderer.invoke(IPC.HEALTH_CHECK),
    checkConflicts: () => ipcRenderer.invoke(IPC.CONFLICT_CHECK),
    showInFolder: (filePath: string) => ipcRenderer.invoke(IPC.SHOW_IN_FOLDER, filePath),
    undo: () => ipcRenderer.invoke(IPC.UNDO_LAST),
    getCounts: () => ipcRenderer.invoke(IPC.SYSTEM_COUNTS),
  },
  on: {
    fileChanged: (callback: (topic: Topic) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, topic: Topic): void => callback(topic);
      ipcRenderer.on(IPC.FILE_CHANGED, handler);
      return () => { ipcRenderer.removeListener(IPC.FILE_CHANGED, handler); };
    },
    conflictDetected: (callback: (files: string[]) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, files: string[]): void => callback(files);
      ipcRenderer.on(IPC.CONFLICT_DETECTED, handler);
      return () => { ipcRenderer.removeListener(IPC.CONFLICT_DETECTED, handler); };
    },
    error: (callback: (error: AppError) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, error: AppError): void => callback(error);
      ipcRenderer.on(IPC.ERROR_OCCURRED, handler);
      return () => { ipcRenderer.removeListener(IPC.ERROR_OCCURRED, handler); };
    },
    captureShow: (callback: () => void) => {
      const handler = (): void => callback();
      ipcRenderer.on(IPC.CAPTURE_SHOW, handler);
      return () => { ipcRenderer.removeListener(IPC.CAPTURE_SHOW, handler); };
    },
  },
});
