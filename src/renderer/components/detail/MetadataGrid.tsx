import React from 'react';
import type { TopicDetail, TopicStatus, TopicPriority, TopicDirection, RecurringInterval } from '@shared/types';
import { isOverdue, formatDate } from '@shared/utils';
import { useTranslation } from '../../hooks/useTranslation';

interface MetadataGridProps {
  topic: TopicDetail;
  onUpdate: (field: string, value: unknown) => void;
}

const selectClass = 'w-full px-2 py-1 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark';

const dateInputClass = 'w-full px-2 py-1 rounded border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark';

export default function MetadataGrid({
  topic,
  onUpdate,
}: MetadataGridProps): React.ReactElement {
  const t = useTranslation();
  const overdue = isOverdue(topic);

  const STATUS_OPTIONS: { value: TopicStatus; label: string }[] = [
    { value: 'new', label: t.status.new },
    { value: 'ready', label: t.status.ready },
    { value: 'follow-up', label: t.status['follow-up'] },
    { value: 'done', label: t.status.done },
    { value: 'canceled', label: t.status.canceled },
  ];

  const PRIORITY_OPTIONS: { value: TopicPriority; label: string }[] = [
    { value: 'high', label: t.priority.high },
    { value: 'medium', label: t.priority.medium },
    { value: 'normal', label: t.priority.normal },
  ];

  const DIRECTION_OPTIONS: { value: TopicDirection; label: string }[] = [
    { value: 'discuss', label: t.direction.discuss },
    { value: 'deliver', label: t.direction.deliver },
    { value: 'waiting', label: t.direction.waiting },
  ];

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center text-sm">
      {/* Status */}
      <label className="text-text-secondary dark:text-text-secondary-dark">{t.detail.statusLabel}</label>
      <select
        value={topic.status}
        onChange={(e) => onUpdate('status', e.target.value)}
        className={selectClass}
        title={t.detail.statusTooltip}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Priority */}
      <label className="text-text-secondary dark:text-text-secondary-dark">{t.detail.priorityLabel}</label>
      <select
        value={topic.priority}
        onChange={(e) => onUpdate('priority', e.target.value)}
        className={selectClass}
        title={t.detail.priorityTooltip}
      >
        {PRIORITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Direction */}
      <label className="text-text-secondary dark:text-text-secondary-dark">{t.detail.directionLabel}</label>
      <select
        value={topic.direction}
        onChange={(e) => onUpdate('direction', e.target.value)}
        className={selectClass}
        title={t.detail.directionTooltip}
      >
        {DIRECTION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Due date */}
      <label className="flex items-center gap-1.5 text-text-secondary dark:text-text-secondary-dark">
        <input
          type="checkbox"
          checked={topic.dueDate !== null && topic.dueDate !== undefined}
          onChange={(e) => {
            if (e.target.checked) {
              onUpdate('dueDate', new Date().toISOString().slice(0, 10));
            } else {
              onUpdate('dueDate', null);
            }
          }}
          title={t.detail.dueToggleTooltip}
          className="cursor-pointer"
        />
        {t.detail.dueLabel}
      </label>
      {topic.dueDate ? (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={topic.dueDate}
            onChange={(e) => onUpdate('dueDate', e.target.value || null)}
            className={`flex-1 ${dateInputClass} ${overdue ? 'text-danger dark:text-danger-dark' : ''}`}
            title={t.detail.dueDateTooltip}
          />
          <button
            type="button"
            className="px-1.5 py-1 text-xs rounded hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-secondary dark:text-text-secondary-dark cursor-pointer"
            title={t.detail.dueRemoveTooltip}
            onClick={() => onUpdate('dueDate', null)}
          >
            ✕
          </button>
        </div>
      ) : (
        <span className="text-xs text-text-secondary dark:text-text-secondary-dark italic py-1">{t.detail.noDate}</span>
      )}

      {/* Follow-up date */}
      <label className="flex items-center gap-1.5 text-text-secondary dark:text-text-secondary-dark self-start pt-1">
        <input
          type="checkbox"
          checked={topic.followUpDate !== null && topic.followUpDate !== undefined}
          onChange={(e) => {
            if (e.target.checked) {
              const d = new Date();
              d.setDate(d.getDate() + 7);
              const dateStr = d.toISOString().slice(0, 10);
              onUpdate('followUpDate', dateStr);
              if (topic.status !== 'follow-up') {
                onUpdate('status', 'follow-up');
              }
            } else {
              onUpdate('followUpDate', null);
            }
          }}
          title={t.detail.followUpToggleTooltip}
          className="cursor-pointer"
        />
        {t.detail.followUpLabel}
      </label>
      {topic.followUpDate ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={topic.followUpDate}
              onChange={(e) => {
                const val = e.target.value || null;
                onUpdate('followUpDate', val);
                if (val && topic.status !== 'follow-up') {
                  onUpdate('status', 'follow-up');
                }
              }}
              className={`flex-1 ${dateInputClass}`}
              title={t.detail.followUpDateTooltip}
            />
            <button
              type="button"
              className="px-1.5 py-1 text-xs rounded hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-secondary dark:text-text-secondary-dark cursor-pointer"
              title={t.detail.followUpRemoveTooltip}
              onClick={() => onUpdate('followUpDate', null)}
            >
              ✕
            </button>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((weeks) => (
              <button
                key={weeks}
                type="button"
                className="px-1.5 py-0.5 text-xs rounded bg-surface-hover dark:bg-surface-hover-dark hover:bg-accent/15 dark:hover:bg-accent/15 text-text-secondary dark:text-text-secondary-dark cursor-pointer"
                title={t.detail.followUpWeeks(weeks)}
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + weeks * 7);
                  const dateStr = d.toISOString().slice(0, 10);
                  onUpdate('followUpDate', dateStr);
                  if (topic.status !== 'follow-up') {
                    onUpdate('status', 'follow-up');
                  }
                }}
              >
                +{weeks}W
              </button>
            ))}
          </div>
        </div>
      ) : (
        <span className="text-xs text-text-secondary dark:text-text-secondary-dark italic py-1">{t.detail.noFollowUp}</span>
      )}

      {/* Recurring toggle */}
      <label className="text-text-secondary dark:text-text-secondary-dark">{t.detail.recurringLabel}</label>
      <label className="flex items-center gap-2 cursor-pointer py-1">
        <input
          type="checkbox"
          checked={topic.recurring}
          title="Thema als wiederkehrend markieren"
          onChange={(e) => {
            if (e.target.checked) {
              onUpdate('recurring', true);
              if (!topic.recurringInterval) {
                onUpdate('recurringInterval', 'monthly');
              }
            } else {
              onUpdate('recurring', false);
              onUpdate('recurringInterval', null);
            }
          }}
          className="w-4 h-4 rounded border-border dark:border-border-dark text-accent dark:text-accent-dark focus:ring-accent dark:focus:ring-accent-dark"
        />
        <span className="text-sm text-text-primary dark:text-text-primary-dark">
          {topic.recurring ? t.detail.yes : t.detail.no}
        </span>
      </label>

      {/* Recurring interval (only when recurring) */}
      {topic.recurring && (
        <>
          <label className="text-text-secondary dark:text-text-secondary-dark">{t.detail.intervalLabel}</label>
          <select
            value={topic.recurringInterval ?? 'monthly'}
            onChange={(e) => onUpdate('recurringInterval', e.target.value as RecurringInterval)}
            className={selectClass}
            title={t.detail.intervalTooltip}
          >
            {(Object.entries(t.recurringInterval) as [RecurringInterval, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>{label}</option>
              )
            )}
          </select>
        </>
      )}

      {/* Recurring next date (read-only) */}
      {topic.recurring && topic.recurringNext && (
        <>
          <label className="text-text-secondary dark:text-text-secondary-dark">{t.detail.nextLabel}</label>
          <span className="text-sm text-text-primary dark:text-text-primary-dark py-1">
            {formatDate(topic.recurringNext)}
          </span>
        </>
      )}
    </div>
  );
}
