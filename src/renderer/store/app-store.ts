import { create } from 'zustand';
import type { Context, ContextGroup, Topic, TopicDetail, CreateContextInput, UpdateContextInput, UpdateTopicInput, TopicFilter, AppErrorSeverity, SavedView, UpdateViewInput, Settings, StartupState } from '@shared/types';
import { getTranslations } from '@shared/locales';
import type { Translations } from '@shared/locales/types';

function toastDescription(data: UpdateTopicInput, t: Translations): string | null {
  if (data.status) return t.toast.statusChanged(t.status[data.status] ?? data.status);
  if (data.priority) return t.toast.priorityChanged(t.priority[data.priority] ?? data.priority);
  if (data.direction) return t.toast.directionChanged(t.direction[data.direction] ?? data.direction);
  if (data.contexts) return t.toast.contextsChanged;
  return null;
}

interface AppState {
  // Startup
  appReady: boolean;
  startupState: StartupState | null;
  loadStartupState: () => Promise<void>;
  completeStartup: () => void;

  // Navigation
  activeView: 'context' | 'inbox' | 'overdue' | 'liefern' | 'free-view' | 'saved-view';
  activeContextId: string | null;
  selectedTopicId: string | null;

  // Context data
  contexts: Context[];
  groups: ContextGroup[];
  ungroupedContexts: Context[];
  systemCounts: { inbox: number; overdue: number; liefern: number };

  // Topic data
  topics: Topic[];
  topicsLoading: boolean;

  // Navigation actions
  setActiveView: (view: AppState['activeView']) => void;
  setActiveContext: (id: string | null) => void;
  selectTopic: (id: string | null) => void;

  // Context data actions
  loadGroups: () => Promise<void>;
  loadSystemCounts: () => Promise<void>;
  createContext: (input: CreateContextInput) => Promise<void>;
  updateContext: (id: string, input: UpdateContextInput) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;

