import { describe, it, expect } from 'vitest';
import { parseTopicFile, serializeTopicFile, updateFrontmatterField, addNoteEntry, updateNoteEntry } from './markdown';

const MINIMAL_TOPIC = `---
id: test-topic
title: Test Topic
status: new
created_at: "2026-03-01T10:00:00.000Z"
updated_at: "2026-03-01T10:00:00.000Z"
---
`;

const FULL_TOPIC = `---
id: full-topic
title: Full Topic
status: follow-up
priority: high
direction: discuss
contexts:
  - project-a
  - project-b
due_date: "2026-04-01"
follow_up_date: "2026-03-20"
created_at: "2026-03-01T10:00:00.000Z"
updated_at: "2026-03-15T14:30:00.000Z"
completed_at: null
sort_order: 3
recurring: true
recurring_interval: weekly
recurring_next: "2026-04-08"
---

## 2026-03-15

Latest update with **bold text**.

## 2026-03-01

First note entry.
- Item 1
- Item 2
`;

const UNKNOWN_FIELDS_TOPIC = `---
id: obsidian-topic
title: Obsidian Topic
status: new
aliases:
  - Obsidian Topic
tags:
  - important
created_at: "2026-03-01T10:00:00.000Z"
updated_at: "2026-03-01T10:00:00.000Z"
---
`;

describe('parseTopicFile', () => {
  it('parses minimal frontmatter with defaults', () => {
    const topic = parseTopicFile('/topics/test-topic.md', MINIMAL_TOPIC);
    expect(topic.id).toBe('test-topic');
    expect(topic.title).toBe('Test Topic');
    expect(topic.status).toBe('new');
    expect(topic.priority).toBe('normal');
    expect(topic.direction).toBe('discuss');
    expect(topic.contexts).toEqual([]);
    expect(topic.dueDate).toBeNull();
    expect(topic.followUpDate).toBeNull();
    expect(topic.recurring).toBe(false);
    expect(topic.notes).toHaveLength(0);
  });

  it('parses full frontmatter with all fields', () => {
    const topic = parseTopicFile('/topics/full-topic.md', FULL_TOPIC);
    expect(topic.id).toBe('full-topic');
    expect(topic.title).toBe('Full Topic');
    expect(topic.status).toBe('follow-up');
    expect(topic.priority).toBe('high');
    expect(topic.direction).toBe('discuss');
    expect(topic.contexts).toEqual(['project-a', 'project-b']);
    expect(topic.dueDate).toBe('2026-04-01');
    expect(topic.followUpDate).toBe('2026-03-20');
    expect(topic.sortOrder).toBe(3);
    expect(topic.recurring).toBe(true);
    expect(topic.recurringInterval).toBe('weekly');
    expect(topic.recurringNext).toBe('2026-04-08');
  });

  it('parses notes from body', () => {
    const topic = parseTopicFile('/topics/full-topic.md', FULL_TOPIC);
    expect(topic.notes).toHaveLength(2);
    expect(topic.notes[0].date).toBe('2026-03-15');
    expect(topic.notes[0].content).toContain('**bold text**');
    expect(topic.notes[1].date).toBe('2026-03-01');
    expect(topic.notes[1].content).toContain('- Item 1');
  });

  it('generates bodyPreview from first note', () => {
    const topic = parseTopicFile('/topics/full-topic.md', FULL_TOPIC);
    expect(topic.bodyPreview).toBeTruthy();
    expect(topic.bodyPreview!).toContain('bold text');
  });

  it('handles empty body', () => {
    const topic = parseTopicFile('/topics/test-topic.md', MINIMAL_TOPIC);
    expect(topic.notes).toHaveLength(0);
    expect(topic.bodyPreview).toBeNull();
  });

  it('preserves unknown frontmatter fields in _rawFrontmatter', () => {
    const topic = parseTopicFile('/topics/obsidian-topic.md', UNKNOWN_FIELDS_TOPIC);
    expect(topic._rawFrontmatter).toBeDefined();
    expect(topic._rawFrontmatter!['aliases']).toEqual(['Obsidian Topic']);
    expect(topic._rawFrontmatter!['tags']).toEqual(['important']);
  });

  it('uses filename as fallback for missing title/id', () => {
    const noTitleContent = `---
status: new
created_at: "2026-03-01T10:00:00.000Z"
updated_at: "2026-03-01T10:00:00.000Z"
---
`;
    const topic = parseTopicFile('/topics/my-slug.md', noTitleContent);
    expect(topic.id).toBe('my-slug');
    expect(topic.title).toBe('my-slug');
  });
});

