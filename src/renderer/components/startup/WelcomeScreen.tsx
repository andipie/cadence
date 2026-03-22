import React, { useState } from 'react';
import { useAppStore } from '../../store/app-store';
import { getTranslations } from '@shared/locales';
import type { StartupState } from '@shared/types';
import type { Translations } from '@shared/locales/types';

interface WelcomeScreenProps {
  startupState: StartupState;
}

type ScreenView =
  | { kind: 'idle' }
  | { kind: 'error'; message: string; showSetupAnyway?: boolean; dirPath?: string }
  | { kind: 'loading' };

export default function WelcomeScreen({ startupState }: WelcomeScreenProps): React.ReactElement {
  // Settings are not loaded yet, use default language
  const t = getTranslations('de');
  const completeStartup = useAppStore((s) => s.completeStartup);
  const [view, setView] = useState<ScreenView>(() => getInitialView(startupState, t));

  async function handleSetupNew(): Promise<void> {
    const dirPath = await window.api.startup.pickFolder();
    if (!dirPath) return;

    setView({ kind: 'loading' });
    const result = await window.api.startup.setupDir(dirPath, false);

    if (result.success) {
      completeStartup();
    } else if (result.error === 'not-empty') {
      setView({
        kind: 'error',
        message: t.welcome.errorNotEmpty,
        showSetupAnyway: true,
        dirPath,
      });
    } else {
      setView({ kind: 'error', message: result.error });
    }
  }

  async function handleSetupAnyway(dirPath: string): Promise<void> {
    setView({ kind: 'loading' });
    const result = await window.api.startup.setupDir(dirPath, true);

    if (result.success) {
      completeStartup();
    } else {
      setView({ kind: 'error', message: result.error });
    }
  }

  async function handleOpenExisting(): Promise<void> {
    const dirPath = await window.api.startup.pickFolder();
    if (!dirPath) return;

    setView({ kind: 'loading' });
    const result = await window.api.startup.openDir(dirPath);

    if (result.success) {
      completeStartup();
    } else {
      const reason = mapErrorReason(result.error, t);
      setView({ kind: 'error', message: reason });
    }
  }

  async function handleChooseAnother(): Promise<void> {
    setView({ kind: 'idle' });
  }

  // Unreachable / Invalid state from startup — show with option to choose another
  if (view.kind === 'idle' && (startupState.state === 'unreachable' || startupState.state === 'invalid')) {
    // Reset to normal idle if user clicked "back" or "choose another"
  }

  return (
    <div className="flex items-center justify-center h-screen bg-surface dark:bg-surface-dark">
      <div className="max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
            {t.welcome.title}
          </h1>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
            {t.welcome.subtitle}
          </p>
        </div>

        {/* Content based on view state */}
        {view.kind === 'loading' && <LoadingView t={t} />}
        {view.kind === 'error' && (
          <ErrorView
            t={t}
            message={view.message}
            showSetupAnyway={view.showSetupAnyway}
            dirPath={view.dirPath}
            onSetupAnyway={handleSetupAnyway}
            onChooseAnother={handleChooseAnother}
          />
        )}
        {view.kind === 'idle' && (
          <IdleView
            t={t}
            onSetupNew={handleSetupNew}
            onOpenExisting={handleOpenExisting}
          />
        )}
      </div>
    </div>
  );
}

// --- Sub-views ---

interface IdleViewProps {
  t: Translations;
  onSetupNew: () => void;
  onOpenExisting: () => void;
}

function IdleView({ t, onSetupNew, onOpenExisting }: IdleViewProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onSetupNew}
        className="w-full text-left p-4 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark hover:bg-surface-secondary dark:hover:bg-surface-secondary-dark transition-colors group"
      >
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 mt-0.5 text-accent dark:text-accent-dark flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <div>
            <span className="block text-sm font-medium text-text-primary dark:text-text-primary-dark group-hover:text-accent dark:group-hover:text-accent-dark">
              {t.welcome.setupNew}
            </span>
            <span className="block text-xs text-text-secondary dark:text-text-secondary-dark mt-1">
              {t.welcome.setupNewHint}
            </span>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onOpenExisting}
        className="w-full text-left p-4 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark hover:bg-surface-secondary dark:hover:bg-surface-secondary-dark transition-colors group"
      >
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 mt-0.5 text-accent dark:text-accent-dark flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <div>
            <span className="block text-sm font-medium text-text-primary dark:text-text-primary-dark group-hover:text-accent dark:group-hover:text-accent-dark">
              {t.welcome.openExisting}
            </span>
            <span className="block text-xs text-text-secondary dark:text-text-secondary-dark mt-1">
              {t.welcome.openExistingHint}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

interface ErrorViewProps {
  t: Translations;
  message: string;
  showSetupAnyway?: boolean;
  dirPath?: string;
  onSetupAnyway: (dirPath: string) => void;
  onChooseAnother: () => void;
}

function ErrorView({ t, message, showSetupAnyway, dirPath, onSetupAnyway, onChooseAnother }: ErrorViewProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {message}
        </p>
      </div>

      <div className="flex gap-2">
        {showSetupAnyway && dirPath && (
          <button
            type="button"
            onClick={() => onSetupAnyway(dirPath)}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-accent dark:bg-accent-dark text-white hover:opacity-90 transition-opacity"
          >
            {t.welcome.setupAnyway}
          </button>
        )}
        <button
          type="button"
          onClick={onChooseAnother}
          className="flex-1 px-4 py-2 text-sm rounded-lg border border-border dark:border-border-dark text-text-primary dark:text-text-primary-dark hover:bg-surface-secondary dark:hover:bg-surface-secondary-dark transition-colors"
        >
          {showSetupAnyway ? t.welcome.back : t.welcome.chooseAnother}
        </button>
      </div>
    </div>
  );
}

interface LoadingViewProps {
  t: Translations;
}

function LoadingView({ t }: LoadingViewProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <svg className="w-8 h-8 animate-spin text-accent dark:text-accent-dark" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
        {t.welcome.initializing}
      </span>
    </div>
  );
}

// --- Helpers ---

function getInitialView(startupState: StartupState, t: Translations): ScreenView {
  switch (startupState.state) {
    case 'no-dir':
      return { kind: 'idle' };
    case 'unreachable':
      return { kind: 'error', message: t.welcome.errorUnreachable(startupState.path) };
    case 'invalid':
      return {
        kind: 'error',
        message: `${t.welcome.errorInvalid(startupState.path)} ${mapErrorReason(startupState.reason, t)}`,
      };
    case 'ready':
      // Should not happen — App.tsx should not render WelcomeScreen when ready
      return { kind: 'idle' };
  }
}

function mapErrorReason(reason: string, t: Translations): string {
  switch (reason) {
    case 'missing-contexts':
      return t.welcome.errorMissingContexts;
    case 'missing-topics':
      return t.welcome.errorMissingTopics;
    default:
      return reason;
  }
}
