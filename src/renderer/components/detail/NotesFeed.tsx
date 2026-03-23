import React, { useState, useEffect } from 'react';
import type { NoteEntry, NoteMode } from '@shared/types';
import { formatDate } from '@shared/utils';
import NoteEditor from './NoteEditor';
import NoteContent from './NoteContent';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';

interface NotesFeedProps {
  notes: NoteEntry[];
  rawBody: string;
  topicSlug: string;
  noteMode: NoteMode;
}

export default function NotesFeed({
  notes,
  rawBody,
  topicSlug,
  noteMode,
}: NotesFeedProps): React.ReactElement {
  const addNote = useAppStore((s) => s.addNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const deleteNote = useAppStore((s) => s.deleteNote);
  const updateBody = useAppStore((s) => s.updateBody);
  const addNoteFocusKey = useAppStore((s) => s.addNoteFocusKey);
  const t = useTranslation();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);

  // Determine effective mode: if individual mode but no parsed notes and body exists, fallback to freetext
  const hasParsableNotes = notes.length > 0;
  const hasBodyContent = rawBody.trim().length > 0;
  const isFallback = noteMode === 'individual' && !hasParsableNotes && hasBodyContent;
  const effectiveMode = isFallback ? 'freetext' : noteMode;

  // React to ⌘+U trigger
  useEffect(() => {
    if (addNoteFocusKey > 0) {
      if (effectiveMode === 'individual') {
        setIsAddingNew(true);
        setEditingIndex(null);
      } else {
        setIsEditingBody(true);
      }
    }
  }, [addNoteFocusKey, effectiveMode]);

  function handleAddClick(): void {
    setIsAddingNew(true);
    setEditingIndex(null);
  }

  function handleNewNoteSave(content: string): void {
    if (content.trim()) {
      addNote(content.trim());
    }
    setIsAddingNew(false);
  }

  function handleNewNoteCancel(): void {
    setIsAddingNew(false);
  }

  function handleNoteClick(index: number): void {
    setEditingIndex(index);
    setIsAddingNew(false);
  }

  function handleNoteUpdate(index: number, content: string): void {
    updateNote(index, content);
    setEditingIndex(null);
  }

  function handleNoteEditCancel(): void {
    setEditingIndex(null);
  }

  function handleNoteDelete(index: number): void {
    deleteNote(index);
    if (editingIndex === index) setEditingIndex(null);
  }

  function handleBodySave(content: string): void {
    updateBody(content);
    setIsEditingBody(false);
  }

  function handleBodyCancel(): void {
    setIsEditingBody(false);
  }

  // --- Freetext Mode ---
  if (effectiveMode === 'freetext') {
    return (
      <div className="space-y-3">
        {isFallback && (
          <div className="text-xs text-warning dark:text-warning-dark italic">
            {t.notes.fallbackHint}
          </div>
        )}

        {isEditingBody ? (
          <NoteEditor
            content={rawBody}
            onSave={handleBodySave}
            onCancel={handleBodyCancel}
            autoFocus
            topicSlug={topicSlug}
          />
        ) : (
          <div
            className="text-sm text-text-primary dark:text-text-primary-dark cursor-pointer hover:bg-surface-secondary/50 dark:hover:bg-surface-secondary-dark/50 rounded p-1 -m-1 min-h-[2rem]"
            onClick={() => setIsEditingBody(true)}
            title={t.notes.editHint}
          >
            {hasBodyContent ? (
              <NoteContent content={rawBody} />
            ) : (
              <span className="text-text-secondary dark:text-text-secondary-dark italic">
                {t.notes.empty}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- Individual Notes Mode ---
  return (
    <div className="space-y-3">
      {/* Add Update button */}
      <button
        type="button"
        className="px-3 py-1.5 rounded text-sm font-medium bg-accent/10 text-accent dark:text-accent-dark hover:bg-accent/20"
        onClick={handleAddClick}
        title={t.notes.addTooltip}
      >
        {t.notes.addButton}
      </button>

      {/* New note editor */}
      {isAddingNew && (
        <div className="border-l-2 border-accent dark:border-accent-dark pl-3">
          <div className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
            {formatDate(new Date().toISOString().split('T')[0])}
          </div>
          <NoteEditor
            content=""
            onSave={handleNewNoteSave}
            onCancel={handleNewNoteCancel}
            autoFocus
            topicSlug={topicSlug}
          />
        </div>
      )}

      {/* Existing notes */}
      {notes.length === 0 && !isAddingNew && (
        <div className="text-sm text-text-secondary dark:text-text-secondary-dark italic">
          {t.notes.empty}
        </div>
      )}

      {notes.map((note, index) => (
        <div
          key={`${note.date}-${index}`}
          className={`group/note border-l-2 pl-3 ${
            index === 0
              ? 'border-accent dark:border-accent-dark'
              : 'border-border dark:border-border-dark'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark">
              {formatDate(note.date)}
            </div>
            <button
              type="button"
              className="px-1 py-0.5 text-xs text-text-secondary dark:text-text-secondary-dark hover:text-danger dark:hover:text-danger-dark opacity-0 group-hover/note:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); handleNoteDelete(index); }}
              title={t.notes.deleteButton}
            >
              ✕
            </button>
          </div>

          {editingIndex === index ? (
            <NoteEditor
              content={note.content}
              onSave={(content) => handleNoteUpdate(index, content)}
              onCancel={handleNoteEditCancel}
              autoFocus
              topicSlug={topicSlug}
            />
          ) : (
            <div
              className="text-sm text-text-primary dark:text-text-primary-dark cursor-pointer hover:bg-surface-secondary/50 dark:hover:bg-surface-secondary-dark/50 rounded p-1 -m-1"
              onClick={() => handleNoteClick(index)}
              title={t.notes.editHint}
            >
              <NoteContent content={note.content} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
