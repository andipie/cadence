import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import MultiSelectDropdown from './MultiSelectDropdown';
import DateFilterDropdown from './DateFilterDropdown';
import type { DatePreset } from './DateFilterDropdown';
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
    { value: 'new', label: t.status.new },
    { value: 'ready', label: t.status.ready },
    { value: 'follow-up', label: t.status['follow-up'] },
    { value: 'done', label: t.status.done },
    { value: 'canceled', label: t.status.canceled },
  ], [t]);

  const PRIORITY_OPTIONS = useMemo(() => [
    { value: 'high', label: t.priority.high },
    { value: 'medium', label: t.priority.medium },
    { value: 'normal', label: t.priority.normal },
  ], [t]);

  const DIRECTION_OPTIONS = useMemo(() => [
    { value: 'discuss', label: t.direction.discuss },
    { value: 'deliver', label: t.direction.deliver },
    { value: 'waiting', label: t.direction.waiting },
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

  const DUE_DATE_PRESETS = useMemo(() => [
    { value: 'overdue' as DatePreset, label: t.filter.dueOverdue },
    { value: 'thisWeek' as DatePreset, label: t.filter.dueThisWeek },
    { value: 'nextWeek' as DatePreset, label: t.filter.dueNextWeek },
    { value: 'noDate' as DatePreset, label: t.filter.noDueDate },
  ], [t]);

  const FOLLOW_UP_PRESETS = useMemo(() => [
    { value: 'overdue' as DatePreset, label: t.filter.followUpOverdue },
    { value: 'thisWeek' as DatePreset, label: t.filter.followUpThisWeek },
    { value: 'nextWeek' as DatePreset, label: t.filter.followUpNextWeek },
    { value: 'noDate' as DatePreset, label: t.filter.noFollowUpDate },
  ], [t]);

  // Derive current preset from filter state
  const dueDatePreset: DatePreset | null =
    freeViewFilter.overdue ? 'overdue' :
    freeViewFilter.dueThisWeek ? 'thisWeek' :
    freeViewFilter.dueNextWeek ? 'nextWeek' :
    freeViewFilter.noDueDate ? 'noDate' : null;

  const followUpPreset: DatePreset | null =
    freeViewFilter.followUpOverdue ? 'overdue' :
    freeViewFilter.followUpThisWeek ? 'thisWeek' :
    freeViewFilter.followUpNextWeek ? 'nextWeek' :
    freeViewFilter.noFollowUpDate ? 'noDate' : null;

  function handleDueDatePreset(preset: DatePreset | null): void {
    const clear = { overdue: undefined, dueThisWeek: undefined, dueNextWeek: undefined, noDueDate: undefined, dueBefore: undefined, dueAfter: undefined };
    if (!preset) { updateFreeViewFilter(clear); return; }
    switch (preset) {
      case 'overdue': updateFreeViewFilter({ ...clear, overdue: true }); break;
      case 'thisWeek': updateFreeViewFilter({ ...clear, dueThisWeek: true }); break;
      case 'nextWeek': updateFreeViewFilter({ ...clear, dueNextWeek: true }); break;
      case 'noDate': updateFreeViewFilter({ ...clear, noDueDate: true }); break;
    }
  }

  function handleDueDateCustomRange(from?: string, to?: string): void {
    updateFreeViewFilter({
      overdue: undefined, dueThisWeek: undefined, dueNextWeek: undefined, noDueDate: undefined,
      dueAfter: from, dueBefore: to,
    });
  }

  function handleFollowUpPreset(preset: DatePreset | null): void {
    const clear = { followUpOverdue: undefined, followUpThisWeek: undefined, followUpNextWeek: undefined, noFollowUpDate: undefined, followUpBefore: undefined, followUpAfter: undefined };
    if (!preset) { updateFreeViewFilter(clear); return; }
    switch (preset) {
      case 'overdue': updateFreeViewFilter({ ...clear, followUpOverdue: true }); break;
      case 'thisWeek': updateFreeViewFilter({ ...clear, followUpThisWeek: true }); break;
      case 'nextWeek': updateFreeViewFilter({ ...clear, followUpNextWeek: true }); break;
      case 'noDate': updateFreeViewFilter({ ...clear, noFollowUpDate: true }); break;
    }
  }

  function handleFollowUpCustomRange(from?: string, to?: string): void {
    updateFreeViewFilter({
      followUpOverdue: undefined, followUpThisWeek: undefined, followUpNextWeek: undefined, noFollowUpDate: undefined,
      followUpAfter: from, followUpBefore: to,
    });
  }

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
    freeViewFilter.dueAfter ||
    freeViewFilter.overdue ||
    freeViewFilter.dueThisWeek ||
    freeViewFilter.dueNextWeek ||
    freeViewFilter.noDueDate ||
    freeViewFilter.followUpOverdue ||
    freeViewFilter.followUpThisWeek ||
    freeViewFilter.followUpNextWeek ||
    freeViewFilter.noFollowUpDate ||
    freeViewFilter.followUpBefore ||
    freeViewFilter.followUpAfter;

  const SCALAR_FILTER_KEYS = [
    'search', 'dueBefore', 'dueAfter', 'overdue', 'dueThisWeek', 'dueNextWeek', 'noDueDate',
    'followUpOverdue', 'followUpBefore', 'followUpAfter', 'noFollowUpDate', 'followUpThisWeek', 'followUpNextWeek',
  ];

  function handleRemoveFilter(dimension: string, value?: string): void {
    if (SCALAR_FILTER_KEYS.includes(dimension)) {
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

        {/* Due date filter */}
        <DateFilterDropdown
          label={t.filter.due.replace(':', '')}
          presetValue={dueDatePreset}
          customFrom={dueDatePreset ? undefined : freeViewFilter.dueAfter}
          customTo={dueDatePreset ? undefined : freeViewFilter.dueBefore}
          onPresetChange={handleDueDatePreset}
          onCustomRangeChange={handleDueDateCustomRange}
          presetOptions={DUE_DATE_PRESETS}
        />

        {/* Follow-up date filter */}
        <DateFilterDropdown
          label={t.filter.followUpDate}
          presetValue={followUpPreset}
          customFrom={followUpPreset ? undefined : freeViewFilter.followUpAfter}
          customTo={followUpPreset ? undefined : freeViewFilter.followUpBefore}
          onPresetChange={handleFollowUpPreset}
          onCustomRangeChange={handleFollowUpCustomRange}
          presetOptions={FOLLOW_UP_PRESETS}
        />
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
