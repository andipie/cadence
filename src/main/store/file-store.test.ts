import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  writeTopicFile,
  readTopicFile,
  deleteTopicFile,
  listTopicFiles,
  ensureDataDirectories,
  moveTopicToTrash,
  moveTopicToArchive,
  moveTopicFromArchive,
} from './file-store';

const VALID_TOPIC_CONTENT = `---
id: test-topic
title: Test Topic
status: new
created_at: "2026-03-01T10:00:00.000Z"
updated_at: "2026-03-01T10:00:00.000Z"
---

## 2026-03-01

Some note content.
`;

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cadence-filestore-'));
  ensureDataDirectories(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('writeTopicFile', () => {
  it('writes content to the target file', () => {
    const filePath = path.join(tmpDir, 'topics', 'test-topic.md');
    writeTopicFile(filePath, VALID_TOPIC_CONTENT);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toBe(VALID_TOPIC_CONTENT);
  });

  it('leaves no leftover .tmp file', () => {
    const filePath = path.join(tmpDir, 'topics', 'test-topic.md');
    writeTopicFile(filePath, VALID_TOPIC_CONTENT);
    const tmpFile = path.join(tmpDir, 'topics', '.test-topic.md.tmp');
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it('cleans up temp file on final rename failure', () => {
    const filePath = path.join(tmpDir, 'topics', 'test-topic.md');
    const tmpFile = path.join(tmpDir, 'topics', '.test-topic.md.tmp');

    const originalRename = fs.renameSync;
    vi.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw new Error('Simulated rename failure');
    });

    expect(() => writeTopicFile(filePath, VALID_TOPIC_CONTENT)).toThrow('Simulated rename failure');
    expect(fs.existsSync(tmpFile)).toBe(false);

    vi.restoreAllMocks();
  });
});

describe('readTopicFile', () => {
  it('reads and parses a topic file', () => {
    const filePath = path.join(tmpDir, 'topics', 'test-topic.md');
    fs.writeFileSync(filePath, VALID_TOPIC_CONTENT, 'utf-8');
    const topic = readTopicFile(filePath);
    expect(topic.id).toBe('test-topic');
    expect(topic.title).toBe('Test Topic');
    expect(topic.status).toBe('new');
    expect(topic.notes).toHaveLength(1);
    expect(topic.notes[0].date).toBe('2026-03-01');
  });
});

describe('deleteTopicFile', () => {
  it('removes an existing file', () => {
    const filePath = path.join(tmpDir, 'topics', 'test-topic.md');
    fs.writeFileSync(filePath, VALID_TOPIC_CONTENT, 'utf-8');
    deleteTopicFile(filePath);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('does not throw for non-existent file', () => {
    const filePath = path.join(tmpDir, 'topics', 'nonexistent.md');
    expect(() => deleteTopicFile(filePath)).not.toThrow();
  });
});

describe('listTopicFiles', () => {
  it('returns only .md files', () => {
    const topicsDir = path.join(tmpDir, 'topics');
    fs.writeFileSync(path.join(topicsDir, 'topic-a.md'), 'a');
    fs.writeFileSync(path.join(topicsDir, 'topic-b.md'), 'b');
    fs.writeFileSync(path.join(topicsDir, 'notes.txt'), 'c');

    const files = listTopicFiles(topicsDir);
    expect(files).toHaveLength(2);
    expect(files.every((f) => f.endsWith('.md'))).toBe(true);
  });

  it('excludes hidden files', () => {
    const topicsDir = path.join(tmpDir, 'topics');
    fs.writeFileSync(path.join(topicsDir, '.hidden.md'), 'hidden');
    fs.writeFileSync(path.join(topicsDir, 'visible.md'), 'visible');

    const files = listTopicFiles(topicsDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('visible.md');
  });

  it('returns empty array for non-existent directory', () => {
    const files = listTopicFiles(path.join(tmpDir, 'nonexistent'));
    expect(files).toEqual([]);
  });
});

describe('ensureDataDirectories', () => {
  it('creates all required subdirectories', () => {
    const newDir = path.join(tmpDir, 'fresh');
    ensureDataDirectories(newDir);

    expect(fs.existsSync(path.join(newDir, 'topics'))).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'attachments'))).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'contexts'))).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'views'))).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'trash'))).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'trash', 'attachments'))).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'archive'))).toBe(true);
    expect(fs.existsSync(path.join(newDir, 'archive', 'attachments'))).toBe(true);
  });
});

