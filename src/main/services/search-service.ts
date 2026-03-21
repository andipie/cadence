import Database from 'better-sqlite3';
import type { SearchResult, ContextType, TopicStatus, TopicPriority } from '../../shared/types';
import { searchTopicsFts, populateTopicContexts } from '../store/index-db';
import { readContextsFile } from './context-service';

/**
 * Performs a global search across topics (FTS5) and context names (in-memory).
 * Returns combined results: matching contexts first, then matching topics.
 */
export function globalSearch(
  db: Database.Database,
  dataDir: string,
  query: string
): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const results: SearchResult[] = [];

  // Build context name map for resolving topic context names
  const { contexts: allContexts } = readContextsFile(dataDir).data;
  const contextNameMap = new Map<string, string>();
  const contextTypeMap = new Map<string, ContextType>();
  for (const ctx of allContexts) {
    contextNameMap.set(ctx.id, ctx.name);
    contextTypeMap.set(ctx.id, ctx.type);
  }

  // 1. Search context names (in-memory, few items)
  const lowerQuery = trimmed.toLowerCase();
  for (const ctx of allContexts) {
    if (ctx.name.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'context',
        id: ctx.id,
        title: ctx.name,
        snippet: null,
        contexts: [],
        contextType: ctx.type,
        status: null,
        priority: null,
      });
    }
  }

  // 2. Search topics via FTS5
  const topicRows = searchTopicsFts(db, trimmed);

  if (topicRows.length > 0) {
    // Get topic IDs to batch-load context associations
    const topicIds = topicRows.map((r) => r.id);
    const placeholders = topicIds.map(() => '?').join(', ');
    const contextRows = db
      .prepare(`SELECT topic_id, context_id FROM topic_contexts WHERE topic_id IN (${placeholders})`)
      .all(...topicIds) as Array<{ topic_id: string; context_id: string }>;

    // Build topic → contexts map
    const topicContextsMap = new Map<string, Array<{ id: string; name: string }>>();
    for (const row of contextRows) {
      const list = topicContextsMap.get(row.topic_id) || [];
      list.push({
        id: row.context_id,
        name: contextNameMap.get(row.context_id) || row.context_id,
      });
      topicContextsMap.set(row.topic_id, list);
    }

    // Convert to SearchResult
    for (const row of topicRows) {
      results.push({
        type: 'topic',
        id: row.id,
        title: row.title,
        snippet: row.match_snippet || null,
        contexts: topicContextsMap.get(row.id) || [],
        contextType: null,
        status: row.status as TopicStatus,
        priority: row.priority as TopicPriority,
      });
    }
  }

  return results;
}
