import React, { useEffect, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import type { ContextGroup } from '@shared/types';
import SystemViews from './SystemViews';
import SavedViews from './SavedViews';
import ContextGroupSection from './ContextGroupSection';
import ContextItem from './ContextItem';
import ContextForm from './ContextForm';

// Sortable wrapper for group sections
function SortableGroupSection({
  group,
  ...props
}: {
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
}): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group::${group.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ContextGroupSection group={group} {...props} />
    </div>
  );
}

// Droppable zone for ungrouped contexts
function UngroupedDropZone({
  ungroupedContexts,
  activeContextId,
  groups,
  onSelectContext,
  onRenameContext,
  onDeleteContext,
  onMoveContextToGroup,
}: {
  ungroupedContexts: import('@shared/types').Context[];
  activeContextId: string | null;
  groups: import('@shared/types').ContextGroup[];
  onSelectContext: (id: string) => void;
  onRenameContext: (id: string, newName: string) => void;
  onDeleteContext: (id: string) => void;
  onMoveContextToGroup: (contextId: string, groupId: string | null) => void;
}): React.ReactElement | null {
  const t = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: 'drop::ungrouped' });

  // Always render the drop zone (so contexts can be dropped here even if empty)
  return (
    <div
      ref={setNodeRef}
      className={`rounded transition-colors ${isOver ? 'bg-accent/10 ring-1 ring-accent dark:ring-accent-dark' : ''}`}
    >
      {ungroupedContexts.length > 0 && (
        <>
          <div className="px-3 py-1 text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide">
            {t.nav.ungrouped}
          </div>
          {ungroupedContexts.map((ctx) => (
            <ContextItem
              key={ctx.id}
              context={ctx}
              isActive={activeContextId === ctx.id}
              onSelect={onSelectContext}
              onRename={onRenameContext}
              onDelete={onDeleteContext}
              availableGroups={groups}
              currentGroupId={null}
              onMoveToGroup={onMoveContextToGroup}
            />
          ))}
        </>
      )}
      {ungroupedContexts.length === 0 && isOver && (
        <div className="px-3 py-2 text-xs text-text-secondary dark:text-text-secondary-dark italic">
          {t.nav.dropUngrouped}
        </div>
      )}
    </div>
  );
}

