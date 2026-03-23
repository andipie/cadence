import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';
import { IPC } from '../../shared/ipc-channels';
import { DEFAULT_STATUS, DEFAULT_PRIORITY, DEFAULT_DIRECTION } from '../../shared/constants';
import { serializeTopicFile, addNoteEntry, updateNoteEntry, deleteNoteEntry, replaceBody } from '../../shared/markdown';
import { calculateNextRecurringDate, formatDate } from '../../shared/utils';
import type { TopicFilter, TopicDetail, CreateTopicInput, UpdateTopicInput, DuplicateTopicInput, AppError } from '../../shared/types';
import { queryTopics, populateTopicContexts, indexTopic, removeTopic } from '../store/index-db';
import { readTopicFile, writeTopicFile, listTopicFiles, deleteTopicFile, moveTopicToTrash, moveTopicToArchive, moveTopicFromArchive } from '../store/file-store';
import { addToIgnoreList, removeFromIgnoreList } from '../store/file-watcher';
import { titleToSlug, ensureUniqueSlug, slugFromFilePath } from '../services/slug-service';
import { setLastUndo, getLastUndo, clearLastUndo } from '../services/undo-service';
import { renameAttachmentsFolder } from '../store/attachment-store';
import { readSettings } from '../services/settings-service';
import { getTranslations } from '../../shared/locales';

function makeError(message: string, detail?: string): AppError {
  return { severity: 'error', message, detail };
}

/** Safe handler registration — removes existing handler first to survive HMR restarts. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeHandle(channel: string, handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
}

/** Reads obsidianMode from settings — cheap sync read on every serialize call. */
function getSerializeOptions(dataDir: string): { obsidianMode: boolean } {
  try {
    const settings = readSettings(dataDir);
    return { obsidianMode: settings.obsidianMode };
  } catch {
    return { obsidianMode: false };
  }
}

function buildUndoDescription(data: UpdateTopicInput, dataDir: string): string {
  const settings = readSettings(dataDir);
  const t = getTranslations(settings.language);
  if (data.status) return t.toast.statusChanged(t.status[data.status] ?? data.status);
  if (data.priority) return t.toast.priorityChanged(t.priority[data.priority] ?? data.priority);
  if (data.direction) return t.toast.directionChanged(t.direction[data.direction] ?? data.direction);
  if (data.title) return t.undo.titleChanged;
  if (data.contexts) return t.undo.contextsChanged;
  if (data.dueDate !== undefined) return t.undo.dueDateChanged;
  if (data.followUpDate !== undefined) return t.undo.followUpChanged;
  return t.undo.topicUpdated;
}

/**
 * Registers IPC handlers for topic operations.
 */
