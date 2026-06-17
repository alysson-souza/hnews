// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs/operators';
import { HNItem, mapToHNItem } from '@models/hn';
import { HackernewsService } from '@services/hackernews.service';
import { IndexedDBService } from '@services/indexed-db.service';

export interface SavedStoryRecord {
  id: number;
  savedAt: number;
  story?: HNItem;
}

export interface SavedStoriesExport {
  schema: 'hnews.savedStories';
  version: 1;
  exportedAt: number;
  stories: SavedStoryRecord[];
}

export interface SavedStoriesImportResult {
  imported: number;
  updated: number;
  skipped: number;
}

const STORAGE_KEY = 'hn_saved_stories_v1';
const EXPORT_SCHEMA = 'hnews.savedStories';
const EXPORT_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class SavedStoriesService {
  private readonly hackernews = inject(HackernewsService);
  private readonly indexedDB = inject(IndexedDBService);
  private readonly _records = signal<Map<number, SavedStoryRecord>>(this.load());
  private readonly warmingIds = new Set<number>();
  readonly records = this._records.asReadonly();

  isSaved(id: number): boolean {
    return this._records().has(id);
  }

  save(story: HNItem): void {
    if (!isFiniteId(story.id) || story.type === 'comment') {
      return;
    }

    const records = new Map(this._records());
    const existing = records.get(story.id);
    records.set(story.id, {
      id: story.id,
      savedAt: existing?.savedAt ?? Date.now(),
      story: createSnapshot(story),
    });
    this.setRecords(records);
    this.warmComments(story.id);
  }

  // Pre-fetch the full comment tree through the same loader the item page uses,
  // populating the shared cache so a saved story's discussion is available offline,
  // and persist it to the durable saved-comments store (see IndexedDBService) so it
  // survives the regular cache's TTL eviction. Re-running this (e.g. on revisiting the
  // saved page) re-fetches and overwrites the durable copy, so it stays current as new
  // comments arrive rather than freezing the tree at save time.
  // getStoryWithAllComments has no in-flight dedup of its own, so a fetch already
  // running for this id (from this warm-up or the item page) is left alone instead
  // of triggering a second identical request.
  warmComments(id: number): void {
    if (typeof window === 'undefined' || this.warmingIds.has(id)) {
      return;
    }
    this.warmingIds.add(id);
    this.hackernews
      .getStoryWithAllComments(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.warmingIds.delete(id);
          if (result && this.isSaved(id)) {
            const items = [result.story, ...result.commentsMap.values()];
            void this.indexedDB.setSavedItems(id, items);
          }
        },
        error: () => this.warmingIds.delete(id),
      });
  }

  unsave(id: number): void {
    const records = new Map(this._records());
    if (!records.delete(id)) {
      return;
    }
    this.setRecords(records);
    void this.indexedDB.deleteSavedItemsByStory(id);
  }

  toggle(story: HNItem): boolean {
    if (this.isSaved(story.id)) {
      this.unsave(story.id);
      return false;
    }

    this.save(story);
    return this.isSaved(story.id);
  }

  getAll(): SavedStoryRecord[] {
    return Array.from(this._records().values()).sort((a, b) => b.savedAt - a.savedAt);
  }

  updateSnapshots(stories: ReadonlyArray<HNItem | null>): void {
    const records = new Map(this._records());
    let changed = false;
    for (const story of stories) {
      if (!story || story.type === 'comment') {
        continue;
      }
      const existing = records.get(story.id);
      if (!existing) {
        continue;
      }
      records.set(story.id, { ...existing, story: createSnapshot(story) });
      changed = true;
    }
    if (changed) {
      this.setRecords(records);
    }
  }

  exportSavedStories(): string {
    const data: SavedStoriesExport = {
      schema: EXPORT_SCHEMA,
      version: EXPORT_VERSION,
      exportedAt: Date.now(),
      stories: this.getAll(),
    };
    return JSON.stringify(data, null, 2);
  }

  importSavedStories(json: string): SavedStoriesImportResult {
    const result: SavedStoriesImportResult = { imported: 0, updated: 0, skipped: 0 };
    const parsed = parseExport(json);
    if (!parsed) {
      throw new Error('Invalid saved stories export');
    }

    const incoming = new Map<number, SavedStoryRecord>();
    for (const record of parsed.stories) {
      const normalized = normalizeRecord(record);
      if (!normalized) {
        result.skipped++;
        continue;
      }

      const duplicate = incoming.get(normalized.id);
      if (duplicate) {
        result.skipped++;
        incoming.set(normalized.id, mergeRecords(duplicate, normalized));
        continue;
      }

      incoming.set(normalized.id, normalized);
    }

    const records = new Map(this._records());
    const idsToWarm: number[] = [];
    for (const incomingRecord of incoming.values()) {
      const existing = records.get(incomingRecord.id);
      if (!existing) {
        records.set(incomingRecord.id, incomingRecord);
        result.imported++;
        idsToWarm.push(incomingRecord.id);
        continue;
      }

      const merged = mergeRecords(existing, incomingRecord);
      if (!recordsEqual(existing, merged)) {
        records.set(incomingRecord.id, merged);
        result.updated++;
        idsToWarm.push(incomingRecord.id);
      } else {
        result.skipped++;
      }
    }

    this.setRecords(records);
    for (const id of idsToWarm) {
      this.warmComments(id);
    }
    return result;
  }

  clearSavedStories(): void {
    this.setRecords(new Map());
    void this.indexedDB.clear('savedComments');
  }

  private load(): Map<number, SavedStoryRecord> {
    if (typeof window === 'undefined') {
      return new Map();
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return new Map();
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      const rawRecords = Array.isArray(parsed)
        ? parsed
        : isRecordContainer(parsed)
          ? parsed.stories
          : [];

      const records = new Map<number, SavedStoryRecord>();
      for (const rawRecord of rawRecords) {
        const record = normalizeRecord(rawRecord);
        if (record) {
          records.set(record.id, mergeRecords(records.get(record.id), record));
        }
      }
      return records;
    } catch {
      return new Map();
    }
  }

  private setRecords(records: Map<number, SavedStoryRecord>): void {
    this._records.set(records);
    this.persist(records);
  }

  private persist(records: Map<number, SavedStoryRecord>): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(records.values())));
  }
}

