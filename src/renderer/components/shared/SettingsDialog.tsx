import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import type { TopicPriority } from '@shared/types';

export default function SettingsDialog(): React.ReactElement {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const closeSettings = useAppStore((s) => s.closeSettings);
  const switchToKnownDir = useAppStore((s) => s.switchToKnownDir);
  const t = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mruList, setMruList] = useState<string[]>([]);

  const PRIORITY_OPTIONS = useMemo(() => [
    { value: 'hoch' as TopicPriority, label: t.priority.hoch },
    { value: 'mittel' as TopicPriority, label: t.priority.mittel },
    { value: 'normal' as TopicPriority, label: t.priority.normal },
  ], [t]);

  // Load MRU list on mount
  useEffect(() => {
    window.api.settings.mruList().then(setMruList).catch(() => setMruList([]));
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeSettings();
      }
    }
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [closeSettings]);

  // Click outside to close
  function handleOverlayClick(e: React.MouseEvent): void {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      closeSettings();
    }
  }

  if (!settings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-surface dark:bg-surface-dark rounded-lg p-6">
          <span className="text-sm text-text-secondary dark:text-text-secondary-dark">{t.detail.loading}</span>
        </div>
      </div>
    );
  }

  function handlePriorityChange(value: string): void {
    updateSettings({ defaultPriority: value as TopicPriority });
  }

  function handleToggle(field: 'confirmDelete' | 'confirmComplete' | 'obsidianMode'): void {
    if (!settings) return;
    updateSettings({ [field]: !settings[field] });
  }

  function handleNumberChange(field: 'warnWaitingDays' | 'warnWaitingCritical', value: string): void {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1) {
      updateSettings({ [field]: num });
    }
  }

  function handleSwitchToDir(dirPath: string): void {
    switchToKnownDir(dirPath);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        className="bg-surface dark:bg-surface-dark rounded-lg shadow-xl w-[480px] max-h-[80vh] overflow-y-auto border border-border dark:border-border-dark"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
            {t.settings.title}
          </h2>
          <button
            type="button"
            onClick={closeSettings}
            className="text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark p-1"
            title={t.settings.close}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings form */}
        <div className="px-6 py-4 space-y-5">
          {/* Data directory */}
          <SettingRow label={t.settings.dataDir} hint={t.settings.dataDirHint}>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={settings.dataDir}
                className="flex-1 px-3 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-secondary-dark text-text-secondary dark:text-text-secondary-dark cursor-default truncate"
              />
              <button
                type="button"
                onClick={() => useAppStore.getState().switchDataDir()}
                className="px-3 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark hover:bg-surface-secondary dark:hover:bg-surface-secondary-dark transition-colors whitespace-nowrap"
              >
                {t.settings.dataDirChange}
              </button>
            </div>
          </SettingRow>

          {/* MRU — Recently used directories */}
          {mruList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">
                {t.settings.recentDirs}
              </label>
              <div className="space-y-1">
                {mruList.map((dirPath) => {
                  const folderName = dirPath.split('/').pop() ?? dirPath;
                  return (
                    <button
                      key={dirPath}
                      type="button"
                      onClick={() => handleSwitchToDir(dirPath)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark hover:bg-surface-secondary dark:hover:bg-surface-secondary-dark transition-colors text-left"
                      title={dirPath}
                    >
                      <svg className="w-4 h-4 flex-shrink-0 text-text-secondary dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      <span className="font-medium truncate">{folderName}</span>
                      <span className="text-xs text-text-secondary dark:text-text-secondary-dark truncate flex-1 text-right">
                        {dirPath}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Default priority */}
          <SettingRow label={t.settings.defaultPriority} hint={t.settings.defaultPriorityHint}>
            <select
              value={settings.defaultPriority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent-dark"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </SettingRow>

          {/* Confirm delete */}
          <SettingToggle
            label={t.settings.confirmDelete}
            hint={t.settings.confirmDeleteHint}
            checked={settings.confirmDelete}
            onChange={() => handleToggle('confirmDelete')}
          />

          {/* Confirm complete */}
          <SettingToggle
            label={t.settings.confirmComplete}
            hint={t.settings.confirmCompleteHint}
            checked={settings.confirmComplete}
            onChange={() => handleToggle('confirmComplete')}
          />

          {/* Waiting warning days */}
          <SettingRow label={t.settings.warnWaitingDays} hint={t.settings.warnWaitingDaysHint}>
            <input
              type="number"
              min={1}
              value={settings.warnWaitingDays}
              onChange={(e) => handleNumberChange('warnWaitingDays', e.target.value)}
              className="w-20 px-3 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent-dark"
            />
          </SettingRow>

          {/* Waiting warning critical days */}
          <SettingRow label={t.settings.warnWaitingCritical} hint={t.settings.warnWaitingCriticalHint}>
            <input
              type="number"
              min={1}
              value={settings.warnWaitingCritical}
              onChange={(e) => handleNumberChange('warnWaitingCritical', e.target.value)}
              className="w-20 px-3 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent-dark"
            />
          </SettingRow>

          {/* Obsidian mode */}
          <SettingToggle
            label={t.settings.obsidianMode}
            hint={t.settings.obsidianModeHint}
            checked={settings.obsidianMode}
            onChange={() => handleToggle('obsidianMode')}
          />

          {/* Language */}
          <SettingRow label={t.settings.language} hint={t.settings.languageHint}>
            <select
              value={settings.language ?? 'en'}
              onChange={(e) => updateSettings({ language: e.target.value as 'de' | 'en' })}
              className="w-full px-3 py-1.5 text-sm rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent-dark"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </SettingRow>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border dark:border-border-dark">
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
            {t.settings.autoSaveHint}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

interface SettingRowProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function SettingRow({ label, hint, children }: SettingRowProps): React.ReactElement {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-1">
        {label}
      </label>
      {hint && (
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark mb-1.5">{hint}</p>
      )}
      {children}
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
}

function SettingToggle({ label, hint, checked, onChange }: SettingToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
          {label}
        </span>
        {hint && (
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-0.5">{hint}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark focus:ring-offset-2 ${
          checked
            ? 'bg-accent dark:bg-accent-dark'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
