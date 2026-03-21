import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Context } from '../../../shared/types';
import { useTranslation } from '../../hooks/useTranslation';

interface ContextOption {
  id: string;
  name: string;
}

export default function QuickCapture(): React.ReactElement {
  const t = useTranslation();
  const [title, setTitle] = useState('');
  const [contextQuery, setContextQuery] = useState('');
  const [selectedContext, setSelectedContext] = useState<ContextOption | null>(null);
  const [contexts, setContexts] = useState<ContextOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load contexts on mount
  useEffect(() => {
    async function loadContexts(): Promise<void> {
      try {
        const result = await window.api.groups.list();
        const allContexts: ContextOption[] = [];
        for (const group of result.groups) {
          for (const ctx of group.contexts) {
            allContexts.push({ id: ctx.id, name: ctx.name });
          }
        }
        for (const ctx of result.ungrouped) {
          allContexts.push({ id: ctx.id, name: ctx.name });
        }
        setContexts(allContexts);
      } catch {
        // Silently fail — context typeahead will just be empty
      }
    }
    loadContexts();
  }, []);

  // Listen for capture:show event to reset and focus
  useEffect(() => {
    const cleanup = window.api.on.captureShow(() => {
      setTitle('');
      setContextQuery('');
      setSelectedContext(null);
      setShowDropdown(false);
      setHighlightedIndex(0);
      setSubmitting(false);
      // Re-load contexts in case they changed
      window.api.groups.list().then((result) => {
        const allContexts: ContextOption[] = [];
        for (const group of result.groups) {
          for (const ctx of group.contexts) {
            allContexts.push({ id: ctx.id, name: ctx.name });
          }
        }
        for (const ctx of result.ungrouped) {
          allContexts.push({ id: ctx.id, name: ctx.name });
        }
        setContexts(allContexts);
      }).catch(() => {});
      // Focus title input after a short delay (window needs to be visible first)
      setTimeout(() => {
        titleRef.current?.focus();
      }, 50);
    });
    return cleanup;
  }, []);

  // Filter contexts by query
  const filteredContexts = contextQuery.trim()
    ? contexts.filter((c) =>
        c.name.toLowerCase().includes(contextQuery.toLowerCase())
      )
    : contexts;

  // Submit handler
  const handleSubmit = useCallback(async () => {
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await window.api.topics.create({
        title: trimmed,
        contexts: selectedContext ? [selectedContext.id] : undefined,
      });
      // Clear fields for next use
      setTitle('');
      setContextQuery('');
      setSelectedContext(null);
      setShowDropdown(false);
      // Close window (intercepted by main process → hide)
      window.close();
    } catch {
      // On error, allow retry
      setSubmitting(false);
    }
  }, [title, selectedContext, submitting]);

  // Title input keydown
  function handleTitleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      window.close();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      contextRef.current?.focus();
    }
  }

  // Context input keydown
  function handleContextKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (showDropdown) {
        setShowDropdown(false);
      } else {
        window.close();
      }
      return;
    }

    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      titleRef.current?.focus();
      return;
    }

    if (showDropdown && filteredContexts.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredContexts.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredContexts[highlightedIndex];
        if (selected) {
          setSelectedContext(selected);
          setContextQuery(selected.name);
          setShowDropdown(false);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Context input change
  function handleContextChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value;
    setContextQuery(value);
    setSelectedContext(null);
    setShowDropdown(value.length > 0 || true);
    setHighlightedIndex(0);
  }

  // Select context from dropdown
  function handleSelectContext(ctx: ContextOption): void {
    setSelectedContext(ctx);
    setContextQuery(ctx.name);
    setShowDropdown(false);
    titleRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-screen select-none overflow-hidden">
      {/* Drag handle header */}
      <div
        className="flex items-center px-4 pt-3 pb-1"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide">
          {t.capture.title}
        </span>
      </div>

      {/* Input fields */}
      <div
        className="flex flex-col gap-2 px-4 pb-2 flex-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Title input */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          placeholder={t.capture.topicPlaceholder}
          autoFocus
          className="w-full px-3 py-2 text-sm rounded-md border border-border dark:border-border-dark
                     bg-white dark:bg-gray-800
                     text-text-primary dark:text-text-primary-dark
                     placeholder-text-secondary dark:placeholder-text-secondary-dark
                     focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        />

        {/* Context typeahead */}
        <div className="relative">
          <input
            ref={contextRef}
            type="text"
            value={contextQuery}
            onChange={handleContextChange}
            onKeyDown={handleContextKeyDown}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              // Delay to allow click on dropdown items
              setTimeout(() => setShowDropdown(false), 150);
            }}
            placeholder={t.capture.contextPlaceholder}
            className="w-full px-3 py-2 text-sm rounded-md border border-border dark:border-border-dark
                       bg-white dark:bg-gray-800
                       text-text-primary dark:text-text-primary-dark
                       placeholder-text-secondary dark:placeholder-text-secondary-dark
                       focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
          />

          {/* Selected context indicator */}
          {selectedContext && (
            <button
              onClick={() => {
                setSelectedContext(null);
                setContextQuery('');
                contextRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-secondary-dark
                         hover:text-text-primary dark:hover:text-text-primary-dark text-xs"
              title={t.capture.contextRemove}
            >
              ✕
            </button>
          )}

          {/* Dropdown */}
          {showDropdown && filteredContexts.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 top-full left-0 right-0 mt-1 max-h-32 overflow-y-auto
                         bg-white dark:bg-gray-800 border border-border dark:border-border-dark
                         rounded-md shadow-lg"
            >
              {filteredContexts.map((ctx, index) => (
                <button
                  key={ctx.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectContext(ctx)}
                  className={`w-full text-left px-3 py-1.5 text-sm
                    ${index === highlightedIndex
                      ? 'bg-accent/10 dark:bg-accent-dark/10 text-accent dark:text-accent-dark'
                      : 'text-text-primary dark:text-text-primary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark'
                    }`}
                >
                  {ctx.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="text-[10px] text-text-secondary dark:text-text-secondary-dark text-center">
          {t.capture.hint}
        </div>
      </div>
    </div>
  );
}
