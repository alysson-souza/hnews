// SPDX-License-Identifier: MIT
// Shared search option types for Algolia HN Search

export type SearchSort = 'relevance' | 'date' | 'points' | 'comments';
export type SearchDateRange = 'all' | '24h' | 'week' | 'month' | 'year';

export interface SearchOptions {
  query: string;
  tags?: string;
  sortBy?: SearchSort;
  dateRange?: SearchDateRange;
  page?: number;
}
