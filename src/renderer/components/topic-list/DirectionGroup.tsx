import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Topic } from '@shared/types';
import TopicRow from './TopicRow';

interface DirectionGroupProps {
  label: string;
  topics: Topic[];
  selectedTopicId: string | null;
  onSelectTopic: (id: string) => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Force the group to expand regardless of collapsed state */
  forceExpand?: boolean;
  limit?: number;
  multiSelectMode?: boolean;
  selectedTopicIds?: string[];
  onToggleCheck?: (id: string) => void;
  sortable?: boolean;
}

function DirectionGroupInner({
  label,
  topics,
  selectedTopicId,
  onSelectTopic,
  collapsible = false,
  defaultCollapsed = false,
  forceExpand = false,
  limit,
  multiSelectMode = false,
  selectedTopicIds = [],
  onToggleCheck,
  sortable = false,
}: DirectionGroupProps): React.ReactElement | null {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // When forceExpand becomes true, auto-expand the group
  React.useEffect(() => {
    if (forceExpand && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [forceExpand]); // eslint-disable-line react-hooks/exhaustive-deps
  const [showAll, setShowAll] = useState(false);

  // Don't render empty non-collapsible groups
  if (topics.length === 0 && !collapsible) {
    return null;
  }

  const visibleTopics = (!showAll && limit && topics.length > limit)
    ? topics.slice(0, limit)
    : topics;

  const hasMore = limit !== undefined && topics.length > limit && !showAll;

  const topicIds = visibleTopics.map((t) => t.id);

  return (
    <section>
      <h3
        className={`px-3 py-1 text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide flex items-center gap-1 ${
          collapsible ? 'cursor-pointer select-none' : ''
        }`}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        title={collapsible ? (isCollapsed ? 'Aufklappen' : 'Zuklappen') : undefined}
      >
        {collapsible && (
          <span className="text-[10px]">{isCollapsed ? '▶' : '▼'}</span>
        )}
        <span>{label}</span>
        <span className="font-normal">({topics.length})</span>
      </h3>

      {!isCollapsed && (
        <SortableContext items={topicIds} strategy={verticalListSortingStrategy} disabled={!sortable || multiSelectMode}>
          <div>
            {visibleTopics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                isSelected={selectedTopicId === topic.id}
                onSelect={onSelectTopic}
                multiSelectMode={multiSelectMode}
                isChecked={selectedTopicIds.includes(topic.id)}
                onToggleCheck={onToggleCheck}
                sortable={sortable && !multiSelectMode}
              />
            ))}

            {hasMore && (
              <button
                type="button"
                className="w-full px-3 py-1.5 text-xs text-accent dark:text-accent-dark hover:underline text-left"
                onClick={() => setShowAll(true)}
                title="Alle Themen anzeigen"
              >
                Mehr anzeigen ({topics.length - (limit ?? 0)} weitere)
              </button>
            )}
          </div>
        </SortableContext>
      )}
    </section>
  );
}

const DirectionGroup = React.memo(DirectionGroupInner);
export default DirectionGroup;
