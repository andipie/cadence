import React, { useCallback, useEffect } from 'react';
import TopBar from './components/layout/TopBar';
import ContextNav from './components/context-nav/ContextNav';
import TopicListPanel from './components/topic-list/TopicListPanel';
import DetailPanel from './components/detail/DetailPanel';
import Toast from './components/shared/Toast';
import CriticalBanner from './components/shared/CriticalBanner';
import ConflictBanner from './components/shared/ConflictBanner';
import CommandPalette from './components/shared/CommandPalette';
import SettingsDialog from './components/shared/SettingsDialog';
import { useAppStore } from './store/app-store';
import type { AppError } from '@shared/types';

function App(): React.ReactElement {
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
  const loadSettings = useAppStore((s) => s.loadSettings);
  const conflictFiles = useAppStore((s) => s.conflictFiles);
  const conflictDismissed = useAppStore((s) => s.conflictDismissed);
  const setConflictFiles = useAppStore((s) => s.setConflictFiles);
  const dismissConflicts = useAppStore((s) => s.dismissConflicts);
  const recheckConflicts = useAppStore((s) => s.recheckConflicts);

  const handleDismissToast = useCallback(() => dismissToast(), [dismissToast]);
  const handleUndo = useCallback(() => undoLastAction(), [undoLastAction]);

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
      // Also check for sync conflicts and load settings
      recheckConflicts();
      loadSettings();
    }
    checkHealth();
  }, [showToast, setCriticalError, recheckConflicts, loadSettings]);

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
            state.updateTopic(state.selectedTopicId, { priority: 'hoch' });
          } else if (e.key === '2') {
            e.preventDefault();
            state.updateTopic(state.selectedTopicId, { priority: 'mittel' });
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
        {/* Linkes Panel: Kontext-Navigation */}
        <aside className="w-[240px] flex-shrink-0 border-r border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-secondary-dark flex flex-col overflow-y-auto">
          <ContextNav />
        </aside>

        {/* Mittleres Panel: Topic-Liste */}
        <TopicListPanel />

        {/* Rechtes Panel: Detail */}
        <DetailPanel />
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
