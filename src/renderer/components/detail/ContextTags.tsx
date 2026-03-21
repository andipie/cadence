import React, { useState } from 'react';
import type { Context } from '@shared/types';
import { useTranslation } from '../../hooks/useTranslation';

interface ContextTagsProps {
  topicContexts: string[];
  allContexts: Context[];
  onUpdate: (contexts: string[]) => void;
}

export default function ContextTags({
  topicContexts,
  allContexts,
  onUpdate,
}: ContextTagsProps): React.ReactElement {
  const t = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [inboxWarning, setInboxWarning] = useState(false);

  // Get context names for display
  const contextMap = new Map(allContexts.map((c) => [c.id, c.name]));

  // Available contexts not yet assigned
  const availableContexts = allContexts.filter((c) => !topicContexts.includes(c.id));

  function handleRemove(contextId: string): void {
    const updated = topicContexts.filter((id) => id !== contextId);

    if (updated.length === 0) {
      setInboxWarning(true);
      setTimeout(() => setInboxWarning(false), 3000);
    }

    onUpdate(updated);
  }

  function handleAdd(contextId: string): void {
    onUpdate([...topicContexts, contextId]);
    setShowDropdown(false);
    setInboxWarning(false);
  }

  return (
    <div>
      <label className="text-sm text-text-secondary dark:text-text-secondary-dark block mb-1">
        {t.contextTags.label}
      </label>

      <div className="flex flex-wrap gap-1.5">
        {topicContexts.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent dark:text-accent-dark text-xs font-medium"
          >
            {contextMap.get(id) ?? id}
            <button
              type="button"
              className="hover:text-danger dark:hover:text-danger-dark"
              onClick={() => handleRemove(id)}
              title="Entfernen"
            >
              ×
            </button>
          </span>
        ))}

        {/* Add button */}
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center px-2 py-0.5 rounded-full border border-dashed border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark text-xs hover:border-accent dark:hover:border-accent-dark hover:text-accent dark:hover:text-accent-dark"
            onClick={() => setShowDropdown(!showDropdown)}
            title={t.contextTags.addTooltip}
          >
            +
          </button>

          {showDropdown && availableContexts.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded shadow-lg py-1 min-w-[160px] max-h-[200px] overflow-y-auto">
              {availableContexts.map((ctx) => (
                <button
                  key={ctx.id}
                  type="button"
                  className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark"
                  onClick={() => handleAdd(ctx.id)}
                >
                  {ctx.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inbox warning */}
      {inboxWarning && (
        <p className="text-xs text-warning dark:text-warning-dark mt-1">
          {t.contextTags.inboxWarning}
        </p>
      )}
    </div>
  );
}