  // Group management actions
  createGroup: (name: string) => Promise<void>;
  renameGroup: (id: string, name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  moveContextToGroup: (contextId: string, groupId: string | null) => Promise<void>;
  reorderContextsInGroup: (groupId: string | null, contextIds: string[]) => Promise<void>;
  reorderGroups: (groupIds: string[]) => Promise<void>;

  // Topic data actions
  loadTopics: () => Promise<void>;
  createTopic: (title: string) => Promise<void>;
  createTopicInInbox: (title: string) => Promise<void>;

  // Detail panel
  selectedTopic: TopicDetail | null;
  selectedTopicLoading: boolean;
  loadSelectedTopic: () => Promise<void>;
  updateTopic: (id: string, data: UpdateTopicInput) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;

  // Quick-add focus mechanism
  quickAddFocusKey: number;
  quickAddInboxMode: boolean;
  triggerQuickAddFocus: () => void;
  triggerQuickAddInbox: () => void;
  resetQuickAddInbox: () => void;

  // Action shortcuts
  markCompleteFocusKey: number;
  followUpFocusKey: number;
  triggerMarkComplete: () => void;
  triggerFollowUp: () => void;

  // Keyboard navigation
  navigateUp: () => void;
  navigateDown: () => void;
  deselectTopic: () => void;

  // Free View filter
  freeViewFilter: TopicFilter;
  setFreeViewFilter: (filter: TopicFilter) => void;
  updateFreeViewFilter: (partial: Partial<TopicFilter>) => void;
  resetFreeViewFilter: () => void;

  // Liefern View filter
  liefernFilter: { contexts?: string[]; dueBefore?: string; includeNoDueDate: boolean };
  updateLiefernFilter: (partial: Partial<{ contexts?: string[]; dueBefore?: string; includeNoDueDate: boolean }>) => void;
  resetLiefernFilter: () => void;

  // Saved Views
  savedViews: SavedView[];
  activeSavedViewId: string | null;
  loadSavedViews: () => Promise<void>;
  createSavedView: (name: string) => Promise<void>;
  updateSavedView: (id: string, data: UpdateViewInput) => Promise<void>;
  deleteSavedView: (id: string) => Promise<void>;
  activateSavedView: (view: SavedView) => void;

  // Agenda
  generateAgenda: () => Promise<void>;

  // Notes
  addNote: (content: string) => Promise<void>;
  updateNote: (noteIndex: number, content: string) => Promise<void>;
  addNoteFocusKey: number;
  triggerAddNote: () => void;

  // Toast + Undo
  toast: { message: string; severity: AppErrorSeverity; undoable: boolean } | null;
  showToast: (message: string, options?: { undoable?: boolean; severity?: AppErrorSeverity }) => void;
  dismissToast: () => void;
  undoLastAction: () => Promise<void>;

  // Critical error (persistent banner)
  criticalError: { message: string; detail?: string } | null;
  setCriticalError: (message: string, detail?: string) => void;
  clearCriticalError: () => void;

  // Command Palette
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // Multi-Select / Bulk Operations
  multiSelectMode: boolean;
  selectedTopicIds: string[];
  toggleMultiSelect: () => void;
  toggleTopicSelection: (id: string) => void;
  selectAllTopics: () => void;
  clearSelection: () => void;
  bulkUpdateTopics: (data: Partial<UpdateTopicInput>) => Promise<void>;
  bulkDeleteTopics: () => Promise<void>;

  // Drag & Drop reorder
  reorderTopics: (ids: string[], groupKey: string) => Promise<void>;

  // Topic duplication (cross-panel drag & drop)
  duplicateTopicToContexts: (topicId: string, contextIds: string[]) => Promise<void>;

  // Sync conflict warning
  conflictFiles: string[];
  conflictDismissed: boolean;
  setConflictFiles: (files: string[]) => void;
  dismissConflicts: () => void;
  recheckConflicts: () => Promise<void>;

  // Settings
  settings: Settings | null;
  settingsOpen: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  openSettings: () => void;
  closeSettings: () => void;

  // Data directory switching
  switchDataDir: () => Promise<void>;
  switchToKnownDir: (dirPath: string) => Promise<void>;
  setupAndSwitchDir: (dirPath: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Startup
  appReady: false,
  startupState: null,
  loadStartupState: async () => {
    try {
      const state = await window.api.startup.getState();
      if (state.state === 'ready') {
        set({ startupState: state, appReady: true });
        // Trigger normal app initialization
        get().loadSettings();
        get().loadGroups();
        get().loadSystemCounts();
      } else {
        set({ startupState: state });
      }
    } catch {
      set({ startupState: { state: 'no-dir' } });
    }
  },
  completeStartup: () => {
    set({ appReady: true });
    // Trigger normal app initialization
    get().loadSettings();
    get().loadGroups();
    get().loadSystemCounts();
  },

  // Navigation state
  activeView: 'context',
  activeContextId: null,
  selectedTopicId: null,

  // Context data
  contexts: [],
  groups: [],
  ungroupedContexts: [],
  systemCounts: { inbox: 0, overdue: 0, liefern: 0 },

  // Topic data
  topics: [],
  topicsLoading: false,

  // Detail panel
  selectedTopic: null,
  selectedTopicLoading: false,

  // Quick-add
  quickAddFocusKey: 0,
  quickAddInboxMode: false,

  // Action shortcuts
  markCompleteFocusKey: 0,
  followUpFocusKey: 0,

  // Free View filter
  freeViewFilter: {},

  // Liefern View filter
  liefernFilter: { includeNoDueDate: true },

  // Saved Views
  savedViews: [],
  activeSavedViewId: null,

  // Notes
  addNoteFocusKey: 0,

  // Toast + Undo
  toast: null,

  // Critical error
  criticalError: null,

  // Navigation actions
  setActiveView: (view) => {
    set({ activeView: view, selectedTopicId: null });
    // Load topics for system views and free view
    if (view === 'inbox' || view === 'overdue' || view === 'liefern' || view === 'free-view') {
      get().loadTopics();
    }
  },

  setActiveContext: (id) => {
    set({ activeContextId: id, activeView: 'context', selectedTopicId: null });
    if (id) {
      get().loadTopics();
    } else {
      set({ topics: [] });
    }
  },

  selectTopic: (id) => {
    set({ selectedTopicId: id, selectedTopic: null });
    if (id) {
      get().loadSelectedTopic();
    }
  },

  // Keyboard navigation actions
  navigateUp: () => {
    const { topics, selectedTopicId } = get();
    if (topics.length === 0) return;
    if (!selectedTopicId) {
      // Nothing selected → select last item
      get().selectTopic(topics[topics.length - 1].id);
      return;
    }
    const currentIndex = topics.findIndex((t) => t.id === selectedTopicId);
    if (currentIndex > 0) {
      get().selectTopic(topics[currentIndex - 1].id);
    }
    // At top of list → do nothing (no wrap)
  },

  navigateDown: () => {
    const { topics, selectedTopicId } = get();
    if (topics.length === 0) return;
    if (!selectedTopicId) {
      // Nothing selected → select first item
      get().selectTopic(topics[0].id);
      return;
    }
    const currentIndex = topics.findIndex((t) => t.id === selectedTopicId);
    if (currentIndex < topics.length - 1) {
      get().selectTopic(topics[currentIndex + 1].id);
    }
    // At bottom of list → do nothing (no wrap)
  },

  deselectTopic: () => {
    set({ selectedTopicId: null, selectedTopic: null });
  },

  // Context data actions
  loadGroups: async () => {
    const result = await window.api.groups.list();
    const allContexts: Context[] = [];
    for (const group of result.groups) {
      allContexts.push(...group.contexts);
    }
    allContexts.push(...result.ungrouped);

    set({
      groups: result.groups,
      ungroupedContexts: result.ungrouped,
      contexts: allContexts,
    });
  },

  loadSystemCounts: async () => {
    const counts = await window.api.system.getCounts();
    set({ systemCounts: counts });
  },

  createContext: async (input) => {
    await window.api.contexts.create(input);
    await useAppStore.getState().loadGroups();
  },

  updateContext: async (id, input) => {
    await window.api.contexts.update(id, input);
    await useAppStore.getState().loadGroups();
  },

  deleteContext: async (id) => {
    const state = useAppStore.getState();

    // Find the context to check topic count
    let topicCount = 0;
    for (const g of state.groups) {
      const ctx = g.contexts.find((c) => c.id === id);
      if (ctx) { topicCount = ctx.topicCount ?? 0; break; }
    }
    if (topicCount === 0) {
      const ctx = state.ungroupedContexts.find((c) => c.id === id);
      if (ctx) topicCount = ctx.topicCount ?? 0;
    }

    if (topicCount > 0) {
      const t = getTranslations(get().settings?.language ?? 'de');
      state.showToast(t.toast.contextHasTopics(topicCount), { severity: 'warning' });
      return;
    }

    await window.api.contexts.delete(id);
    if (state.activeContextId === id) {
      set({ activeContextId: null, topics: [] });
    }
    await state.loadGroups();
  },

  createGroup: async (name) => {
    await window.api.groups.create(name);
    await useAppStore.getState().loadGroups();
  },

  renameGroup: async (id, name) => {
    await window.api.groups.update(id, name);
    await useAppStore.getState().loadGroups();
  },

  deleteGroup: async (id) => {
    await window.api.groups.delete(id);
    await useAppStore.getState().loadGroups();
  },

  moveContextToGroup: async (contextId, groupId) => {
    await window.api.contexts.moveToGroup(contextId, groupId);
    await useAppStore.getState().loadGroups();
  },

  reorderContextsInGroup: async (groupId, contextIds) => {
    await window.api.contexts.reorder(groupId, contextIds);
    await useAppStore.getState().loadGroups();
  },

  reorderGroups: async (groupIds) => {
    await window.api.groups.reorder(groupIds);
    await useAppStore.getState().loadGroups();
  },

  // Quick-add actions
  triggerQuickAddFocus: () => set((state) => ({ quickAddFocusKey: state.quickAddFocusKey + 1, quickAddInboxMode: false })),
  triggerQuickAddInbox: () => set((state) => ({ quickAddFocusKey: state.quickAddFocusKey + 1, quickAddInboxMode: true })),
  resetQuickAddInbox: () => set({ quickAddInboxMode: false }),

  // Action shortcut triggers
  triggerMarkComplete: () => set((state) => ({ markCompleteFocusKey: state.markCompleteFocusKey + 1 })),
  triggerFollowUp: () => set((state) => ({ followUpFocusKey: state.followUpFocusKey + 1 })),

  // Free View filter actions
  setFreeViewFilter: (filter) => {
    set({ freeViewFilter: filter });
    if (get().activeView === 'free-view') {
      get().loadTopics();
    }
  },

  updateFreeViewFilter: (partial) => {
    set((state) => ({ freeViewFilter: { ...state.freeViewFilter, ...partial }, activeSavedViewId: null }));
    if (get().activeView === 'free-view') {
      get().loadTopics();
    }
  },

  resetFreeViewFilter: () => {
    set({ freeViewFilter: {}, activeSavedViewId: null });
    if (get().activeView === 'free-view') {
      get().loadTopics();
    }
  },

  // Liefern View filter actions
  updateLiefernFilter: (partial) => {
    set((state) => ({ liefernFilter: { ...state.liefernFilter, ...partial } }));
    if (get().activeView === 'liefern') {
      get().loadTopics();
    }
  },

  resetLiefernFilter: () => {
    set({ liefernFilter: { includeNoDueDate: true } });
    if (get().activeView === 'liefern') {
      get().loadTopics();
    }
  },

  // Saved View actions
  loadSavedViews: async () => {
    try {
      const views = await window.api.views.list();
      set({ savedViews: views });
    } catch (err) {
      console.error('[AppStore] Failed to load saved views:', err);
    }
  },

  createSavedView: async (name) => {
    try {
      const filter = { ...get().freeViewFilter };
      await window.api.views.create({ name, filter });
      await get().loadSavedViews();
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.viewSaved);
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.viewSaveError;
      get().showToast(message, { severity: 'error' });
    }
  },

  updateSavedView: async (id, data) => {
    try {
      await window.api.views.update(id, data);
      await get().loadSavedViews();
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.viewUpdateError;
      get().showToast(message, { severity: 'error' });
    }
  },

  deleteSavedView: async (id) => {
    try {
      await window.api.views.delete(id);
      await get().loadSavedViews();
      // If the deleted view was active, clear
      if (get().activeSavedViewId === id) {
        set({ activeSavedViewId: null });
      }
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.viewDeleted);
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.viewDeleteError;
      get().showToast(message, { severity: 'error' });
    }
  },

