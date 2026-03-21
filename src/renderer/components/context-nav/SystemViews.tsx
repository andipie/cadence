import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface SystemViewsProps {
  inboxCount: number;
  overdueCount: number;
  liefernCount: number;
  activeView: string;
  onSelectView: (view: 'inbox' | 'overdue' | 'liefern') => void;
}

export default function SystemViews({
  inboxCount,
  overdueCount,
  liefernCount,
  activeView,
  onSelectView,
}: SystemViewsProps): React.ReactElement {
  const t = useTranslation();
  return (
    <>
      <button
        type="button"
        className={`w-full px-3 py-2 rounded cursor-pointer flex items-center justify-between text-left ${
          activeView === 'inbox'
            ? 'bg-accent/10 text-accent dark:text-accent-dark font-medium'
            : 'hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark'
        }`}
        onClick={() => onSelectView('inbox')}
        title={t.nav.inboxTooltip}
      >
        <span>{t.nav.inbox}</span>
        {inboxCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/10 text-accent dark:text-accent-dark font-semibold">
            {inboxCount}
          </span>
        )}
      </button>
      <button
        type="button"
        className={`w-full px-3 py-2 rounded cursor-pointer flex items-center justify-between text-left ${
          activeView === 'liefern'
            ? 'bg-accent/10 text-accent dark:text-accent-dark font-medium'
            : 'hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark'
        }`}
        onClick={() => onSelectView('liefern')}
        title={t.nav.liefernTooltip}
      >
        <span>{t.nav.liefern}</span>
        {liefernCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-warning/10 text-warning dark:text-warning-dark font-semibold">
            {liefernCount}
          </span>
        )}
      </button>
      <button
        type="button"
        className={`w-full px-3 py-2 rounded cursor-pointer flex items-center justify-between text-left ${
          activeView === 'overdue'
            ? 'bg-accent/10 text-accent dark:text-accent-dark font-medium'
            : 'hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark'
        }`}
        onClick={() => onSelectView('overdue')}
        title={t.nav.overdueTooltip}
      >
        <span>{t.nav.overdue}</span>
        {overdueCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-danger/10 text-danger dark:text-danger-dark font-semibold">
            {overdueCount}
          </span>
        )}
      </button>
    </>
  );
}
