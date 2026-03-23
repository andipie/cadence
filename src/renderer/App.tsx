import React, { useCallback, useEffect, useRef, useState } from 'react';
import TopBar from './components/layout/TopBar';
import ContextNav from './components/context-nav/ContextNav';
import TopicListPanel from './components/topic-list/TopicListPanel';
import DetailPanel from './components/detail/DetailPanel';
import Toast from './components/shared/Toast';
import CriticalBanner from './components/shared/CriticalBanner';
import ConflictBanner from './components/shared/ConflictBanner';
import CommandPalette from './components/shared/CommandPalette';
import SettingsDialog from './components/shared/SettingsDialog';
import ResizeHandle from './components/shared/ResizeHandle';
import WelcomeScreen from './components/startup/WelcomeScreen';
import { useAppStore } from './store/app-store';
import type { AppError } from '@shared/types';
import {
  SIDEBAR_WIDTH,
  DETAIL_PANEL_WIDTH,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_DETAIL_PANEL_WIDTH,
  MIN_MIDDLE_PANEL_WIDTH,
} from '@shared/constants';

function App(): React.ReactElement {
  const appReady = useAppStore((s) => s.appReady);
  const startupState = useAppStore((s) => s.startupState);
  const loadStartupState = useAppStore((s) => s.loadStartupState);

  // Load startup state on mount
  useEffect(() => {
    if (startupState === null) {
      loadStartupState();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading screen while checking startup state
  if (startupState === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface dark:bg-surface-dark">
        <div className="w-6 h-6 border-2 border-accent dark:border-accent-dark border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show welcome screen if data directory is not ready
  if (!appReady) {
    return <WelcomeScreen startupState={startupState} />;
  }

  return <AppMain />;
}

function AppMain(): React.ReactElement {
  const triggerQuickAddFocus = useAppStore((s) => s.triggerQuickAddFocus);
  const triggerQuickAddInbox = useAppStore((s) => s.triggerQuickAddInbox);
  const triggerAddNote = useAppStore((s) => s.triggerAddNote);
  const generateAgenda = useAppStore((s) => s.generateAgenda);
  const triggerMarkComplete = useAppStore((s) => s.triggerMarkComplete);
  const triggerFollowUp = useAppStore((s) => s.triggerFollowUp);
  const navigateUp = useAppStore((s) => s.navigateUp);
  const navigateDown = useAppStore((s) => s.navigateDown);
  const deselectTopic = useAppStore((s) => s.deselectTopic);
  const toast = useAppStore((s) => s.toast);
  const dismissToast = useAppStore((s) => s.dismissToast);
  const undoLastAction = useAppStore((s) => s.undoLastAction);
  const criticalError = useAppStore((s) => s.criticalError);
  const showToast = useAppStore((s) => s.showToast);
  const setCriticalError = useAppStore((s) => s.setCriticalError);
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen);
  const toggleCommandPalette = useAppStore((s) => s.toggleCommandPalette);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const openSettings = useAppStore((s) => s.openSettings);
  const conflictFiles = useAppStore((s) => s.conflictFiles);
  const conflictDismissed = useAppStore((s) => s.conflictDismissed);
  const setConflictFiles = useAppStore((s) => s.setConflictFiles);
  const dismissConflicts = useAppStore((s) => s.dismissConflicts);
  const recheckConflicts = useAppStore((s) => s.recheckConflicts);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const handleDismissToast = useCallback(() => dismissToast(), [dismissToast]);
  const handleUndo = useCallback(() => undoLastAction(), [undoLastAction]);

  // --- Resizable panel widths ---
  // Read initial widths from settings once; use getState() to avoid re-render on every settings change
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const s = useAppStore.getState().settings;
    return s?.sidebarWidth ?? SIDEBAR_WIDTH;
  });
  const [detailWidth, setDetailWidth] = useState(() => {
    const s = useAppStore.getState().settings;
    return s?.detailPanelWidth ?? DETAIL_PANEL_WIDTH;
  });
  const sidebarDragStartRef = useRef(0);
  const detailDragStartRef = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSyncDoneRef = useRef(false);

  // Sync once when settings first load (they may be null on initial render)
  useEffect(() => {
    if (initialSyncDoneRef.current) return;
    const unsub = useAppStore.subscribe((state) => {
      if (state.settings && !initialSyncDoneRef.current) {
        initialSyncDoneRef.current = true;
        if (state.settings.sidebarWidth != null) setSidebarWidth(state.settings.sidebarWidth);
        if (state.settings.detailPanelWidth != null) setDetailWidth(state.settings.detailPanelWidth);
        unsub();
      }
    });
    // Check if already loaded
    const current = useAppStore.getState().settings;
    if (current) {
      initialSyncDoneRef.current = true;
      if (current.sidebarWidth != null) setSidebarWidth(current.sidebarWidth);
      if (current.detailPanelWidth != null) setDetailWidth(current.detailPanelWidth);
      unsub();
    }
    return unsub;
  }, []);

  function clampSidebar(w: number, detail: number): number {
    const maxByWindow = window.innerWidth - detail - MIN_MIDDLE_PANEL_WIDTH - 8;
    return Math.max(MIN_SIDEBAR_WIDTH, Math.min(w, MAX_SIDEBAR_WIDTH, maxByWindow));
  }

  function clampDetail(w: number, sidebar: number): number {
    const maxByWindow = window.innerWidth - sidebar - MIN_MIDDLE_PANEL_WIDTH - 8;
    return Math.max(MIN_DETAIL_PANEL_WIDTH, Math.min(w, maxByWindow));
  }

  // Re-clamp on window resize
  useEffect(() => {
    function handleResize(): void {
      setSidebarWidth((prev) => clampSidebar(prev, detailWidth));
      setDetailWidth((prev) => clampDetail(prev, sidebarWidth));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth, detailWidth]);

  const debouncedSave = useCallback((sw: number, dw: number) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateSettings({ sidebarWidth: sw, detailPanelWidth: dw }, { silent: true });
    }, 300);
  }, [updateSettings]);

  // Sidebar resize handlers
  const handleSidebarDrag = useCallback((deltaX: number) => {
    setSidebarWidth(() => {
      const newWidth = clampSidebar(sidebarDragStartRef.current + deltaX, detailWidth);
      return newWidth;
    });
  }, [detailWidth]);

  const handleSidebarDragEnd = useCallback(() => {
    setSidebarWidth((current) => {
      debouncedSave(current, detailWidth);
      return current;
    });
  }, [detailWidth, debouncedSave]);

  const handleSidebarReset = useCallback(() => {
    const w = clampSidebar(SIDEBAR_WIDTH, detailWidth);
    setSidebarWidth(w);
    debouncedSave(w, detailWidth);
  }, [detailWidth, debouncedSave]);

  const handleSidebarDragStart = useCallback(() => {
    sidebarDragStartRef.current = sidebarWidth;
  }, [sidebarWidth]);

  // Detail resize handlers
  const handleDetailDragStart = useCallback(() => {
    detailDragStartRef.current = detailWidth;
  }, [detailWidth]);

  const handleDetailDrag = useCallback((deltaX: number) => {
    setDetailWidth(() => {
      const newWidth = clampDetail(detailDragStartRef.current - deltaX, sidebarWidth);
      return newWidth;
    });
  }, [sidebarWidth]);

  const handleDetailDragEnd = useCallback(() => {
    setDetailWidth((current) => {
      debouncedSave(sidebarWidth, current);
      return current;
    });
  }, [sidebarWidth, debouncedSave]);

  const handleDetailReset = useCallback(() => {
    const w = clampDetail(DETAIL_PANEL_WIDTH, sidebarWidth);
    setDetailWidth(w);
    debouncedSave(sidebarWidth, w);
  }, [sidebarWidth, debouncedSave]);

  // Listen for error events pushed from the main process
  useEffect(() => {
    const cleanup = window.api.on.error((error: AppError) => {
      if (error.severity === 'critical') {
        setCriticalError(error.message, error.detail);
      } else {
        showToast(error.message, { severity: error.severity });
      }
    });
    return cleanup;
  }, [showToast, setCriticalError]);

  // Listen for conflict detection events from main process
  useEffect(() => {
    const cleanup = window.api.on.conflictDetected((files: string[]) => {
      setConflictFiles(files);
    });
    return cleanup;
  }, [setConflictFiles]);

  // Health check on mount — retrieve any startup issues + check conflicts
  useEffect(() => {
    async function checkHealth(): Promise<void> {
      try {
        const issues = await window.api.system.healthCheck();
        for (const issue of issues) {
          if (issue.severity === 'critical') {
            setCriticalError(issue.message, issue.detail);
          } else {
            showToast(issue.message, { severity: issue.severity });
          }
        }
      } catch {
        // Health check not available — ignore silently
      }
      // Also check for sync conflicts
      recheckConflicts();
    }
    checkHealth();
  }, [showToast, setCriticalError, recheckConflicts]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      // ⌘+K / Ctrl+K → Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // ⌘+, / Ctrl+, → Open Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',' && !e.shiftKey) {
        e.preventDefault();
        openSettings();
        return;
      }

      // Don't process other shortcuts when command palette or settings is open
      if (useAppStore.getState().commandPaletteOpen || useAppStore.getState().settingsOpen) return;

      // ⌘N / Ctrl+N → Focus quick-add (current context)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        triggerQuickAddFocus();
      }
      // ⌘+I / Ctrl+I → Quick-add in Inbox mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'i' && !e.shiftKey) {
        e.preventDefault();
        triggerQuickAddInbox();
        return;
      }
      // ⌘+U / Ctrl+U → New note update
      if ((e.metaKey || e.ctrlKey) && e.key === 'u' && !e.shiftKey) {
        e.preventDefault();
        triggerAddNote();
      }
      // ⌘+E / Ctrl+E → Mark complete
      if ((e.metaKey || e.ctrlKey) && e.key === 'e' && !e.shiftKey) {
        e.preventDefault();
        triggerMarkComplete();
      }
      // ⌘+F / Ctrl+F → Follow-up
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        triggerFollowUp();
      }
      // ⌘+Shift+A / Ctrl+Shift+A → Generate agenda
      if ((e.metaKey || e.ctrlKey) && e.key === 'A' && e.shiftKey) {
        e.preventDefault();
        generateAgenda();
      }
      // ⌘+Z / Ctrl+Z → Undo last action (always try, main process returns error if nothing to undo)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoLastAction();
      }
      // ⌘+1/2/3 → Priority shortcuts (only when a topic is selected)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const state = useAppStore.getState();
        if (state.selectedTopicId && state.selectedTopic) {
          if (e.key === '1') {
            e.preventDefault();
            state.updateTopic(state.selectedTopicId, { priority: 'high' });
          } else if (e.key === '2') {
            e.preventDefault();
            state.updateTopic(state.selectedTopicId, { priority: 'medium' });
          } else if (e.key === '3') {
            e.preventDefault();
            state.updateTopic(state.selectedTopicId, { priority: 'normal' });
          }
        }
      }

      // Navigation shortcuts — only when no input/textarea/select is focused
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || tag === 'select' || (document.activeElement as HTMLElement)?.isContentEditable;
      if (!isEditable && !e.metaKey && !e.ctrlKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          navigateUp();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          navigateDown();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          deselectTopic();
        } else if (e.key === 'Enter') {
          // If no topic selected, select the first one
          const state = useAppStore.getState();
          if (!state.selectedTopicId && state.topics.length > 0) {
            e.preventDefault();
            state.selectTopic(state.topics[0].id);
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [triggerQuickAddFocus, triggerQuickAddInbox, triggerAddNote, triggerMarkComplete, triggerFollowUp, generateAgenda, undoLastAction, navigateUp, navigateDown, deselectTopic, toggleCommandPalette, openSettings]);

  return (
    <div className="flex flex-col h-screen w-full min-w-[960px]">
      {/* Critical error banner — persistent, above everything */}
      {criticalError && (
        <CriticalBanner
          message={criticalError.message}
          detail={criticalError.detail}
        />
      )}

      {/* Sync conflict warning banner */}
      {conflictFiles.length > 0 && !conflictDismissed && (
        <ConflictBanner
          files={conflictFiles}
          onDismiss={dismissConflicts}
          onRecheck={recheckConflicts}
        />
      )}

      {/* TopBar */}
      <TopBar />

      {/* Three-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Context Navigation */}
        <aside
          className="flex-shrink-0 border-r border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-secondary-dark flex flex-col overflow-y-auto"
          style={{ width: sidebarWidth }}
        >
          <ContextNav />
        </aside>

        {/* Left resize handle */}
        <ResizeHandle
          onDragStart={handleSidebarDragStart}
          onDrag={handleSidebarDrag}
          onDragEnd={handleSidebarDragEnd}
          onReset={handleSidebarReset}
        />

        {/* Middle Panel: Topic List */}
        <TopicListPanel />

        {/* Right resize handle */}
        <ResizeHandle
          onDragStart={handleDetailDragStart}
          onDrag={handleDetailDrag}
          onDragEnd={handleDetailDragEnd}
          onReset={handleDetailReset}
        />

        {/* Right Panel: Detail */}
        <DetailPanel width={detailWidth} />
      </div>

      {/* Command Palette */}
      {commandPaletteOpen && <CommandPalette />}

      {/* Settings Dialog */}
      {settingsOpen && <SettingsDialog />}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          severity={toast.severity}
          undoable={toast.undoable}
          onUndo={handleUndo}
          onDismiss={handleDismissToast}
        />
      )}
    </div>
  );
}

export default App;
