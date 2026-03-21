import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import type { SavedView } from '@shared/types';

export default function SavedViews(): React.ReactElement | null {
  const t = useTranslation();
  const savedViews = useAppStore((s) => s.savedViews);
  const activeSavedViewId = useAppStore((s) => s.activeSavedViewId);
  const activateSavedView = useAppStore((s) => s.activateSavedView);
  const updateSavedView = useAppStore((s) => s.updateSavedView);
  const deleteSavedView = useAppStore((s) => s.deleteSavedView);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  if (savedViews.length === 0) {
    return null;
  }

  function handleStartRename(view: SavedView): void {
    setRenamingId(view.id);
    setRenameValue(view.name);
  }

  async function handleFinishRename(): Promise<void> {
    if (renamingId && renameValue.trim()) {
      await updateSavedView(renamingId, { name: renameValue.trim() });
    }
    setRenamingId(null);
    setRenameValue('');
  }

  function handleRenameKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setRenamingId(null);
      setRenameValue('');
    }
  }

  return (
    <div>
      {/* Section header */}
      <button
        type="button"
        className="w-full px-3 py-1 text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide flex items-center gap-1 hover:text-text-primary dark:hover:text-text-primary-dark"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? t.nav.savedViewsShow : t.nav.savedViewsHide}
      >
        <span className={`transition-transform text-[10px] ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
        {t.nav.savedViews}
        <span className="ml-auto text-[10px] font-normal normal-case tracking-normal">
          {savedViews.length}
        </span>
      </button>

      {/* View list */}
      {!isCollapsed && (
        <div className="space-y-0.5 mt-0.5">
          {savedViews.map((view) => (
            <div
              key={view.id}
              className="group relative"
            >
              {renamingId === view.id ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  onBlur={handleFinishRename}
                  className="w-full px-3 py-1.5 text-sm rounded border border-accent dark:border-accent-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  className={`w-full px-3 py-1.5 rounded cursor-pointer text-left text-sm flex items-center gap-2 ${
                    activeSavedViewId === view.id
                      ? 'bg-accent/10 text-accent dark:text-accent-dark font-medium'
                      : 'hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark'
                  }`}
                  onClick={() => activateSavedView(view)}
                  onDoubleClick={() => handleStartRename(view)}
                  title={t.nav.viewRenameHint}
                >
                  {view.icon && <span className="text-xs">{view.icon}</span>}
                  <span className="truncate flex-1">{view.name}</span>
                </button>
              )}

              {/* Delete button on hover */}
              {renamingId !== view.id && (
                <button
                  type="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-xs text-text-secondary dark:text-text-secondary-dark hover:text-danger dark:hover:text-danger-dark transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSavedView(view.id);
                  }}
                  title={t.nav.viewDeleteTooltip}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
