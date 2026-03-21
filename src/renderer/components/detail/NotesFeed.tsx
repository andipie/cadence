import React, { useState, useEffect } from 'react';
import type { NoteEntry } from '@shared/types';
import { formatDate } from '@shared/utils';
import NoteEditor from './NoteEditor';
import NoteContent from './NoteContent';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';

interface NotesFeedProps {
  notes: NoteEntry[];
  topicSlug: string;
}

export default function NotesFeed({
  notes,
  topicSlug,
}: NotesFeedProps): React.ReactElement {
  const addNote = useAppStore((s) => s.addNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const addNoteFocusKey = useAppStore((s) => s.addNoteFocusKey);
  const t = useTranslation();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // React to ⌘+U trigger
  useEffect(() => {
    if (addNoteFocusKey > 0) {
      setIsAddingNew(true);
      setEditingIndex(null);
    }
  }, [addNoteFocusKey]);

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

      {/* Key includes index because notes have no unique ID and multiple notes
          can share the same date. This is safe because notes are append-only
          (new notes prepended, no reordering). */}
      {notes.map((note, index) => (
        <div
          key={`${note.date}-${index}`}
          className={`border-l-2 pl-3 ${
            index === 0
              ? 'border-accent dark:border-accent-dark'
              : 'border-border dark:border-border-dark'
          }`}
        >
          <div className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
            {formatDate(note.date)}
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
