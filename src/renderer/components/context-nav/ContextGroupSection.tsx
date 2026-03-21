import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { ContextGroup } from '@shared/types';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import ContextItem from './ContextItem';
import ContextForm from './ContextForm';

interface ContextGroupSectionProps {
  group: ContextGroup;
  activeContextId: string | null;
  availableGroups: ContextGroup[];
  onSelectContext: (id: string) => void;
  onRenameContext: (id: string, newName: string) => void;
  onDeleteContext: (id: string) => void;
  onRenameGroup: (id: string, newName: string) => void;
  onDeleteGroup: (id: string) => void;
  onMoveContextToGroup: (contextId: string, groupId: string | null) => void;
  onCreateContextInGroup: (groupId: string, name: string) => void;
}

export default function ContextGroupSection({
  group,
  activeContextId,
  availableGroups,
  onSelectContext,
  onRenameContext,
  onDeleteContext,
  onRenameGroup,
  onDeleteGroup,
  onMoveContextToGroup,
  onCreateContextInGroup,
}: ContextGroupSectionProps): React.ReactElement {
  const t = useTranslation();
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `group::${group.id}` });
  const duplicateTopicToContexts = useAppStore((s) => s.duplicateTopicToContexts);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingContext, setIsCreatingContext] = useState(false);
  const [editValue, setEditValue] = useState(group.name);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isTopicDragOver, setIsTopicDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close context menu on click outside or Escape
  useEffect(() => {
    if (menuPos === null) return;

    function handleClickOutside(): void {
      setMenuPos(null);
    }

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setMenuPos(null);
      }
    }

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuPos]);

  function handleContextMenu(e: React.MouseEvent): void {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }

  function handleRenameStart(): void {
    setEditValue(group.name);
    setIsEditing(true);
    setMenuPos(null);
  }

  function handleRenameConfirm(): void {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== group.name) {
      onRenameGroup(group.id, trimmed);
    }
    setIsEditing(false);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      handleRenameConfirm();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }

  function handleDeleteClick(): void {
    setMenuPos(null);
    onDeleteGroup(group.id);
  }

  function handleCreateContextClick(): void {
    setMenuPos(null);
    setIsCreatingContext(true);
    setIsCollapsed(false);
  }

  function handleCreateContextSubmit(name: string): void {
    onCreateContextInGroup(group.id, name);
    setIsCreatingContext(false);
  }

  return (
    <div>
      {/* Group header */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRenameConfirm}
          onKeyDown={handleRenameKeyDown}
          className="w-full px-3 py-1 text-xs font-semibold rounded border border-accent dark:border-accent-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
        />
      ) : (
        <div
          ref={setDropRef}
          className={`px-3 py-1 text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide cursor-pointer select-none flex items-center gap-1 rounded transition-colors ${
            isTopicDragOver
              ? 'bg-accent/20 ring-2 ring-accent dark:ring-accent-dark'
              : isOver ? 'bg-accent/15 ring-1 ring-accent dark:ring-accent-dark' : ''
          }`}
          title={`${group.name} — ${isCollapsed ? '▶' : '▼'}`}
          onClick={() => setIsCollapsed(!isCollapsed)}
          onContextMenu={handleContextMenu}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('application/cadence-topic')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              setIsTopicDragOver(true);
            }
          }}
          onDragLeave={() => setIsTopicDragOver(false)}
          onDrop={(e) => {
            setIsTopicDragOver(false);
            const topicId = e.dataTransfer.getData('application/cadence-topic');
            if (topicId && group.contexts.length > 0) {
              e.preventDefault();
              const contextIds = group.contexts.map((c) => c.id);
              duplicateTopicToContexts(topicId, contextIds);
            }
          }}
        >
          <span className="text-[10px]">{isCollapsed ? '▶' : '▼'}</span>
          <span>{group.name}</span>
          <span className="font-normal">({group.contexts.length})</span>
        </div>
      )}

      {/* Contexts in this group — indented for tree-view style */}
      {!isCollapsed && (
        <div className="pl-3">
          {group.contexts.map((ctx) => (
            <ContextItem
              key={ctx.id}
              context={ctx}
              isActive={activeContextId === ctx.id}
              onSelect={onSelectContext}
              onRename={onRenameContext}
              onDelete={onDeleteContext}
              availableGroups={availableGroups}
              currentGroupId={group.id}
              onMoveToGroup={onMoveContextToGroup}
            />
          ))}
          {isCreatingContext && (
            <ContextForm
              onSubmit={handleCreateContextSubmit}
              onCancel={() => setIsCreatingContext(false)}
              placeholder={t.nav.contextPlaceholder}
            />
          )}
        </div>
      )}

      {/* Group context menu */}
      {menuPos !== null && (
        <div
          className="fixed z-50 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded shadow-lg py-1 min-w-[160px]"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <button
            type="button"
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark"
            onClick={handleRenameStart}
            title={t.contextMenu.groupRename}
          >
            {t.contextMenu.groupRenameAction}
          </button>
          <button
            type="button"
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark"
            onClick={handleCreateContextClick}
            title={t.contextMenu.groupNewContext}
          >
            {t.contextMenu.groupNewContextAction}
          </button>
          <button
            type="button"
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-danger dark:text-danger-dark"
            onClick={handleDeleteClick}
            title={t.contextMenu.groupDelete}
          >
            {t.contextMenu.groupDeleteAction}
          </button>
        </div>
      )}
    </div>
  );
}
