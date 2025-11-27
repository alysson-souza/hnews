// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { StoryListStateService } from './story-list-state.service';
import { HNItem } from '../models/hn';

describe('StoryListStateService', () => {
  let service: StoryListStateService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [StoryListStateService],
    });
    service = TestBed.inject(StoryListStateService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('saves and retrieves state with storyIds', () => {
    const storyIds = [1, 2, 3];
    const currentPage = 1;
    const totalStoryIds = [1, 2, 3, 4, 5];
    const selectedIndex = 2;

    service.saveState('top', storyIds, currentPage, totalStoryIds, selectedIndex);

    const retrieved = service.getState('top');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.storyIds).toEqual(storyIds);
    expect(retrieved?.currentPage).toBe(currentPage);
    expect(retrieved?.totalStoryIds).toEqual(totalStoryIds);
    expect(retrieved?.selectedIndex).toBe(selectedIndex);
  });

  it('returns null for legacy state with stories array', () => {
    const legacyState = {
      stories: [
        { id: 1, type: 'story', title: 'Story 1', time: 123 },
        { id: 2, type: 'story', title: 'Story 2', time: 456 },
      ] as HNItem[],
      currentPage: 0,
      totalStoryIds: [1, 2, 3],
      storyType: 'top',
      selectedIndex: null,
      timestamp: Date.now(),
    };

    sessionStorage.setItem('hnews-story-list-top', JSON.stringify(legacyState));

    const retrieved = service.getState('top');
    expect(retrieved).toBeNull();
  });

  it('returns null for state missing storyIds', () => {
    const invalidState = {
      currentPage: 0,
      totalStoryIds: [1, 2, 3],
      storyType: 'top',
      selectedIndex: null,
      timestamp: Date.now(),
    };

    sessionStorage.setItem('hnews-story-list-top', JSON.stringify(invalidState));

    const retrieved = service.getState('top');
    expect(retrieved).toBeNull();
  });

  it('returns null for state with non-array storyIds', () => {
    const invalidState = {
      storyIds: 'not-an-array',
      currentPage: 0,
      totalStoryIds: [1, 2, 3],
      storyType: 'top',
      selectedIndex: null,
      timestamp: Date.now(),
    };

    sessionStorage.setItem('hnews-story-list-top', JSON.stringify(invalidState));

    const retrieved = service.getState('top');
    expect(retrieved).toBeNull();
  });

  it('returns null when state has expired', () => {
    const expiredState = {
      storyIds: [1, 2, 3],
      currentPage: 0,
      totalStoryIds: [1, 2, 3, 4, 5],
      storyType: 'top',
      selectedIndex: null,
      timestamp: Date.now() - 11 * 60 * 1000, // 11 minutes ago
    };

    sessionStorage.setItem('hnews-story-list-top', JSON.stringify(expiredState));

    const retrieved = service.getState('top');
    expect(retrieved).toBeNull();
  });

  it('hasValidState returns true for valid state', () => {
    service.saveState('best', [10, 20, 30], 0, [10, 20, 30, 40], null);
    expect(service.hasValidState('best')).toBe(true);
  });

  it('hasValidState returns false for missing state', () => {
    expect(service.hasValidState('new')).toBe(false);
  });

  it('hasValidState returns false for empty storyIds', () => {
    service.saveState('ask', [], 0, [1, 2, 3], null);
    expect(service.hasValidState('ask')).toBe(false);
  });

  it('clearState removes the cached state', () => {
    service.saveState('show', [1, 2], 0, [1, 2, 3], null);
    expect(service.getState('show')).not.toBeNull();

    service.clearState('show');
    expect(service.getState('show')).toBeNull();
  });

  it('clearAllStates removes all cached states', () => {
    service.saveState('top', [1], 0, [1, 2], null);
    service.saveState('best', [3], 0, [3, 4], null);

    service.clearAllStates();

    expect(service.getState('top')).toBeNull();
    expect(service.getState('best')).toBeNull();
  });
});
