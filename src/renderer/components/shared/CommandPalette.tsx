import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SearchResult } from '../../../shared/types';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';

export default function CommandPalette(): React.ReactElement {
  const closeCommandPalette = useAppStore((s) => s.closeCommandPalette);
  const setActiveContext = useAppStore((s) => s.setActiveContext);
  const selectTopic = useAppStore((s) => s.selectTopic);
  const t = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autofocus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults = await window.api.search.global(trimmed);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, results.length]);

  // Navigate to a search result
  const handleSelect = useCallback((result: SearchResult) => {
    closeCommandPalette();

    if (result.type === 'context') {
      setActiveContext(result.id);
    } else {
      // Topic: navigate to its first context, then select it
      const firstContext = result.contexts[0];
      if (firstContext) {
        setActiveContext(firstContext.id);
      }
      // Select the topic (detail panel loads independently)
      setTimeout(() => {
        selectTopic(result.id);
      }, 50);
    }
  }, [closeCommandPalette, setActiveContext, selectTopic]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCommandPalette();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
      return;
    }
  }

  // Backdrop click
  function handleBackdropClick(e: React.MouseEvent): void {
    if (e.target === e.currentTarget) {
      closeCommandPalette();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="w-[560px] max-h-[400px] flex flex-col bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border dark:border-border-dark">
          {/* Search icon */}
          <svg className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.commandPalette.placeholder}
            className="flex-1 bg-transparent text-sm text-text-primary dark:text-text-primary-dark placeholder-text-secondary dark:placeholder-text-secondary-dark focus:outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-accent dark:border-accent-dark border-t-transparent rounded-full animate-spin" />
          )}
          <kbd className="text-xs px-1.5 py-0.5 rounded bg-surface-secondary dark:bg-surface-secondary-dark border border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark font-mono">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {/* Empty state: no query */}
          {!query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
              {t.commandPalette.placeholder}
            </div>
          )}

          {/* Empty state: no results */}
          {query.trim() && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
              {t.commandPalette.noResults(query.trim())}
            </div>
          )}

          {/* Result items */}
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors
                ${index === selectedIndex
                  ? 'bg-accent/10 dark:bg-accent-dark/10'
                  : 'hover:bg-surface-hover dark:hover:bg-surface-hover-dark'
                }`}
            >
              {/* Type icon */}
              <div className="mt-0.5 flex-shrink-0">
                {result.type === 'context' ? (
                  <svg className="w-4 h-4 text-text-secondary dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-text-secondary dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark truncate">
                    {result.title}
                  </span>

                  {/* Topic badges */}
                  {result.type === 'topic' && result.priority === 'high' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-danger/10 text-danger dark:text-danger-dark font-medium flex-shrink-0">
                      {t.priority[result.priority]}
                    </span>
                  )}
                  {result.type === 'topic' && result.status && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-secondary dark:bg-surface-secondary-dark text-text-secondary dark:text-text-secondary-dark flex-shrink-0">
                      {t.status[result.status] ?? result.status}
                    </span>
                  )}

                  {/* Context type label */}
                  {result.type === 'context' && result.contextType && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-secondary dark:bg-surface-secondary-dark text-text-secondary dark:text-text-secondary-dark flex-shrink-0">
                      {t.contextType[result.contextType] ?? result.contextType}
                    </span>
                  )}
                </div>

                {/* Snippet for topics */}
                {result.type === 'topic' && result.snippet && (
                  <p
                    className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary-dark truncate"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}

                {/* Context pills for topics */}
                {result.type === 'topic' && result.contexts.length > 0 && (
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {result.contexts.map((ctx) => (
                      <span
                        key={ctx.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent dark:text-accent-dark"
                      >
                        {ctx.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation hint for selected item */}
              {index === selectedIndex && (
                <kbd className="self-center text-[10px] px-1 py-0.5 rounded bg-surface-secondary dark:bg-surface-secondary-dark border border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark font-mono flex-shrink-0">
                  ↵
                </kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
