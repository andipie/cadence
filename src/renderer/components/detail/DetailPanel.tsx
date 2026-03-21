import React, { useEffect } from 'react';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import DetailHeader from './DetailHeader';
import MetadataGrid from './MetadataGrid';
import ContextTags from './ContextTags';
import NotesFeed from './NotesFeed';
import ActionFooter from './ActionFooter';

export default function DetailPanel(): React.ReactElement {
  const {
    selectedTopicId,
    selectedTopic,
    selectedTopicLoading,
    contexts,
    updateTopic,
    deleteTopic,
    markCompleteFocusKey,
    followUpFocusKey,
  } = useAppStore();
  const t = useTranslation();

  // Keyboard shortcut effects — must be before early returns (Rules of Hooks)
  // Read fresh state via getState() to avoid stale closure issues
  useEffect(() => {
    if (markCompleteFocusKey > 0) {
      const topic = useAppStore.getState().selectedTopic;
      if (topic && topic.status !== 'erledigt') {
        useAppStore.getState().updateTopic(topic.id, { status: 'erledigt' });
      }
    }
  }, [markCompleteFocusKey]);

  useEffect(() => {
    if (followUpFocusKey > 0) {
      const topic = useAppStore.getState().selectedTopic;
      if (topic && topic.status !== 'erledigt' && topic.status !== 'follow-up') {
        useAppStore.getState().updateTopic(topic.id, { status: 'follow-up', followUpDate: null });
      }
    }
  }, [followUpFocusKey]);

  // No topic selected
  if (!selectedTopicId) {
    return (
      <aside className="w-[380px] flex-shrink-0 flex flex-col overflow-y-auto bg-surface dark:bg-surface-dark">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-lg text-text-secondary dark:text-text-secondary-dark">
              {t.detail.selectTopic}
            </p>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">
              {t.detail.selectTopicHint}
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // Loading
  if (selectedTopicLoading || !selectedTopic) {
    return (
      <aside className="w-[380px] flex-shrink-0 flex flex-col overflow-y-auto bg-surface dark:bg-surface-dark">
        <div className="flex-1 flex items-center justify-center p-8">
          <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
            {t.detail.loading}
          </span>
        </div>
      </aside>
    );
  }

  function handleFieldUpdate(field: string, value: unknown): void {
    if (!selectedTopic) return;
    updateTopic(selectedTopic.id, { [field]: value });
  }

  function handleTitleChange(newTitle: string): void {
    if (!selectedTopic) return;
    updateTopic(selectedTopic.id, { title: newTitle });
  }

  function handleContextsUpdate(newContexts: string[]): void {
    if (!selectedTopic) return;
    updateTopic(selectedTopic.id, { contexts: newContexts });
  }

  function handleMarkComplete(): void {
    if (!selectedTopic) return;
    updateTopic(selectedTopic.id, { status: 'erledigt' });
  }

  function handleFollowUp(): void {
    if (!selectedTopic) return;
    updateTopic(selectedTopic.id, {
      status: 'follow-up',
      followUpDate: null,
    });
  }

  function handleDelete(): void {
    if (!selectedTopic) return;
    deleteTopic(selectedTopic.id);
  }

  return (
    <aside className="w-[380px] flex-shrink-0 flex flex-col overflow-hidden bg-surface dark:bg-surface-dark">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title */}
        <DetailHeader
          title={selectedTopic.title}
          onTitleChange={handleTitleChange}
        />

        {/* Metadata */}
        <MetadataGrid
          topic={selectedTopic}
          onUpdate={handleFieldUpdate}
        />

        {/* Context tags */}
        <ContextTags
          topicContexts={selectedTopic.contexts}
          allContexts={contexts}
          onUpdate={handleContextsUpdate}
        />

        {/* Notes */}
        <div>
          <h3 className="text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide mb-2">
            {t.detail.notes}
          </h3>
          <NotesFeed notes={selectedTopic.notes} topicSlug={selectedTopic.id} />
        </div>
      </div>

      {/* Action footer */}
      <div className="p-4 border-t border-border dark:border-border-dark">
        <ActionFooter
          topic={selectedTopic}
          onMarkComplete={handleMarkComplete}
          onFollowUp={handleFollowUp}
          onDelete={handleDelete}
        />
      </div>
    </aside>
  );
}
