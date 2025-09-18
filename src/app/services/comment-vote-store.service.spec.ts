// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { CommentVoteStoreService, COMMENT_VOTE_STORAGE } from './comment-vote-store.service';

describe('CommentVoteStoreService', () => {
  const storageKey = 'votedComments';
  let storageMap: Map<string, string>;
  let mockStorage: Storage;

  beforeEach(() => {
    storageMap = new Map();
    mockStorage = {
      get length() {
        return storageMap.size;
      },
      clear: vi.fn(() => storageMap.clear()),
      getItem: vi.fn((key: string) => storageMap.get(key) ?? null),
      key: vi.fn((index: number) => Array.from(storageMap.keys())[index] ?? null),
      removeItem: vi.fn((key: string) => storageMap.delete(key)),
      setItem: vi.fn((key: string, value: string) => {
        storageMap.set(key, value);
      }),
    } as unknown as Storage;

    TestBed.configureTestingModule({
      providers: [
        { provide: COMMENT_VOTE_STORAGE, useValue: mockStorage },
        CommentVoteStoreService,
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('should restore votes from storage on creation', () => {
    const storedVotes = [1, 2, 3];
    storageMap.set(storageKey, JSON.stringify(storedVotes));

    const service = TestBed.inject(CommentVoteStoreService);

    expect(Array.from(service.votedCommentIds())).toEqual(storedVotes);
  });

  it('should ignore malformed storage values', () => {
    storageMap.set(storageKey, 'not json');

    const service = TestBed.inject(CommentVoteStoreService);

    expect(service.votedCommentIds().size).toBe(0);
  });

  it('should persist new votes', () => {
    const service = TestBed.inject(CommentVoteStoreService);

    service.vote(42);

    expect(mockStorage.setItem).toHaveBeenCalledWith(storageKey, '[42]');
    expect(service.votedCommentIds().has(42)).toBe(true);
  });

  it('should avoid persisting duplicates', () => {
    storageMap.set(storageKey, JSON.stringify([7]));
    const service = TestBed.inject(CommentVoteStoreService);

    service.vote(7);

    expect(mockStorage.setItem).toHaveBeenCalledTimes(0);
    expect(Array.from(service.votedCommentIds())).toEqual([7]);
  });

  it('should handle missing storage gracefully', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: COMMENT_VOTE_STORAGE, useValue: null }, CommentVoteStoreService],
    });

    const service = TestBed.inject(CommentVoteStoreService);

    expect(service.votedCommentIds().size).toBe(0);
    service.vote(11);
    expect(service.votedCommentIds().has(11)).toBe(true);
  });
});
