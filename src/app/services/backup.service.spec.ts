// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HackernewsService } from '@services/hackernews.service';
import { IndexedDBService } from '@services/indexed-db.service';
import { SavedStoriesService } from '@services/saved-stories.service';
import { UserTagsService } from '@services/user-tags.service';
import { BackupService, NEWER_BACKUP_ERROR, UNRECOGNIZED_BACKUP_ERROR } from './backup.service';

describe('BackupService', () => {
  let service: BackupService;
  let tags: UserTagsService;
  let savedStories: SavedStoriesService;

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(1700000000000);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: HackernewsService,
          useValue: { getStoryWithAllComments: vi.fn().mockReturnValue(of(null)) },
        },
        {
          provide: IndexedDBService,
          useValue: {
            setSavedItems: vi.fn().mockResolvedValue(undefined),
            deleteSavedItemsByStory: vi.fn().mockResolvedValue(undefined),
            clear: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });

    tags = TestBed.inject(UserTagsService);
    savedStories = TestBed.inject(SavedStoriesService);
    service = TestBed.inject(BackupService);
    tags.clearAllTags();
    savedStories.clearSavedStories();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
    window.localStorage.clear();
  });

  function seed(): void {
    tags.setTag('dang', 'HN Moderator', undefined, 'mod');
    savedStories.save({ id: 8863, type: 'story', time: 1700000000, title: 'My YC app' });
  }

  it('exports both datasets in one versioned envelope', () => {
    seed();

    const exported = JSON.parse(service.exportBackup());

    expect(exported).toMatchObject({
      schema: 'hnews.backup',
      version: 1,
      exportedAt: 1700000000000,
    });
    expect(exported.data.userTags).toEqual([
      {
        username: 'dang',
        tag: 'HN Moderator',
        notes: 'mod',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ]);
    expect(exported.data.savedStories.map((record: { id: number }) => record.id)).toEqual([8863]);
  });

  it('leaves local-only colors out of the file', () => {
    seed();

    expect(service.exportBackup()).not.toContain('color');
  });

  it('restores an exported backup after everything is cleared', () => {
    seed();
    const backup = service.exportBackup();

    tags.clearAllTags();
    savedStories.clearSavedStories();
    expect(service.isEmpty()).toBe(true);

    const result = service.importBackup(backup);

    expect(result).toEqual({
      userTags: { imported: 1, updated: 0, skipped: 0 },
      savedStories: { imported: 1, updated: 0, skipped: 0 },
    });
    expect(tags.getTag('dang')?.notes).toBe('mod');
    expect(savedStories.isSaved(8863)).toBe(true);
  });

  it('reports counts per dataset', () => {
    seed();

    const result = service.importBackup(service.exportBackup());

    expect(result).toEqual({
      userTags: { imported: 0, updated: 0, skipped: 1 },
      savedStories: { imported: 0, updated: 0, skipped: 1 },
    });
  });

  it('exposes reactive counts', () => {
    expect(service.isEmpty()).toBe(true);

    seed();

    expect(service.tagCount()).toBe(1);
    expect(service.savedStoryCount()).toBe(1);
    expect(service.isEmpty()).toBe(false);
  });

  describe('backwards compatibility', () => {
    it('imports a legacy bare user tag array', () => {
      const result = service.importBackup(
        JSON.stringify([
          { username: 'alice', tag: 'Expert', createdAt: 1, updatedAt: 2 },
          { username: 'bob', tag: 'Dev', createdAt: 1, updatedAt: 2 },
        ]),
      );

      expect(result).toEqual({ userTags: { imported: 2, updated: 0, skipped: 0 } });
      expect(result.savedStories).toBeUndefined();
      expect(tags.getTag('alice')?.tag).toBe('Expert');
    });

    it('imports a legacy hnews.savedStories envelope', () => {
      const result = service.importBackup(
        JSON.stringify({
          schema: 'hnews.savedStories',
          version: 1,
          exportedAt: 1700000000000,
          stories: [{ id: 42, savedAt: 1700000000000 }],
        }),
      );

      expect(result).toEqual({ savedStories: { imported: 1, updated: 0, skipped: 0 } });
      expect(result.userTags).toBeUndefined();
      expect(savedStories.isSaved(42)).toBe(true);
    });

    it('imports a raw saved-stories localStorage dump', () => {
      const result = service.importBackup(JSON.stringify([{ id: 43, savedAt: 1700000000000 }]));

      expect(result).toEqual({ savedStories: { imported: 1, updated: 0, skipped: 0 } });
      expect(savedStories.isSaved(43)).toBe(true);
    });

    it('applies only the sections a unified file contains', () => {
      seed();

      const result = service.importBackup(
        JSON.stringify({
          schema: 'hnews.backup',
          version: 1,
          exportedAt: 1700000000000,
          data: { userTags: [{ username: 'alice', tag: 'Expert' }] },
        }),
      );

      expect(result.savedStories).toBeUndefined();
      expect(result.userTags).toEqual({ imported: 1, updated: 0, skipped: 0 });
      expect(savedStories.isSaved(8863)).toBe(true);
    });
  });

  describe('rejected files', () => {
    it.each([
      ['malformed JSON', '{'],
      ['an empty array', '[]'],
      ['a mixed array', '[{"username":"a","tag":"b"},{"id":1,"savedAt":2}]'],
      ['an unrelated object', '{"hello":"world"}'],
      ['a unified file with no known sections', '{"schema":"hnews.backup","version":1,"data":{}}'],
      ['a unified file with no version', '{"schema":"hnews.backup","data":{"userTags":[]}}'],
      ['a plain string', '"nope"'],
    ])('rejects %s', (_label, json) => {
      expect(() => service.importBackup(json)).toThrow(UNRECOGNIZED_BACKUP_ERROR);
    });

    it('rejects a backup written by a newer version', () => {
      expect(() =>
        service.importBackup(
          JSON.stringify({
            schema: 'hnews.backup',
            version: 2,
            exportedAt: 1700000000000,
            data: { userTags: [] },
          }),
        ),
      ).toThrow(NEWER_BACKUP_ERROR);
    });

    it('leaves local data untouched when a file is rejected', () => {
      seed();

      expect(() => service.importBackup('{')).toThrow();

      expect(tags.getTag('dang')?.tag).toBe('HN Moderator');
      expect(savedStories.isSaved(8863)).toBe(true);
    });
  });

  it('counts unusable records as skipped rather than failing the import', () => {
    const result = service.importBackup(
      JSON.stringify({
        schema: 'hnews.backup',
        version: 1,
        exportedAt: 1700000000000,
        data: {
          userTags: [{ username: 'alice', tag: 'Expert' }, { tag: 'No username' }],
          savedStories: [{ id: 7, savedAt: 1700000000000 }, { savedAt: 1700000000000 }],
        },
      }),
    );

    expect(result).toEqual({
      userTags: { imported: 1, updated: 0, skipped: 1 },
      savedStories: { imported: 1, updated: 0, skipped: 1 },
    });
  });
});
