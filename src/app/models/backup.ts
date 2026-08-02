// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import type { SavedStoryRecord } from '@services/saved-stories.service';
import type { UserTag } from '@services/user-tags.service';

export const BACKUP_SCHEMA = 'hnews.backup';
export const BACKUP_VERSION = 1;

// Schema of the files the app used to write before tags and saved stories shared
// one backup. Still accepted on import; never produced.
export const LEGACY_SAVED_STORIES_SCHEMA = 'hnews.savedStories';
export const LEGACY_SAVED_STORIES_VERSION = 1;

/**
 * A single backup file covering every dataset the app can export.
 *
 * `data` is the extension point: a new key is additive and older builds ignore
 * what they do not recognize, so adding a dataset needs no version bump.
 * `version` is reserved for breaking changes to sections that already exist.
 */
export interface BackupFile {
  schema: typeof BACKUP_SCHEMA;
  version: number;
  exportedAt: number;
  data: BackupData;
}

export interface BackupData {
  userTags?: UserTag[];
  savedStories?: SavedStoryRecord[];
}

/** Per-dataset outcome of an import, shared by every service that accepts one. */
export interface ImportCounts {
  imported: number;
  updated: number;
  skipped: number;
}

/** Only the sections present in the imported file appear here. */
export interface BackupImportResult {
  userTags?: ImportCounts;
  savedStories?: ImportCounts;
}
