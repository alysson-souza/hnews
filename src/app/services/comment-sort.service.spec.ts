import type { Mock, MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { HNItem } from '@models/hn';
import { CommentSortService } from './comment-sort.service';

describe('CommentSortService', () => {
  let service: CommentSortService;
  let localStorageSpy: MockedObject<Storage>;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Save original localStorage
    originalLocalStorage = window.localStorage;

    localStorageSpy = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as MockedObject<Storage>;
    (localStorageSpy.getItem as Mock).mockReturnValue(null);
    Object.defineProperty(window, 'localStorage', {
      value: localStorageSpy,
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('should be created', () => {
    service = TestBed.inject(CommentSortService);
    expect(service).toBeTruthy();
  });

  it('should default to "default" sort order', () => {
    (localStorageSpy.getItem as Mock).mockReturnValue(null);
    service = TestBed.inject(CommentSortService);
    expect(service.sortOrder()).toBe('default');
  });

  it('should load sort order from localStorage', () => {
    (localStorageSpy.getItem as Mock).mockReturnValue('popular');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentSortService);
    expect(service.sortOrder()).toBe('popular');
  });

  it('should fallback to default for invalid stored values', () => {
    (localStorageSpy.getItem as Mock).mockReturnValue('invalid');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentSortService);
    expect(service.sortOrder()).toBe('default');
  });

  it('should accept all valid sort orders', () => {
    ['default', 'popular', 'newest', 'oldest'].forEach((order) => {
      (localStorageSpy.getItem as Mock).mockReturnValue(order);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(CommentSortService);
      expect(newService.sortOrder()).toBe(order);
    });
  });

  it('should save sort order to localStorage', () => {
    service = TestBed.inject(CommentSortService);
    service.setSortOrder('newest');
    expect(localStorageSpy.setItem).toHaveBeenCalledWith('hnews_comment_sort', 'newest');
  });

  it('should update signal when sort order changes', () => {
    service = TestBed.inject(CommentSortService);
    service.setSortOrder('oldest');
    expect(service.sortOrder()).toBe('oldest');

    service.setSortOrder('popular');
    expect(service.sortOrder()).toBe('popular');
  });

  it('should handle localStorage not available', () => {
    // Delete localStorage to simulate unavailable environment
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const newService = new CommentSortService();
    expect(newService.sortOrder()).toBe('default');

    expect(() => newService.setSortOrder('popular')).not.toThrow();
  });

  describe('sortComments', () => {
    const nativeOrder = [1, 2, 3, 4];
    const comments: HNItem[] = [
      {
        id: 1,
        type: 'comment',
        by: 'user1',
        time: 1000,
        text: 'Comment 1',
        kids: [10, 11],
        descendants: 0,
      },
      {
        id: 2,
        type: 'comment',
        by: 'user2',
        time: 2000,
        text: 'Comment 2',
        kids: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
      },
      {
        id: 3,
        type: 'comment',
        by: 'user3',
        time: 1500,
        text: 'Comment 3',
        descendants: 20,
        kids: [30],
      },
      {
        id: 4,
        type: 'comment',
        by: 'user4',
        time: 1250,
        text: 'Comment 4',
        kids: [40, 41],
      },
    ];

    beforeEach(() => {
      service = TestBed.inject(CommentSortService);
    });

    it('should preserve native HN order for default sorting', () => {
      expect(service.sortComments(nativeOrder, comments, 'default')).toEqual(nativeOrder);
    });

    it('should fallback to native HN order when comments are not loaded', () => {
      expect(service.sortComments(nativeOrder, [], 'popular')).toEqual(nativeOrder);
    });

    it('should sort comments by newest first', () => {
      expect(service.sortComments(nativeOrder, comments, 'newest')).toEqual([2, 3, 4, 1]);
    });

    it('should sort comments by oldest first', () => {
      expect(service.sortComments(nativeOrder, comments, 'oldest')).toEqual([1, 4, 3, 2]);
    });

    it('should sort popular comments by descendant volume with kids as a lower bound', () => {
      expect(service.sortComments(nativeOrder, comments, 'popular')).toEqual([3, 2, 1, 4]);
    });

    it('should preserve native HN order when popularity counts are equal', () => {
      expect(service.sortComments(nativeOrder, comments, 'popular').slice(2)).toEqual([1, 4]);
    });
  });
});
