// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

import { HNItem } from './hn';
import {
  StoryFilterMode,
  getFilterCutoffTimestamp,
  sortByScoreDesc,
  filterTopHalf,
  applyStoryFilter,
  FILTER_MODE_LABELS,
} from './story-filter';

function createMockStory(id: number, score?: number, time?: number): HNItem {
  return {
    id,
    type: 'story',
    time: time ?? Math.floor(Date.now() / 1000),
    score,
    title: `Story ${id}`,
  };
}

describe('story-filter', () => {
  describe('getFilterCutoffTimestamp', () => {
    it('should return a Unix timestamp in seconds', () => {
      const cutoff = getFilterCutoffTimestamp();
      expect(typeof cutoff).toBe('number');
      expect(cutoff).toBeGreaterThan(0);
    });

    it('should return a timestamp less than or equal to current time', () => {
      const cutoff = getFilterCutoffTimestamp();
      const now = Math.floor(Date.now() / 1000);
      expect(cutoff).toBeLessThanOrEqual(now);
    });

    it('should return a timestamp no more than 24 hours ago', () => {
      const cutoff = getFilterCutoffTimestamp();
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = now - 24 * 60 * 60;
      expect(cutoff).toBeGreaterThanOrEqual(twentyFourHoursAgo);
    });

    it('should return a timestamp no earlier than yesterday midnight UTC', () => {
      const cutoff = getFilterCutoffTimestamp();
      const now = new Date();
      const yesterdayMidnight = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 1,
      );
      const yesterdayMidnightSeconds = Math.floor(yesterdayMidnight / 1000);
      expect(cutoff).toBeGreaterThanOrEqual(yesterdayMidnightSeconds);
    });
  });

  describe('sortByScoreDesc', () => {
    it('should sort stories by score in descending order', () => {
      const stories = [createMockStory(1, 10), createMockStory(2, 50), createMockStory(3, 30)];
      const sorted = sortByScoreDesc(stories);
      expect(sorted.map((s) => s.score)).toEqual([50, 30, 10]);
    });

    it('should treat undefined scores as 0', () => {
      const stories = [
        createMockStory(1, undefined),
        createMockStory(2, 10),
        createMockStory(3, 0),
      ];
      const sorted = sortByScoreDesc(stories);
      expect(sorted.map((s) => s.id)).toEqual([2, 1, 3]); // 10, 0 (undefined), 0
    });

    it('should not mutate the original array', () => {
      const stories = [createMockStory(1, 10), createMockStory(2, 50)];
      const original = [...stories];
      sortByScoreDesc(stories);
      expect(stories).toEqual(original);
    });

    it('should handle empty array', () => {
      const sorted = sortByScoreDesc([]);
      expect(sorted).toEqual([]);
    });
  });

  describe('filterTopHalf', () => {
    it('should return top half of recent stories by score', () => {
      const cutoff = getFilterCutoffTimestamp();
      const stories = [
        createMockStory(1, 10, cutoff + 3600),
        createMockStory(2, 20, cutoff + 3600),
        createMockStory(3, 30, cutoff + 3600),
        createMockStory(4, 40, cutoff + 3600),
      ];

      const result = filterTopHalf(stories);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.score)).toEqual([40, 30]);
    });

    it('should only include stories within the cutoff period', () => {
      const cutoff = getFilterCutoffTimestamp();
      const stories = [
        createMockStory(1, 100, cutoff + 3600), // Recent
        createMockStory(2, 200, cutoff - 3600), // Old (should be excluded)
        createMockStory(3, 50, cutoff + 3600), // Recent
      ];

      const result = filterTopHalf(stories);
      expect(result).toHaveLength(1); // ceil(2/2) = 1
      expect(result[0].id).toBe(1); // Highest score from recent
    });

    it('should round up for odd counts', () => {
      const cutoff = getFilterCutoffTimestamp();
      const stories = [
        createMockStory(1, 10, cutoff + 3600),
        createMockStory(2, 20, cutoff + 3600),
        createMockStory(3, 30, cutoff + 3600),
      ];

      const result = filterTopHalf(stories);
      expect(result).toHaveLength(2); // ceil(3/2) = 2
      expect(result.map((s) => s.score)).toEqual([30, 20]);
    });

    it('should return single item for single element array from recent', () => {
      const cutoff = getFilterCutoffTimestamp();
      const stories = [createMockStory(1, 100, cutoff + 3600)];
      const result = filterTopHalf(stories);
      expect(result).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = filterTopHalf([]);
      expect(result).toEqual([]);
    });

    it('should return empty when no recent stories', () => {
      const cutoff = getFilterCutoffTimestamp();
      const stories = [
        createMockStory(1, 100, cutoff - 3600), // Old
        createMockStory(2, 200, cutoff - 7200), // Old
      ];

      const result = filterTopHalf(stories);
      expect(result).toEqual([]);
    });

    it('should treat undefined scores as 0', () => {
      const cutoff = getFilterCutoffTimestamp();
      const stories = [
        createMockStory(1, undefined, cutoff + 3600),
        createMockStory(2, 10, cutoff + 3600),
        createMockStory(3, 5, cutoff + 3600),
        createMockStory(4, 20, cutoff + 3600),
      ];

      const result = filterTopHalf(stories);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toEqual([4, 2]); // Top 2 by score
    });
  });

  describe('applyStoryFilter', () => {
    it('should return original stories for default mode', () => {
      const cutoff = getFilterCutoffTimestamp();
      const stories = [
        createMockStory(1, 100, cutoff + 3600),
        createMockStory(2, 50, cutoff + 3600),
        createMockStory(3, 200, cutoff - 3600), // Old
      ];
      const result = applyStoryFilter(stories, 'default');
      expect(result).toEqual(stories);
    });

    it('should apply topHalf filter to recent stories only', () => {
      const cutoff = getFilterCutoffTimestamp();
      const stories = [
        createMockStory(1, 100, cutoff + 3600),
        createMockStory(2, 50, cutoff + 3600),
        createMockStory(3, 200, cutoff - 3600), // Old
      ];
      const result = applyStoryFilter(stories, 'topHalf');
      expect(result).toHaveLength(1); // ceil(2/2) = 1, only recent stories
      expect(result[0].id).toBe(1); // Highest score from recent (100)
      expect(result.every((s) => s.time >= cutoff)).toBe(true);
    });
  });

  describe('FILTER_MODE_LABELS', () => {
    it('should have labels for all filter modes', () => {
      const modes: StoryFilterMode[] = ['default', 'topHalf'];
      modes.forEach((mode) => {
        expect(FILTER_MODE_LABELS[mode]).toBeDefined();
        expect(typeof FILTER_MODE_LABELS[mode]).toBe('string');
      });
    });

    it('should have expected label values', () => {
      expect(FILTER_MODE_LABELS.default).toBe('Default');
      expect(FILTER_MODE_LABELS.topHalf).toBe('Top 50%');
    });
  });
});
