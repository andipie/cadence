import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

type DatePreset = 'overdue' | 'thisWeek' | 'nextWeek' | 'noDate';

interface DateFilterDropdownProps {
  label: string;
  presetValue: DatePreset | null;
  customFrom?: string;
  customTo?: string;
  onPresetChange: (preset: DatePreset | null) => void;
  onCustomRangeChange: (from?: string, to?: string) => void;
  presetOptions: { value: DatePreset; label: string }[];
}

export type { DatePreset };

export default function DateFilterDropdown({
  label,
  presetValue,
  customFrom,
  customTo,
  onPresetChange,
  onCustomRangeChange,
  presetOptions,
}: DateFilterDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslation();

  const isCustomRange = !presetValue && (!!customFrom || !!customTo);
  const hasSelection = presetValue !== null || isCustomRange;

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function handlePresetClick(preset: DatePreset): void {
    if (presetValue === preset) {
      onPresetChange(null);
    } else {
      onPresetChange(preset);
    }
  }

  function handleClear(): void {
    onPresetChange(null);
    onCustomRangeChange(undefined, undefined);
  }

  // Determine the active label for the badge
  const activeLabel = presetValue
    ? presetOptions.find((o) => o.value === presetValue)?.label
    : isCustomRange
      ? t.filter.customRange
      : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
          hasSelection
            ? 'border-accent dark:border-accent-dark bg-accent/10 text-accent dark:text-accent-dark'
            : 'border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-text-secondary dark:hover:border-text-secondary-dark'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
        {activeLabel && (
          <span className="ml-1 text-[10px] opacity-80">({activeLabel})</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-lg shadow-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark py-1">
          {/* Clear option */}
          {hasSelection && (
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm text-accent dark:text-accent-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark"
              onClick={handleClear}
            >
              {t.filter.clearFilter}
            </button>
          )}

          {/* Preset options */}
          {presetOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface-hover dark:hover:bg-surface-hover-dark ${
                presetValue === option.value
                  ? 'text-accent dark:text-accent-dark font-medium'
                  : 'text-text-primary dark:text-text-primary-dark'
              }`}
              onClick={() => handlePresetClick(option.value)}
            >
              {presetValue === option.value && '● '}
              {option.label}
            </button>
          ))}

          {/* Separator */}
          <div className="border-t border-border dark:border-border-dark my-1" />

          {/* Custom range */}
          <div className="px-3 py-1.5">
            <div className={`text-sm mb-1.5 ${
              isCustomRange
                ? 'text-accent dark:text-accent-dark font-medium'
                : 'text-text-primary dark:text-text-primary-dark'
            }`}>
              {isCustomRange && '● '}
              {t.filter.customRange}
            </div>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customFrom ?? ''}
                onChange={(e) => {
                  onPresetChange(null);
                  onCustomRangeChange(e.target.value || undefined, customTo);
                }}
                className="px-1.5 py-0.5 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-xs w-[120px]"
              />
              <span className="text-text-secondary dark:text-text-secondary-dark text-xs">–</span>
              <input
                type="date"
                value={customTo ?? ''}
                onChange={(e) => {
                  onPresetChange(null);
                  onCustomRangeChange(customFrom, e.target.value || undefined);
                }}
                className="px-1.5 py-0.5 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-xs w-[120px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
