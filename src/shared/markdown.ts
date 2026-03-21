import matter from 'gray-matter';
import yaml from 'js-yaml';
import type { TopicDetail, NoteEntry, TopicStatus, TopicPriority, TopicDirection, RecurringInterval } from './types';
import { DEFAULT_STATUS, DEFAULT_PRIORITY, DEFAULT_DIRECTION } from './constants';

// --- gray-matter config ---
// Use JSON_SCHEMA so dates stay as strings (no auto-conversion to Date objects).
// This is critical for roundtrip stability — "2026-03-25" must not become "2026-03-25T00:00:00.000Z".

const MATTER_OPTIONS: matter.GrayMatterOption<string, matter.GrayMatterOption<string, unknown>> = {
  engines: {
    yaml: {
      // gray-matter engine type requires parse and stringify
      parse: (str: string) => yaml.load(str, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>,
      stringify: (obj: Record<string, unknown>) => yaml.dump(obj, {
        schema: yaml.JSON_SCHEMA,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      }),
    },
  },
};

function parseMatter(content: string): matter.GrayMatterFile<string> {
  return matter(content, MATTER_OPTIONS);
}

function stringifyMatter(body: string, data: Record<string, unknown>): string {
  return matter.stringify(body, data, MATTER_OPTIONS);
}

// --- snake_case ↔ camelCase mapping ---

interface FrontmatterRaw {
  id?: string;
  title?: string;
  status?: string;
  priority?: string;
  direction?: string;
  contexts?: string[];
  due_date?: string | null;
  follow_up_date?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  sort_order?: number | null;
  recurring?: boolean;
  recurring_interval?: string | null;
  recurring_next?: string | null;
}

const BODY_DATE_HEADER_REGEX = /^## (\d{4}-\d{2}-\d{2})\s*$/;

// --- Parsing ---

/**
 * Parses a Markdown file with YAML frontmatter into a TopicDetail object.
 * Defensive: missing fields get defaults.
 */
export function parseTopicFile(filePath: string, content: string): TopicDetail {
  const parsed = parseMatter(content);
  const fm = parsed.data as FrontmatterRaw;
  const now = new Date().toISOString();

  // Extract slug from filePath for id
  const fileName = filePath.replace(/^.*[\\/]/, '').replace(/\.md$/, '');
  const id = fm.id || fileName;

  // Preserve raw frontmatter for Obsidian coexistence (unknown fields survive roundtrip)
  const rawFrontmatter = parsed.data as Record<string, unknown>;

  const topic: TopicDetail = {
    id,
    title: fm.title || fileName,
    status: (fm.status as TopicStatus) || DEFAULT_STATUS,
    priority: (fm.priority as TopicPriority) || DEFAULT_PRIORITY,
    direction: (fm.direction as TopicDirection) || DEFAULT_DIRECTION,
    contexts: fm.contexts || [],
    dueDate: fm.due_date ?? null,
    followUpDate: fm.follow_up_date ?? null,
    createdAt: fm.created_at || now,
    updatedAt: fm.updated_at || now,
    completedAt: fm.completed_at ?? null,
    sortOrder: fm.sort_order ?? null,
    recurring: fm.recurring ?? false,
    recurringInterval: (fm.recurring_interval as RecurringInterval) ?? null,
    recurringNext: fm.recurring_next ?? null,
    bodyPreview: null,
    filePath,
    notes: [],
    _rawFrontmatter: { ...rawFrontmatter },
  };

  // Parse body into NoteEntries
  topic.notes = parseNotes(parsed.content);

  // Body preview: first note content, trimmed
  if (topic.notes.length > 0) {
    const preview = topic.notes[0].content.trim();
    topic.bodyPreview = preview.length > 200 ? preview.substring(0, 200) + '…' : preview;
  }

  return topic;
}

/**
 * Splits the markdown body into chronological NoteEntry objects.
 * Expects `## YYYY-MM-DD` headers separating entries.
 */
function parseNotes(body: string): NoteEntry[] {
  const lines = body.split('\n');
  const notes: NoteEntry[] = [];
  let currentDate: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const match = BODY_DATE_HEADER_REGEX.exec(line);
    if (match) {
      // Save previous entry
      if (currentDate !== null) {
        notes.push({
          date: currentDate,
          content: joinNoteContent(currentLines),
        });
      }
      currentDate = match[1];
      currentLines = [];
    } else if (currentDate !== null) {
      currentLines.push(line);
    }
    // Lines before the first date header are ignored
  }

  // Save last entry
  if (currentDate !== null) {
    notes.push({
      date: currentDate,
      content: joinNoteContent(currentLines),
    });
  }

  return notes;
}

/**
 * Joins note content lines, preserving internal structure but trimming
 * leading/trailing empty lines.
 */
function joinNoteContent(lines: string[]): string {
  const joined = lines.join('\n');
  // Trim leading/trailing blank lines but keep internal structure
  return joined.replace(/^\n+/, '').replace(/\n+$/, '');
}

// --- Serialization ---

