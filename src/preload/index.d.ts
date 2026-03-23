import type {
  Topic,
  TopicDetail,
  TopicFilter,
  CreateTopicInput,
  UpdateTopicInput,
  Context,
  ContextGroup,
  CreateContextInput,
  UpdateContextInput,
  SavedView,
  CreateViewInput,
  UpdateViewInput,
  SearchResult,
  Settings,
  StartupState,
  SetupDirResult,
  SwitchDirResult,
  AppError
} from '../shared/types';

export interface ElectronAPI {
  topics: {
    list: (filter: TopicFilter) => Promise<Topic[]>;
    get: (id: string) => Promise<TopicDetail>;
    create: (data: CreateTopicInput) => Promise<Topic>;
    update: (id: string, data: UpdateTopicInput) => Promise<Topic>;
    delete: (id: string) => Promise<void>;
    bulkUpdate: (ids: string[], data: Partial<UpdateTopicInput>) => Promise<Topic[]>;
    bulkDelete: (ids: string[]) => Promise<void>;
    reorder: (ids: string[], groupKey: string) => Promise<void>;
    addNote: (id: string, content: string) => Promise<TopicDetail>;
    updateNote: (id: string, noteIndex: number, content: string) => Promise<TopicDetail>;
    deleteNote: (id: string, noteIndex: number) => Promise<TopicDetail>;
    updateBody: (id: string, body: string) => Promise<TopicDetail>;
    duplicate: (sourceId: string, targetContexts: string[]) => Promise<Topic[]>;
  };
  contexts: {
    list: () => Promise<Context[]>;
    create: (data: CreateContextInput) => Promise<Context>;
    update: (id: string, data: UpdateContextInput) => Promise<Context>;
    delete: (id: string) => Promise<void>;
    moveToGroup: (contextId: string, groupId: string | null) => Promise<void>;
    reorder: (groupId: string | null, contextIds: string[]) => Promise<void>;
  };
  groups: {
    list: () => Promise<{ groups: ContextGroup[]; ungrouped: Context[] }>;
    create: (name: string) => Promise<ContextGroup>;
    update: (id: string, name: string) => Promise<ContextGroup>;
    delete: (id: string) => Promise<void>;
    reorder: (groupIds: string[]) => Promise<void>;
  };
  views: {
    list: () => Promise<SavedView[]>;
    create: (data: CreateViewInput) => Promise<SavedView>;
    update: (id: string, data: UpdateViewInput) => Promise<SavedView>;
    delete: (id: string) => Promise<void>;
  };
  attachments: {
    save: (topicSlug: string, base64Data: string, mimeType: string) => Promise<string>;
  };
  search: {
    global: (query: string) => Promise<SearchResult[]>;
  };
  agenda: {
    generate: (contextId: string) => Promise<string>;
  };
  startup: {
    getState: () => Promise<StartupState>;
    pickFolder: () => Promise<string | null>;
    setupDir: (dirPath: string, force: boolean) => Promise<SetupDirResult>;
    openDir: (dirPath: string) => Promise<SetupDirResult>;
  };
  settings: {
    get: () => Promise<Settings>;
    update: (data: Partial<Settings>) => Promise<Settings>;
    switchDir: () => Promise<SwitchDirResult>;
    mruList: () => Promise<string[]>;
    switchToDir: (dirPath: string) => Promise<SwitchDirResult>;
  };
  system: {
    rebuildIndex: () => Promise<void>;
    healthCheck: () => Promise<AppError[]>;
    checkConflicts: () => Promise<string[]>;
    showInFolder: (filePath: string) => Promise<void>;
    undo: () => Promise<void>;
    getCounts: () => Promise<{ inbox: number; overdue: number }>;
  };
  on: {
    fileChanged: (callback: (topic: Topic) => void) => () => void;
    conflictDetected: (callback: (files: string[]) => void) => () => void;
    error: (callback: (error: AppError) => void) => () => void;
    captureShow: (callback: () => void) => () => void;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
