// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, computed, inject } from '@angular/core';
import {
  BACKUP_SCHEMA,
  BACKUP_VERSION,
  LEGACY_SAVED_STORIES_SCHEMA,
  LEGACY_SAVED_STORIES_VERSION,
  type BackupFile,
  type BackupImportResult,
} from '@models/backup';
import { SavedStoriesService } from '@services/saved-stories.service';
import { UserTagsService } from '@services/user-tags.service';

export const UNRECOGNIZED_BACKUP_ERROR = 'Unrecognized backup file';
export const NEWER_BACKUP_ERROR = 'Backup was created by a newer version of hnews';

/** Raw, still-unvalidated sections recovered from a backup file. */
interface BackupSections {
  userTags?: unknown[];
  savedStories?: unknown[];
}

/**
 * Owns the backup file format: one file covering every exportable dataset.
 *
 * Import also accepts the per-dataset files earlier versions wrote (a bare user
 * tag array and the `hnews.savedStories` envelope). Export only writes the
 * unified format.
 */
@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly tags = inject(UserTagsService);
  private readonly savedStories = inject(SavedStoriesService);

  readonly tagCount = this.tags.tagCount;
  readonly savedStoryCount = computed(() => this.savedStories.records().size);
  readonly isEmpty = computed(() => this.tagCount() === 0 && this.savedStoryCount() === 0);

  exportBackup(): string {
    const backup: BackupFile = {
      schema: BACKUP_SCHEMA,
      version: BACKUP_VERSION,
      exportedAt: Date.now(),
      data: {
        userTags: this.tags.exportTagRecords(),
        savedStories: this.savedStories.getAll(),
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Applies a backup file, merging each section it contains into the service
   * that owns it.
   *
   * Only `parseBackup` rejects on file shape. Once a section is known to be an
   * array the services count malformed records as skipped rather than throwing,
   * so no record in the file can abort the rest of the import. A storage-level
   * failure (a full localStorage quota, say) can still surface mid-way.
   */
  importBackup(json: string): BackupImportResult {
    const sections = parseBackup(json);

    const result: BackupImportResult = {};
    if (sections.userTags) {
      result.userTags = this.tags.importTagRecords(sections.userTags);
    }
    if (sections.savedStories) {
      result.savedStories = this.savedStories.importRecords(sections.savedStories);
    }
    return result;
  }
}

function parseBackup(json: string): BackupSections {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(UNRECOGNIZED_BACKUP_ERROR);
  }

  if (isObject(parsed) && parsed['schema'] === BACKUP_SCHEMA) {
    return parseUnifiedBackup(parsed);
  }

  if (isLegacySavedStoriesExport(parsed)) {
    return { savedStories: parsed['stories'] as unknown[] };
  }

  if (Array.isArray(parsed)) {
    return parseBareArray(parsed);
  }

  throw new Error(UNRECOGNIZED_BACKUP_ERROR);
}

function parseUnifiedBackup(parsed: Record<string, unknown>): BackupSections {
  const version = parsed['version'];
  if (typeof version !== 'number' || !Number.isFinite(version)) {
    throw new Error(UNRECOGNIZED_BACKUP_ERROR);
  }
  if (version > BACKUP_VERSION) {
    throw new Error(NEWER_BACKUP_ERROR);
  }

  const data: Record<string, unknown> = isObject(parsed['data']) ? parsed['data'] : {};
  const sections: BackupSections = {};
  if (Array.isArray(data['userTags'])) {
    sections.userTags = data['userTags'];
  }
  if (Array.isArray(data['savedStories'])) {
    sections.savedStories = data['savedStories'];
  }

  if (!sections.userTags && !sections.savedStories) {
    throw new Error(UNRECOGNIZED_BACKUP_ERROR);
  }
  return sections;
}

// A bare array is either a user tag file from before the formats were unified or
// a raw saved-stories dump. The two shapes have no field in common, so whichever
// one every entry matches wins; anything mixed or empty is too ambiguous to use.
function parseBareArray(records: unknown[]): BackupSections {
  if (records.length === 0) {
    throw new Error(UNRECOGNIZED_BACKUP_ERROR);
  }
  if (records.every(looksLikeUserTag)) {
    return { userTags: records };
  }
  if (records.every(looksLikeSavedStory)) {
    return { savedStories: records };
  }
  throw new Error(UNRECOGNIZED_BACKUP_ERROR);
}

function isLegacySavedStoriesExport(value: unknown): value is Record<string, unknown> {
  return (
    isObject(value) &&
    value['schema'] === LEGACY_SAVED_STORIES_SCHEMA &&
    value['version'] === LEGACY_SAVED_STORIES_VERSION &&
    Array.isArray(value['stories'])
  );
}

function looksLikeUserTag(value: unknown): boolean {
  return (
    isObject(value) && typeof value['username'] === 'string' && typeof value['tag'] === 'string'
  );
}

function looksLikeSavedStory(value: unknown): boolean {
  return isObject(value) && typeof value['id'] === 'number' && typeof value['savedAt'] === 'number';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
