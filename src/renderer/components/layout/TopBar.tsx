import React from 'react';
import { APP_NAME } from '@shared/constants';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';

export default function TopBar(): React.ReactElement {
  const systemCounts = useAppStore((s) => s.systemCounts);
  const openCommandPalette = useAppStore((s) => s.openCommandPalette);
  const openSettings = useAppStore((s) => s.openSettings);
  const dataDir = useAppStore((s) => s.settings?.dataDir);
  const t = useTranslation();

  const folderName = dataDir ? dataDir.split('/').pop() ?? '' : '';

  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-secondary-dark">
      {/* App Name + Data Directory */}
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-lg text-text-primary dark:text-text-primary-dark">
          {APP_NAME}
        </span>
        {folderName && (
          <span
            className="text-sm text-text-secondary dark:text-text-secondary-dark truncate max-w-48"
            title={dataDir}
          >
            — {folderName}
          </span>
        )}
      </div>

      {/* Right: Badges + Search Placeholder */}
      <div className="flex items-center gap-3">
        {/* Überfällig Badge */}
        {systemCounts.overdue > 0 && (
          <span className="inline-flex items-center gap-1 text-sm text-danger dark:text-danger-dark">
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-danger/10 text-xs font-semibold">
              {systemCounts.overdue}
            </span>
            <span className="hidden sm:inline">{t.topBar.overdue}</span>
          </span>
        )}

        {/* Inbox Badge */}
        {systemCounts.inbox > 0 && (
          <span className="inline-flex items-center gap-1 text-sm text-text-secondary dark:text-text-secondary-dark">
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-accent/10 text-xs font-semibold text-accent dark:text-accent-dark">
              {systemCounts.inbox}
            </span>
            <span className="hidden sm:inline">{t.topBar.inbox}</span>
          </span>
        )}

        {/* Search Shortcut Hint */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex items-center gap-2 px-3 py-1 rounded border border-border dark:border-border-dark text-sm text-text-secondary dark:text-text-secondary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark transition-colors"
          title={t.topBar.searchTooltip}
        >
          <span>{t.topBar.search}</span>
          <kbd className="text-xs px-1.5 py-0.5 rounded bg-surface dark:bg-surface-dark border border-border dark:border-border-dark font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={openSettings}
          className="p-1.5 rounded text-text-secondary dark:text-text-secondary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark transition-colors"
          title={t.topBar.settingsTooltip}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.004.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
