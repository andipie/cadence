import fs from 'fs';
import path from 'path';
import { getDataDirPointerPath } from './settings-service';
import { ensureDataDirectories } from '../store/file-store';
import type { StartupState } from '../../shared/types';

const CONTEXTS_YAML_PATH = 'contexts/contexts.yaml';
const TOPICS_DIR = 'topics';

/**
 * Checks the startup state by reading the pointer file and validating the directory.
 * Returns a discriminated union describing what the renderer should show.
 */
export function checkStartupState(): StartupState {
  const pointerPath = getDataDirPointerPath();

  // No pointer file → first launch
  let savedPath: string | null = null;
  try {
    if (fs.existsSync(pointerPath)) {
      savedPath = fs.readFileSync(pointerPath, 'utf-8').trim();
      if (!savedPath) {
        savedPath = null;
      }
    }
  } catch {
    savedPath = null;
  }

  if (!savedPath) {
    return { state: 'no-dir' };
  }

  // Saved path exists — check if reachable
  try {
    fs.accessSync(savedPath, fs.constants.R_OK);
  } catch {
    return { state: 'unreachable', path: savedPath };
  }

  // Reachable — validate structure
  const validation = validateDataDirectory(savedPath);
  if (!validation.valid) {
    return { state: 'invalid', path: savedPath, reason: validation.reason! };
  }

  return { state: 'ready', dataDir: savedPath };
}

/**
 * Validates that a directory is a valid Cadence data directory.
 * Checks for contexts/contexts.yaml and topics/ folder.
 */
export function validateDataDirectory(dirPath: string): { valid: boolean; reason?: string } {
  const topicsDir = path.join(dirPath, TOPICS_DIR);
  const contextsYaml = path.join(dirPath, CONTEXTS_YAML_PATH);

  if (!fs.existsSync(topicsDir) || !fs.statSync(topicsDir).isDirectory()) {
    return { valid: false, reason: 'missing-topics' };
  }

  if (!fs.existsSync(contextsYaml)) {
    return { valid: false, reason: 'missing-contexts' };
  }

  return { valid: true };
}

/**
 * Checks whether a directory is empty (has no entries).
 */
export function isDirectoryEmpty(dirPath: string): boolean {
  try {
    const entries = fs.readdirSync(dirPath);
    return entries.length === 0;
  } catch {
    return true;
  }
}

/**
 * Initializes a new Cadence data directory.
 * Creates subdirectories and an empty contexts.yaml.
 */
export function initializeNewDataDirectory(dirPath: string): void {
  // Create all required subdirectories
  ensureDataDirectories(dirPath);

  // Create empty contexts.yaml if it doesn't exist
  const contextsDir = path.join(dirPath, 'contexts');
  const contextsYaml = path.join(contextsDir, 'contexts.yaml');

  if (!fs.existsSync(contextsYaml)) {
    fs.mkdirSync(contextsDir, { recursive: true });
    fs.writeFileSync(contextsYaml, 'groups: []\ncontexts: []\n', 'utf-8');
  }
}
