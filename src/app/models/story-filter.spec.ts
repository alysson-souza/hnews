// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

import { HNItem } from './hn';
import {
  StoryFilterMode,
  getUtcMidnightTimestamp,
  sortByScoreDesc,
  filterTodayTop20,
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
  describe('getUtcMidnightTimestamp', () => {
    it('should return a Unix timestamp in seconds', () => {
      const midnight = getUtcMidnightTimestamp();
      expect(typeof midnight).toBe('number');
      expect(midnight).toBeGreaterThan(0);
    });

    it('should return timestamp at start of day UTC', () => {
      const midnight = getUtcMidnightTimestamp();
      const date = new Date(midnight * 1000);
      expect(date.getUTCHours()).toBe(0);
      expect(date.getUTCMinutes()).toBe(0);
      expect(date.getUTCSeconds()).toBe(0);
    });

    it('should return a timestamp less than or equal to current time', () => {
      const midnight = getUtcMidnightTimestamp();
      const now = Math.floor(Date.now() / 1000);
      expect(midnight).toBeLessThanOrEqual(now);
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

  describe('filterTodayTop20', () => {
    it('should only include stories from today', () => {
      const midnight = getUtcMidnightTimestamp();
      const todayStory = createMockStory(1, 100, midnight + 3600); // 1 hour after midnight
      const yesterdayStory = createMockStory(2, 200, midnight - 3600); // 1 hour before midnight

      const result = filterTodayTop20([todayStory, yesterdayStory]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should include stories exactly at midnight', () => {
      const midnight = getUtcMidnightTimestamp();
      const atMidnight = createMockStory(1, 100, midnight);
      const beforeMidnight = createMockStory(2, 200, midnight - 1);

      const result = filterTodayTop20([atMidnight, beforeMidnight]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should return top 20 by score', () => {
      const midnight = getUtcMidnightTimestamp();
      const stories = Array.from({ length: 30 }, (_, i) =>
        createMockStory(i + 1, i + 1, midnight + 3600),
      );

      const result = filterTodayTop20(stories);
      expect(result).toHaveLength(20);
      expect(result[0].score).toBe(30); // Highest score
      expect(result[19].score).toBe(11); // 20th highest
    });

    it('should return all if less than 20 stories today', () => {
      const midnight = getUtcMidnightTimestamp();
      const stories = Array.from({ length: 5 }, (_, i) =>
        createMockStory(i + 1, i + 1, midnight + 3600),
      );

      const result = filterTodayTop20(stories);
      expect(result).toHaveLength(5);
    });

    it('should handle missing scores as 0', () => {
      const midnight = getUtcMidnightTimestamp();
      const withScore = createMockStory(1, 10, midnight + 3600);
      const withoutScore = createMockStory(2, undefined, midnight + 3600);

      const result = filterTodayTop20([withoutScore, withScore]);
      expect(result[0].id).toBe(1); // Higher score first
      expect(result[1].id).toBe(2);
    });

    it('should handle empty array', () => {
      const result = filterTodayTop20([]);
      expect(result).toEqual([]);
    });
  });

  describe('filterTopHalf', () => {
    it('should return top half by score', () => {
      const stories = [
        createMockStory(1, 10),
        createMockStory(2, 20),
        createMockStory(3, 30),
        createMockStory(4, 40),
      ];

      const result = filterTopHalf(stories);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.score)).toEqual([40, 30]);
    });

    it('should round up for odd counts', () => {
      const stories = [createMockStory(1, 10), createMockStory(2, 20), createMockStory(3, 30)];

      const result = filterTopHalf(stories);
      expect(result).toHaveLength(2); // ceil(3/2) = 2
      expect(result.map((s) => s.score)).toEqual([30, 20]);
    });

    it('should return single item for single element array', () => {
      const stories = [createMockStory(1, 100)];
      const result = filterTopHalf(stories);
      expect(result).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = filterTopHalf([]);
      expect(result).toEqual([]);
    });

    it('should treat undefined scores as 0', () => {
      const stories = [
        createMockStory(1, undefined),
        createMockStory(2, 10),
        createMockStory(3, 5),
        createMockStory(4, 20),
      ];

      const result = filterTopHalf(stories);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toEqual([4, 2]); // Top 2 by score
    });
  });

  describe('applyStoryFilter', () => {
    const midnight = getUtcMidnightTimestamp();
    const stories = [
      createMockStory(1, 100, midnight + 3600),
      createMockStory(2, 50, midnight + 3600),
      createMockStory(3, 200, midnight - 3600), // Yesterday
    ];

    it('should return original stories for default mode', () => {
      const result = applyStoryFilter(stories, 'default');
      expect(result).toEqual(stories);
    });

    it('should apply todayTop20 filter', () => {
      const result = applyStoryFilter(stories, 'todayTop20');
      expect(result).toHaveLength(2);
      expect(result.every((s) => s.time >= midnight)).toBe(true);
    });

    it('should apply topHalf filter', () => {
      const result = applyStoryFilter(stories, 'topHalf');
      expect(result).toHaveLength(2);
      expect(result[0].score).toBe(200);
    });
  });

  describe('FILTER_MODE_LABELS', () => {
    it('should have labels for all filter modes', () => {
      const modes: StoryFilterMode[] = ['default', 'todayTop20', 'topHalf'];
      modes.forEach((mode) => {
        expect(FILTER_MODE_LABELS[mode]).toBeDefined();
        expect(typeof FILTER_MODE_LABELS[mode]).toBe('string');
      });
    });

    it('should have expected label values', () => {
      expect(FILTER_MODE_LABELS.default).toBe('Default');
      expect(FILTER_MODE_LABELS.todayTop20).toBe('Top 20 Today');
      expect(FILTER_MODE_LABELS.topHalf).toBe('Top 50%');
    });
  });
});
