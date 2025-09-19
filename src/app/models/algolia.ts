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
