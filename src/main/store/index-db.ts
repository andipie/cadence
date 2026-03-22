import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { Topic, TopicFilter } from '../../shared/types';
import { readTopicFile, listTopicFiles } from './file-store';

// --- Schema ---

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS topics (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'new',
  priority        TEXT NOT NULL DEFAULT 'normal',
  direction       TEXT NOT NULL DEFAULT 'discuss',
  due_date        TEXT,
  follow_up_date  TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  completed_at    TEXT,
  sort_order      REAL,
  recurring       INTEGER DEFAULT 0,
  recurring_interval TEXT,
  recurring_next  TEXT,
  body_preview    TEXT,
  file_path       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topic_contexts (
  topic_id    TEXT NOT NULL,
  context_id  TEXT NOT NULL,
  PRIMARY KEY (topic_id, context_id)
);

CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_priority ON topics(priority);
CREATE INDEX IF NOT EXISTS idx_topics_direction ON topics(direction);
CREATE INDEX IF NOT EXISTS idx_topics_due_date ON topics(due_date);
CREATE INDEX IF NOT EXISTS idx_topic_contexts_context ON topic_contexts(context_id);

-- FTS5 full-text search index (US-17)
CREATE VIRTUAL TABLE IF NOT EXISTS topics_fts USING fts5(
  title, body_preview,
  content=topics, content_rowid=rowid
);

-- Sync triggers: keep FTS in sync with topics table
CREATE TRIGGER IF NOT EXISTS topics_ai AFTER INSERT ON topics BEGIN
  INSERT INTO topics_fts(rowid, title, body_preview)
    VALUES (new.rowid, new.title, new.body_preview);
END;

CREATE TRIGGER IF NOT EXISTS topics_ad AFTER DELETE ON topics BEGIN
  INSERT INTO topics_fts(topics_fts, rowid, title, body_preview)
    VALUES ('delete', old.rowid, old.title, old.body_preview);
END;

CREATE TRIGGER IF NOT EXISTS topics_au AFTER UPDATE ON topics BEGIN
  INSERT INTO topics_fts(topics_fts, rowid, title, body_preview)
    VALUES ('delete', old.rowid, old.title, old.body_preview);
  INSERT INTO topics_fts(rowid, title, body_preview)
    VALUES (new.rowid, new.title, new.body_preview);
END;
`;

// --- Database init ---

/**
 * Deletes the SQLite database file and its WAL/SHM journal files.
 * WAL mode creates `-wal` and `-shm` companion files that must be
 * removed together to avoid recovery attempts from corrupted journals.
 */
function deleteDatabaseFiles(dbPath: string): void {
  for (const suffix of ['', '-wal', '-shm']) {
    const filePath = dbPath + suffix;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

/**
 * Opens (or creates) the SQLite database and ensures the schema exists.
 * If the database is corrupt, deletes it and recreates from scratch.
 */
export function initDatabase(dbPath: string): Database.Database {
  let db: Database.Database;

  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Integrity check — detect corruption early
    if (!checkIntegrity(db)) {
      console.warn('[IndexDB] Datenbank-Integritätsprüfung fehlgeschlagen, erstelle neu...');
      db.close();
      deleteDatabaseFiles(dbPath);
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
    }
  } catch {
    // Database file completely broken — delete and recreate
    console.error('[IndexDB] Datenbank konnte nicht geöffnet werden, erstelle neu...');
    deleteDatabaseFiles(dbPath);
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }

  db.exec(SCHEMA_SQL);
  return db;
}

/**
 * Checks SQLite database integrity. Returns true if database is healthy.
 */
export function checkIntegrity(db: Database.Database): boolean {
  try {
    const result = db.pragma('integrity_check') as Array<{ integrity_check: string }>;
    return result.length === 1 && result[0].integrity_check === 'ok';
  } catch {
    return false;
  }
}

// --- Index operations ---

const UPSERT_TOPIC_SQL = `
  INSERT OR REPLACE INTO topics
    (id, title, status, priority, direction, due_date, follow_up_date,
     created_at, updated_at, completed_at, sort_order,
     recurring, recurring_interval, recurring_next, body_preview, file_path)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const DELETE_TOPIC_CONTEXTS_SQL = `DELETE FROM topic_contexts WHERE topic_id = ?`;
const INSERT_TOPIC_CONTEXT_SQL = `INSERT INTO topic_contexts (topic_id, context_id) VALUES (?, ?)`;
const DELETE_TOPIC_SQL = `DELETE FROM topics WHERE id = ?`;

/**
 * Inserts or updates a topic in the index.
 */
export function indexTopic(db: Database.Database, topic: Topic): void {
  const upsert = db.prepare(UPSERT_TOPIC_SQL);
  const deleteContexts = db.prepare(DELETE_TOPIC_CONTEXTS_SQL);
  const insertContext = db.prepare(INSERT_TOPIC_CONTEXT_SQL);

  const transaction = db.transaction(() => {
    upsert.run(
      topic.id,
      topic.title,
      topic.status,
      topic.priority,
      topic.direction,
      topic.dueDate,
      topic.followUpDate,
      topic.createdAt,
      topic.updatedAt,
      topic.completedAt,
      topic.sortOrder,
      topic.recurring ? 1 : 0,
      topic.recurringInterval,
      topic.recurringNext,
      topic.bodyPreview,
      topic.filePath
    );

    deleteContexts.run(topic.id);
    for (const contextId of topic.contexts) {
      insertContext.run(topic.id, contextId);
    }
  });

  transaction();
}

/**
 * Removes a topic from the index by its ID.
 */
export function removeTopic(db: Database.Database, topicId: string): void {
  const deleteContexts = db.prepare(DELETE_TOPIC_CONTEXTS_SQL);
  const deleteTopic = db.prepare(DELETE_TOPIC_SQL);

  const transaction = db.transaction(() => {
    deleteContexts.run(topicId);
    deleteTopic.run(topicId);
  });

  transaction();
}

// --- Queries ---

/**
 * Queries topics from the index with flexible filtering.
 * Uses prepared statements — never string concatenation.
 */
export function queryTopics(db: Database.Database, filter: TopicFilter): Topic[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  // Inbox: topics without any context
  if (filter.inbox) {
    conditions.push(`t.id NOT IN (SELECT topic_id FROM topic_contexts)`);
  }

  // Context filter
  if (filter.contexts && filter.contexts.length > 0) {
    const placeholders = filter.contexts.map(() => '?').join(', ');
    conditions.push(`t.id IN (SELECT topic_id FROM topic_contexts WHERE context_id IN (${placeholders}))`);
    params.push(...filter.contexts);
  }

  // Status filter
  if (filter.status && filter.status.length > 0) {
    const placeholders = filter.status.map(() => '?').join(', ');
    conditions.push(`t.status IN (${placeholders})`);
    params.push(...filter.status);
  }

  // Priority filter
  if (filter.priority && filter.priority.length > 0) {
    const placeholders = filter.priority.map(() => '?').join(', ');
    conditions.push(`t.priority IN (${placeholders})`);
    params.push(...filter.priority);
  }

  // Direction filter
  if (filter.direction && filter.direction.length > 0) {
    const placeholders = filter.direction.map(() => '?').join(', ');
    conditions.push(`t.direction IN (${placeholders})`);
    params.push(...filter.direction);
  }

  // Overdue filter
  if (filter.overdue) {
    conditions.push(`t.due_date IS NOT NULL AND t.due_date < date('now')`);
  }

  // Due date range
  if (filter.dueBefore) {
    conditions.push(`t.due_date IS NOT NULL AND t.due_date <= ?`);
    params.push(filter.dueBefore);
  }
  if (filter.dueAfter) {
    conditions.push(`t.due_date IS NOT NULL AND t.due_date >= ?`);
    params.push(filter.dueAfter);
  }

  // Text search (simple LIKE for now, FTS5 in US-17)
  if (filter.search) {
    conditions.push(`(t.title LIKE ? OR t.body_preview LIKE ?)`);
    const searchPattern = `%${filter.search}%`;
    params.push(searchPattern, searchPattern);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // Sort order
  let orderClause: string;
  switch (filter.sortBy) {
    case 'due_date':
      orderClause = 'ORDER BY t.due_date ASC NULLS LAST, t.priority ASC';
      break;
    case 'created_at':
      orderClause = 'ORDER BY t.created_at DESC';
      break;
    case 'updated_at':
      orderClause = 'ORDER BY t.updated_at DESC';
      break;
    case 'priority':
    default:
      // sort_order takes precedence (manual DnD order), then priority, then due date
      orderClause = `ORDER BY
        t.sort_order ASC NULLS LAST,
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END ASC,
        t.due_date ASC NULLS LAST`;
      break;
  }

  const sql = `
    SELECT t.*
    FROM topics t
    ${whereClause}
    ${orderClause}
  `;

  const rows = db.prepare(sql).all(...params) as TopicRow[];
  return rows.map(rowToTopic);
}

/**
 * Returns the count of open topics per context.
 */
export function getTopicCountByContext(db: Database.Database): Map<string, number> {
  const sql = `
    SELECT tc.context_id, COUNT(*) as count
    FROM topic_contexts tc
    JOIN topics t ON t.id = tc.topic_id
    WHERE t.status != 'done'
    GROUP BY tc.context_id
  `;

  const rows = db.prepare(sql).all() as Array<{ context_id: string; count: number }>;
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.context_id, row.count);
  }
  return map;
}

