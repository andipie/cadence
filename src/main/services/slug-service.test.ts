import { describe, it, expect } from 'vitest';
import { titleToSlug, ensureUniqueSlug, slugFromFilePath } from './slug-service';

describe('titleToSlug', () => {
  it('converts simple title to slug', () => {
    expect(titleToSlug('Hello World')).toBe('hello-world');
  });

  it('replaces German umlauts', () => {
    expect(titleToSlug('Über Öko Äpfel')).toBe('ueber-oeko-aepfel');
  });

  it('replaces ß with ss', () => {
    expect(titleToSlug('Straßenbau')).toBe('strassenbau');
  });

  it('removes special characters', () => {
    expect(titleToSlug('Test (Version 2.0) — Final!')).toBe('test-version-20-final');
  });

  it('deduplicates hyphens', () => {
    expect(titleToSlug('a   b   c')).toBe('a-b-c');
  });

  it('trims leading and trailing hyphens', () => {
    expect(titleToSlug('  hello  ')).toBe('hello');
  });

  it('returns "untitled" for empty string', () => {
    expect(titleToSlug('')).toBe('untitled');
  });

  it('returns "untitled" for string with only special characters', () => {
    expect(titleToSlug('!@#$%')).toBe('untitled');
  });

  it('handles uppercase umlauts', () => {
    expect(titleToSlug('Ärger Über Übung')).toBe('aerger-ueber-uebung');
  });
});

describe('ensureUniqueSlug', () => {
  it('returns slug as-is if no collision', () => {
    expect(ensureUniqueSlug('my-topic', ['other-topic'])).toBe('my-topic');
  });

  it('appends -2 on first collision', () => {
    expect(ensureUniqueSlug('my-topic', ['my-topic'])).toBe('my-topic-2');
  });

  it('appends -3 when -2 also exists', () => {
    expect(ensureUniqueSlug('my-topic', ['my-topic', 'my-topic-2'])).toBe('my-topic-3');
  });

  it('handles empty existing slugs', () => {
    expect(ensureUniqueSlug('my-topic', [])).toBe('my-topic');
  });
});

describe('slugFromFilePath', () => {
  it('extracts slug from simple path', () => {
    expect(slugFromFilePath('/data/topics/my-topic.md')).toBe('my-topic');
  });

  it('extracts slug from nested path', () => {
    expect(slugFromFilePath('/Users/x/Cadence/topics/deep-topic.md')).toBe('deep-topic');
  });

  it('handles filename without directory', () => {
    expect(slugFromFilePath('simple.md')).toBe('simple');
  });
});
