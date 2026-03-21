import React, { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Context, ContextGroup } from '@shared/types';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';

interface ContextItemProps {
  context: Context;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  availableGroups?: ContextGroup[];
  currentGroupId?: string | null;
  onMoveToGroup?: (contextId: string, groupId: string | null) => void;
}

export default function ContextItem({
  context,
  isActive,
  onSelect,
  onRename,
  onDelete,
  availableGroups = [],
  currentGroupId = null,
  onMoveToGroup,
}: ContextItemProps): React.ReactElement {
  const t = useTranslation();
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: `ctx::${context.id}` });

  const duplicateTopicToContexts = useAppStore((s) => s.duplicateTopicToContexts);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(context.name);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [isTopicDragOver, setIsTopicDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close context menu on click outside
  useEffect(() => {
    if (menuPos === null) return;

    function handleClickOutside(): void {
      setMenuPos(null);
      setShowMoveMenu(false);
    }

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setMenuPos(null);
        setShowMoveMenu(false);
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
    setShowMoveMenu(false);
  }

  function handleRenameStart(): void {
    setEditValue(context.name);
    setIsEditing(true);
    setMenuPos(null);
  }

  function handleRenameConfirm(): void {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== context.name) {
      onRename(context.id, trimmed);
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
    onDelete(context.id);
  }

  function handleMoveToGroup(groupId: string | null): void {
    setMenuPos(null);
    setShowMoveMenu(false);
    onMoveToGroup?.(context.id, groupId);
  }

  // Groups available to move to (exclude current group)
  const moveTargets = availableGroups.filter((g) => g.id !== currentGroupId);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleRenameConfirm}
        onKeyDown={handleRenameKeyDown}
        className="w-full px-3 py-2 rounded border border-accent dark:border-accent-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark"
      />
    );
  }

  return (
    <>
      <button
        ref={setDragRef}
        type="button"
        className={`w-full px-3 py-2 rounded cursor-pointer flex items-center justify-between text-left text-sm transition-colors ${
          isTopicDragOver
            ? 'bg-accent/15 ring-1 ring-accent dark:ring-accent-dark'
            : isActive
              ? 'bg-accent/10 text-accent dark:text-accent-dark font-medium'
              : 'hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark'
        }`}
        style={{ opacity: isDragging ? 0.4 : undefined }}
        onClick={() => onSelect(context.id)}
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
          if (topicId) {
            e.preventDefault();
            duplicateTopicToContexts(topicId, [context.id]);
          }
        }}
        title={context.name}
        {...dragAttributes}
        {...dragListeners}
      >
        <span className="truncate">{context.name}</span>
        {(context.topicCount ?? 0) > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-hover dark:bg-surface-hover-dark text-text-secondary dark:text-text-secondary-dark font-medium flex-shrink-0 ml-2">
            {context.topicCount}
          </span>
        )}
      </button>

      {/* Context menu */}
      {menuPos !== null && (
        <div
          className="fixed z-50 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded shadow-lg py-1 min-w-[160px]"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <button
            type="button"
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark"
            onClick={handleRenameStart}
            title={t.contextMenu.rename}
          >
            {t.contextMenu.renameAction}
          </button>

          {/* Move to group sub-menu */}
          {onMoveToGroup && (moveTargets.length > 0 || currentGroupId !== null) && (
            <div className="relative">
              <button
                type="button"
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark flex items-center justify-between"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveMenu(!showMoveMenu);
                }}
                title={t.contextMenu.moveToGroup}
              >
                <span>{t.contextMenu.moveToGroupAction}</span>
                <span className="text-[10px] ml-2">▶</span>
              </button>

              {showMoveMenu && (
                <div
                  className="absolute left-full top-0 ml-1 z-50 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded shadow-lg py-1 min-w-[140px]"
                >
                  {moveTargets.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark"
                      onClick={() => handleMoveToGroup(g.id)}
                    >
                      {g.name}
                    </button>
                  ))}
                  {currentGroupId !== null && (
                    <button
                      type="button"
                      className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-secondary dark:text-text-secondary-dark italic"
                      onClick={() => handleMoveToGroup(null)}
                    >
                      {t.contextMenu.noGroup}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-danger dark:text-danger-dark"
            onClick={handleDeleteClick}
            title={t.contextMenu.delete}
          >
            {t.contextMenu.deleteAction}
          </button>
        </div>
      )}
    </>
  );
}
