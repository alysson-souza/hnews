// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

import { TestBed } from '@angular/core/testing';
import { StoryFilterPreferencesService } from './story-filter-preferences.service';
import { StoryFilterMode } from '../models/story-filter';

describe('StoryFilterPreferencesService', () => {
  const STORAGE_KEY = 'hnews-story-filter-mode';

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    // Restore all mocks to prevent leaking between tests
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  function createService(): StoryFilterPreferencesService {
    TestBed.configureTestingModule({
      providers: [StoryFilterPreferencesService],
    });
    return TestBed.inject(StoryFilterPreferencesService);
  }

  describe('initialization', () => {
    it('should default to "default" mode when no preference is stored', () => {
      const service = createService();
      expect(service.filterMode()).toBe('default');
    });

    it('should load stored preference on initialization', () => {
      window.localStorage.setItem(STORAGE_KEY, 'top20');
      const service = createService();
      expect(service.filterMode()).toBe('top20');
    });

    it('should load topHalf preference', () => {
      window.localStorage.setItem(STORAGE_KEY, 'topHalf');
      const service = createService();
      expect(service.filterMode()).toBe('topHalf');
    });

    it('should ignore invalid stored values', () => {
      window.localStorage.setItem(STORAGE_KEY, 'invalidMode');
      const service = createService();
      expect(service.filterMode()).toBe('default');
    });
  });

  describe('setFilterMode', () => {
    it('should update the filter mode signal', () => {
      const service = createService();
      service.setFilterMode('top20');
      expect(service.filterMode()).toBe('top20');
    });

    it('should persist the filter mode to localStorage', () => {
      const service = createService();
      service.setFilterMode('topHalf');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('topHalf');
    });

    it('should remove localStorage item when setting to default', () => {
      const service = createService();
      service.setFilterMode('top20');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('top20');

      service.setFilterMode('default');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should not update if setting the same mode', () => {
      const service = createService();
      const setItemSpy = vi.spyOn(window.localStorage, 'setItem');

      service.setFilterMode('top20');
      expect(setItemSpy).toHaveBeenCalledTimes(1);

      // Setting the same mode should not trigger another save
      service.setFilterMode('top20');
      expect(setItemSpy).toHaveBeenCalledTimes(1);
    });

    it('should allow cycling through all modes', () => {
      const service = createService();
      const modes: StoryFilterMode[] = ['default', 'top20', 'topHalf'];

      modes.forEach((mode) => {
        service.setFilterMode(mode);
        expect(service.filterMode()).toBe(mode);
      });
    });
  });

  describe('error handling', () => {
    it('should handle localStorage setItem errors gracefully', () => {
      const service = createService();
      const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      try {
        // Should not throw
        expect(() => service.setFilterMode('top20')).not.toThrow();
        // Signal should still update
        expect(service.filterMode()).toBe('top20');
      } finally {
        setItemSpy.mockRestore();
      }
    });

    it('should handle localStorage removeItem errors gracefully', () => {
      const service = createService();
      service.setFilterMode('top20');

      const removeItemSpy = vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('StorageError');
      });

      try {
        // Should not throw
        expect(() => service.setFilterMode('default')).not.toThrow();
        expect(service.filterMode()).toBe('default');
      } finally {
        removeItemSpy.mockRestore();
      }
    });
  });

  describe('filterMode signal', () => {
    it('should be readonly', () => {
      const service = createService();
      // The filterMode is a readonly signal (Signal, not WritableSignal)
      expect(service.filterMode).toBeDefined();
      expect(typeof service.filterMode).toBe('function');
    });
  });
});