function parseExport(json: string): SavedStoriesExport | null {
  try {
    const parsed = JSON.parse(json) as Partial<SavedStoriesExport> | unknown;
    if (!isRecordContainer(parsed)) {
      return null;
    }
    if (parsed.schema !== EXPORT_SCHEMA || parsed.version !== EXPORT_VERSION) {
      return null;
    }
    return parsed as SavedStoriesExport;
  } catch {
    return null;
  }
}

function isRecordContainer(value: unknown): value is {
  schema?: unknown;
  version?: unknown;
  exportedAt?: unknown;
  stories: unknown[];
} {
  return (
    !!value && typeof value === 'object' && Array.isArray((value as { stories?: unknown }).stories)
  );
}

function normalizeRecord(value: unknown): SavedStoryRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Partial<SavedStoryRecord>;
  if (!isFiniteId(raw.id)) {
    return null;
  }

  const savedAt =
    typeof raw.savedAt === 'number' && Number.isFinite(raw.savedAt) ? raw.savedAt : Date.now();
  const story = normalizeSnapshot(raw.story, raw.id);

  return story ? { id: raw.id, savedAt, story } : { id: raw.id, savedAt };
}

function normalizeSnapshot(value: unknown, id: number): HNItem | undefined {
  const story = mapToHNItem(value);
  if (!story || story.id !== id || story.type === 'comment') {
    return undefined;
  }
  return createSnapshot(story);
}

function createSnapshot(story: HNItem): HNItem {
  const snapshot: HNItem = {
    id: story.id,
    type: story.type,
    time: story.time,
  };

  if (story.by) snapshot.by = story.by;
  if (story.text) snapshot.text = story.text;
  if (story.title) snapshot.title = story.title;
  if (story.url) snapshot.url = story.url;
  if (typeof story.score === 'number') snapshot.score = story.score;
  if (typeof story.descendants === 'number') snapshot.descendants = story.descendants;
  if (story.dead === true) snapshot.dead = true;
  if (story.deleted === true) snapshot.deleted = true;
  if (Array.isArray(story.kids)) snapshot.kids = [...story.kids];
  if (Array.isArray(story.parts)) snapshot.parts = [...story.parts];
  if (typeof story.parent === 'number') snapshot.parent = story.parent;
  if (typeof story.poll === 'number') snapshot.poll = story.poll;

  return snapshot;
}

function mergeRecords(
  existing: SavedStoryRecord | undefined,
  incoming: SavedStoryRecord,
): SavedStoryRecord {
  if (!existing) {
    return incoming;
  }

  return {
    id: existing.id,
    savedAt: Math.min(existing.savedAt, incoming.savedAt),
    story: existing.story ?? incoming.story,
  };
}

function recordsEqual(a: SavedStoryRecord, b: SavedStoryRecord): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isFiniteId(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
