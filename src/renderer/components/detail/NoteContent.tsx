import React from 'react';
import Markdown from 'react-markdown';
import { useTranslation } from '../../hooks/useTranslation';

interface NoteContentProps {
  content: string;
}

/**
 * Renders note content as Markdown.
 * Images with relative attachment paths are converted to cadence-file:// protocol URLs.
 */
export default function NoteContent({ content }: NoteContentProps): React.ReactElement {
  const t = useTranslation();

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <Markdown
        components={{
          img({ src, alt, ...props }) {
            const imageUrl = src?.startsWith('../attachments/')
              ? `cadence-file:///${src.replace('../', '')}`
              : src;
            return (
              <img
                src={imageUrl}
                alt={alt || t.notes.imageAlt}
                className="max-w-full rounded my-1 border border-border dark:border-border-dark"
                loading="lazy"
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
