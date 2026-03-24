import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import { hasContextViewFilter } from '@shared/utils';
import MultiSelectDropdown from './MultiSelectDropdown';
import DateFilterDropdown from './DateFilterDropdown';
import type { DatePreset } from './DateFilterDropdown';
import FilterChips from './FilterChips';
import type { TopicStatus, TopicPriority, TopicDirection } from '@shared/types';

export default function ContextFilterBar(): React.ReactElement {
  const contextViewFilter = useAppStore((s) => s.contextViewFilter);
  const updateContextViewFilter = useAppStore((s) => s.updateContextViewFilter);
  const resetContextViewFilter = useAppStore((s) => s.resetContextViewFilter);
  const contexts = useAppStore((s) => s.contexts);
  const t = useTranslation();

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'new', label: t.status.new },
    { value: 'ready', label: t.status.ready },
    { value: 'follow-up', label: t.status['follow-up'] },
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

  // Local search state for debouncing
  const [searchInput, setSearchInput] = useState(contextViewFilter.search ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local search when filter is reset externally
  useEffect(() => {
    setSearchInput(contextViewFilter.search ?? '');
  }, [contextViewFilter.search]);

  function handleSearchChange(value: string): void {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateContextViewFilter({ search: value || undefined });
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Derive date presets from filter state
  const dueDatePreset: DatePreset | null =
    contextViewFilter.overdue ? 'overdue' :
    contextViewFilter.dueThisWeek ? 'thisWeek' :
    contextViewFilter.dueNextWeek ? 'nextWeek' :
    contextViewFilter.noDueDate ? 'noDate' : null;

  const followUpPreset: DatePreset | null =
    contextViewFilter.followUpOverdue ? 'overdue' :
    contextViewFilter.followUpThisWeek ? 'thisWeek' :
    contextViewFilter.followUpNextWeek ? 'nextWeek' :
    contextViewFilter.noFollowUpDate ? 'noDate' : null;

  function handleDueDatePreset(preset: DatePreset | null): void {
    const clear = { overdue: undefined, dueThisWeek: undefined, dueNextWeek: undefined, noDueDate: undefined, dueBefore: undefined, dueAfter: undefined };
    if (!preset) { updateContextViewFilter(clear); return; }
    switch (preset) {
      case 'overdue': updateContextViewFilter({ ...clear, overdue: true }); break;
      case 'thisWeek': updateContextViewFilter({ ...clear, dueThisWeek: true }); break;
      case 'nextWeek': updateContextViewFilter({ ...clear, dueNextWeek: true }); break;
      case 'noDate': updateContextViewFilter({ ...clear, noDueDate: true }); break;
    }
  }

  function handleDueDateCustomRange(from?: string, to?: string): void {
    updateContextViewFilter({
      overdue: undefined, dueThisWeek: undefined, dueNextWeek: undefined, noDueDate: undefined,
      dueAfter: from, dueBefore: to,
    });
  }

  function handleFollowUpPreset(preset: DatePreset | null): void {
    const clear = { followUpOverdue: undefined, followUpThisWeek: undefined, followUpNextWeek: undefined, noFollowUpDate: undefined, followUpBefore: undefined, followUpAfter: undefined };
    if (!preset) { updateContextViewFilter(clear); return; }
    switch (preset) {
      case 'overdue': updateContextViewFilter({ ...clear, followUpOverdue: true }); break;
      case 'thisWeek': updateContextViewFilter({ ...clear, followUpThisWeek: true }); break;
      case 'nextWeek': updateContextViewFilter({ ...clear, followUpNextWeek: true }); break;
      case 'noDate': updateContextViewFilter({ ...clear, noFollowUpDate: true }); break;
    }
  }

  function handleFollowUpCustomRange(from?: string, to?: string): void {
    updateContextViewFilter({
      followUpOverdue: undefined, followUpThisWeek: undefined, followUpNextWeek: undefined, noFollowUpDate: undefined,
      followUpAfter: from, followUpBefore: to,
    });
  }

  const hasFilters = hasContextViewFilter(contextViewFilter);

  const SCALAR_FILTER_KEYS = [
    'search', 'dueBefore', 'dueAfter', 'overdue', 'dueThisWeek', 'dueNextWeek', 'noDueDate',
    'followUpOverdue', 'followUpBefore', 'followUpAfter', 'noFollowUpDate', 'followUpThisWeek', 'followUpNextWeek',
  ];

  function handleRemoveFilter(dimension: string, value?: string): void {
    if (SCALAR_FILTER_KEYS.includes(dimension)) {
      updateContextViewFilter({ [dimension]: undefined });
    } else {
      const current = contextViewFilter[dimension as keyof typeof contextViewFilter] as string[] | undefined;
      if (current && value) {
        const updated = current.filter((v: string) => v !== value);
        updateContextViewFilter({ [dimension]: updated.length > 0 ? updated : undefined });
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
          selected={(contextViewFilter.status ?? []) as string[]}
          onChange={(values) => updateContextViewFilter({ status: values.length > 0 ? values as TopicStatus[] : undefined })}
        />
        <MultiSelectDropdown
          label={t.filter.priority}
          options={PRIORITY_OPTIONS}
          selected={(contextViewFilter.priority ?? []) as string[]}
          onChange={(values) => updateContextViewFilter({ priority: values.length > 0 ? values as TopicPriority[] : undefined })}
        />
        <MultiSelectDropdown
          label={t.filter.direction}
          options={DIRECTION_OPTIONS}
          selected={(contextViewFilter.direction ?? []) as string[]}
          onChange={(values) => updateContextViewFilter({ direction: values.length > 0 ? values as TopicDirection[] : undefined })}
        />

        {/* Due date filter */}
        <DateFilterDropdown
          label={t.filter.due.replace(':', '')}
          presetValue={dueDatePreset}
          customFrom={dueDatePreset ? undefined : contextViewFilter.dueAfter}
          customTo={dueDatePreset ? undefined : contextViewFilter.dueBefore}
          onPresetChange={handleDueDatePreset}
          onCustomRangeChange={handleDueDateCustomRange}
          presetOptions={DUE_DATE_PRESETS}
        />

        {/* Follow-up date filter */}
        <DateFilterDropdown
          label={t.filter.followUpDate}
          presetValue={followUpPreset}
          customFrom={followUpPreset ? undefined : contextViewFilter.followUpAfter}
          customTo={followUpPreset ? undefined : contextViewFilter.followUpBefore}
          onPresetChange={handleFollowUpPreset}
          onCustomRangeChange={handleFollowUpCustomRange}
          presetOptions={FOLLOW_UP_PRESETS}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reset link */}
        {hasFilters && (
          <button
            type="button"
            className="text-xs text-accent dark:text-accent-dark hover:underline"
            onClick={resetContextViewFilter}
            title={t.filter.resetAll}
          >
            {t.filter.resetAll}
          </button>
        )}
      </div>

      {/* Row 2: Active filter chips */}
      {hasFilters && (
        <FilterChips
          filter={contextViewFilter}
          contexts={contexts}
          onRemoveFilter={handleRemoveFilter}
        />
      )}
    </div>
  );
}
