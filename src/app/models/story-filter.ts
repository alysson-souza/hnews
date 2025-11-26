// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

import { HNItem } from './hn';

/**
 * Filter modes for story lists.
 * - 'default': Show all stories without filtering (unchanged behavior)
 * - 'topHalf': Upper half of recent stories by score (last 24h, capped at yesterday's midnight UTC)
 */
export type StoryFilterMode = 'default' | 'topHalf';

/**
 * Returns the Unix timestamp (in seconds) for the filter cutoff time.
 * This is the maximum of:
 * - 24 hours ago
 * - Midnight UTC of the previous day
 * This ensures there are always stories to show, even early in the morning.
 */
export function getFilterCutoffTimestamp(): number {
  const now = new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);

  // 24 hours ago
  const twentyFourHoursAgo = nowSeconds - 24 * 60 * 60;

  // Midnight UTC of yesterday
  const yesterdayMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1);
  const yesterdayMidnightSeconds = Math.floor(yesterdayMidnight / 1000);

  // Use the more recent of the two (cap at yesterday's midnight)
  return Math.max(twentyFourHoursAgo, yesterdayMidnightSeconds);
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
 * Returns the top half of recent stories by score (last 24h, capped at yesterday's midnight UTC).
 * @param stories - Array of stories to filter
 * @returns Top 50% of recent stories, sorted by score descending
 */
export function filterTopHalf(stories: HNItem[]): HNItem[] {
  if (stories.length === 0) return [];
  const cutoff = getFilterCutoffTimestamp();
  const recentStories = stories.filter((story) => story.time >= cutoff);
  if (recentStories.length === 0) return [];
  const sorted = sortByScoreDesc(recentStories);
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
  topHalf: 'Top 50%',
};
