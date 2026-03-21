import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import type { Language, Settings } from '../../shared/types';

const SETTINGS_FILENAME = 'settings.yaml';
const SETTINGS_BACKUP = 'settings.yaml.bak';
const RETRY_DELAYS = [100, 500, 2000];

const DEFAULT_SETTINGS: Settings = {
  dataDir: '',  // Will be set at runtime
  globalHotkey: 'CommandOrControl+Shift+C',
  defaultPriority: 'normal',
  confirmDelete: true,
  confirmComplete: false,
  warnWaitingDays: 7,
  warnWaitingCritical: 14,
  obsidianMode: false,
  language: 'de',
};

function settingsFilePath(dataDir: string): string {
  return path.join(dataDir, SETTINGS_FILENAME);
}

function backupFilePath(dataDir: string): string {
  return path.join(dataDir, SETTINGS_BACKUP);
}

/**
 * Reads settings from settings.yaml in the data directory.
 * Falls back to backup if primary is corrupt. Returns defaults if neither exists.
 */
export function readSettings(dataDir: string): Settings {
  const primary = settingsFilePath(dataDir);
  const backup = backupFilePath(dataDir);

  const primaryResult = tryReadSettingsYaml(primary);
  if (primaryResult !== null) {
    return { ...DEFAULT_SETTINGS, dataDir, ...primaryResult };
  }

  const backupResult = tryReadSettingsYaml(backup);
  if (backupResult !== null) {
    console.warn('[SettingsService] Primary settings.yaml unreadable, loaded from backup');
    return { ...DEFAULT_SETTINGS, dataDir, ...backupResult };
  }

  return { ...DEFAULT_SETTINGS, dataDir };
}

function tryReadSettingsYaml(filePath: string): Partial<Settings> | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const raw = YAML.parse(content) as Record<string, unknown> | null;

    if (!raw || typeof raw !== 'object') {
      return {};
    }

    // Map snake_case YAML keys to camelCase Settings properties
    const settings: Partial<Settings> = {};

    if (typeof raw.global_hotkey === 'string') settings.globalHotkey = raw.global_hotkey;
    if (typeof raw.default_priority === 'string') settings.defaultPriority = raw.default_priority as Settings['defaultPriority'];
    if (typeof raw.confirm_delete === 'boolean') settings.confirmDelete = raw.confirm_delete;
    if (typeof raw.confirm_complete === 'boolean') settings.confirmComplete = raw.confirm_complete;
    if (typeof raw.warn_waiting_days === 'number') settings.warnWaitingDays = raw.warn_waiting_days;
    if (typeof raw.warn_waiting_critical === 'number') settings.warnWaitingCritical = raw.warn_waiting_critical;
    if (typeof raw.obsidian_mode === 'boolean') settings.obsidianMode = raw.obsidian_mode;
    if (typeof raw.language === 'string' && (raw.language === 'de' || raw.language === 'en')) {
      settings.language = raw.language as Language;
    }

    return settings;
  } catch (err) {
    console.error(`[SettingsService] Error parsing ${filePath}:`, err);
    return null;
  }
}

/**
 * Writes settings to settings.yaml with atomic write and backup.
 */
export function writeSettings(dataDir: string, settings: Settings): void {
  const filePath = settingsFilePath(dataDir);
  const backup = backupFilePath(dataDir);

  // Create backup of existing file before writing
  if (fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, backup);
    } catch (err) {
      console.error('[SettingsService] Failed to create backup:', err);
    }
  }

  // Build YAML data (snake_case keys)
  const data: Record<string, unknown> = {
    global_hotkey: settings.globalHotkey,
    default_priority: settings.defaultPriority,
    confirm_delete: settings.confirmDelete,
    confirm_complete: settings.confirmComplete,
    warn_waiting_days: settings.warnWaitingDays,
    warn_waiting_critical: settings.warnWaitingCritical,
    obsidian_mode: settings.obsidianMode,
    language: settings.language,
  };

  const yamlContent = YAML.stringify(data, { lineWidth: 0 });

  // Atomic write: temp file → rename
  const tmpPath = path.join(dataDir, `.${SETTINGS_FILENAME}.tmp`);
  fs.writeFileSync(tmpPath, yamlContent, 'utf-8');

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    try {
      fs.renameSync(tmpPath, filePath);
      return;
    } catch (err) {
      if (attempt < RETRY_DELAYS.length - 1) {
        const delay = RETRY_DELAYS[attempt];
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
      } else {
        try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup error */ }
        throw err;
      }
    }
  }
}