export default function ContextNav(): React.ReactElement {
  const t = useTranslation();
  const {
    activeView,
    activeContextId,
    groups,
    ungroupedContexts,
    systemCounts,
    setActiveView,
    setActiveContext,
    loadGroups,
    loadSystemCounts,
    loadSavedViews,
    createContext,
    updateContext,
    deleteContext,
    createGroup,
    renameGroup,
    deleteGroup,
    moveContextToGroup,
    reorderGroups,
  } = useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Load data on mount
  useEffect(() => {
    loadGroups();
    loadSystemCounts();
    loadSavedViews();
  }, [loadGroups, loadSystemCounts, loadSavedViews]);

  function handleSelectView(view: 'inbox' | 'overdue' | 'deliver'): void {
    setActiveView(view);
  }

  function handleSelectContext(id: string): void {
    setActiveContext(id);
  }

  async function handleCreateContext(name: string): Promise<void> {
    await createContext({ name, type: 'other' });
    setIsCreating(false);
  }

  async function handleCreateContextInGroup(groupId: string, name: string): Promise<void> {
    await createContext({ name, type: 'other', group: groupId });
  }

  async function handleRenameContext(id: string, newName: string): Promise<void> {
    await updateContext(id, { name: newName });
  }

  async function handleDeleteContext(id: string): Promise<void> {
    await deleteContext(id);
  }

  async function handleCreateGroup(name: string): Promise<void> {
    await createGroup(name);
    setIsCreatingGroup(false);
  }

  async function handleRenameGroup(id: string, newName: string): Promise<void> {
    await renameGroup(id, newName);
  }

  async function handleDeleteGroup(id: string): Promise<void> {
    await deleteGroup(id);
  }

  async function handleMoveContextToGroup(contextId: string, groupId: string | null): Promise<void> {
    await moveContextToGroup(contextId, groupId);
  }

  function handleDragStart(event: DragStartEvent): void {
    setActiveDragId(String(event.active.id));
  }

  // Find the group a context belongs to (null = ungrouped)
  function findGroupForContext(contextId: string): string | null {
    for (const g of groups) {
      if (g.contexts.some((c) => c.id === contextId)) {
        return g.id;
      }
    }
    return null;
  }

  // Get context by id from groups or ungrouped
  function findContext(contextId: string): { name: string } | undefined {
    for (const g of groups) {
      const found = g.contexts.find((c) => c.id === contextId);
      if (found) return found;
    }
    return ungroupedContexts.find((c) => c.id === contextId);
  }

  // Handle drag end — reorder groups OR move contexts
  function handleDragEnd(event: DragEndEvent): void {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Group reordering
    if (activeId.startsWith('group::') && overId.startsWith('group::')) {
      const activeGroupId = activeId.replace('group::', '');
      const overGroupId = overId.replace('group::', '');

      const groupIds = groups.map((g) => g.id);
      const activeIndex = groupIds.indexOf(activeGroupId);
      const overIndex = groupIds.indexOf(overGroupId);

      if (activeIndex !== -1 && overIndex !== -1) {
        const reordered = arrayMove(groupIds, activeIndex, overIndex);
        reorderGroups(reordered);
      }
      return;
    }

    // Context moving between groups
    if (activeId.startsWith('ctx::')) {
      const contextId = activeId.replace('ctx::', '');
      let targetGroupId: string | null = null;

      if (overId === 'drop::ungrouped') {
        targetGroupId = null;
      } else if (overId.startsWith('group::')) {
        targetGroupId = overId.replace('group::', '');
      } else if (overId.startsWith('ctx::')) {
        // Drop on another context → move to that context's group
        const overContextId = overId.replace('ctx::', '');
        targetGroupId = findGroupForContext(overContextId);
      } else {
        return;
      }

      const currentGroupId = findGroupForContext(contextId);
      if (targetGroupId !== currentGroupId) {
        moveContextToGroup(contextId, targetGroupId);
      }
    }
  }

  const groupDndIds = groups.map((g) => `group::${g.id}`);

  return (
    <nav className="flex-1 p-2 space-y-1 flex flex-col">
      {/* System Views */}
      <SystemViews
        inboxCount={systemCounts.inbox}
        overdueCount={systemCounts.overdue}
        liefernCount={systemCounts.deliver}
        activeView={activeView}
        onSelectView={handleSelectView}
      />

      <hr className="my-2 border-border dark:border-border-dark" />

      {/* Free View */}
      <button
        type="button"
        className={`w-full px-3 py-2 rounded cursor-pointer text-left ${
          activeView === 'free-view'
            ? 'bg-accent/10 text-accent dark:text-accent-dark font-medium'
            : 'hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-primary dark:text-text-primary-dark'
        }`}
        onClick={() => setActiveView('free-view')}
        title={t.nav.freeViewTooltip}
      >
        {t.nav.freeView}
      </button>

      {/* Saved Views */}
      <SavedViews />

      <hr className="my-2 border-border dark:border-border-dark" />

      {/* Groups with contexts — sortable */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={groupDndIds} strategy={verticalListSortingStrategy}>
            {groups.map((group) => (
              <SortableGroupSection
                key={group.id}
                group={group}
                activeContextId={activeContextId}
                availableGroups={groups}
                onSelectContext={handleSelectContext}
                onRenameContext={handleRenameContext}
                onDeleteContext={handleDeleteContext}
                onRenameGroup={handleRenameGroup}
                onDeleteGroup={handleDeleteGroup}
                onMoveContextToGroup={handleMoveContextToGroup}
                onCreateContextInGroup={handleCreateContextInGroup}
              />
            ))}
          </SortableContext>

          {/* Ungrouped contexts — droppable target */}
          <UngroupedDropZone
            ungroupedContexts={ungroupedContexts}
            activeContextId={activeContextId}
            groups={groups}
            onSelectContext={handleSelectContext}
            onRenameContext={handleRenameContext}
            onDeleteContext={handleDeleteContext}
            onMoveContextToGroup={handleMoveContextToGroup}
          />

          {/* Drag overlay — floating preview of dragged context */}
          <DragOverlay>
            {activeDragId?.startsWith('ctx::') ? (
              <div className="px-3 py-2 rounded bg-surface dark:bg-surface-dark border border-accent dark:border-accent-dark shadow-lg text-sm text-text-primary dark:text-text-primary-dark">
                {findContext(activeDragId.replace('ctx::', ''))?.name ?? ''}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <hr className="my-2 border-border dark:border-border-dark" />

      {/* Create group */}
      {isCreatingGroup ? (
        <ContextForm
          onSubmit={handleCreateGroup}
          onCancel={() => setIsCreatingGroup(false)}
          placeholder={t.nav.newGroupPlaceholder}
        />
      ) : (
        <button
          type="button"
          className="w-full px-3 py-1.5 rounded cursor-pointer hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-text-secondary dark:text-text-secondary-dark text-xs text-left"
          onClick={() => setIsCreatingGroup(true)}
          title={t.nav.newGroup}
        >
          {t.nav.newGroup}
        </button>
      )}

      {/* Create context */}
      {isCreating ? (
        <ContextForm
          onSubmit={handleCreateContext}
          onCancel={() => setIsCreating(false)}
          placeholder={t.nav.contextPlaceholder}
        />
      ) : (
        <button
          type="button"
          className="w-full px-3 py-2 rounded cursor-pointer hover:bg-surface-hover dark:hover:bg-surface-hover-dark text-accent dark:text-accent-dark text-sm text-left"
          onClick={() => setIsCreating(true)}
          title={t.nav.newContext}
        >
          {t.nav.newContext}
        </button>
      )}
    </nav>
  );
}