interface SerializeOptions {
  obsidianMode?: boolean;
}

/**
 * Serializes a TopicDetail back to a Markdown string with YAML frontmatter.
 * Preserves unknown frontmatter fields from _rawFrontmatter (Obsidian coexistence).
 */
export function serializeTopicFile(topic: TopicDetail, options?: SerializeOptions): string {
  // Start with preserved raw frontmatter (unknown fields from Obsidian etc.)
  // Then overwrite with known Cadence fields to ensure consistency
  const fm: Record<string, unknown> = { ...(topic._rawFrontmatter || {}) };

  // Always set known Cadence fields
  fm.id = topic.id;
  fm.title = topic.title;
  fm.status = topic.status;

  // Only include non-default values — clean up defaults and nulls
  if (topic.priority !== DEFAULT_PRIORITY) {
    fm.priority = topic.priority;
  } else {
    delete fm.priority;
  }
  if (topic.direction !== DEFAULT_DIRECTION) {
    fm.direction = topic.direction;
  } else {
    delete fm.direction;
  }
  if (topic.contexts.length > 0) {
    fm.contexts = topic.contexts;
  } else {
    delete fm.contexts;
  }
  if (topic.dueDate) {
    fm.due_date = topic.dueDate;
  } else {
    delete fm.due_date;
  }
  if (topic.followUpDate) {
    fm.follow_up_date = topic.followUpDate;
  } else {
    delete fm.follow_up_date;
  }

  fm.created_at = topic.createdAt;
  fm.updated_at = topic.updatedAt;

  if (topic.completedAt) {
    fm.completed_at = topic.completedAt;
  } else {
    delete fm.completed_at;
  }
  if (topic.sortOrder !== null) {
    fm.sort_order = topic.sortOrder;
  } else {
    delete fm.sort_order;
  }
  if (topic.recurring) {
    fm.recurring = topic.recurring;
    if (topic.recurringInterval) {
      fm.recurring_interval = topic.recurringInterval;
    }
    if (topic.recurringNext) {
      fm.recurring_next = topic.recurringNext;
    }
  } else {
    delete fm.recurring;
    delete fm.recurring_interval;
    delete fm.recurring_next;
  }

  // Obsidian mode: add aliases for readable title in Obsidian graph/search
  if (options?.obsidianMode) {
    fm.aliases = [topic.title];
  } else {
    // Clean up aliases if obsidian mode was turned off
    delete fm.aliases;
  }

  // Serialize body from notes
  const bodyParts: string[] = [];
  for (const note of topic.notes) {
    bodyParts.push(`## ${note.date}`);
    bodyParts.push('');
    bodyParts.push(note.content);
    bodyParts.push('');
  }

  const body = bodyParts.length > 0 ? bodyParts.join('\n') : '';

  return stringifyMatter(body, fm);
}

/**
 * Updates a single frontmatter field without touching the body.
 * Returns the modified file content.
 */
export function updateFrontmatterField(
  content: string,
  field: string,
  value: unknown
): string {
  const parsed = parseMatter(content);
  if (value === null || value === undefined) {
    delete parsed.data[field];
  } else {
    parsed.data[field] = value;
  }
  return stringifyMatter(parsed.content, parsed.data);
}

/**
 * Inserts a new note entry at the top of the body (newest first).
 * Adds a `## YYYY-MM-DD` header with today's date.
 */
export function addNoteEntry(content: string, noteContent: string): string {
  const parsed = parseMatter(content);
  const today = new Date().toISOString().split('T')[0];
  const newEntry = `## ${today}\n\n${noteContent}\n`;

  const existingBody = parsed.content.trim();
  const newBody = existingBody
    ? `${newEntry}\n${existingBody}\n`
    : `${newEntry}\n`;

  return stringifyMatter(newBody, parsed.data);
}

/**
 * Updates an existing note entry by index (0 = newest).
 * Replaces the content of the n-th `## YYYY-MM-DD` block while leaving
 * frontmatter and other notes untouched.
 */
export function updateNoteEntry(content: string, noteIndex: number, newContent: string): string {
  const parsed = parseMatter(content);
  const lines = parsed.content.split('\n');

  // Find all date header positions
  const headerPositions: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (BODY_DATE_HEADER_REGEX.test(lines[i])) {
      headerPositions.push(i);
    }
  }

  if (noteIndex < 0 || noteIndex >= headerPositions.length) {
    throw new Error(`Note index ${noteIndex} out of range (${headerPositions.length} notes)`);
  }

  const startLine = headerPositions[noteIndex];
  const endLine = noteIndex + 1 < headerPositions.length
    ? headerPositions[noteIndex + 1]
    : lines.length;

  // Rebuild: keep date header, replace content
  const dateHeader = lines[startLine];
  const replacementLines = [dateHeader, '', newContent, ''];

  const newLines = [
    ...lines.slice(0, startLine),
    ...replacementLines,
    ...lines.slice(endLine),
  ];

  return stringifyMatter(newLines.join('\n'), parsed.data);
}
