// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
// Domain models and helpers for Algolia HN Search API

export interface AlgoliaHitRaw {
  objectID: string;
  title?: string;
  url?: string;
  author?: string;
  points?: number;
  num_comments?: number;
  created_at?: string; // ISO string
  created_at_i?: number; // unix seconds
  story_text?: string | null;
  comment_text?: string | null;
  story_id?: number | null;
  story_title?: string | null;
  story_url?: string | null;
  parent_id?: number | null;
  _tags?: string[];
}

/**
 * Response from Algolia /items/{id} endpoint.
 * Returns the full item with nested children (comments).
 * This is the key to avoiding N+1 requests when loading comment threads.
 */
export interface AlgoliaItemResponse {
  id: number;
  created_at: string; // ISO string
  created_at_i: number; // unix seconds
  type: 'story' | 'comment' | 'poll' | 'pollopt' | 'job';
  author: string | null;
  title: string | null;
  url: string | null;
  text: string | null;
  points: number | null;
  parent_id: number | null;
  story_id: number | null;
  children: AlgoliaItemResponse[];
  options?: unknown[];
}

export interface AlgoliaSearchResponse<T = AlgoliaHitRaw> {
  hits?: T[];
  nbHits?: number;
  page?: number;
  nbPages?: number;
  hitsPerPage?: number;
}

export interface AlgoliaStory {
  id: number; // story id
  title: string;
  url?: string;
  author: string;
  points?: number;
  numComments?: number;
  createdAt: number; // unix seconds
}

export function mapHitToStory(hit: AlgoliaHitRaw): AlgoliaStory | null {
  // Some hits are comments; we map only story-like hits here
  const id = (hit.story_id ?? Number(hit.objectID)) as number | undefined;
  const title = hit.title ?? hit.story_title ?? undefined;
  const url = hit.url ?? hit.story_url ?? undefined;
  const author = hit.author ?? '';
  const createdAt =
    hit.created_at_i ?? (hit.created_at ? Date.parse(hit.created_at) / 1000 : undefined);
  const points = hit.points;
  const numComments = hit.num_comments;

  if (!id || !title || !createdAt) return null;

  return {
    id,
    title,
    url,
    author,
    points,
    numComments,
    createdAt,
  };
}

/**
 * HNItem compatible shape (matches HN Firebase API format).
 * Import HNItem from hn.ts to avoid circular deps in services.
 */
interface HNItemShape {
  id: number;
  type: 'job' | 'story' | 'comment' | 'poll' | 'pollopt';
  by?: string;
  time: number;
  text?: string;
  title?: string;
  url?: string;
  score?: number;
  parent?: number;
  kids?: number[];
  descendants?: number;
  deleted?: boolean;
  dead?: boolean;
}

/**
 * Convert an Algolia item response to HNItem format.
 * The kids array is populated with child IDs from the nested children.
 */
export function mapAlgoliaItemToHNItem(item: AlgoliaItemResponse): HNItemShape {
  return {
    id: item.id,
    type: item.type,
    by: item.author ?? undefined,
    time: item.created_at_i,
    text: item.text ?? undefined,
    title: item.title ?? undefined,
    url: item.url ?? undefined,
    score: item.points ?? undefined,
    parent: item.parent_id ?? undefined,
    kids: item.children.length > 0 ? item.children.map((c) => c.id) : undefined,
    descendants: countDescendants(item),
  };
}

/**
 * Recursively count all descendants (comments) in a tree.
 */
function countDescendants(item: AlgoliaItemResponse): number {
  if (!item.children || item.children.length === 0) {
    return 0;
  }
  return item.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

/**
 * Flatten an Algolia item tree into a Map of id -> HNItem.
 * This allows O(1) lookup for any comment by ID.
 *
 * @param root - The root Algolia item (story or comment)
 * @returns Map of item ID to HNItem-compatible object
 */
export function flattenAlgoliaItemTree(root: AlgoliaItemResponse): Map<number, HNItemShape> {
  const map = new Map<number, HNItemShape>();

  function traverse(item: AlgoliaItemResponse) {
    map.set(item.id, mapAlgoliaItemToHNItem(item));
    for (const child of item.children) {
      traverse(child);
    }
  }

  traverse(root);
  return map;
}
