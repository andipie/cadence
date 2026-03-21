import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import MultiSelectDropdown from './MultiSelectDropdown';
import FilterChips from './FilterChips';
import type { TopicStatus, TopicPriority, TopicDirection, TopicFilter } from '@shared/types';

export default function FilterBar(): React.ReactElement {
  const freeViewFilter = useAppStore((s) => s.freeViewFilter);
  const updateFreeViewFilter = useAppStore((s) => s.updateFreeViewFilter);
  const resetFreeViewFilter = useAppStore((s) => s.resetFreeViewFilter);
  const createSavedView = useAppStore((s) => s.createSavedView);
  const contexts = useAppStore((s) => s.contexts);
  const topics = useAppStore((s) => s.topics);
  const t = useTranslation();

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'neu', label: t.status.neu },
    { value: 'follow-up', label: t.status['follow-up'] },
    { value: 'erledigt', label: t.status.erledigt },
  ], [t]);

  const PRIORITY_OPTIONS = useMemo(() => [
    { value: 'hoch', label: t.priority.hoch },
    { value: 'mittel', label: t.priority.mittel },
    { value: 'normal', label: t.priority.normal },
  ], [t]);

  const DIRECTION_OPTIONS = useMemo(() => [
    { value: 'ansprechen', label: t.direction.ansprechen },
    { value: 'liefern', label: t.direction.liefern },
    { value: 'warten', label: t.direction.warten },
  ], [t]);

  const GROUP_BY_OPTIONS = useMemo(() => [
    { value: 'direction', label: t.filter.groupByDirection },
    { value: 'status', label: t.filter.groupByStatus },
    { value: 'priority', label: t.filter.groupByPriority },
    { value: 'context', label: t.filter.groupByContext },
    { value: 'none', label: t.filter.groupByNone },
  ], [t]);

  const SORT_BY_OPTIONS = useMemo(() => [
    { value: 'priority', label: t.filter.sortByPriority },
    { value: 'due_date', label: t.filter.sortByDueDate },
    { value: 'created_at', label: t.filter.sortByCreatedAt },
    { value: 'updated_at', label: t.filter.sortByUpdatedAt },
  ], [t]);

  // Local search state for debouncing
  const [searchInput, setSearchInput] = useState(freeViewFilter.search ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save view state
  const [isSaving, setIsSaving] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Sync local search when filter is reset externally
  useEffect(() => {
    setSearchInput(freeViewFilter.search ?? '');
  }, [freeViewFilter.search]);

  function handleSearchChange(value: string): void {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateFreeViewFilter({ search: value || undefined });
    }, 300);
  }

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Focus save input when entering save mode
  useEffect(() => {
    if (isSaving && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [isSaving]);

  async function handleSaveView(): Promise<void> {
    const trimmed = saveViewName.trim();
    if (!trimmed) return;
    await createSavedView(trimmed);
    setIsSaving(false);
    setSaveViewName('');
  }

  function handleSaveKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      handleSaveView();
    } else if (e.key === 'Escape') {
      setIsSaving(false);
      setSaveViewName('');
    }
  }

  const contextOptions = contexts.map((c) => ({ value: c.id, label: c.name }));

  const currentGroupBy = freeViewFilter.groupBy ?? 'direction';
  const currentSortBy = freeViewFilter.sortBy ?? 'priority';

  // Check if any filters are active
  const hasActiveFilters =
    (freeViewFilter.status && freeViewFilter.status.length > 0) ||
    (freeViewFilter.priority && freeViewFilter.priority.length > 0) ||
    (freeViewFilter.direction && freeViewFilter.direction.length > 0) ||
    (freeViewFilter.contexts && freeViewFilter.contexts.length > 0) ||
    freeViewFilter.search ||
    freeViewFilter.dueBefore ||
    freeViewFilter.dueAfter;

  function handleRemoveFilter(dimension: string, value?: string): void {
    if (dimension === 'search' || dimension === 'dueBefore' || dimension === 'dueAfter') {
      updateFreeViewFilter({ [dimension]: undefined });
    } else {
      // Remove a specific value from an array filter
      const current = freeViewFilter[dimension as keyof typeof freeViewFilter] as string[] | undefined;
      if (current && value) {
        const updated = current.filter((v: string) => v !== value);
        updateFreeViewFilter({ [dimension]: updated.length > 0 ? updated : undefined });
      }
    }
  }

  return (
    <div className="p-3 border-b border-border dark:border-border-dark space-y-2">
      {/* Row 1: Search + Filter dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t.filter.search}
          title={t.filter.searchTooltip}
          className="px-2.5 py-1 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark placeholder-text-secondary dark:placeholder-text-secondary-dark text-xs w-36 focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent-dark"
        />

        {/* Multi-select filters */}
        <MultiSelectDropdown
          label={t.filter.status}
          options={STATUS_OPTIONS}
          selected={(freeViewFilter.status ?? []) as string[]}
          onChange={(values) => updateFreeViewFilter({ status: values.length > 0 ? values as TopicStatus[] : undefined })}
        />
        <MultiSelectDropdown
          label={t.filter.priority}
          options={PRIORITY_OPTIONS}
          selected={(freeViewFilter.priority ?? []) as string[]}
          onChange={(values) => updateFreeViewFilter({ priority: values.length > 0 ? values as TopicPriority[] : undefined })}
        />
        <MultiSelectDropdown
          label={t.filter.direction}
          options={DIRECTION_OPTIONS}
          selected={(freeViewFilter.direction ?? []) as string[]}
          onChange={(values) => updateFreeViewFilter({ direction: values.length > 0 ? values as TopicDirection[] : undefined })}
        />
        <MultiSelectDropdown
          label={t.filter.context}
          options={contextOptions}
          selected={freeViewFilter.contexts ?? []}
          onChange={(values) => updateFreeViewFilter({ contexts: values.length > 0 ? values : undefined })}
        />

        {/* Due date range */}
        <div className="flex items-center gap-1 text-xs text-text-secondary dark:text-text-secondary-dark">
          <span>{t.filter.due}</span>
          <input
            type="date"
            value={freeViewFilter.dueAfter ?? ''}
            onChange={(e) => updateFreeViewFilter({ dueAfter: e.target.value || undefined })}
            className="px-1.5 py-0.5 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-xs"
            title={t.filter.dueFrom}
          />
          <span>–</span>
          <input
            type="date"
            value={freeViewFilter.dueBefore ?? ''}
            onChange={(e) => updateFreeViewFilter({ dueBefore: e.target.value || undefined })}
            className="px-1.5 py-0.5 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-xs"
            title={t.filter.dueTo}
          />
        </div>
      </div>

      {/* Row 2: GroupBy + SortBy + Counter + Reset */}
      <div className="flex items-center gap-3 text-xs">
        {/* GroupBy */}
        <div className="flex items-center gap-1">
          <span className="text-text-secondary dark:text-text-secondary-dark">{t.filter.groupBy}</span>
          <select
            value={currentGroupBy}
            onChange={(e) => updateFreeViewFilter({ groupBy: e.target.value as TopicFilter['groupBy'] })}
            className="px-1.5 py-0.5 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-xs"
            title={t.filter.groupByTooltip}
          >
            {GROUP_BY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* SortBy */}
        <div className="flex items-center gap-1">
          <span className="text-text-secondary dark:text-text-secondary-dark">{t.filter.sortBy}</span>
          <select
            value={currentSortBy}
            onChange={(e) => updateFreeViewFilter({ sortBy: e.target.value as TopicFilter['sortBy'] })}
            className="px-1.5 py-0.5 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-xs"
            title={t.filter.sortByTooltip}
          >
            {SORT_BY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Results counter */}
        <span className="text-text-secondary dark:text-text-secondary-dark">
          {t.topicList.resultsCount(topics.length)}
        </span>

        {/* Reset link */}
        {hasActiveFilters && (
          <button
            type="button"
            className="text-accent dark:text-accent-dark hover:underline"
            onClick={resetFreeViewFilter}
            title={t.filter.resetAll}
          >
            {t.filter.resetAll}
          </button>
        )}

        {/* Save view */}
        {isSaving ? (
          <div className="flex items-center gap-1">
            <input
              ref={saveInputRef}
              type="text"
              value={saveViewName}
              onChange={(e) => setSaveViewName(e.target.value)}
              onKeyDown={handleSaveKeyDown}
              onBlur={() => { setIsSaving(false); setSaveViewName(''); }}
              placeholder={t.filter.viewNamePlaceholder}
              className="px-2 py-0.5 rounded border border-accent dark:border-accent-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-xs w-32 focus:outline-none"
            />
          </div>
        ) : (
          <button
            type="button"
            className="text-accent dark:text-accent-dark hover:underline"
            onClick={() => setIsSaving(true)}
            title={t.filter.saveViewTooltip}
          >
            {t.filter.saveView}
          </button>
        )}
      </div>

      {/* Row 3: Active filter chips */}
      {hasActiveFilters && (
        <FilterChips
          filter={freeViewFilter}
          contexts={contexts}
          onRemoveFilter={handleRemoveFilter}
        />
      )}
    </div>
  );
}
