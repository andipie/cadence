import type { Topic, TopicDirection, TopicFilter, Context, RecurringInterval } from './types';
import type { Translations } from './locales/types';
import { WARN_WAITING_DAYS_DEFAULT, WARN_WAITING_CRITICAL_DEFAULT } from './constants';

/**
 * Calculates how many days a "warten" topic has been waiting.
 * Based on updatedAt (last activity).
 * Returns null if not applicable (wrong direction or completed).
 */
export function calcWaitingDays(topic: Topic): number | null {
  if (topic.direction !== 'warten' || topic.status === 'erledigt') {
    return null;
  }

  const lastActivity = new Date(topic.updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns the severity level for waiting days.
 */
export function getWaitingLevel(days: number): 'normal' | 'warning' | 'critical' {
  if (days >= WARN_WAITING_CRITICAL_DEFAULT) return 'critical';
  if (days >= WARN_WAITING_DAYS_DEFAULT) return 'warning';
  return 'normal';
}

/**
 * Checks if a topic is overdue (due date in the past and not completed).
 */
export function isOverdue(topic: Topic): boolean {
  if (!topic.dueDate || topic.status === 'erledigt') return false;
  const today = new Date().toISOString().split('T')[0];
  return topic.dueDate < today;
}

/**
 * Groups topics by direction, with completed topics in a separate "erledigt" group.
 * Returns groups in display order: ansprechen → liefern → warten → erledigt.
 */
export function groupTopicsByDirection(
  topics: Topic[],
  t: Translations
): { direction: TopicDirection | 'erledigt'; label: string; topics: Topic[] }[] {
  const groups: Record<string, Topic[]> = {
    ansprechen: [],
    liefern: [],
    warten: [],
    erledigt: [],
  };

  for (const topic of topics) {
    if (topic.status === 'erledigt') {
      groups.erledigt.push(topic);
    } else {
      const dir = topic.direction;
      if (groups[dir]) {
        groups[dir].push(topic);
      } else {
        groups.ansprechen.push(topic);
      }
    }
  }

  const labels: Record<string, string> = {
    ansprechen: t.direction.ansprechen,
    liefern: t.direction.liefern,
    warten: t.direction.warten,
    erledigt: t.status.erledigt,
  };

  return [
    { direction: 'ansprechen' as const, label: labels.ansprechen, topics: groups.ansprechen },
    { direction: 'liefern' as const, label: labels.liefern, topics: groups.liefern },
    { direction: 'warten' as const, label: labels.warten, topics: groups.warten },
    { direction: 'erledigt' as const, label: labels.erledigt, topics: groups.erledigt },
  ];
}

/**
 * Groups topics by a flexible dimension for use in Free View.
 * Supports: direction, status, priority, context, none.
 */
export function groupTopics(
  topics: Topic[],
  groupBy: TopicFilter['groupBy'],
  allContexts: Context[] | undefined,
  t: Translations
): { key: string; label: string; topics: Topic[] }[] {
  switch (groupBy) {
    case 'status': {
      const buckets: Record<string, Topic[]> = { neu: [], 'follow-up': [], erledigt: [] };
      for (const t of topics) {
        const key = t.status;
        if (buckets[key]) {
          buckets[key].push(t);
        } else {
          buckets.neu.push(t);
        }
      }
      return [
        { key: 'neu', label: t.status.neu, topics: buckets.neu },
        { key: 'follow-up', label: t.status['follow-up'], topics: buckets['follow-up'] },
        { key: 'erledigt', label: t.status.erledigt, topics: buckets.erledigt },
      ];
    }

    case 'priority': {
      const buckets: Record<string, Topic[]> = { hoch: [], mittel: [], normal: [] };
      for (const t of topics) {
        const key = t.priority;
        if (buckets[key]) {
          buckets[key].push(t);
        } else {
          buckets.normal.push(t);
        }
      }
      return [
        { key: 'hoch', label: t.priority.hoch, topics: buckets.hoch },
        { key: 'mittel', label: t.priority.mittel, topics: buckets.mittel },
        { key: 'normal', label: t.priority.normal, topics: buckets.normal },
      ];
    }

    case 'context': {
      const contextMap = new Map<string, Context>();
      if (allContexts) {
        for (const ctx of allContexts) {
          contextMap.set(ctx.id, ctx);
        }
      }

      const buckets = new Map<string, Topic[]>();
      const noContext: Topic[] = [];

      for (const t of topics) {
        if (t.contexts.length === 0) {
          noContext.push(t);
        } else {
          for (const ctxId of t.contexts) {
            let bucket = buckets.get(ctxId);
            if (!bucket) {
              bucket = [];
              buckets.set(ctxId, bucket);
            }
            bucket.push(t);
          }
        }
      }

      const groups: { key: string; label: string; topics: Topic[] }[] = [];
      for (const [ctxId, ctxTopics] of buckets) {
        const ctx = contextMap.get(ctxId);
        groups.push({ key: ctxId, label: ctx?.name ?? ctxId, topics: ctxTopics });
      }
      // Sort groups alphabetically by label
      groups.sort((a, b) => a.label.localeCompare(b.label));

      if (noContext.length > 0) {
        groups.push({ key: '_none', label: t.common.noContext, topics: noContext });
      }

      return groups;
    }

    case 'none':
      return [{ key: 'all', label: t.common.allTopics, topics }];

    case 'direction':
    default: {
      // Reuse direction grouping logic
      const buckets: Record<string, Topic[]> = {
        ansprechen: [], liefern: [], warten: [], erledigt: [],
      };
      for (const t of topics) {
        if (t.status === 'erledigt') {
          buckets.erledigt.push(t);
        } else {
          const dir = t.direction;
          if (buckets[dir]) {
            buckets[dir].push(t);
          } else {
            buckets.ansprechen.push(t);
          }
        }
      }
      return [
        { key: 'ansprechen', label: t.direction.ansprechen, topics: buckets.ansprechen },
        { key: 'liefern', label: t.direction.liefern, topics: buckets.liefern },
        { key: 'warten', label: t.direction.warten, topics: buckets.warten },
        { key: 'erledigt', label: t.status.erledigt, topics: buckets.erledigt },
      ];
    }
  }
}

/**
 * Groups topics by due date proximity for the Liefern view.
 * Returns groups: Überfällig, Heute, Morgen, Diese Woche, Nächste Woche, Später, Ohne Datum.
 * Empty groups are omitted.
 */
export function groupTopicsByDueProximity(
  topics: Topic[],
  t: Translations
): { key: string; label: string; topics: Topic[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  // End of this week (Sunday)
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday + 1); // Monday after this week
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  // End of next week
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
  const endOfNextWeekStr = endOfNextWeek.toISOString().split('T')[0];

  const buckets: Record<string, Topic[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    nextWeek: [],
    later: [],
    noDueDate: [],
  };

  for (const topic of topics) {
    if (!topic.dueDate) {
      buckets.noDueDate.push(topic);
    } else if (topic.dueDate < todayStr) {
      buckets.overdue.push(topic);
    } else if (topic.dueDate === todayStr) {
      buckets.today.push(topic);
    } else if (topic.dueDate === tomorrowStr) {
      buckets.tomorrow.push(topic);
    } else if (topic.dueDate >= dayAfterTomorrowStr && topic.dueDate < endOfWeekStr) {
      buckets.thisWeek.push(topic);
    } else if (topic.dueDate >= endOfWeekStr && topic.dueDate < endOfNextWeekStr) {
      buckets.nextWeek.push(topic);
    } else {
      buckets.later.push(topic);
    }
  }

  const allGroups = [
    { key: 'overdue', label: t.filter.dueOverdue, topics: buckets.overdue },
    { key: 'today', label: t.filter.dueToday, topics: buckets.today },
    { key: 'tomorrow', label: t.filter.dueTomorrow, topics: buckets.tomorrow },
    { key: 'thisWeek', label: t.filter.dueThisWeek, topics: buckets.thisWeek },
    { key: 'nextWeek', label: t.filter.dueNextWeek, topics: buckets.nextWeek },
    { key: 'later', label: t.filter.dueLater, topics: buckets.later },
    { key: 'noDueDate', label: t.filter.dueNone, topics: buckets.noDueDate },
  ];

  // Only return non-empty groups
  return allGroups.filter((g) => g.topics.length > 0);
}

/**
 * Formats a date string (YYYY-MM-DD) for display.
 */
export function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

/**
 * Calculates the next recurring date based on interval.
 * Input/output: YYYY-MM-DD strings.
 */
export function calculateNextRecurringDate(fromDate: string, interval: RecurringInterval): string {
  const date = new Date(fromDate + 'T00:00:00'); // Local timezone, no UTC shift
  switch (interval) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
