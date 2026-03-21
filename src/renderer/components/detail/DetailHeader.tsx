import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface DetailHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
}

export default function DetailHeader({
  title,
  onTitleChange,
}: DetailHeaderProps): React.ReactElement {
  const t = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleConfirm(): void {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      setEditValue(title);
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleConfirm}
        onKeyDown={handleKeyDown}
        className="w-full px-1 py-0.5 text-lg font-semibold rounded border border-accent dark:border-accent-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
      />
    );
  }

  return (
    <h2
      className="text-lg font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer hover:bg-surface-hover dark:hover:bg-surface-hover-dark rounded px-1 py-0.5"
      onClick={() => setIsEditing(true)}
      title={t.detail.editHint}
    >
      {title}
    </h2>
  );
}
