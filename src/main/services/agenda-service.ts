import path from 'path';
import type Database from 'better-sqlite3';
import type { Topic } from '../../shared/types';
import type { Translations } from '../../shared/locales';
import { queryTopics, populateTopicContexts } from '../store/index-db';
import { readTopicFile } from '../store/file-store';
import { readContextsFile } from './context-service';
import { calcWaitingDays } from '../../shared/utils';

const DIRECTION_KEYS = ['discuss', 'deliver', 'waiting'] as const;

/**
 * Truncates a string to a maximum length, adding "…" if truncated.
 */
function truncate(text: string, maxLength: number): string {
  // Take the first line only
  const firstLine = text.split('\n')[0].trim();
  if (firstLine.length <= maxLength) return firstLine;
  return firstLine.slice(0, maxLength - 1) + '…';
}

/**
 * Formats today's date as DD.MM.YYYY.
 */
function todayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * Formats a short date (DD.MM.) from an ISO date string.
 */
function shortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.`;
}

/**
 * Builds the metadata bracket for a topic: [Status, Priorität]
 * Only shows status if it's not 'neu' or if it's 'follow-up'.
 * Always shows priority if it's not 'normal'.
 */
function buildMetaBracket(topic: Topic, t: Translations): string {
  const parts: string[] = [];

  // Status — always show for follow-up, skip for 'new' unless priority is also normal
  const statusLabel = (topic.status === 'new' || topic.status === 'follow-up')
    ? t.status[topic.status]
    : undefined;
  if (statusLabel) {
    parts.push(statusLabel);
  }

  // Priority — show unless normal
  if (topic.priority !== 'normal') {
    parts.push(t.priority[topic.priority] ?? topic.priority);
  }

  if (parts.length === 0) return '';
  return ` [${parts.join(', ')}]`;
}

/**
 * Generates agenda markdown for a specific context.
 *
 * Format:
 * # Agenda: {Context Name} — {DD.MM.YYYY}
 *
 * ## Ansprechen
 * - **Title** [Follow-Up, Hoch]
 *   Letztes Update (DD.MM.): Content...
 *
 * ## Liefern
 * - **Title** [Neu, Hoch]
 *   Fällig: DD.MM.
 *
 * ## Warten
 * - **Title** [Follow-Up]
 *   Wartet seit N Tagen
 */
export function generateAgenda(db: Database.Database, dataDir: string, contextId: string, t: Translations): string {
  // 1. Resolve context name
  const { contexts } = readContextsFile(dataDir).data;
  const context = contexts.find((c) => c.id === contextId);
  const contextName = context?.name ?? contextId;

  // 2. Load topics for this context
  const topics = queryTopics(db, { contexts: [contextId] });
  populateTopicContexts(db, topics);

  // 3. Filter out completed topics
  const activeTopics = topics.filter((topic) => topic.status !== 'done');

  // 4. Group by direction
  const groups = new Map<string, Topic[]>();
  for (const key of DIRECTION_KEYS) {
    groups.set(key, []);
  }
  for (const topic of activeTopics) {
    const bucket = groups.get(topic.direction);
    if (bucket) {
      bucket.push(topic);
    }
  }

  // 5. Load latest notes for each topic
  const topicsDir = path.join(dataDir, 'topics');
  const latestNotes = new Map<string, { date: string; content: string }>();
  for (const topic of activeTopics) {
    try {
      const detail = readTopicFile(path.join(topicsDir, `${topic.id}.md`));
      if (detail.notes.length > 0) {
        latestNotes.set(topic.id, detail.notes[0]);
      }
    } catch {
      // Skip if file cannot be read
    }
  }

  // 6. Build markdown
  const lines: string[] = [];
  lines.push(`# Agenda: ${contextName} — ${todayFormatted()}`);

  for (const dirKey of DIRECTION_KEYS) {
    const dirTopics = groups.get(dirKey) ?? [];
    if (dirTopics.length === 0) continue;

    lines.push('');
    lines.push(`## ${t.direction[dirKey]}`);
    lines.push('');

    for (const topic of dirTopics) {
      const meta = buildMetaBracket(topic, t);
      lines.push(`- **${topic.title}**${meta}`);

      // Direction-specific sub-line
      if (dirKey === 'waiting') {
        const days = calcWaitingDays(topic);
        if (days !== null && days > 0) {
          lines.push(`  ${t.agenda.waitingSince(days)}`);
        }
      } else if (dirKey === 'deliver' && topic.dueDate) {
        lines.push(`  ${t.agenda.dueOn(shortDate(topic.dueDate))}`);
      }

      // Latest note (if available)
      const note = latestNotes.get(topic.id);
      if (note) {
        const noteDate = shortDate(note.date);
        const noteContent = truncate(note.content, 100);
        lines.push(`  ${t.agenda.lastUpdate(noteDate, noteContent)}`);
      }

      lines.push('');
    }
  }

  return lines.join('\n').trim() + '\n';
}