/**
 * Returns counts for inbox and overdue topics.
 */
export function getSystemViewCounts(db: Database.Database): { inbox: number; overdue: number; deliver: number } {
  const inboxSql = `
    SELECT COUNT(*) as count FROM topics
    WHERE id NOT IN (SELECT topic_id FROM topic_contexts)
    AND status != 'done'
  `;
  const overdueSql = `
    SELECT COUNT(*) as count FROM topics
    WHERE due_date IS NOT NULL AND due_date < date('now')
    AND status != 'done'
  `;
  const deliverSql = `
    SELECT COUNT(*) as count FROM topics
    WHERE direction = 'deliver'
    AND status != 'done'
  `;

  const inbox = (db.prepare(inboxSql).get() as { count: number }).count;
  const overdue = (db.prepare(overdueSql).get() as { count: number }).count;
  const deliver = (db.prepare(deliverSql).get() as { count: number }).count;

  return { inbox, overdue, deliver };
}

export interface RebuildResult {
  indexed: number;
  corruptFiles: string[];
}

/**
 * Drops all data and rebuilds the index from the filesystem.
 * Returns the count of indexed topics and a list of corrupt file paths.
 */
export function rebuildIndex(db: Database.Database, topicsDir: string): RebuildResult {
  db.exec('DELETE FROM topic_contexts');
  db.exec('DELETE FROM topics');

  // Index both topics/ and archive/ directories
  const archiveDir = path.join(path.dirname(topicsDir), 'archive');
  const allFiles = [
    ...listTopicFiles(topicsDir),
    ...listTopicFiles(archiveDir),
  ];
  let indexed = 0;
  const corruptFiles: string[] = [];

  for (const filePath of allFiles) {
    try {
      const topic = readTopicFile(filePath);
      indexTopic(db, topic);
      indexed++;
    } catch (err) {
      // Log but don't crash — corrupted files are isolated (CLAUDE.md Error Handling)
      console.error(`[IndexDB] Fehler beim Indizieren von ${filePath}:`, err);
      corruptFiles.push(path.basename(filePath));
    }
  }



  // Rebuild FTS index to ensure consistency
  try {
    db.exec("INSERT INTO topics_fts(topics_fts) VALUES('rebuild')");
  } catch {
    // FTS rebuild failed — non-critical, search may be degraded
    console.warn('[IndexDB] FTS rebuild failed');
  }

  return { indexed, corruptFiles };
}

