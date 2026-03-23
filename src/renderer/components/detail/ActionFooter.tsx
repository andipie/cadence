import React, { useEffect, useRef, useState } from 'react';
import type { TopicDetail } from '@shared/types';
import { useTranslation } from '../../hooks/useTranslation';

interface ActionFooterProps {
  topic: TopicDetail;
  onMarkComplete: () => void;
  onFollowUp: () => void;
  onDelete: () => void;
}

export default function ActionFooter({
  topic,
  onMarkComplete,
  onFollowUp,
  onDelete,
}: ActionFooterProps): React.ReactElement {
  const t = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleted = topic.status === 'done' || topic.status === 'canceled';
  const isFollowUp = topic.status === 'follow-up';

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  function handleDeleteClick(): void {
    if (confirmDelete) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!isCompleted && (
        <button
          type="button"
          className="px-3 py-1.5 rounded text-sm font-medium bg-success/10 text-success dark:text-success-dark hover:bg-success/20"
          onClick={onMarkComplete}
          title="⌘+E"
        >
          {t.actions.complete}
        </button>
      )}

      {!isCompleted && !isFollowUp && (
        <button
          type="button"
          className="px-3 py-1.5 rounded text-sm font-medium bg-warning/10 text-warning dark:text-warning-dark hover:bg-warning/20"
          onClick={onFollowUp}
          title="⌘+F"
        >
          {t.actions.followUp}
        </button>
      )}

      <div className="flex-1" />

      <button
        type="button"
        className={`px-3 py-1.5 rounded text-sm ${
          confirmDelete
            ? 'bg-danger/20 text-danger dark:text-danger-dark font-medium'
            : 'text-text-secondary dark:text-text-secondary-dark hover:text-danger dark:hover:text-danger-dark hover:bg-danger/10'
        }`}
        onClick={handleDeleteClick}
        title={t.actions.delete}
      >
        {confirmDelete ? t.actions.deleteConfirm : t.actions.delete}
      </button>
    </div>
  );
}
