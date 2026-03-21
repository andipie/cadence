import React from 'react';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import MultiSelectDropdown from './MultiSelectDropdown';

/**
 * Dedicated filter bar for the Liefern system view.
 * Provides context filter, time horizon quick buttons, and "without due date" checkbox.
 */
export default function LiefernFilterBar(): React.ReactElement {
  const liefernFilter = useAppStore((s) => s.liefernFilter);
  const updateLiefernFilter = useAppStore((s) => s.updateLiefernFilter);
  const resetLiefernFilter = useAppStore((s) => s.resetLiefernFilter);
  const contexts = useAppStore((s) => s.contexts);
  const t = useTranslation();

  const contextOptions = contexts.map((c) => ({ value: c.id, label: c.name }));

  // Compute dueBefore dates for quick buttons
  const today = new Date();
  function addDays(days: number): string {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
  const tomorrowStr = addDays(1);
  const oneWeekStr = addDays(7);
  const twoWeeksStr = addDays(14);

  const timeHorizonButtons = [
    { label: t.filter.tomorrow, value: tomorrowStr },
    { label: t.filter.oneWeek, value: oneWeekStr },
    { label: t.filter.twoWeeks, value: twoWeeksStr },
  ];

  // Check if any filters are active
  const hasActiveFilters =
    (liefernFilter.contexts && liefernFilter.contexts.length > 0) ||
    liefernFilter.dueBefore ||
    !liefernFilter.includeNoDueDate;

  return (
    <div className="px-3 py-2 border-b border-border dark:border-border-dark space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Context multi-select */}
        <MultiSelectDropdown
          label={t.filter.context}
          options={contextOptions}
          selected={liefernFilter.contexts ?? []}
          onChange={(values) => updateLiefernFilter({ contexts: values.length > 0 ? values : undefined })}
        />

        {/* Separator */}
        <div className="w-px h-5 bg-border dark:bg-border-dark" />

        {/* Time horizon quick buttons */}
        {timeHorizonButtons.map((btn) => (
          <button
            key={btn.value}
            type="button"
            onClick={() => updateLiefernFilter({
              dueBefore: liefernFilter.dueBefore === btn.value ? undefined : btn.value,
            })}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              liefernFilter.dueBefore === btn.value
                ? 'border-accent dark:border-accent-dark bg-accent/10 text-accent dark:text-accent-dark'
                : 'border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-text-secondary dark:hover:border-text-secondary-dark'
            }`}
            title={t.filter.dueDateFilterTooltip(btn.label)}
          >
            {btn.label}
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-5 bg-border dark:bg-border-dark" />

        {/* "Ohne Fälligkeitsdatum" checkbox */}
        <label className="flex items-center gap-1.5 text-xs text-text-secondary dark:text-text-secondary-dark cursor-pointer select-none">
          <input
            type="checkbox"
            checked={liefernFilter.includeNoDueDate}
            onChange={(e) => updateLiefernFilter({ includeNoDueDate: e.target.checked })}
            className="rounded border-border dark:border-border-dark text-accent dark:text-accent-dark focus:ring-accent dark:focus:ring-accent-dark"
          />
          {t.filter.noDueDate}
        </label>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            className="text-xs text-accent dark:text-accent-dark hover:underline"
            onClick={resetLiefernFilter}
            title={t.filter.resetAll}
          >
            {t.filter.reset}
          </button>
        )}
      </div>
    </div>
  );
}
