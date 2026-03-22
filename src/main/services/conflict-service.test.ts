import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { scanConflictFiles } from './conflict-service';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cadence-conflict-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function touch(relativePath: string): void {
  const fullPath = path.join(tmpDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, '', 'utf-8');
}

describe('scanConflictFiles', () => {
  it('detects OneDrive German conflict pattern', () => {
    touch('topics/my-topic (Konflikt).md');
    const conflicts = scanConflictFiles(tmpDir);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toContain('Konflikt');
  });

  it('detects OneDrive English conflict pattern', () => {
    touch('topics/my-topic (conflict).md');
    const conflicts = scanConflictFiles(tmpDir);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toContain('conflict');
  });

  it('detects Syncthing conflict pattern', () => {
    touch('topics/my-topic.sync-conflict-20260301-123456.md');
    const conflicts = scanConflictFiles(tmpDir);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toContain('sync-conflict');
  });

  it('does not flag normal files', () => {
    touch('topics/normal-topic.md');
    touch('topics/another.txt');
    const conflicts = scanConflictFiles(tmpDir);
    expect(conflicts).toEqual([]);
  });

  it('skips hidden files and directories', () => {
    touch('.hidden/topic (conflict).md');
    touch('topics/.hidden-conflict (conflict).md');
    const conflicts = scanConflictFiles(tmpDir);
    expect(conflicts).toEqual([]);
  });

  it('skips excluded internal files', () => {
    touch('cadence-index.db');
    touch('topics/backup.tmp');
    touch('contexts/contexts.yaml.bak');
    const conflicts = scanConflictFiles(tmpDir);
    expect(conflicts).toEqual([]);
  });

  it('finds conflicts in nested subdirectories', () => {
    touch('topics/sub/deep/topic (conflict).md');
    const conflicts = scanConflictFiles(tmpDir);
    expect(conflicts).toHaveLength(1);
  });

  it('returns empty array for non-existent directory', () => {
    const conflicts = scanConflictFiles(path.join(tmpDir, 'nonexistent'));
    expect(conflicts).toEqual([]);
  });

  it('handles mixed normal and conflict files', () => {
    touch('topics/normal.md');
    touch('topics/conflict-one (Konflikt).md');
    touch('topics/normal-two.md');
    touch('archive/conflict-two.sync-conflict-20260301.md');
    const conflicts = scanConflictFiles(tmpDir);
    expect(conflicts).toHaveLength(2);
  });
});
