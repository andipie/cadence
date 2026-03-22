import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import { groupTopicsByDirection, groupTopics, groupTopicsByDueProximity } from '@shared/utils';
import DirectionGroup from './DirectionGroup';
import FilterBar from './FilterBar';
import DeliverFilterBar from './DeliverFilterBar';
import BulkToolbar from './BulkToolbar';
export default function TopicListPanel(): React.ReactElement {
  const {
    activeView,
    activeContextId,
    topics,
    topicsLoading,
    contexts,
    selectedTopicId,
    selectTopic,
    loadTopics,
    createTopic,
    createTopicInInbox,
    quickAddFocusKey,
    quickAddInboxMode,
    resetQuickAddInbox,
    freeViewFilter,
    generateAgenda,
    multiSelectMode,
    selectedTopicIds,
    toggleMultiSelect,
    toggleTopicSelection,
    reorderTopics,
    setVisualTopicOrder,
  } = useAppStore();

  const t = useTranslation();
  const [quickAddValue, setQuickAddValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isFreeView = activeView === 'free-view';
  const isDndEnabled = activeView === 'context' && !multiSelectMode;

  // DnD sensors — require 5px movement to start drag (prevents accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Reload topics when file changes are detected (debounced to prevent rapid reloads)
  const fileChangeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableLoadTopics = useCallback(() => loadTopics(), [loadTopics]);

  useEffect(() => {
    const handleFileChanged = (): void => {
      if (fileChangeDebounceRef.current) clearTimeout(fileChangeDebounceRef.current);
      fileChangeDebounceRef.current = setTimeout(stableLoadTopics, 300);
    };

    const cleanup = window.api.on.fileChanged(handleFileChanged);
    return () => {
      cleanup();
      if (fileChangeDebounceRef.current) clearTimeout(fileChangeDebounceRef.current);
    };
  }, [stableLoadTopics]);

  // Focus quick-add input when triggered via keyboard shortcut
  useEffect(() => {
    if (quickAddFocusKey > 0 && inputRef.current && !isFreeView) {
      inputRef.current.focus();
    }
  }, [quickAddFocusKey, isFreeView]);

  // Determine header title
  let headerTitle = '';
  if (activeView === 'context' && activeContextId) {
    const ctx = contexts.find((c) => c.id === activeContextId);
    headerTitle = ctx?.name ?? activeContextId;
  } else if (activeView === 'inbox') {
    headerTitle = t.nav.inbox;
  } else if (activeView === 'overdue') {
    headerTitle = t.nav.overdue;
  } else if (activeView === 'deliver') {
    headerTitle = t.nav.deliver;
  } else if (isFreeView) {
    headerTitle = t.nav.freeView;
  }

  async function handleQuickAddKeyDown(e: React.KeyboardEvent): Promise<void> {
    if (e.key === 'Enter') {
      const trimmed = quickAddValue.trim();
      if (!trimmed) return;

      if (quickAddInboxMode) {
        await createTopicInInbox(trimmed);
        resetQuickAddInbox();
      } else {
        await createTopic(trimmed);
      }
      setQuickAddValue('');
    } else if (e.key === 'Escape') {
      setQuickAddValue('');
      resetQuickAddInbox();
      inputRef.current?.blur();
    }
  }

  const placeholder = quickAddInboxMode
    ? t.topicList.newTopicInboxPlaceholder
    : t.topicList.newTopicPlaceholder;

  // Memoize grouping to avoid recomputing on every render (e.g. selection changes)
  // Must be before early returns to satisfy Rules of Hooks
  const topicGroups = useMemo(() => {
    if (isFreeView) {
      return groupTopics(topics, freeViewFilter.groupBy, contexts, t);
    }
    if (activeView === 'deliver') {
      return groupTopicsByDueProximity(topics, t);
    }
    return groupTopicsByDirection(topics, t).map((g) => ({ key: g.direction, label: g.label, topics: g.topics }));
  }, [topics, isFreeView, activeView, freeViewFilter.groupBy, contexts, t]);

  const { openCount, totalCount, hasOpenTopics, doneGroup, mainGroups } = useMemo(() => {
    const _openCount = topics.filter((t) => t.status !== 'done').length;
    const _totalCount = topics.length;
    const isDeliver = activeView === 'deliver';
    const _hasOpenTopics = isFreeView || isDeliver
      ? _totalCount > 0
      : topicGroups.slice(0, 3).some((g) => g.topics.length > 0);
    const _doneGroup = !isFreeView && !isDeliver && topicGroups.length >= 4 ? topicGroups[3] : null;
    const _mainGroups = !isFreeView && !isDeliver ? topicGroups.slice(0, 3) : topicGroups;
    return {
      openCount: _openCount,
      totalCount: _totalCount,
      hasOpenTopics: _hasOpenTopics,
      doneGroup: _doneGroup,
      mainGroups: _mainGroups,
    };
  }, [topics, isFreeView, topicGroups]);

  // Sync visual topic order to store for keyboard navigation
  useEffect(() => {
    const ids: string[] = [];
    for (const group of mainGroups) {
      for (const topic of group.topics) {
        ids.push(topic.id);
      }
    }
    if (doneGroup) {
      for (const topic of doneGroup.topics) {
        ids.push(topic.id);
      }
    }
    setVisualTopicOrder(ids);
  }, [mainGroups, doneGroup, setVisualTopicOrder]);

  // No context/view selected — early return after all hooks
  if (activeView === 'context' && !activeContextId) {
    return (
      <main className="flex-1 flex flex-col overflow-hidden border-r border-border dark:border-border-dark">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-lg text-text-secondary dark:text-text-secondary-dark">
              {t.topicList.selectContext}
            </p>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
              {t.topicList.selectContextHint}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Handle drag end — find which group the item belongs to and reorder within it
  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find the group containing the dragged item
    for (const group of mainGroups) {
      const activeIndex = group.topics.findIndex((t) => t.id === active.id);
      const overIndex = group.topics.findIndex((t) => t.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        // Both items in the same group — reorder
        const reordered = arrayMove(group.topics, activeIndex, overIndex);
        const ids = reordered.map((t) => t.id);
        reorderTopics(ids, group.key);
        break;
      }
    }
  }

  const topicListContent = (
    <>
      {topicsLoading ? (
        <div className="flex items-center justify-center p-8">
          <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
            {t.topicList.loading}
          </span>
        </div>
      ) : !hasOpenTopics ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-text-secondary dark:text-text-secondary-dark">
              {isFreeView
                ? t.topicList.noTopics
                : activeView === 'inbox'
                  ? t.topicList.allDone
                  : activeView === 'overdue'
                    ? t.topicList.noOverdue
                    : activeView === 'deliver'
                      ? t.topicList.nothingToDeliver
                      : t.topicList.noOpenTopics}
            </p>
            {isFreeView && (
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
                {t.topicList.tryOtherFilters}
              </p>
            )}
            {!isFreeView && doneGroup && doneGroup.topics.length > 0 && (
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
                {t.topicList.completedExists(doneGroup.topics.length)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {mainGroups.map((group) => (
            <DirectionGroup
              key={group.key}
              label={group.label}
              topics={group.topics}
              selectedTopicId={selectedTopicId}
              onSelectTopic={selectTopic}
              multiSelectMode={multiSelectMode}
              selectedTopicIds={selectedTopicIds}
              onToggleCheck={toggleTopicSelection}
              sortable={isDndEnabled}
            />
          ))}
        </>
      )}

      {/* Erledigt — show for non-free-view except overdue, collapsible */}
      {!isFreeView && activeView !== 'overdue' && activeView !== 'deliver' && doneGroup && (
        <DirectionGroup
          label={doneGroup.label}
          topics={doneGroup.topics}
          selectedTopicId={selectedTopicId}
          onSelectTopic={selectTopic}
          collapsible
          defaultCollapsed
          forceExpand={
            doneGroup.topics.length > 0 &&
            selectedTopicIds.length > 0 &&
            doneGroup.topics.some((t) => selectedTopicIds.includes(t.id))
          }
          limit={20}
          multiSelectMode={multiSelectMode}
          selectedTopicIds={selectedTopicIds}
          onToggleCheck={toggleTopicSelection}
        />
      )}
    </>
  );

  return (
    <main className="flex-1 flex flex-col overflow-hidden border-r border-border dark:border-border-dark">
      {/* Header */}
      <header className="p-4 border-b border-border dark:border-border-dark flex items-center justify-between">
        <h2 className="font-semibold text-lg text-text-primary dark:text-text-primary-dark">
          {headerTitle}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
            {isFreeView
              ? t.topicList.resultsCount(totalCount)
              : t.topicList.openCount(openCount)}
          </span>
          {/* Multi-Select toggle */}
          <button
            type="button"
            onClick={toggleMultiSelect}
            className={`p-1.5 rounded transition-colors ${
              multiSelectMode
                ? 'bg-accent/10 text-accent dark:text-accent-dark'
                : 'text-text-secondary dark:text-text-secondary-dark hover:bg-surface-hover dark:hover:bg-surface-hover-dark'
            }`}
            title={multiSelectMode ? t.topicList.multiSelectEnd : t.topicList.multiSelect}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </button>

          {activeView === 'context' && activeContextId && (
            <button
              type="button"
              className="px-2.5 py-1 rounded text-xs font-medium border border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:border-accent dark:hover:border-accent-dark hover:text-accent dark:hover:text-accent-dark transition-colors"
              onClick={generateAgenda}
              title={t.topicList.agendaTooltip}
            >
              {t.topicList.agenda}
            </button>
          )}
        </div>
      </header>

      {/* Filter bar (free view only) */}
      {isFreeView && <FilterBar />}

      {/* Liefern filter bar */}
      {activeView === 'deliver' && <DeliverFilterBar />}

      {/* Topic list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {isDndEnabled ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                {topicListContent}
              </DndContext>
            ) : (
              topicListContent
            )}
          </div>

          {/* Bulk toolbar (when topics are selected) */}
          {multiSelectMode && <BulkToolbar />}

          {/* Quick-Add Footer (not in free view, not in multi-select) */}
          {!isFreeView && !multiSelectMode && (
            <div className="p-3 border-t border-border dark:border-border-dark">
              <input
                ref={inputRef}
                type="text"
                value={quickAddValue}
                onChange={(e) => setQuickAddValue(e.target.value)}
                onKeyDown={handleQuickAddKeyDown}
                placeholder={placeholder}
                title={t.topicList.newTopicQuick}
                className={`w-full px-3 py-2 rounded border bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark placeholder-text-secondary dark:placeholder-text-secondary-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent-dark ${
                  quickAddInboxMode
                    ? 'border-accent dark:border-accent-dark'
                    : 'border-border dark:border-border-dark'
                }`}
              />
            </div>
          )}
    </main>
  );
}