  activateSavedView: (view) => {
    set({
      freeViewFilter: { ...view.filter },
      activeView: 'free-view',
      activeSavedViewId: view.id,
      selectedTopicId: null,
    });
    get().loadTopics();
  },

  // Agenda
  generateAgenda: async () => {
    const { activeView, activeContextId } = get();
    if (activeView !== 'context' || !activeContextId) return;

    try {
      const markdown = await window.api.agenda.generate(activeContextId);
      await navigator.clipboard.writeText(markdown);
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.agendaCopied);
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.agendaError;
      get().showToast(message, { severity: 'error' });
    }
  },

  // Note actions
  triggerAddNote: () => set((state) => ({ addNoteFocusKey: state.addNoteFocusKey + 1 })),

  addNote: async (content) => {
    const { selectedTopicId } = get();
    if (!selectedTopicId) return;
    try {
      const updated = await window.api.topics.addNote(selectedTopicId, content);
      set({ selectedTopic: updated });
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.noteAddError, { severity: 'error' });
    }
  },

  updateNote: async (noteIndex, content) => {
    const { selectedTopicId } = get();
    if (!selectedTopicId) return;
    try {
      const updated = await window.api.topics.updateNote(selectedTopicId, noteIndex, content);
      set({ selectedTopic: updated });
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.noteUpdateError, { severity: 'error' });
    }
  },

  // Toast + Undo actions
  showToast: (message, options) => {
    set({ toast: { message, severity: options?.severity ?? 'info', undoable: options?.undoable ?? false } });
  },

  dismissToast: () => {
    set({ toast: null });
  },

  // Critical error actions
  setCriticalError: (message, detail) => {
    set({ criticalError: { message, detail } });
  },

  clearCriticalError: () => {
    set({ criticalError: null });
  },

  undoLastAction: async () => {
    try {
      await window.api.system.undo();
      get().dismissToast();
      // Reload everything to reflect undo
      await get().loadTopics();
      await get().loadSystemCounts();
      await get().loadGroups();
      // Try to reload selected topic if one was selected
      const { selectedTopicId } = get();
      if (selectedTopicId) {
        await get().loadSelectedTopic();
      }
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.undone);
    } catch {
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.nothingToUndo, { severity: 'info' });
    }
  },

  // Detail panel actions
  loadSelectedTopic: async () => {
    const { selectedTopicId } = get();
    if (!selectedTopicId) {
      set({ selectedTopic: null, selectedTopicLoading: false });
      return;
    }

    set({ selectedTopicLoading: true });
    try {
      const detail = await window.api.topics.get(selectedTopicId);
      set({ selectedTopic: detail, selectedTopicLoading: false });
    } catch (err) {
      console.error('[AppStore] Failed to load topic detail:', err);
      set({ selectedTopic: null, selectedTopicLoading: false });
    }
  },

  updateTopic: async (id, data) => {
    try {
      const updated = await window.api.topics.update(id, data);
      // Set topic directly from response to avoid race condition on rename
      set({
        selectedTopicId: updated.id,
        selectedTopic: updated as TopicDetail,
      });
      // Reload lists
      await get().loadTopics();
      await get().loadSystemCounts();
      await get().loadGroups();
      // Show toast for undoable actions
      const t = getTranslations(get().settings?.language ?? 'de');
      const desc = toastDescription(data, t);
      if (desc) {
        get().showToast(desc, { undoable: true });
      }
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.topicUpdateError;
      get().showToast(message, { severity: 'error' });
    }
  },

  deleteTopic: async (id) => {
    try {
      await window.api.topics.delete(id);
      set({ selectedTopicId: null, selectedTopic: null });
      await get().loadTopics();
      await get().loadSystemCounts();
      await get().loadGroups();
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.topicDeleted, { undoable: true });
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.topicDeleteError;
      get().showToast(message, { severity: 'error' });
    }
  },

  // Topic data actions
  createTopic: async (title) => {
    const { activeView, activeContextId } = get();
    const contexts = (activeView === 'context' && activeContextId) ? [activeContextId] : [];

    try {
      const newTopic = await window.api.topics.create({ title, contexts });
      // Refresh data
      await get().loadTopics();
      await get().loadSystemCounts();
      await get().loadGroups();
      set({ selectedTopicId: newTopic.id });
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.topicCreateError;
      get().showToast(message, { severity: 'error' });
    }
  },

  createTopicInInbox: async (title) => {
    try {
      const newTopic = await window.api.topics.create({ title, contexts: [] });
      await get().loadTopics();
      await get().loadSystemCounts();
      await get().loadGroups();
      set({ selectedTopicId: newTopic.id });
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.topicCreateError;
      get().showToast(message, { severity: 'error' });
    }
  },

  // Command Palette
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  // Multi-Select / Bulk Operations
  multiSelectMode: false,
  selectedTopicIds: [],
  toggleMultiSelect: () => {
    const current = get().multiSelectMode;
    set({
      multiSelectMode: !current,
      selectedTopicIds: [],
    });
  },
  toggleTopicSelection: (id) => {
    const { selectedTopicIds } = get();
    const exists = selectedTopicIds.includes(id);
    set({
      selectedTopicIds: exists
        ? selectedTopicIds.filter((tid) => tid !== id)
        : [...selectedTopicIds, id],
    });
  },
  selectAllTopics: () => {
    const allIds = get().topics.map((t) => t.id);
    set({ selectedTopicIds: allIds });
  },
  clearSelection: () => {
    set({ selectedTopicIds: [] });
  },
  bulkUpdateTopics: async (data) => {
    const { selectedTopicIds } = get();
    if (selectedTopicIds.length === 0) return;
    try {
      await window.api.topics.bulkUpdate(selectedTopicIds, data);
      // Selection bleibt erhalten für weitere Bulk-Edits
      await get().loadTopics();
      await get().loadSystemCounts();
      await get().loadGroups();
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.bulkUpdated(selectedTopicIds.length));
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.bulkUpdateError;
      get().showToast(message, { severity: 'error' });
    }
  },
  bulkDeleteTopics: async () => {
    const { selectedTopicIds } = get();
    if (selectedTopicIds.length === 0) return;
    try {
      await window.api.topics.bulkDelete(selectedTopicIds);
      set({ selectedTopicIds: [], multiSelectMode: false, selectedTopicId: null, selectedTopic: null });
      await get().loadTopics();
      await get().loadSystemCounts();
      await get().loadGroups();
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.bulkDeleted(selectedTopicIds.length));
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.bulkDeleteError;
      get().showToast(message, { severity: 'error' });
    }
  },

  // Drag & Drop reorder
  reorderTopics: async (ids, groupKey) => {
    // Optimistic update: reorder topics in store immediately
    const { topics } = get();
    const idSet = new Set(ids);
    const reorderedInGroup = ids.map((id) => topics.find((t) => t.id === id)).filter(Boolean) as Topic[];

    // Rebuild topics array: replace group topics with reordered ones, keep rest in place
    const newTopics = topics.map((t) => {
      if (idSet.has(t.id)) {
        const replacement = reorderedInGroup.shift();
        return replacement ?? t;
      }
      return t;
    });
    set({ topics: newTopics });

    try {
      await window.api.topics.reorder(ids, groupKey);
    } catch (err) {
      // Rollback on error
      console.error('[AppStore] Reorder failed, rolling back:', err);
      await get().loadTopics();
    }
  },

  duplicateTopicToContexts: async (topicId, contextIds) => {
    try {
      await window.api.topics.duplicate(topicId, contextIds);
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.topicCopied(contextIds.length));
      await get().loadTopics();
      await get().loadSystemCounts();
      await get().loadGroups();
    } catch (err) {
      const t = getTranslations(get().settings?.language ?? 'de');
      const message = err instanceof Error ? err.message : t.toast.topicCopyError;
      get().showToast(message, { severity: 'error' });
    }
  },

  // Sync conflict warning
  conflictFiles: [],
  conflictDismissed: false,
  setConflictFiles: (files) => set({ conflictFiles: files, conflictDismissed: false }),
  dismissConflicts: () => set({ conflictDismissed: true }),
  recheckConflicts: async () => {
    try {
      const files = await window.api.system.checkConflicts();
      set({ conflictFiles: files, conflictDismissed: false });
    } catch (err) {
      console.error('[AppStore] Conflict check failed:', err);
    }
  },

  // Settings
  settings: null,
  settingsOpen: false,
  loadSettings: async () => {
    try {
      const settings = await window.api.settings.get();
      set({ settings });
    } catch (err) {
      console.error('[AppStore] Failed to load settings:', err);
    }
  },
  updateSettings: async (data) => {
    try {
      const updated = await window.api.settings.update(data);
      set({ settings: updated });
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.settingsSaved, { severity: 'info' });
    } catch (err) {
      console.error('[AppStore] Failed to update settings:', err);
      const t = getTranslations(get().settings?.language ?? 'de');
      get().showToast(t.toast.settingsError, { severity: 'error' });
    }
  },
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  // Data directory switching
  switchDataDir: async () => {
    const t = getTranslations(get().settings?.language ?? 'de');
    const result = await window.api.settings.switchDir();

    if (!result.success) {
      if (result.error === 'canceled') return;

      if (result.needsSetup) {
        // Ask user if they want to set up the directory
        get().showToast(t.settings.dataDirSetupConfirm, { severity: 'warning' });
        return;
      }

      if (result.error === 'not-accessible') {
        get().showToast(t.settings.dataDirNotAccessible, { severity: 'error' });
      } else {
        get().showToast(t.settings.dataDirSwitchError, { severity: 'error' });
      }
      return;
    }

    // Reset all UI state
    set({
      activeContextId: null,
      selectedTopicId: null,
      selectedTopic: null,
      selectedTopicLoading: false,
      topics: [],
      topicsLoading: false,
      contexts: [],
      groups: [],
      ungroupedContexts: [],
      settings: result.settings,
      savedViews: [],
      activeSavedViewId: null,
      multiSelectMode: false,
      selectedTopicIds: [],
      conflictFiles: [],
      conflictDismissed: false,
      activeView: 'context',
      settingsOpen: false,
      freeViewFilter: {},
    });

    // Reload data from new directory
    get().loadGroups();
    get().loadSystemCounts();
    get().loadSavedViews();
    get().recheckConflicts();

    const tNew = getTranslations(result.settings.language ?? 'de');
    get().showToast(tNew.settings.dataDirSwitched);
  },

  switchToKnownDir: async (dirPath: string) => {
    const t = getTranslations(get().settings?.language ?? 'de');
    const result = await window.api.settings.switchToDir(dirPath);

    if (!result.success) {
      if (result.error === 'not-accessible') {
        get().showToast(t.settings.dataDirNotAccessible, { severity: 'error' });
      } else {
        get().showToast(t.settings.switchDirError, { severity: 'error' });
      }
      return;
    }

    // Reset all UI state
    set({
      activeContextId: null,
      selectedTopicId: null,
      selectedTopic: null,
      selectedTopicLoading: false,
      topics: [],
      topicsLoading: false,
      contexts: [],
      groups: [],
      ungroupedContexts: [],
      settings: result.settings,
      savedViews: [],
      activeSavedViewId: null,
      multiSelectMode: false,
      selectedTopicIds: [],
      conflictFiles: [],
      conflictDismissed: false,
      activeView: 'context',
      settingsOpen: false,
      freeViewFilter: {},
    });

    // Reload data from new directory
    get().loadGroups();
    get().loadSystemCounts();
    get().loadSavedViews();
    get().recheckConflicts();

    const tNew = getTranslations(result.settings.language ?? 'de');
    get().showToast(tNew.settings.switchDirSuccess);
  },

  setupAndSwitchDir: async (dirPath: string) => {
    const t = getTranslations(get().settings?.language ?? 'de');
    const result = await window.api.startup.setupDir(dirPath, false);

    if (!result.success) {
      if (result.error === 'not-empty') {
        // Try with force
        const forceResult = await window.api.startup.setupDir(dirPath, true);
        if (!forceResult.success) {
          get().showToast(t.settings.dataDirSwitchError, { severity: 'error' });
          return;
        }
      } else {
        get().showToast(t.settings.dataDirSwitchError, { severity: 'error' });
        return;
      }
    }

    // Reset all UI state and reload
    const newSettings = await window.api.settings.get();
    set({
      activeContextId: null,
      selectedTopicId: null,
      selectedTopic: null,
      selectedTopicLoading: false,
      topics: [],
      topicsLoading: false,
      contexts: [],
      groups: [],
      ungroupedContexts: [],
      settings: newSettings,
      savedViews: [],
      activeSavedViewId: null,
      multiSelectMode: false,
      selectedTopicIds: [],
      conflictFiles: [],
      conflictDismissed: false,
      activeView: 'context',
      settingsOpen: false,
      freeViewFilter: {},
    });

    get().loadGroups();
    get().loadSystemCounts();
    get().loadSavedViews();
    get().recheckConflicts();

    const tNew = getTranslations(newSettings.language ?? 'de');
    get().showToast(tNew.settings.dataDirSwitched);
  },

  loadTopics: async () => {
    const { activeView, activeContextId } = get();
    set({ topicsLoading: true });

    try {
      let filter: TopicFilter = {};

      if (activeView === 'context' && activeContextId) {
        filter = { contexts: [activeContextId] };
      } else if (activeView === 'inbox') {
        filter = { inbox: true };
      } else if (activeView === 'overdue') {
        filter = { overdue: true };
      } else if (activeView === 'liefern') {
        const lf = get().liefernFilter;
        filter = { direction: ['liefern'], status: ['neu', 'follow-up'], sortBy: 'due_date' };
        if (lf.contexts && lf.contexts.length > 0) {
          filter.contexts = lf.contexts;
        }
        if (lf.dueBefore) {
          filter.dueBefore = lf.dueBefore;
        }
        if (!lf.includeNoDueDate) {
          filter.dueAfter = '1900-01-01'; // forces due_date IS NOT NULL in SQL
        }
      } else if (activeView === 'free-view') {
        filter = { ...get().freeViewFilter };
      } else {
        set({ topics: [], topicsLoading: false });
        return;
      }

      const topics = await window.api.topics.list(filter);
      set({ topics, topicsLoading: false });
    } catch (err) {
      console.error('[AppStore] Failed to load topics:', err);
      set({ topics: [], topicsLoading: false });
    }
  },
}));
