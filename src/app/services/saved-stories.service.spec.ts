// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { HNItem } from '@models/hn';
import { HackernewsService } from '@services/hackernews.service';
import { SavedStoriesService } from './saved-stories.service';

const STORAGE_KEY = 'hn_saved_stories_v1';

const story = (id: number, overrides: Partial<HNItem> = {}): HNItem => ({
  id,
  type: 'story',
  by: `user-${id}`,
  time: 1700000000 + id,
  title: `Story ${id}`,
  url: `https://example.com/${id}`,
  score: id,
  descendants: id + 1,
  ...overrides,
});

const exportJson = (records: unknown[]): string =>
  JSON.stringify({
    schema: 'hnews.savedStories',
    version: 1,
    exportedAt: 1700000300,
    stories: records,
  });

describe('SavedStoriesService', () => {
  let service: SavedStoriesService;
  let hackernews: { getStoryWithAllComments: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(1700000000000);

    hackernews = { getStoryWithAllComments: vi.fn().mockReturnValue(of(null)) };

    TestBed.configureTestingModule({
      providers: [{ provide: HackernewsService, useValue: hackernews }],
    });
    service = TestBed.inject(SavedStoriesService);
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
    window.localStorage.clear();
  });

  it('saves, unsaves, and toggles stories', () => {
    const item = story(1);

    service.save(item);
    expect(service.isSaved(1)).toBe(true);
    expect(service.getAll()).toEqual([{ id: 1, savedAt: 1700000000000, story: item }]);

    expect(service.toggle(item)).toBe(false);
    expect(service.isSaved(1)).toBe(false);

    expect(service.toggle(item)).toBe(true);
    expect(service.isSaved(1)).toBe(true);

    service.unsave(1);
    expect(service.isSaved(1)).toBe(false);
  });

  it('warms the comment cache when saving, but not when unsaving', () => {
    service.save(story(7));
    expect(hackernews.getStoryWithAllComments).toHaveBeenCalledWith(7);

    hackernews.getStoryWithAllComments.mockClear();
    service.unsave(7);
    expect(hackernews.getStoryWithAllComments).not.toHaveBeenCalled();
  });

  it('does not re-warm the comment cache while a previous warm-up is in flight', () => {
    const pending = new Subject<null>();
    hackernews.getStoryWithAllComments.mockReturnValue(pending);

    service.save(story(10));
    service.unsave(10);
    service.save(story(10));

    expect(hackernews.getStoryWithAllComments).toHaveBeenCalledTimes(1);

    pending.next(null);
    pending.complete();

    service.unsave(10);
    service.save(story(10));
    expect(hackernews.getStoryWithAllComments).toHaveBeenCalledTimes(2);
  });

  it('reloads saved records from localStorage', () => {
    service.save(story(2));

    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(SavedStoriesService);

    expect(reloaded.isSaved(2)).toBe(true);
    expect(reloaded.getAll()[0].story?.title).toBe('Story 2');
  });

  it('exports a versioned saved stories envelope newest first', () => {
    service.save(story(1));
    vi.setSystemTime(1700000005000);
    service.save(story(2));
    vi.setSystemTime(1700000010000);

    const exported = JSON.parse(service.exportSavedStories());

    expect(exported).toMatchObject({
      schema: 'hnews.savedStories',
      version: 1,
      exportedAt: 1700000010000,
    });
    expect(exported.stories.map((record: { id: number }) => record.id)).toEqual([2, 1]);
  });

  it('merges imports by ID and preserves existing snapshots', () => {
    service.save(story(1, { title: 'Local title' }));

    const result = service.importSavedStories(
      exportJson([
        { id: 1, savedAt: 1600000000000, story: story(1, { title: 'Imported title' }) },
        { id: 2, savedAt: 1600000100000, story: story(2) },
      ]),
    );

    expect(result).toEqual({ imported: 1, updated: 1, skipped: 0 });
    expect(service.getAll()).toEqual([
      { id: 2, savedAt: 1600000100000, story: story(2) },
      { id: 1, savedAt: 1600000000000, story: story(1, { title: 'Local title' }) },
    ]);
  });

  it('uses imported snapshots when an existing record has none', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 3, savedAt: 1700000000000 }]));
    TestBed.resetTestingModule();
    service = TestBed.inject(SavedStoriesService);

    const result = service.importSavedStories(
      exportJson([{ id: 3, savedAt: 1700000000000, story: story(3) }]),
    );

    expect(result).toEqual({ imported: 0, updated: 1, skipped: 0 });
    expect(service.getAll()[0].story).toEqual(story(3));
  });

  it('counts duplicate imported IDs as skipped while keeping the earliest savedAt', () => {
    const result = service.importSavedStories(
      exportJson([
        { id: 4, savedAt: 1700000100000, story: story(4) },
        { id: 4, savedAt: 1600000100000, story: story(4, { title: 'Earlier duplicate' }) },
      ]),
    );

    expect(result).toEqual({ imported: 1, updated: 0, skipped: 1 });
    expect(service.getAll()[0]).toEqual({
      id: 4,
      savedAt: 1600000100000,
      story: story(4),
    });
  });

  it('throws for invalid JSON and invalid export envelopes', () => {
    expect(() => service.importSavedStories('{')).toThrow('Invalid saved stories export');
    expect(() => service.importSavedStories(JSON.stringify({ stories: [] }))).toThrow(
      'Invalid saved stories export',
    );
  });

  it('skips invalid records', () => {
    const result = service.importSavedStories(
      exportJson([
        { id: Number.NaN, savedAt: 1700000000000 },
        { id: 5, savedAt: 1700000000000, story: story(999) },
        { id: 6, savedAt: 'bad', story: story(6) },
      ]),
    );

    expect(result).toEqual({ imported: 2, updated: 0, skipped: 1 });
    expect(service.getAll().map((record) => record.id)).toEqual([5, 6]);
    expect(service.getAll().find((record) => record.id === 5)?.story).toBeUndefined();
    expect(service.getAll().find((record) => record.id === 6)?.savedAt).toBe(1700000000000);
  });

  it('clears saved stories without touching other localStorage keys', () => {
    window.localStorage.setItem('other-key', 'kept');
    service.save(story(7));

    service.clearSavedStories();

    expect(service.getAll()).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('[]');
    expect(window.localStorage.getItem('other-key')).toBe('kept');
  });

  it('updates snapshots for saved stories only', () => {
    service.save(story(8, { title: 'Old' }));
    service.updateSnapshots([story(8, { title: 'Fresh', score: 88 })]);
    service.updateSnapshots([story(9, { title: 'Ignored' })]);

    expect(service.getAll()).toEqual([
      { id: 8, savedAt: 1700000000000, story: story(8, { title: 'Fresh', score: 88 }) },
    ]);
  });
});
