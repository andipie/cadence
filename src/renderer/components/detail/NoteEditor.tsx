import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface NoteEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  topicSlug?: string;
}

export default function NoteEditor({
  content,
  onSave,
  onCancel,
  autoFocus = false,
  topicSlug,
}: NoteEditorProps): React.ReactElement {
  const t = useTranslation();
  const [value, setValue] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  function handleBlur(): void {
    const trimmed = value.trim();
    if (trimmed !== content.trim()) {
      onSave(trimmed);
    } else if (onCancel && trimmed === '') {
      onCancel();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    // Escape → cancel editing
    if (e.key === 'Escape') {
      e.preventDefault();
      setValue(content);
      if (onCancel) {
        onCancel();
      }
      textareaRef.current?.blur();
    }
  }

  async function handlePaste(e: React.ClipboardEvent): Promise<void> {
    if (!topicSlug) return;

    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        try {
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          const relativePath = await window.api.attachments.save(topicSlug, base64, item.type);
          const markdownRef = `![${t.notes.imageAlt}](${relativePath})`;

          // Insert at cursor position
          const textarea = textareaRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const before = value.substring(0, start);
            const after = value.substring(end);
            const newValue = before + markdownRef + after;
            setValue(newValue);
          } else {
            setValue((prev) => prev + '\n' + markdownRef);
          }
        } catch (err) {
          console.error('[NoteEditor] Failed to save image:', err);
        }
        return; // Only handle the first image
      }
    }
    // If no image found, let default paste behavior handle text
  }

  return (
    <textarea
      ref={textareaRef}
      className="w-full bg-surface-secondary dark:bg-surface-secondary-dark text-text-primary dark:text-text-primary-dark text-sm font-mono rounded border border-border dark:border-border-dark p-2 resize-none focus:outline-none focus:ring-1 focus:ring-accent dark:focus:ring-accent-dark"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={t.notes.placeholder}
      style={{ minHeight: '80px' }}
    />
  );
}
