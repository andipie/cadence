import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface ContextFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
  initialValue?: string;
  placeholder?: string;
}

export default function ContextForm({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder,
}: ContextFormProps): React.ReactElement {
  const t = useTranslation();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (initialValue) {
        inputRef.current.select();
      }
    }
  }, [initialValue]);

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      const trimmed = value.trim();
      if (trimmed) {
        onSubmit(trimmed);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }

  function handleBlur(): void {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    } else {
      onCancel();
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder ?? t.nav.contextPlaceholder}
      className="w-full px-3 py-2 rounded border border-accent dark:border-accent-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
    />
  );
}
