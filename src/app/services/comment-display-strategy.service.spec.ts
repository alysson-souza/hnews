// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { HNItem } from '../models/hn';
import { CommentDisplayStrategyService } from './comment-display-strategy.service';

describe('CommentDisplayStrategyService', () => {
  let service: CommentDisplayStrategyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentDisplayStrategyService);
  });

  it('detects small threads within threshold', () => {
    expect(service.isSmallThread(1, 40)).toBe(true);
    expect(service.isSmallThread(40, 40)).toBe(true);
  });

  it('does not detect empty or large threads as small', () => {
    expect(service.isSmallThread(undefined, 40)).toBe(false);
    expect(service.isSmallThread(0, 40)).toBe(false);
    expect(service.isSmallThread(41, 40)).toBe(false);
  });

  it('returns full top-level count when small thread mode is enabled', () => {
    const count = service.getInitialVisibleTopLevelCount({
      totalTopLevel: 6,
      pageSize: 10,
      smallThreadMode: true,
    });

    expect(count).toBe(6);
  });

  it('caps initial count by page size when small thread mode is disabled', () => {
    const count = service.getInitialVisibleTopLevelCount({
      totalTopLevel: 25,
      pageSize: 10,
      smallThreadMode: false,
    });

    expect(count).toBe(10);
  });

  it('falls back to page size when there are no top-level comments', () => {
    const count = service.getInitialVisibleTopLevelCount({
      totalTopLevel: 0,
      pageSize: 10,
      smallThreadMode: false,
    });

    expect(count).toBe(10);
  });

  it('resolves strategy values for an item', () => {
    const item: HNItem = {
      id: 1,
      type: 'story',
      time: 1,
      descendants: 12,
      kids: [11, 12, 13],
    };

    const result = service.resolveForItem(item, {
      pageSize: 10,
      smallThreadDescendantsThreshold: 40,
    });

    expect(result.smallThreadMode).toBe(true);
    expect(result.initialVisibleTopLevelCount).toBe(3);
  });
});
