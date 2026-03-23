import React, { useEffect, useRef, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Topic } from '@shared/types';
import { calcWaitingDays, getWaitingLevel, isOverdue, formatDate } from '@shared/utils';
import { useTranslation } from '../../hooks/useTranslation';

interface TopicRowProps {
  topic: Topic;
  isSelected: boolean;
  onSelect: (id: string) => void;
  multiSelectMode?: boolean;
  isChecked?: boolean;
  onToggleCheck?: (id: string) => void;
  sortable?: boolean;
}

const PRIO_COLORS: Record<string, string> = {
  high: 'bg-prio-high',
  medium: 'bg-prio-medium',
  normal: 'bg-prio-normal',
};

function TopicRowInner({
  topic,
  isSelected,
  onSelect,
  multiSelectMode = false,
  isChecked = false,
  onToggleCheck,
  sortable = false,
}: TopicRowProps): React.ReactElement {
  const t = useTranslation();
  const rowRef = useRef<HTMLButtonElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: topic.id,
    disabled: !sortable || multiSelectMode,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  };

  // Scroll into view when selected (e.g. via keyboard navigation)
  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  // Memoize derived calculations to avoid recomputing on every render
  const { overdue, waitingDays, waitingLevel, isFollowUp, followUpIsFuture, waitingColorClass } = useMemo(() => {
    const _overdue = isOverdue(topic);
    const _waitingDays = calcWaitingDays(topic);
    const _waitingLevel = _waitingDays !== null ? getWaitingLevel(_waitingDays) : null;
    const _isFollowUp = topic.status === 'follow-up';
    const _followUpIsFuture = _isFollowUp && topic.followUpDate
      ? topic.followUpDate > new Date().toISOString().split('T')[0]
      : false;
    const _waitingColorClass = _waitingLevel === 'critical'
      ? 'text-danger dark:text-danger-dark'
      : _waitingLevel === 'warning'
        ? 'text-warning dark:text-warning-dark'
        : 'text-text-secondary dark:text-text-secondary-dark';
    return {
      overdue: _overdue,
      waitingDays: _waitingDays,
      waitingLevel: _waitingLevel,
      isFollowUp: _isFollowUp,
      followUpIsFuture: _followUpIsFuture,
      waitingColorClass: _waitingColorClass,
    };
  }, [topic.status, topic.dueDate, topic.followUpDate, topic.direction, topic.updatedAt]);

  // Combine refs: useSortable ref + our scroll ref
  const combinedRef = (node: HTMLButtonElement | null): void => {
    setNodeRef(node);
    (rowRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  };

  return (
    <button
      ref={combinedRef}
      type="button"
      style={sortable ? style : undefined}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/cadence-topic', topic.id);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      className={`w-full px-3 py-2 rounded cursor-pointer flex items-center gap-2 text-left group ${
        isSelected
          ? 'bg-accent/10'
          : 'hover:bg-surface-hover dark:hover:bg-surface-hover-dark'
      } ${
        isFollowUp && !followUpIsFuture ? 'border-l-2 border-warning dark:border-warning-dark' : ''
      } text-text-primary dark:text-text-primary-dark`}
      onClick={() => {
        if (multiSelectMode && onToggleCheck) {
          onToggleCheck(topic.id);
        } else {
          onSelect(topic.id);
        }
      }}
      {...attributes}
    >
      {/* Drag handle (sortable mode only, hidden during multi-select) */}
      {sortable && !multiSelectMode && (
        <span
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-text-secondary dark:text-text-secondary-dark opacity-0 group-hover:opacity-100 transition-opacity"
          title={t.topicRow.dragToSort}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </span>
      )}

      {/* Checkbox (multi-select mode) */}
      {multiSelectMode && (
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggleCheck?.(topic.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-border dark:border-border-dark text-accent dark:text-accent-dark focus:ring-accent dark:focus:ring-accent-dark flex-shrink-0"
          title={t.topicRow.selectForBulk}
        />
      )}

      {/* Priority dot */}
      <span
        className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${PRIO_COLORS[topic.priority] || PRIO_COLORS.normal}`}
        title={t.topicRow.priorityTitle(t.priority[topic.priority])}
      />

      {/* Status badge */}
      {topic.status === 'follow-up' && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
            followUpIsFuture
              ? 'bg-success/10 text-success dark:text-success-dark'
              : 'bg-warning/10 text-warning dark:text-warning-dark'
          }`}
          title={followUpIsFuture ? t.topicRow.followUpOn(topic.followUpDate!) : t.topicRow.followUpDue}
        >
          {t.topicRow.followUp}
        </span>
      )}
      {topic.status === 'new' && (
        <span
          className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent dark:text-accent-dark font-medium flex-shrink-0"
          title={t.topicRow.newTopic}
        >
          {t.topicRow.newBadge}
        </span>
      )}
      {topic.status === 'ready' && (
        <span
          className="text-xs px-1.5 py-0.5 rounded bg-success/10 text-success dark:text-success-dark font-medium flex-shrink-0"
          title={t.topicRow.readyTopic}
        >
          {t.topicRow.readyBadge}
        </span>
      )}
      {topic.status === 'canceled' && (
        <span
          className="text-xs px-1.5 py-0.5 rounded bg-text-secondary/10 text-text-secondary dark:text-text-secondary-dark font-medium flex-shrink-0 line-through"
          title={t.topicRow.canceledTopic}
        >
          {t.topicRow.canceledBadge}
        </span>
      )}

      {/* Recurring indicator */}
      {topic.recurring && (
        <span
          className="text-text-secondary dark:text-text-secondary-dark flex-shrink-0"
          title={t.topicRow.recurring}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </span>
      )}

      {/* Title */}
      <span className="truncate flex-1">{topic.title}</span>

      {/* Due date */}
      {topic.dueDate && (
        <span
          className={`text-xs flex-shrink-0 ${
            overdue
              ? 'text-danger dark:text-danger-dark font-medium'
              : 'text-text-secondary dark:text-text-secondary-dark'
          }`}
          title={overdue ? t.topicRow.overdueSince(topic.dueDate!) : t.topicRow.dueOn(topic.dueDate!)}
        >
          {formatDate(topic.dueDate)}
        </span>
      )}

      {/* Waiting indicator */}
      {waitingDays !== null && waitingDays > 0 && (
        <span className={`text-xs flex-shrink-0 ${waitingColorClass}`}>
          {t.topicRow.waitingSince(waitingDays)}
        </span>
      )}
    </button>
  );
}

const TopicRow = React.memo(TopicRowInner);
export default TopicRow;
