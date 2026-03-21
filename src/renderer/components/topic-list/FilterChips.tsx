import React from 'react';
import type { TopicFilter, Context } from '@shared/types';
import { formatDate } from '@shared/utils';
import { useTranslation } from '../../hooks/useTranslation';

interface FilterChipsProps {
  filter: TopicFilter;
  contexts: Context[];
  onRemoveFilter: (dimension: string, value?: string) => void;
}

export default function FilterChips({
  filter,
  contexts,
  onRemoveFilter,
}: FilterChipsProps): React.ReactElement | null {
  const t = useTranslation();
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  // Status chips
  if (filter.status) {
    for (const s of filter.status) {
      chips.push({
        key: `status-${s}`,
        label: t.chips.status(t.status[s] ?? s),
        onRemove: () => onRemoveFilter('status', s),
      });
    }
  }

  // Priority chips
  if (filter.priority) {
    for (const p of filter.priority) {
      chips.push({
        key: `priority-${p}`,
        label: t.chips.priority(t.priority[p] ?? p),
        onRemove: () => onRemoveFilter('priority', p),
      });
    }
  }

  // Direction chips
  if (filter.direction) {
    for (const d of filter.direction) {
      chips.push({
        key: `direction-${d}`,
        label: t.chips.direction(t.direction[d] ?? d),
        onRemove: () => onRemoveFilter('direction', d),
      });
    }
  }

  // Context chips
  if (filter.contexts) {
    for (const ctxId of filter.contexts) {
      const ctx = contexts.find((c) => c.id === ctxId);
      chips.push({
        key: `context-${ctxId}`,
        label: t.chips.context(ctx?.name ?? ctxId),
        onRemove: () => onRemoveFilter('contexts', ctxId),
      });
    }
  }

  // Search chip
  if (filter.search) {
    chips.push({
      key: 'search',
      label: t.chips.search(filter.search),
      onRemove: () => onRemoveFilter('search'),
    });
  }

  // Due date chips
  if (filter.dueAfter) {
    chips.push({
      key: 'dueAfter',
      label: t.chips.dueAfter(formatDate(filter.dueAfter)),
      onRemove: () => onRemoveFilter('dueAfter'),
    });
  }
  if (filter.dueBefore) {
    chips.push({
      key: 'dueBefore',
      label: t.chips.dueBefore(formatDate(filter.dueBefore)),
      onRemove: () => onRemoveFilter('dueBefore'),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent dark:text-accent-dark"
        >
          {chip.label}
          <button
            type="button"
            className="ml-0.5 hover:text-danger dark:hover:text-danger-dark"
            onClick={chip.onRemove}
            title={t.chips.removeFilter}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
