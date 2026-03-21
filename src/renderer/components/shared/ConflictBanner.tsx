import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface ConflictBannerProps {
  files: string[];
  onDismiss: () => void;
  onRecheck: () => void;
}

const MAX_VISIBLE = 5;

export default function ConflictBanner({
  files,
  onDismiss,
  onRecheck,
}: ConflictBannerProps): React.ReactElement {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const visibleFiles = expanded ? files : files.slice(0, MAX_VISIBLE);
  const hiddenCount = files.length - MAX_VISIBLE;

  function handleShowInFolder(filePath: string): void {
    window.api.system.showInFolder(filePath);
  }

  return (
    <div className="w-full bg-amber-100 dark:bg-amber-900/40 border-b border-amber-300 dark:border-amber-700 px-4 py-2 text-sm flex-shrink-0">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-700 dark:text-amber-300 font-semibold">
            {t.conflict.title(files.length)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline"
            onClick={onRecheck}
            title={t.conflict.recheckTooltip}
          >
            {t.conflict.recheck}
          </button>
          <button
            type="button"
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-0.5"
            onClick={onDismiss}
            title={t.conflict.close}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* File list */}
      <ul className="mt-1 space-y-0.5">
        {visibleFiles.map((filePath) => (
          <li key={filePath} className="flex items-center gap-1">
            <button
              type="button"
              className="text-xs text-amber-800 dark:text-amber-200 hover:text-amber-950 dark:hover:text-amber-50 hover:underline truncate max-w-md text-left"
              onClick={() => handleShowInFolder(filePath)}
              title={filePath}
            >
              📄 {basename(filePath)}
            </button>
            <span className="text-xs text-amber-600 dark:text-amber-400">{t.conflict.showInFinder}</span>
          </li>
        ))}
      </ul>

      {/* Expand/collapse for many files */}
      {hiddenCount > 0 && !expanded && (
        <button
          type="button"
          className="mt-1 text-xs text-amber-700 dark:text-amber-300 hover:underline"
          onClick={() => setExpanded(true)}
        >
          {t.conflict.showMore(hiddenCount)}
        </button>
      )}
      {expanded && hiddenCount > 0 && (
        <button
          type="button"
          className="mt-1 text-xs text-amber-700 dark:text-amber-300 hover:underline"
          onClick={() => setExpanded(false)}
        >
          {t.conflict.showLess}
        </button>
      )}
    </div>
  );
}

/** Extract basename from a file path (handles both / and \ separators). */
function basename(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}