export function registerTopicHandlers(db: Database.Database, dataDir: string): void {
  const topicsDir = path.join(dataDir, 'topics');

  safeHandle(IPC.TOPICS_LIST, (_event, filter: TopicFilter) => {
    const topics = queryTopics(db, filter);
    populateTopicContexts(db, topics);
    return topics;
  });

  safeHandle(IPC.TOPICS_GET, (_event, id: string) => {
    // Check both topics/ and archive/ for the file
    const topicsFilePath = path.join(topicsDir, `${id}.md`);
    const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
    const filePath = fs.existsSync(topicsFilePath) ? topicsFilePath : archiveFilePath;
    return readTopicFile(filePath);
  });

  safeHandle(IPC.TOPICS_CREATE, (_event, data: CreateTopicInput) => {
    try {
      // 1. Generate unique slug from title
      const slug = titleToSlug(data.title);
      const existingSlugs = listTopicFiles(topicsDir).map(slugFromFilePath);
      const uniqueSlug = ensureUniqueSlug(slug, existingSlugs);

      // 2. Build TopicDetail with defaults
      const now = new Date().toISOString();
      const topic: TopicDetail = {
        id: uniqueSlug,
        title: data.title,
        status: DEFAULT_STATUS,
        priority: data.priority ?? readSettings(dataDir).defaultPriority,
        direction: data.direction ?? DEFAULT_DIRECTION,
        contexts: data.contexts ?? [],
        dueDate: data.dueDate ?? null,
        followUpDate: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        sortOrder: null,
        recurring: false,
        recurringInterval: null,
        recurringNext: null,
        bodyPreview: null,
        filePath: `${uniqueSlug}.md`,
        notes: [],
        rawBody: '',
      };

      // 3. Serialize and write file
      const content = serializeTopicFile(topic, getSerializeOptions(dataDir));
      const filePath = path.join(topicsDir, `${uniqueSlug}.md`);

      addToIgnoreList(filePath);
      try {
        writeTopicFile(filePath, content);
      } finally {
        removeFromIgnoreList(filePath);
      }

      // 4. Update index
      indexTopic(db, topic);

      // 5. Return topic for immediate UI update
      return topic;
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.topicCreateFailed, String(err));
    }
  });

  // Update an existing topic
  safeHandle(IPC.TOPICS_UPDATE, (_event, id: string, data: UpdateTopicInput) => {
    try {
      // Check both topics/ and archive/ for the file
      const topicsFilePath = path.join(topicsDir, `${id}.md`);
      const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
      const oldFilePath = fs.existsSync(topicsFilePath) ? topicsFilePath : fs.existsSync(archiveFilePath) ? archiveFilePath : topicsFilePath;
      const wasArchived = oldFilePath === archiveFilePath;

      // Capture undo state before modification
      const previousFileContent = fs.readFileSync(oldFilePath, 'utf-8');
      setLastUndo({
        type: 'update',
        topicId: id,
        description: buildUndoDescription(data, dataDir),
        previousFileContent,
        previousFilePath: oldFilePath,
      });

      const existing = readTopicFile(oldFilePath);
      const now = new Date().toISOString();

      // Merge updates into existing topic
      const updated: TopicDetail = {
        ...existing,
        title: data.title ?? existing.title,
        status: data.status ?? existing.status,
        priority: data.priority ?? existing.priority,
        direction: data.direction ?? existing.direction,
        contexts: data.contexts ?? existing.contexts,
        dueDate: data.dueDate !== undefined ? data.dueDate : existing.dueDate,
        followUpDate: data.followUpDate !== undefined ? data.followUpDate : existing.followUpDate,
        sortOrder: data.sortOrder ?? existing.sortOrder,
        recurring: data.recurring ?? existing.recurring,
        recurringInterval: data.recurringInterval !== undefined ? data.recurringInterval : existing.recurringInterval,
        updatedAt: now,
      };

      // Set completedAt when marking as done or canceled
      const isTerminal = data.status === 'done' || data.status === 'canceled';
      const wasTerminal = existing.status === 'done' || existing.status === 'canceled';
      if (isTerminal && !wasTerminal) {
        updated.completedAt = now;
      } else if (data.status && !isTerminal) {
        updated.completedAt = null;
      }

      // Auto-recur: when marking a recurring topic as "erledigt", transition to follow-up instead
      if (data.status === 'done' && existing.recurring && existing.recurringInterval) {
        const today = now.split('T')[0];
        const nextDate = calculateNextRecurringDate(today, existing.recurringInterval);
        updated.status = 'follow-up';
        updated.completedAt = null;
        updated.recurringNext = nextDate;
        updated.followUpDate = nextDate;
        // Add note documenting the recurrence cycle
        const noteText = `--- Completed on ${formatDate(today)}, next follow-up ${formatDate(nextDate)} ---`;
        updated.notes = [
          { date: today, content: noteText },
          ...updated.notes,
        ];
      }

      // Check if title changed → file rename needed
      const newSlug = data.title ? titleToSlug(data.title) : id;
      const needsRename = data.title && newSlug !== id;

      if (needsRename) {
        // Generate unique slug for new filename
        const existingSlugs = listTopicFiles(topicsDir)
          .map(slugFromFilePath)
          .filter((s) => s !== id);
        const uniqueSlug = ensureUniqueSlug(newSlug, existingSlugs);
        const newFilePath = path.join(topicsDir, `${uniqueSlug}.md`);

        updated.id = uniqueSlug;
        updated.filePath = `${uniqueSlug}.md`;

        // Update attachment references in notes (old slug → new slug)
        updated.notes = updated.notes.map((note) => ({
          ...note,
          content: note.content.replace(
            new RegExp(`\\.\\.\/attachments\/${id}\/`, 'g'),
            `../attachments/${uniqueSlug}/`
          ),
        }));

        // Write new file
        const content = serializeTopicFile(updated, getSerializeOptions(dataDir));
        addToIgnoreList(newFilePath);
        addToIgnoreList(oldFilePath);
        try {
          writeTopicFile(newFilePath, content);
          deleteTopicFile(oldFilePath);
        } finally {
          removeFromIgnoreList(newFilePath);
          removeFromIgnoreList(oldFilePath);
        }

        // Rename attachments folder to match new slug
        renameAttachmentsFolder(dataDir, id, uniqueSlug);

        // Update index: remove old, add new
        removeTopic(db, id);
        indexTopic(db, updated);
      } else {
        // Normal update — same file
        const content = serializeTopicFile(updated, getSerializeOptions(dataDir));
        addToIgnoreList(oldFilePath);
        try {
          writeTopicFile(oldFilePath, content);
        } finally {
          removeFromIgnoreList(oldFilePath);
        }

        indexTopic(db, updated);

        // Archive/unarchive based on status change
        const nowErledigt = updated.status === 'done' || updated.status === 'canceled';
        if (nowErledigt && !wasArchived) {
          // Move to archive
          addToIgnoreList(oldFilePath);
          try {
            moveTopicToArchive(oldFilePath, dataDir);
          } finally {
            removeFromIgnoreList(oldFilePath);
          }
        } else if (!nowErledigt && wasArchived) {
          // Move back from archive to topics
          const archivePath = path.join(dataDir, 'archive', `${id}.md`);
          addToIgnoreList(archivePath);
          try {
            moveTopicFromArchive(id, dataDir);
          } finally {
            removeFromIgnoreList(archivePath);
          }
        }
      }

      // Update body preview
      if (updated.notes.length > 0) {
        const preview = updated.notes[0].content.trim();
        updated.bodyPreview = preview.length > 200 ? preview.substring(0, 200) + '…' : preview;
      }

      return updated;
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.topicUpdateFailed, String(err));
    }
  });

  // Delete a topic (moves to trash instead of permanent deletion)
  safeHandle(IPC.TOPICS_DELETE, (_event, id: string) => {
    try {
      const filePath = path.join(topicsDir, `${id}.md`);

      // Also check archive directory for completed topics
      const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
      const actualPath = fs.existsSync(filePath) ? filePath : fs.existsSync(archiveFilePath) ? archiveFilePath : filePath;

      // Capture undo state before deletion
      const t = getTranslations(readSettings(dataDir).language);
      const previousFileContent = fs.readFileSync(actualPath, 'utf-8');
      setLastUndo({
        type: 'delete',
        topicId: id,
        description: t.undo.topicDeleted,
        previousFileContent,
        previousFilePath: actualPath,
      });

      addToIgnoreList(actualPath);
      try {
        moveTopicToTrash(actualPath, dataDir);
      } finally {
        removeFromIgnoreList(actualPath);
      }

      removeTopic(db, id);
    } catch (err) {
      const tErr = getTranslations(readSettings(dataDir).language);
      throw makeError(tErr.errors.topicDeleteFailed, String(err));
    }
  });

  // Add a new note entry to a topic
  safeHandle(IPC.TOPICS_ADD_NOTE, (_event, id: string, noteContent: string) => {
    try {
      const topicsFilePath = path.join(topicsDir, `${id}.md`);
      const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
      const filePath = fs.existsSync(topicsFilePath) ? topicsFilePath : archiveFilePath;
      const raw = fs.readFileSync(filePath, 'utf-8');

      // Insert new note at top of body
      const updatedContent = addNoteEntry(raw, noteContent);

      addToIgnoreList(filePath);
      try {
        writeTopicFile(filePath, updatedContent);
      } finally {
        removeFromIgnoreList(filePath);
      }

      // Re-read parsed topic for index update and return
      const updated = readTopicFile(filePath);
      indexTopic(db, updated);
      return updated;
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.noteAddFailed, String(err));
    }
  });

  // Update an existing note entry by index
  safeHandle(IPC.TOPICS_UPDATE_NOTE, (_event, id: string, noteIndex: number, newContent: string) => {
    try {
      const topicsFilePath = path.join(topicsDir, `${id}.md`);
      const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
      const filePath = fs.existsSync(topicsFilePath) ? topicsFilePath : archiveFilePath;
      const raw = fs.readFileSync(filePath, 'utf-8');

      // Update the specific note block
      const updatedContent = updateNoteEntry(raw, noteIndex, newContent);

      addToIgnoreList(filePath);
      try {
        writeTopicFile(filePath, updatedContent);
      } finally {
        removeFromIgnoreList(filePath);
      }

      // Re-read parsed topic for index update and return
      const updated = readTopicFile(filePath);
      indexTopic(db, updated);
      return updated;
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.noteUpdateFailed, String(err));
    }
  });

  // Delete a note entry by index
  safeHandle(IPC.TOPICS_DELETE_NOTE, (_event, id: string, noteIndex: number) => {
    try {
      const topicsFilePath = path.join(topicsDir, `${id}.md`);
      const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
      const filePath = fs.existsSync(topicsFilePath) ? topicsFilePath : archiveFilePath;
      const raw = fs.readFileSync(filePath, 'utf-8');

      // Save for undo
      const t = getTranslations(readSettings(dataDir).language);
      setLastUndo({ filePath, content: raw, description: t.undo.noteDeleted ?? 'Note deleted' });

      const updatedContent = deleteNoteEntry(raw, noteIndex);

      addToIgnoreList(filePath);
      try {
        writeTopicFile(filePath, updatedContent);
      } finally {
        removeFromIgnoreList(filePath);
      }

      const updated = readTopicFile(filePath);
      indexTopic(db, updated);
      return updated;
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.noteDeleteFailed ?? 'Failed to delete note', String(err));
    }
  });

  // Replace the entire body (freetext note mode)
  safeHandle(IPC.TOPICS_UPDATE_BODY, (_event, id: string, body: string) => {
    try {
      const topicsFilePath = path.join(topicsDir, `${id}.md`);
      const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
      const filePath = fs.existsSync(topicsFilePath) ? topicsFilePath : archiveFilePath;
      const raw = fs.readFileSync(filePath, 'utf-8');

      const updatedContent = replaceBody(raw, body);

      addToIgnoreList(filePath);
      try {
        writeTopicFile(filePath, updatedContent);
      } finally {
        removeFromIgnoreList(filePath);
      }

      const updated = readTopicFile(filePath);
      indexTopic(db, updated);
      return updated;
    } catch (err) {
      const t = getTranslations(readSettings(dataDir).language);
      throw makeError(t.errors.bodyUpdateFailed ?? 'Failed to update body', String(err));
    }
  });

  // Bulk update multiple topics
  safeHandle(IPC.TOPICS_BULK_UPDATE, (_event, ids: string[], data: Partial<UpdateTopicInput>) => {
    const t = getTranslations(readSettings(dataDir).language);
    if (!Array.isArray(ids) || ids.length === 0) {
      throw makeError(t.errors.noTopicsForBulkUpdate);
    }
    if (!data || typeof data !== 'object') {
      throw makeError(t.errors.invalidBulkData);
    }

    const results: TopicDetail[] = [];
    const now = new Date().toISOString();

    for (const id of ids) {
      try {
        // Check both topics/ and archive/ for the file
        const topicsFilePath = path.join(topicsDir, `${id}.md`);
        const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
        const filePath = fs.existsSync(topicsFilePath) ? topicsFilePath : fs.existsSync(archiveFilePath) ? archiveFilePath : topicsFilePath;
        const wasArchived = filePath === archiveFilePath;

        const existing = readTopicFile(filePath);

        // Merge updates (no title change in bulk — would cause renames)
        const updated: TopicDetail = {
          ...existing,
          status: data.status ?? existing.status,
          priority: data.priority ?? existing.priority,
          direction: data.direction ?? existing.direction,
          contexts: data.contexts ?? existing.contexts,
          dueDate: data.dueDate !== undefined ? data.dueDate : existing.dueDate,
          followUpDate: data.followUpDate !== undefined ? data.followUpDate : existing.followUpDate,
          updatedAt: now,
        };

        // Set completedAt when marking as done or canceled
        const isTerminalBulk = data.status === 'done' || data.status === 'canceled';
        const wasTerminalBulk = existing.status === 'done' || existing.status === 'canceled';
        if (isTerminalBulk && !wasTerminalBulk) {
          updated.completedAt = now;
        } else if (data.status && !isTerminalBulk) {
          updated.completedAt = null;
        }

        // Auto-recur: when marking a recurring topic as "erledigt", transition to follow-up
        if (data.status === 'done' && existing.recurring && existing.recurringInterval) {
          const today = now.split('T')[0];
          const nextDate = calculateNextRecurringDate(today, existing.recurringInterval);
          updated.status = 'follow-up';
          updated.completedAt = null;
          updated.recurringNext = nextDate;
          updated.followUpDate = nextDate;
          const noteText = `--- Completed on ${formatDate(today)}, next follow-up ${formatDate(nextDate)} ---`;
          updated.notes = [
            { date: today, content: noteText },
            ...updated.notes,
          ];
        }

        const content = serializeTopicFile(updated, getSerializeOptions(dataDir));
        addToIgnoreList(filePath);
        try {
          writeTopicFile(filePath, content);
        } finally {
          removeFromIgnoreList(filePath);
        }

        indexTopic(db, updated);

        // Archive/unarchive based on status change
        const nowErledigt = updated.status === 'done' || updated.status === 'canceled';
        if (nowErledigt && !wasArchived) {
          addToIgnoreList(filePath);
          try {
            moveTopicToArchive(filePath, dataDir);
          } finally {
            removeFromIgnoreList(filePath);
          }
        } else if (!nowErledigt && wasArchived) {
          addToIgnoreList(filePath);
          try {
            moveTopicFromArchive(id, dataDir);
          } finally {
            removeFromIgnoreList(filePath);
          }
        }

        results.push(updated);
      } catch (err) {
        // Skip individual failures, continue with rest
        console.error(`[Bulk-Update] Fehler bei ${id}:`, err);
      }
    }

    // No undo for bulk operations (single-undo model)
    return results;
  });

  // Bulk delete multiple topics
  safeHandle(IPC.TOPICS_BULK_DELETE, (_event, ids: string[]) => {
    const t = getTranslations(readSettings(dataDir).language);
    if (!Array.isArray(ids) || ids.length === 0) {
      throw makeError(t.errors.noTopicsForBulkDelete);
    }

    let deleted = 0;
    for (const id of ids) {
      try {
        // Check both topics/ and archive/ for the file
        const topicsFilePath = path.join(topicsDir, `${id}.md`);
        const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
        const filePath = fs.existsSync(topicsFilePath) ? topicsFilePath : fs.existsSync(archiveFilePath) ? archiveFilePath : topicsFilePath;

        addToIgnoreList(filePath);
        try {
          moveTopicToTrash(filePath, dataDir);
        } finally {
          removeFromIgnoreList(filePath);
        }

        removeTopic(db, id);
        deleted++;
      } catch (err) {
        console.error(`[Bulk-Delete] Fehler bei ${id}:`, err);
      }
    }

    // No undo for bulk deletions
    return { deleted };
  });

  // Reorder topics within a direction group (Drag & Drop)
  safeHandle(IPC.TOPICS_REORDER, (_event, ids: string[], _groupKey: string) => {
    const t = getTranslations(readSettings(dataDir).language);
    if (!Array.isArray(ids) || ids.length === 0) {
      throw makeError(t.errors.noTopicsForReorder);
    }

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const sortOrder = (i + 1) * 1000; // Gaps for future insertions
      try {
        const topicsFilePath = path.join(topicsDir, `${id}.md`);
        const archiveFilePath = path.join(dataDir, 'archive', `${id}.md`);
        const filePath = fs.existsSync(topicsFilePath) ? topicsFilePath : archiveFilePath;
        const existing = readTopicFile(filePath);

        // Only update if sort_order actually changed
        if (existing.sortOrder === sortOrder) continue;

        const updated: TopicDetail = {
          ...existing,
          sortOrder,
          updatedAt: new Date().toISOString(),
        };

        const content = serializeTopicFile(updated, getSerializeOptions(dataDir));
        addToIgnoreList(filePath);
        try {
          writeTopicFile(filePath, content);
        } finally {
          removeFromIgnoreList(filePath);
        }

        indexTopic(db, updated);
      } catch (err) {
        console.error(`[Reorder] Fehler bei ${id}:`, err);
      }
    }
  });

  // Duplicate a topic into one or more target contexts
  safeHandle(IPC.TOPICS_DUPLICATE, (_event, data: DuplicateTopicInput) => {
    const t = getTranslations(readSettings(dataDir).language);
    if (!data.sourceId || !Array.isArray(data.targetContexts) || data.targetContexts.length === 0) {
      throw makeError(t.errors.invalidDuplicateParams);
    }

    try {
      // Read source topic (check both topics/ and archive/)
      const sourceTopicsPath = path.join(topicsDir, `${data.sourceId}.md`);
      const sourceArchivePath = path.join(dataDir, 'archive', `${data.sourceId}.md`);
      const sourcePath = fs.existsSync(sourceTopicsPath) ? sourceTopicsPath : sourceArchivePath;
      const source = readTopicFile(sourcePath);

      // Collect all existing slugs for uniqueness checks
      const archiveDir = path.join(dataDir, 'archive');
      const existingSlugs = [
        ...listTopicFiles(topicsDir).map(slugFromFilePath),
        ...(fs.existsSync(archiveDir) ? listTopicFiles(archiveDir).map(slugFromFilePath) : []),
      ];

      const results: TopicDetail[] = [];
      const baseSlug = titleToSlug(source.title);

      for (const targetContext of data.targetContexts) {
        const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);
        existingSlugs.push(uniqueSlug); // Prevent collision with subsequent copies

        const now = new Date().toISOString();
        const duplicate: TopicDetail = {
          ...source,
          id: uniqueSlug,
          contexts: [targetContext],
          createdAt: now,
          updatedAt: now,
          completedAt: null,
          sortOrder: null,
          filePath: `${uniqueSlug}.md`,
        };

        // Reset status if it was erledigt (copy should be active)
        if (duplicate.status === 'done' || duplicate.status === 'canceled') {
          duplicate.status = DEFAULT_STATUS;
        }

        const content = serializeTopicFile(duplicate, getSerializeOptions(dataDir));
        const filePath = path.join(topicsDir, `${uniqueSlug}.md`);

        addToIgnoreList(filePath);
        try {
          writeTopicFile(filePath, content);
        } finally {
          removeFromIgnoreList(filePath);
        }

        indexTopic(db, duplicate);
        results.push(duplicate);
      }

      return results;
    } catch (err) {
      throw makeError(t.errors.duplicateFailed, String(err));
    }
  });

  // Undo the last action
  safeHandle(IPC.UNDO_LAST, () => {
    const t = getTranslations(readSettings(dataDir).language);
    const undo = getLastUndo();
    if (!undo) {
      throw makeError(t.errors.nothingToUndo);
    }

    try {
      const filePath = undo.previousFilePath;
      const slug = path.basename(filePath, '.md');

      // For delete undo: remove the file from trash first
      if (undo.type === 'delete') {
        const trashPath = path.join(dataDir, 'trash', `${slug}.md`);
        if (fs.existsSync(trashPath)) {
          addToIgnoreList(trashPath);
          try {
            deleteTopicFile(trashPath);
          } finally {
            removeFromIgnoreList(trashPath);
          }
        }
        // Also move attachments back from trash
        const trashAttDir = path.join(dataDir, 'trash', 'attachments', slug);
        const attDir = path.join(dataDir, 'attachments', slug);
        if (fs.existsSync(trashAttDir)) {
          fs.renameSync(trashAttDir, attDir);
        }
      }

      // For update undo: if current file is in a different location, clean it up
      if (undo.type === 'update') {
        // The file might have been moved (archived/unarchived) — find and remove the moved copy
        const topicsPath = path.join(topicsDir, `${slug}.md`);
        const archivePath = path.join(dataDir, 'archive', `${slug}.md`);
        const currentPath = fs.existsSync(topicsPath) ? topicsPath : fs.existsSync(archivePath) ? archivePath : null;

        if (currentPath && currentPath !== filePath) {
          addToIgnoreList(currentPath);
          try {
            deleteTopicFile(currentPath);
          } finally {
            removeFromIgnoreList(currentPath);
          }
        }
      }

      // Restore file at the original location
      addToIgnoreList(filePath);
      try {
        writeTopicFile(filePath, undo.previousFileContent);
      } finally {
        removeFromIgnoreList(filePath);
      }

      // Re-read and re-index the restored file
      const restored = readTopicFile(filePath);
      indexTopic(db, restored);

      clearLastUndo();
      return { success: true, topicId: restored.id };
    } catch (err) {
      throw makeError(t.errors.undoFailed, String(err));
    }
  });
}
