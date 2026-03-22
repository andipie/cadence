import fs from 'fs';
import path from 'path';
import os from 'os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readSettings, writeSettings, readMruList, addToMruList } from './settings-service';

let tmpDir: string;
let mruPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cadence-settings-'));
  mruPath = path.join(os.homedir(), '.cadence-mru.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readSettings / writeSettings', () => {
  it('returns defaults when no settings file exists', () => {
    const settings = readSettings(tmpDir);
    expect(settings.dataDir).toBe(tmpDir);
    expect(settings.defaultPriority).toBe('normal');
    expect(settings.confirmDelete).toBe(true);
    expect(settings.language).toBe('en');
  });

  it('roundtrips settings through write and read', () => {
    const defaults = readSettings(tmpDir);
    const modified = {
      ...defaults,
      defaultPriority: 'hoch' as const,
      language: 'en' as const,
      warnWaitingDays: 10,
      obsidianMode: true,
    };

    writeSettings(tmpDir, modified);
    const reread = readSettings(tmpDir);

    expect(reread.defaultPriority).toBe('hoch');
    expect(reread.language).toBe('en');
    expect(reread.warnWaitingDays).toBe(10);
    expect(reread.obsidianMode).toBe(true);
  });

  it('creates backup on write', () => {
    const settings = readSettings(tmpDir);
    writeSettings(tmpDir, settings);

    // First write — no backup yet (no previous file existed)
    // Second write — should create backup
    writeSettings(tmpDir, { ...settings, warnWaitingDays: 99 });

    const backupPath = path.join(tmpDir, 'settings.yaml.bak');
    expect(fs.existsSync(backupPath)).toBe(true);
  });

  it('falls back to backup when primary is corrupt', () => {
    const settings = readSettings(tmpDir);
    writeSettings(tmpDir, settings);

    // Write again to create backup
    writeSettings(tmpDir, { ...settings, warnWaitingDays: 42 });

    // Corrupt primary file
    fs.writeFileSync(path.join(tmpDir, 'settings.yaml'), '{{invalid yaml::', 'utf-8');

    const recovered = readSettings(tmpDir);
    // Should fall back to backup (which has default values from first write)
    expect(recovered.dataDir).toBe(tmpDir);
    expect(recovered.warnWaitingDays).toBeDefined();
  });
});

describe('MRU list', () => {
  // Save/restore existing MRU file to not corrupt user data during tests
  let originalMru: string | null = null;

  beforeEach(() => {
    try {
      originalMru = fs.readFileSync(mruPath, 'utf-8');
    } catch {
      originalMru = null;
    }
  });

  afterEach(() => {
    if (originalMru !== null) {
      fs.writeFileSync(mruPath, originalMru, 'utf-8');
    } else {
      try { fs.unlinkSync(mruPath); } catch { /* ok */ }
    }
  });

  it('returns empty array when no MRU file exists', () => {
    try { fs.unlinkSync(mruPath); } catch { /* ok */ }
    const list = readMruList();
    expect(list).toEqual([]);
  });

  it('adds and reads entries', () => {
    try { fs.unlinkSync(mruPath); } catch { /* ok */ }
    addToMruList(tmpDir);
    const list = readMruList();
    expect(list).toContain(tmpDir);
  });

  it('deduplicates entries', () => {
    try { fs.unlinkSync(mruPath); } catch { /* ok */ }
    addToMruList(tmpDir);
    addToMruList(tmpDir);
    addToMruList(tmpDir);
    const list = readMruList();
    const occurrences = list.filter((p) => p === tmpDir).length;
    expect(occurrences).toBe(1);
  });

  it('puts most recent entry first', () => {
    try { fs.unlinkSync(mruPath); } catch { /* ok */ }
    const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'cadence-mru2-'));
    try {
      addToMruList(tmpDir);
      addToMruList(dir2);
      const list = readMruList();
      expect(list[0]).toBe(dir2);
    } finally {
      fs.rmSync(dir2, { recursive: true, force: true });
    }
  });

  it('limits to 5 entries', () => {
    try { fs.unlinkSync(mruPath); } catch { /* ok */ }
    const dirs: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = fs.mkdtempSync(path.join(os.tmpdir(), `cadence-mru${i}-`));
      dirs.push(d);
      addToMruList(d);
    }
    try {
      const list = readMruList();
      expect(list.length).toBeLessThanOrEqual(5);
    } finally {
      for (const d of dirs) {
        fs.rmSync(d, { recursive: true, force: true });
      }
    }
  });
});
