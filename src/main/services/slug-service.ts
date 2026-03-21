import path from 'path';

const UMLAUT_MAP: Record<string, string> = {
  'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
  'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue',
};

/**
 * Converts a topic title to a filesystem-safe slug.
 * "PROFINET Testkonzept Review" → "profinet-testkonzept-review"
 */
export function titleToSlug(title: string): string {
  let slug = title;

  // Replace umlauts
  for (const [char, replacement] of Object.entries(UMLAUT_MAP)) {
    slug = slug.split(char).join(replacement);
  }

  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // Remove special characters
    .replace(/\s+/g, '-')            // Spaces → hyphens
    .replace(/-+/g, '-')             // Deduplicate hyphens
    .replace(/^-+|-+$/g, '');        // Trim leading/trailing hyphens

  return slug || 'untitled';
}

/**
 * Ensures a slug is unique by appending -2, -3, ... if needed.
 */
export function ensureUniqueSlug(slug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(slug)) {
    return slug;
  }

  let counter = 2;
  while (existingSlugs.includes(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}

/**
 * Derives the slug from a file path (filename without extension).
 */
export function slugFromFilePath(filePath: string): string {
  return path.basename(filePath, '.md');
}
