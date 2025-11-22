import type { Mock } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { CommentStateService, CommentStateEntry } from './comment-state.service';

describe('CommentStateService', () => {
  let service: CommentStateService;
  let localStorageMock: {
    [key: string]: string;
  };

  beforeEach(() => {
    localStorageMock = {};

    vi.spyOn(window.localStorage, 'getItem').mockImplementation((key: string) => {
      return localStorageMock[key] || null;
    });

    vi.spyOn(window.localStorage, 'setItem').mockImplementation((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getState', () => {
    it('should return undefined for unsaved comment', () => {
      expect(service.getState(12345)).toBeUndefined();
    });

    it('should return saved state', () => {
      service.setState(12345, { collapsed: true, repliesExpanded: true, loadedPages: 2 });
      const state = service.getState(12345);

      expect(state).toBeDefined();
      expect(state!.collapsed).toBe(true);
      expect(state!.repliesExpanded).toBe(true);
      expect(state!.loadedPages).toBe(2);
    });
  });

  describe('setState', () => {
    it('should create new state with defaults', () => {
      service.setState(12345, { collapsed: true });
      const state = service.getState(12345);

      expect(state).toEqual({
        collapsed: true,
        repliesExpanded: false,
        loadedPages: 0,
        lastAccessed: expect.any(Number),
      });
    });

    it('should merge with existing state', () => {
      service.setState(12345, { collapsed: true, loadedPages: 2 });
      service.setState(12345, { repliesExpanded: true });

      const state = service.getState(12345);
      expect(state!.collapsed).toBe(true);
      expect(state!.repliesExpanded).toBe(true);
      expect(state!.loadedPages).toBe(2);
    });

    it('should update lastAccessed timestamp', async () => {
      service.setState(12345, { collapsed: true });
      const firstTimestamp = service.getState(12345)!.lastAccessed;

      // Wait a small amount to ensure timestamp changes
      setTimeout(() => {
        service.setState(12345, { repliesExpanded: true });
        const secondTimestamp = service.getState(12345)!.lastAccessed;

        expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
      }, 10);
    });

    it('should persist to localStorage', () => {
      service.setState(12345, { collapsed: true, repliesExpanded: true, loadedPages: 2 });

      expect(window.localStorage.setItem).toHaveBeenCalled();

      const stored = localStorageMock['hn_comment_state.v1'];
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored);
      expect(parsed['12345']).toBeDefined();
      expect(parsed['12345'].collapsed).toBe(true);
      expect(parsed['12345'].repliesExpanded).toBe(true);
      expect(parsed['12345'].loadedPages).toBe(2);
    });
  });

  describe('convenience getters', () => {
    it('isCollapsed should return false by default', () => {
      expect(service.isCollapsed(12345)).toBe(false);
    });

    it('isCollapsed should return saved value', () => {
      service.setCollapsed(12345, true);
      expect(service.isCollapsed(12345)).toBe(true);
    });

    it('areRepliesExpanded should return false by default', () => {
      expect(service.areRepliesExpanded(12345)).toBe(false);
    });

    it('areRepliesExpanded should return saved value', () => {
      service.setRepliesExpanded(12345, true);
      expect(service.areRepliesExpanded(12345)).toBe(true);
    });

    it('getLoadedPages should return 0 by default', () => {
      expect(service.getLoadedPages(12345)).toBe(0);
    });

    it('getLoadedPages should return saved value', () => {
      service.setLoadedPages(12345, 3);
      expect(service.getLoadedPages(12345)).toBe(3);
    });
  });

  describe('convenience setters', () => {
    it('setCollapsed should update only collapsed state', () => {
      service.setState(12345, { repliesExpanded: true, loadedPages: 2 });
      service.setCollapsed(12345, true);

      const state = service.getState(12345);
      expect(state!.collapsed).toBe(true);
      expect(state!.repliesExpanded).toBe(true);
      expect(state!.loadedPages).toBe(2);
    });

    it('setRepliesExpanded should update only repliesExpanded state', () => {
      service.setState(12345, { collapsed: true, loadedPages: 2 });
      service.setRepliesExpanded(12345, true);

      const state = service.getState(12345);
      expect(state!.collapsed).toBe(true);
      expect(state!.repliesExpanded).toBe(true);
      expect(state!.loadedPages).toBe(2);
    });

    it('setLoadedPages should update only loadedPages state', () => {
      service.setState(12345, { collapsed: true, repliesExpanded: true });
      service.setLoadedPages(12345, 5);

      const state = service.getState(12345);
      expect(state!.collapsed).toBe(true);
      expect(state!.repliesExpanded).toBe(true);
      expect(state!.loadedPages).toBe(5);
    });

    it('setLoadedPages should not allow negative values', () => {
      service.setLoadedPages(12345, -5);
      expect(service.getLoadedPages(12345)).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all saved states', () => {
      service.setState(111, { collapsed: true });
      service.setState(222, { repliesExpanded: true });

      service.clearAll();

      expect(service.getState(111)).toBeUndefined();
      expect(service.getState(222)).toBeUndefined();
    });

    it('should persist clear to localStorage', () => {
      service.setState(111, { collapsed: true });
      service.clearAll();

      const stored = localStorageMock['hn_comment_state.v1'];
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored);
      expect(Object.keys(parsed).length).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should restore state from localStorage on initialization', () => {
      const testData = {
        '12345': {
          collapsed: true,
          repliesExpanded: true,
          loadedPages: 3,
          lastAccessed: Date.now(),
        },
        '67890': {
          collapsed: false,
          repliesExpanded: true,
          loadedPages: 1,
          lastAccessed: Date.now(),
        },
      };
      localStorageMock['hn_comment_state.v1'] = JSON.stringify(testData);

      const newService = new CommentStateService();

      expect(newService.isCollapsed(12345)).toBe(true);
      expect(newService.areRepliesExpanded(12345)).toBe(true);
      expect(newService.getLoadedPages(12345)).toBe(3);

      expect(newService.isCollapsed(67890)).toBe(false);
      expect(newService.areRepliesExpanded(67890)).toBe(true);
      expect(newService.getLoadedPages(67890)).toBe(1);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock['hn_comment_state.v1'] = 'invalid json';

      expect(() => new CommentStateService()).not.toThrow();
    });

    it('should handle invalid entry format', () => {
      const testData = {
        '12345': {
          collapsed: true,
          repliesExpanded: true,
          loadedPages: 2,
          lastAccessed: Date.now(),
        },
        '67890': {
          collapsed: 'not-a-boolean', // Invalid
          repliesExpanded: true,
          loadedPages: 1,
          lastAccessed: Date.now(),
        },
        '11111': {
          collapsed: true,
          repliesExpanded: true,
          // Missing loadedPages
          lastAccessed: Date.now(),
        },
      };
      localStorageMock['hn_comment_state.v1'] = JSON.stringify(testData);

      const newService = new CommentStateService();

      expect(newService.getState(12345)).toBeDefined(); // Valid entry
      expect(newService.getState(67890)).toBeUndefined(); // Invalid entry
      expect(newService.getState(11111)).toBeUndefined(); // Invalid entry
    });

    it('should handle localStorage errors gracefully', () => {
      (window.localStorage.setItem as Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => service.setState(12345, { collapsed: true })).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should remove entries older than 90 days', () => {
      const now = Date.now();
      const oldTimestamp = now - 91 * 24 * 60 * 60 * 1000; // 91 days ago
      const recentTimestamp = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago

      const testData = {
        '12345': {
          collapsed: true,
          repliesExpanded: false,
          loadedPages: 0,
          lastAccessed: oldTimestamp,
        },
        '67890': {
          collapsed: true,
          repliesExpanded: false,
          loadedPages: 0,
          lastAccessed: recentTimestamp,
        },
      };
      localStorageMock['hn_comment_state.v1'] = JSON.stringify(testData);

      const newService = new CommentStateService();

      expect(newService.getState(12345)).toBeUndefined(); // Old entry removed
      expect(newService.getState(67890)).toBeDefined(); // Recent entry kept
    });

    it('should limit to MAX_ENTRIES (1000)', () => {
      const now = Date.now();
      const testData: Record<string, CommentStateEntry> = {};

      // Create 1500 entries
      for (let i = 0; i < 1500; i++) {
        testData[i.toString()] = {
          collapsed: true,
          repliesExpanded: false,
          loadedPages: 0,
          lastAccessed: now - i * 1000, // Decreasing timestamps
        };
      }

      localStorageMock['hn_comment_state.v1'] = JSON.stringify(testData);

      const newService = new CommentStateService();

      // Most recent 1000 should be kept
      expect(newService.getState(0)).toBeDefined(); // Most recent
      expect(newService.getState(999)).toBeDefined(); // 1000th most recent
      expect(newService.getState(1499)).toBeUndefined(); // Oldest, should be removed
    });
  });

  describe('multiple comments', () => {
    it('should handle multiple comments independently', () => {
      service.setState(111, { collapsed: true, repliesExpanded: false, loadedPages: 0 });
      service.setState(222, { collapsed: false, repliesExpanded: true, loadedPages: 2 });
      service.setState(333, { collapsed: true, repliesExpanded: true, loadedPages: 5 });

      expect(service.isCollapsed(111)).toBe(true);
      expect(service.areRepliesExpanded(111)).toBe(false);
      expect(service.getLoadedPages(111)).toBe(0);

      expect(service.isCollapsed(222)).toBe(false);
      expect(service.areRepliesExpanded(222)).toBe(true);
      expect(service.getLoadedPages(222)).toBe(2);

      expect(service.isCollapsed(333)).toBe(true);
      expect(service.areRepliesExpanded(333)).toBe(true);
      expect(service.getLoadedPages(333)).toBe(5);
    });
  });
});