/**
 * Queries a single topic by ID from the index.
 * Used for frontmatter change detection in the file watcher.
 */
export function queryTopicById(db: Database.Database, id: string): Topic | null {
  const sql = `SELECT t.* FROM topics t WHERE t.id = ?`;
  const row = db.prepare(sql).get(id) as TopicRow | undefined;
  if (!row) return null;

  const topic = rowToTopic(row);
  // Populate contexts
  const ctxSql = `SELECT context_id FROM topic_contexts WHERE topic_id = ?`;
  const ctxRows = db.prepare(ctxSql).all(id) as Array<{ context_id: string }>;
  topic.contexts = ctxRows.map((r) => r.context_id);

  return topic;
}

// --- Full-text search ---

interface SearchTopicRow extends TopicRow {
  match_snippet: string | null;
}

/**
 * Sanitize user input for FTS5 queries.
 * Wraps each token in quotes and appends * for prefix matching.
 */
function sanitizeFtsQuery(input: string): string {
  // Remove FTS5 special operators and characters
  const cleaned = input
    .replace(/['"(){}[\]:^~!@#$%&]/g, '')
    .replace(/\b(AND|OR|NOT|NEAR)\b/gi, '');

  const tokens = cleaned.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return '';

  // Wrap each token in quotes and add prefix wildcard
  return tokens.map((t) => `"${t}"*`).join(' ');
}

/**
 * Searches topics using FTS5 full-text search.
 * Returns topic rows with match snippets.
 */
export function searchTopicsFts(
  db: Database.Database,
  query: string,
  limit: number = 20
): SearchTopicRow[] {
  const ftsQuery = sanitizeFtsQuery(query);
  if (!ftsQuery) return [];

  const sql = `
    SELECT t.*,
           snippet(topics_fts, 1, '<mark>', '</mark>', '…', 32) as match_snippet
    FROM topics_fts
    JOIN topics t ON t.rowid = topics_fts.rowid
    WHERE topics_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `;

  try {
    return db.prepare(sql).all(ftsQuery, limit) as SearchTopicRow[];
  } catch {
    // FTS query may fail with certain inputs — fall back to empty results
    return [];
  }
}

// --- Internal helpers ---

interface TopicRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  direction: string;
  due_date: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  sort_order: number | null;
  recurring: number;
  recurring_interval: string | null;
  recurring_next: string | null;
  body_preview: string | null;
  file_path: string;
}

function rowToTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    title: row.title,
    status: row.status as Topic['status'],
    priority: row.priority as Topic['priority'],
    direction: row.direction as Topic['direction'],
    contexts: [],  // Will be populated by caller if needed
    dueDate: row.due_date,
    followUpDate: row.follow_up_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    recurring: row.recurring === 1,
    recurringInterval: row.recurring_interval as Topic['recurringInterval'],
    recurringNext: row.recurring_next,
    bodyPreview: row.body_preview,
    filePath: row.file_path,
  };
}

/**
 * Populates the contexts array for topics from the topic_contexts table.
 */
export function populateTopicContexts(db: Database.Database, topics: Topic[]): void {
  if (topics.length === 0) return;

  const placeholders = topics.map(() => '?').join(', ');
  const sql = `SELECT topic_id, context_id FROM topic_contexts WHERE topic_id IN (${placeholders})`;
  const rows = db.prepare(sql).all(...topics.map((t) => t.id)) as Array<{ topic_id: string; context_id: string }>;

  const contextMap = new Map<string, string[]>();
  for (const row of rows) {
    const existing = contextMap.get(row.topic_id) || [];
    existing.push(row.context_id);
    contextMap.set(row.topic_id, existing);
  }

  for (const topic of topics) {
    topic.contexts = contextMap.get(topic.id) || [];
  }
}