describe('serializeTopicFile', () => {
  it('serializes a topic back to markdown', () => {
    const topic = parseTopicFile('/topics/full-topic.md', FULL_TOPIC);
    const serialized = serializeTopicFile(topic);
    expect(serialized).toContain('id: full-topic');
    expect(serialized).toContain('title: Full Topic');
    expect(serialized).toContain('status: follow-up');
    expect(serialized).toContain('priority: high');
    expect(serialized).toContain('## 2026-03-15');
    expect(serialized).toContain('## 2026-03-01');
  });

  it('omits default values (priority normal, direction discuss)', () => {
    const topic = parseTopicFile('/topics/test-topic.md', MINIMAL_TOPIC);
    const serialized = serializeTopicFile(topic);
    expect(serialized).not.toContain('priority:');
    expect(serialized).not.toContain('direction:');
  });

  it('roundtrips frontmatter values correctly', () => {
    const topic = parseTopicFile('/topics/full-topic.md', FULL_TOPIC);
    const serialized = serializeTopicFile(topic);
    const reparsed = parseTopicFile('/topics/full-topic.md', serialized);

    expect(reparsed.id).toBe(topic.id);
    expect(reparsed.title).toBe(topic.title);
    expect(reparsed.status).toBe(topic.status);
    expect(reparsed.priority).toBe(topic.priority);
    expect(reparsed.direction).toBe(topic.direction);
    expect(reparsed.contexts).toEqual(topic.contexts);
    expect(reparsed.dueDate).toBe(topic.dueDate);
    expect(reparsed.followUpDate).toBe(topic.followUpDate);
    expect(reparsed.recurring).toBe(topic.recurring);
    expect(reparsed.recurringInterval).toBe(topic.recurringInterval);
    expect(reparsed.notes).toHaveLength(topic.notes.length);
  });

  it('preserves unknown fields through roundtrip', () => {
    const topic = parseTopicFile('/topics/obsidian-topic.md', UNKNOWN_FIELDS_TOPIC);
    const serialized = serializeTopicFile(topic);
    expect(serialized).toContain('tags:');
    // aliases should be cleaned up when obsidianMode is off
    expect(serialized).not.toContain('aliases:');
  });

  it('adds aliases in obsidian mode', () => {
    const topic = parseTopicFile('/topics/test-topic.md', MINIMAL_TOPIC);
    const serialized = serializeTopicFile(topic, { obsidianMode: true });
    expect(serialized).toContain('aliases:');
    expect(serialized).toContain('Test Topic');
  });
});

describe('updateFrontmatterField', () => {
  it('updates a single field without changing body', () => {
    const updated = updateFrontmatterField(FULL_TOPIC, 'status', 'done');
    expect(updated).toContain('status: done');
    // Body should still be there
    expect(updated).toContain('## 2026-03-15');
    expect(updated).toContain('## 2026-03-01');
  });

  it('removes a field when set to null', () => {
    const updated = updateFrontmatterField(FULL_TOPIC, 'due_date', null);
    expect(updated).not.toContain('due_date:');
  });
});

describe('addNoteEntry', () => {
  it('adds a note entry at the top', () => {
    const updated = addNoteEntry(FULL_TOPIC, 'New note content');
    const topic = parseTopicFile('/topics/full-topic.md', updated);
    // New note should be first (newest)
    expect(topic.notes.length).toBeGreaterThanOrEqual(3);
    expect(topic.notes[0].content).toContain('New note content');
  });

  it('adds a note to empty body', () => {
    const updated = addNoteEntry(MINIMAL_TOPIC, 'First note ever');
    const topic = parseTopicFile('/topics/test-topic.md', updated);
    expect(topic.notes).toHaveLength(1);
    expect(topic.notes[0].content).toContain('First note ever');
  });
});

describe('updateNoteEntry', () => {
  it('updates a specific note by index', () => {
    const updated = updateNoteEntry(FULL_TOPIC, 0, 'Replaced content');
    const topic = parseTopicFile('/topics/full-topic.md', updated);
    expect(topic.notes[0].date).toBe('2026-03-15');
    expect(topic.notes[0].content).toBe('Replaced content');
    // Second note should be untouched
    expect(topic.notes[1].content).toContain('- Item 1');
  });

  it('throws on invalid index', () => {
    expect(() => updateNoteEntry(FULL_TOPIC, 5, 'content')).toThrow();
  });
});

describe('frontmatter migration (German → English)', () => {
  it('migrates old German values to English on parse', () => {
    const legacyContent = `---
id: legacy-topic
title: Legacy Topic
status: neu
priority: hoch
direction: ansprechen
created_at: "2026-03-01T10:00:00.000Z"
updated_at: "2026-03-01T10:00:00.000Z"
---
`;
    const topic = parseTopicFile('/topics/legacy-topic.md', legacyContent);
    expect(topic.status).toBe('new');
    expect(topic.priority).toBe('high');
    expect(topic.direction).toBe('discuss');
  });

  it('migrates erledigt status to done', () => {
    const content = `---
id: done-topic
title: Done Topic
status: erledigt
created_at: "2026-03-01T10:00:00.000Z"
updated_at: "2026-03-01T10:00:00.000Z"
---
`;
    const topic = parseTopicFile('/topics/done-topic.md', content);
    expect(topic.status).toBe('done');
  });

  it('migrates mittel priority and liefern/warten directions', () => {
    const content = `---
id: mid-topic
title: Mid Topic
status: neu
priority: mittel
direction: liefern
created_at: "2026-03-01T10:00:00.000Z"
updated_at: "2026-03-01T10:00:00.000Z"
---
`;
    const topic = parseTopicFile('/topics/mid-topic.md', content);
    expect(topic.status).toBe('new');
    expect(topic.priority).toBe('medium');
    expect(topic.direction).toBe('deliver');

    const waitingContent = `---
id: wait-topic
title: Wait Topic
status: neu
direction: warten
created_at: "2026-03-01T10:00:00.000Z"
updated_at: "2026-03-01T10:00:00.000Z"
---
`;
    const waitTopic = parseTopicFile('/topics/wait-topic.md', waitingContent);
    expect(waitTopic.direction).toBe('waiting');
  });

  it('leaves already-English values unchanged', () => {
    const topic = parseTopicFile('/topics/test-topic.md', MINIMAL_TOPIC);
    expect(topic.status).toBe('new');
    expect(topic.priority).toBe('normal');
    expect(topic.direction).toBe('discuss');
  });
});
