import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import type { TopicStatus, TopicPriority, TopicDirection } from '@shared/types';

interface ConfirmState {
  show: boolean;
  count: number;
}

export default function BulkToolbar(): React.ReactElement | null {
  const selectedTopicIds = useAppStore((s) => s.selectedTopicIds);
  const selectAllTopics = useAppStore((s) => s.selectAllTopics);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const bulkUpdateTopics = useAppStore((s) => s.bulkUpdateTopics);
  const bulkDeleteTopics = useAppStore((s) => s.bulkDeleteTopics);
  const contexts = useAppStore((s) => s.contexts);
  const t = useTranslation();

  const [confirmDelete, setConfirmDelete] = useState<ConfirmState>({ show: false, count: 0 });

  if (selectedTopicIds.length === 0) return null;

  const count = selectedTopicIds.length;

  function handleStatusChange(status: TopicStatus): void {
    bulkUpdateTopics({ status });
  }

  function handlePriorityChange(priority: TopicPriority): void {
    bulkUpdateTopics({ priority });
  }

  function handleDirectionChange(direction: TopicDirection): void {
    bulkUpdateTopics({ direction });
  }

  function handleContextAssign(contextId: string): void {
    bulkUpdateTopics({ contexts: [contextId] });
  }

  function handleDeleteClick(): void {
    setConfirmDelete({ show: true, count });
  }

  async function handleConfirmDelete(): Promise<void> {
    setConfirmDelete({ show: false, count: 0 });
    await bulkDeleteTopics();
  }

  return (
    <>
      <div className="border-t border-border dark:border-border-dark bg-surface-secondary dark:bg-surface-secondary-dark px-3 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        {/* Top row: counter + quick select */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
            {t.bulk.selected(count)}
          </span>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAllTopics}
              className="text-accent dark:text-accent-dark hover:underline"
              title={t.bulk.selectAll}
            >
              {t.bulk.selectAllShort}
            </button>
            <span className="text-text-secondary dark:text-text-secondary-dark">·</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-accent dark:text-accent-dark hover:underline"
              title={t.bulk.deselectAll}
            >
              {t.bulk.deselectAllShort}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Context dropdown */}
          <BulkDropdown
            label={t.bulk.context}
            options={contexts.map((c) => ({ value: c.id, label: c.name }))}
            onSelect={(val) => handleContextAssign(val)}
            changeLabel={t.bulk.changeLabel}
          />

          {/* Priority dropdown */}
          <BulkDropdown
            label={t.bulk.priority}
            options={[
              { value: 'high', label: t.priority.high },
              { value: 'medium', label: t.priority.medium },
              { value: 'normal', label: t.priority.normal },
            ]}
            onSelect={(val) => handlePriorityChange(val as TopicPriority)}
            changeLabel={t.bulk.changeLabel}
          />

          {/* Status dropdown */}
          <BulkDropdown
            label={t.bulk.status}
            options={[
              { value: 'new', label: t.status.new },
              { value: 'ready', label: t.status.ready },
              { value: 'follow-up', label: t.status['follow-up'] },
              { value: 'done', label: t.status.done },
              { value: 'canceled', label: t.status.canceled },
            ]}
            onSelect={(val) => handleStatusChange(val as TopicStatus)}
            changeLabel={t.bulk.changeLabel}
          />

          {/* Direction dropdown */}
          <BulkDropdown
            label={t.bulk.direction}
            options={[
              { value: 'discuss', label: t.direction.discuss },
              { value: 'deliver', label: t.direction.deliver },
              { value: 'waiting', label: t.direction.waiting },
            ]}
            onSelect={(val) => handleDirectionChange(val as TopicDirection)}
            changeLabel={t.bulk.changeLabel}
          />

          {/* Delete button */}
          <button
            type="button"
            onClick={handleDeleteClick}
            className="px-2.5 py-1 rounded text-xs font-medium bg-danger/10 text-danger dark:text-danger-dark hover:bg-danger/20 transition-colors"
            title={t.bulk.delete}
          >
            {t.bulk.delete}
          </button>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {confirmDelete.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setConfirmDelete({ show: false, count: 0 })}
        >
          <div
            className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl shadow-2xl p-6 w-[360px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
              {t.bulk.deleteConfirmTitle}
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
              {t.bulk.deleteConfirmMessage(confirmDelete.count)}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete({ show: false, count: 0 })}
                className="px-4 py-2 rounded text-sm border border-border dark:border-border-dark text-text-primary dark:text-text-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark transition-colors"
              >
                {t.bulk.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded text-sm font-medium bg-danger text-white hover:bg-danger/90 transition-colors"
              >
                {t.bulk.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- Internal mini-dropdown component ---

interface BulkDropdownProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  onSelect: (value: string) => void;
  changeLabel?: (label: string) => string;
}

function BulkDropdown({ label, options, onSelect, changeLabel }: BulkDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1 rounded text-xs font-medium border border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-accent dark:hover:border-accent-dark hover:text-accent dark:hover:text-accent-dark transition-colors"
        title={changeLabel ? changeLabel(label) : `${label} ändern`}
      >
        {label} ▾
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[140px] rounded-lg shadow-lg bg-surface dark:bg-surface-dark border border-border dark:border-border-dark overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-text-primary dark:text-text-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
