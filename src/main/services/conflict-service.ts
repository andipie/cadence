import fs from 'fs';
import path from 'path';

// Patterns for cloud sync conflict files
const CONFLICT_PATTERNS = [
  / \(Konflikt\)/i,   // OneDrive (German)
  / \(conflict\)/i,    // OneDrive (English)
  /\.sync-conflict-/,  // Syncthing
];

// Internal files to exclude from scanning
const EXCLUDED_FILES = new Set([
  'cadence-index.db',
  'cadence-index.db-wal',
  'cadence-index.db-shm',
]);

/**
 * Recursively scans the data directory for cloud-sync conflict files.
 * Returns an array of absolute paths to conflict files.
 */
export function scanConflictFiles(dataDir: string): string[] {
  const conflicts: string[] = [];

  if (!fs.existsSync(dataDir)) {
    return conflicts;
  }

  scanDirectory(dataDir, conflicts);
  return conflicts;
}

function scanDirectory(dir: string, results: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    // Directory not readable — skip silently
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip hidden files/directories and internal files
    if (entry.name.startsWith('.')) continue;
    if (EXCLUDED_FILES.has(entry.name)) continue;
    if (entry.name.endsWith('.tmp') || entry.name.endsWith('.bak')) continue;

    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile()) {
      if (isConflictFile(entry.name)) {
        results.push(fullPath);
      }
    }
  }
}

function isConflictFile(filename: string): boolean {
  return CONFLICT_PATTERNS.some((pattern) => pattern.test(filename));
}