describe('moveTopicToTrash', () => {
  it('moves file and attachments to trash', () => {
    const filePath = path.join(tmpDir, 'topics', 'my-topic.md');
    const attachDir = path.join(tmpDir, 'attachments', 'my-topic');
    fs.writeFileSync(filePath, VALID_TOPIC_CONTENT, 'utf-8');
    fs.mkdirSync(attachDir, { recursive: true });
    fs.writeFileSync(path.join(attachDir, 'img.png'), 'fake-image');

    moveTopicToTrash(filePath, tmpDir);

    expect(fs.existsSync(filePath)).toBe(false);
    expect(fs.existsSync(attachDir)).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'trash', 'my-topic.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'trash', 'attachments', 'my-topic', 'img.png'))).toBe(true);
  });

  it('does not throw when there is no attachments folder', () => {
    const filePath = path.join(tmpDir, 'topics', 'no-attach.md');
    fs.writeFileSync(filePath, VALID_TOPIC_CONTENT, 'utf-8');

    expect(() => moveTopicToTrash(filePath, tmpDir)).not.toThrow();
    expect(fs.existsSync(path.join(tmpDir, 'trash', 'no-attach.md'))).toBe(true);
  });

  it('overwrites existing file in trash', () => {
    const filePath = path.join(tmpDir, 'topics', 'dup.md');
    fs.writeFileSync(filePath, 'new content', 'utf-8');
    fs.writeFileSync(path.join(tmpDir, 'trash', 'dup.md'), 'old content', 'utf-8');

    moveTopicToTrash(filePath, tmpDir);
    const trashContent = fs.readFileSync(path.join(tmpDir, 'trash', 'dup.md'), 'utf-8');
    expect(trashContent).toBe('new content');
  });
});

describe('moveTopicToArchive', () => {
  it('moves file and attachments to archive', () => {
    const filePath = path.join(tmpDir, 'topics', 'archived.md');
    const attachDir = path.join(tmpDir, 'attachments', 'archived');
    fs.writeFileSync(filePath, VALID_TOPIC_CONTENT, 'utf-8');
    fs.mkdirSync(attachDir, { recursive: true });
    fs.writeFileSync(path.join(attachDir, 'doc.pdf'), 'fake-doc');

    moveTopicToArchive(filePath, tmpDir);

    expect(fs.existsSync(filePath)).toBe(false);
    expect(fs.existsSync(attachDir)).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'archive', 'archived.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'archive', 'attachments', 'archived', 'doc.pdf'))).toBe(true);
  });

  it('overwrites existing archive attachments when source has attachments', () => {
    const filePath = path.join(tmpDir, 'topics', 'dup.md');
    fs.writeFileSync(filePath, 'new', 'utf-8');

    // Create source attachments
    const srcAttach = path.join(tmpDir, 'attachments', 'dup');
    fs.mkdirSync(srcAttach, { recursive: true });
    fs.writeFileSync(path.join(srcAttach, 'new.txt'), 'new');

    // Create existing archive attachments
    const existingArchiveAttach = path.join(tmpDir, 'archive', 'attachments', 'dup');
    fs.mkdirSync(existingArchiveAttach, { recursive: true });
    fs.writeFileSync(path.join(existingArchiveAttach, 'old.txt'), 'old');

    moveTopicToArchive(filePath, tmpDir);
    // Old attachment should be removed, new one should be there
    expect(fs.existsSync(path.join(tmpDir, 'archive', 'attachments', 'dup', 'old.txt'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'archive', 'attachments', 'dup', 'new.txt'))).toBe(true);
  });
});

describe('moveTopicFromArchive', () => {
  it('restores file and attachments from archive', () => {
    const archiveFile = path.join(tmpDir, 'archive', 'restored.md');
    const archiveAttach = path.join(tmpDir, 'archive', 'attachments', 'restored');
    fs.writeFileSync(archiveFile, VALID_TOPIC_CONTENT, 'utf-8');
    fs.mkdirSync(archiveAttach, { recursive: true });
    fs.writeFileSync(path.join(archiveAttach, 'file.txt'), 'data');

    moveTopicFromArchive('restored', tmpDir);

    expect(fs.existsSync(archiveFile)).toBe(false);
    expect(fs.existsSync(archiveAttach)).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'topics', 'restored.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'attachments', 'restored', 'file.txt'))).toBe(true);
  });

  it('does not throw when archive has no attachments', () => {
    const archiveFile = path.join(tmpDir, 'archive', 'simple.md');
    fs.writeFileSync(archiveFile, VALID_TOPIC_CONTENT, 'utf-8');

    expect(() => moveTopicFromArchive('simple', tmpDir)).not.toThrow();
    expect(fs.existsSync(path.join(tmpDir, 'topics', 'simple.md'))).toBe(true);
  });
});
