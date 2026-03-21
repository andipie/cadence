import React, { useEffect } from 'react';
import type { AppErrorSeverity } from '@shared/types';

interface ToastProps {
  message: string;
  severity: AppErrorSeverity;
  undoable: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

const SEVERITY_STYLES: Record<string, { border: string; dot: string; bg: string }> = {
  info: {
    border: 'border-l-4 border-accent dark:border-accent-dark',
    dot: 'bg-accent dark:bg-accent-dark',
    bg: '',
  },
  warning: {
    border: 'border-l-4 border-warning dark:border-warning-dark',
    dot: 'bg-warning dark:bg-warning-dark',
    bg: 'bg-warning/5',
  },
  error: {
    border: 'border-l-4 border-danger dark:border-danger-dark',
    dot: 'bg-danger dark:bg-danger-dark',
    bg: 'bg-danger/5',
  },
};

export default function Toast({
  message,
  severity,
  undoable,
  onUndo,
  onDismiss,
}: ToastProps): React.ReactElement {
  // Auto-dismiss only for info severity (5 seconds)
  useEffect(() => {
    if (severity !== 'info') return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss, message, severity]);

  const styles = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-secondary-dark text-text-primary dark:text-text-primary-dark text-sm ${styles.border} ${styles.bg}`}>
        {/* Severity indicator dot */}
        <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />

        <span>{message}</span>

        {undoable && (
          <button
            type="button"
            className="font-medium text-accent dark:text-accent-dark hover:underline"
            onClick={onUndo}
          >
            Rückgängig
          </button>
        )}

        <button
          type="button"
          className="ml-1 text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
