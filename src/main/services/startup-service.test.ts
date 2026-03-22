import fs from 'fs';
import path from 'path';
import os from 'os';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateDataDirectory, isDirectoryEmpty, initializeNewDataDirectory } from './startup-service';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cadence-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('validateDataDirectory', () => {
  it('returns valid for a correct directory structure', () => {
    const topicsDir = path.join(tmpDir, 'topics');
    const contextsDir = path.join(tmpDir, 'contexts');
    fs.mkdirSync(topicsDir);
    fs.mkdirSync(contextsDir);
    fs.writeFileSync(path.join(contextsDir, 'contexts.yaml'), 'groups: []\ncontexts: []\n');

    const result = validateDataDirectory(tmpDir);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when topics/ is missing', () => {
    const contextsDir = path.join(tmpDir, 'contexts');
    fs.mkdirSync(contextsDir);
    fs.writeFileSync(path.join(contextsDir, 'contexts.yaml'), '');

    const result = validateDataDirectory(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing-topics');
  });

  it('returns invalid when contexts.yaml is missing', () => {
    fs.mkdirSync(path.join(tmpDir, 'topics'));

    const result = validateDataDirectory(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing-contexts');
  });

  it('returns invalid for non-existent path', () => {
    const result = validateDataDirectory(path.join(tmpDir, 'nonexistent'));
    expect(result.valid).toBe(false);
  });
});

describe('isDirectoryEmpty', () => {
  it('returns true for an empty directory', () => {
    expect(isDirectoryEmpty(tmpDir)).toBe(true);
  });

  it('returns false for a non-empty directory', () => {
    fs.writeFileSync(path.join(tmpDir, 'file.txt'), 'content');
    expect(isDirectoryEmpty(tmpDir)).toBe(false);
  });

  it('returns true for non-existent directory', () => {
    expect(isDirectoryEmpty(path.join(tmpDir, 'nope'))).toBe(true);
  });
});

describe('initializeNewDataDirectory', () => {
  it('creates required subdirectories and contexts.yaml', () => {
    initializeNewDataDirectory(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'topics'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'contexts', 'contexts.yaml'))).toBe(true);

    const content = fs.readFileSync(path.join(tmpDir, 'contexts', 'contexts.yaml'), 'utf-8');
    expect(content).toContain('groups:');
    expect(content).toContain('contexts:');
  });

  it('does not overwrite existing contexts.yaml', () => {
    const contextsDir = path.join(tmpDir, 'contexts');
    fs.mkdirSync(contextsDir, { recursive: true });
    fs.writeFileSync(path.join(contextsDir, 'contexts.yaml'), 'custom: content\n');

    initializeNewDataDirectory(tmpDir);

    const content = fs.readFileSync(path.join(contextsDir, 'contexts.yaml'), 'utf-8');
    expect(content).toBe('custom: content\n');
  });
});
