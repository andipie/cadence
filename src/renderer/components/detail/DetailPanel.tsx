import React, { useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/app-store';
import { useTranslation } from '../../hooks/useTranslation';
import DetailHeader from './DetailHeader';
import MetadataGrid from './MetadataGrid';
import ContextTags from './ContextTags';
import NotesFeed from './NotesFeed';
import ActionFooter from './ActionFooter';
import { DETAIL_PANEL_WIDTH } from '@shared/constants';
import type { NoteMode } from '@shared/types';

interface DetailPanelProps {
  width?: number;
}

export default function DetailPanel({ width = DETAIL_PANEL_WIDTH }: DetailPanelProps): React.ReactElement {
  const {
    selectedTopicId,
    selectedTopic,
    selectedTopicLoading,
    contexts,
    updateTopic,
    deleteTopic,
    markCompleteFocusKey,
    followUpFocusKey,
    settings,
    updateSettings,
  } = useAppStore();
  const t = useTranslation();
  const noteMode: NoteMode = settings?.noteMode ?? 'individual';
  const handleNoteModeChange = useCallback((mode: NoteMode) => {
    updateSettings({ noteMode: mode }, { silent: true });
  }, [updateSettings]);

  // Keyboard shortcut effects — must be before early returns (Rules of Hooks)
  // Read fresh state via getState() to avoid stale closure issues
  useEffect(() => {
    if (markCompleteFocusKey > 0) {
      const topic = useAppStore.getState().selectedTopic;
      if (topic && topic.status !== 'done' && topic.status !== 'canceled') {
        useAppStore.getState().updateTopic(topic.id, { status: 'done' });
      }
    }
  }, [markCompleteFocusKey]);

  useEffect(() => {
    if (followUpFocusKey > 0) {
      const topic = useAppStore.getState().selectedTopic;
      if (topic && topic.status !== 'done' && topic.status !== 'canceled' && topic.status !== 'follow-up') {
        useAppStore.getState().updateTopic(topic.id, { status: 'follow-up', followUpDate: null });
      }
    }
  }, [followUpFocusKey]);

  // No topic selected
  if (!selectedTopicId) {
    return (
      <aside className="flex-shrink-0 flex flex-col overflow-y-auto bg-surface dark:bg-surface-dark" style={{ width }}>
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
      <aside className="flex-shrink-0 flex flex-col overflow-y-auto bg-surface dark:bg-surface-dark" style={{ width }}>
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
    updateTopic(selectedTopic.id, { status: 'done' });
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
    <aside className="flex-shrink-0 flex flex-col overflow-hidden bg-surface dark:bg-surface-dark" style={{ width }}>
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide">
              {t.detail.notes}
            </h3>
            <div className="flex gap-0.5 rounded bg-surface-secondary dark:bg-surface-secondary-dark p-0.5">
              <button
                type="button"
                onClick={() => handleNoteModeChange('individual')}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  noteMode === 'individual'
                    ? 'bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm'
                    : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark'
                }`}
                title={t.notes.modeIndividual}
              >
                ☰
              </button>
              <button
                type="button"
                onClick={() => handleNoteModeChange('freetext')}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  noteMode === 'freetext'
                    ? 'bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm'
                    : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark'
                }`}
                title={t.notes.modeFreetext}
              >
                ¶
              </button>
            </div>
          </div>
          <NotesFeed
            notes={selectedTopic.notes}
            rawBody={selectedTopic.rawBody}
            topicSlug={selectedTopic.id}
            noteMode={noteMode}
          />
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
