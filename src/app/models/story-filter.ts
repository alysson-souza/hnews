// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

import { HNItem } from './hn';

/**
 * Filter modes for story lists.
 * - 'default': Show all stories without filtering (unchanged behavior)
 * - 'todayTop20': Top 20 highest-scoring stories since midnight UTC
 * - 'topHalf': Upper half of stories by score
 */
export type StoryFilterMode = 'default' | 'todayTop20' | 'topHalf';

/**
 * Returns the Unix timestamp (in seconds) for the start of today in UTC.
 */
export function getUtcMidnightTimestamp(): number {
  const now = new Date();
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor(utcMidnight / 1000);
}

/**
 * Returns the score of a story, treating undefined/null as 0.
 */
function getScore(item: HNItem): number {
  return item.score ?? 0;
}

/**
 * Sorts stories by score in descending order.
 * Stories with higher scores appear first.
 */
export function sortByScoreDesc(stories: HNItem[]): HNItem[] {
  return [...stories].sort((a, b) => getScore(b) - getScore(a));
}

/**
 * Filters stories posted today (since midnight UTC) and returns the top 20 by score.
 * @param stories - Array of stories to filter
 * @returns Top 20 stories from today, sorted by score descending
 */
export function filterTodayTop20(stories: HNItem[]): HNItem[] {
  const midnightUtc = getUtcMidnightTimestamp();
  const todayStories = stories.filter((story) => story.time >= midnightUtc);
  const sorted = sortByScoreDesc(todayStories);
  return sorted.slice(0, 20);
}

/**
 * Returns the top half of stories by score.
 * @param stories - Array of stories to filter
 * @returns Top 50% of stories, sorted by score descending
 */
export function filterTopHalf(stories: HNItem[]): HNItem[] {
  if (stories.length === 0) return [];
  const sorted = sortByScoreDesc(stories);
  const halfCount = Math.ceil(sorted.length / 2);
  return sorted.slice(0, halfCount);
}

/**
 * Applies the specified filter mode to the stories.
 * @param stories - Array of stories to filter
 * @param mode - The filter mode to apply
 * @returns Filtered stories based on the mode
 */
export function applyStoryFilter(stories: HNItem[], mode: StoryFilterMode): HNItem[] {
  switch (mode) {
    case 'todayTop20':
      return filterTodayTop20(stories);
    case 'topHalf':
      return filterTopHalf(stories);
    case 'default':
    default:
      return stories;
  }
}

/**
 * Human-readable labels for filter modes.
 */
export const FILTER_MODE_LABELS: Record<StoryFilterMode, string> = {
  default: 'Default',
  todayTop20: 'Top 20 Today',
  topHalf: 'Top 50%',
};
