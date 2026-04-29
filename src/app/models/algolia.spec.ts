// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  mapAlgoliaItemToHNItem,
  mapHitToStory,
  AlgoliaHitRaw,
  AlgoliaItemResponse,
} from './algolia';

describe('algolia mappers', () => {
  it('maps a basic story hit', () => {
    const hit: AlgoliaHitRaw = {
      objectID: '123',
      title: 'Hello',
      url: 'https://example.com',
      author: 'alice',
      points: 10,
      num_comments: 2,
      created_at_i: 1700000000,
      _tags: ['story'],
    };

    const mapped = mapHitToStory(hit);
    expect(mapped).toEqual({
      id: 123,
      title: 'Hello',
      url: 'https://example.com',
      author: 'alice',
      points: 10,
      numComments: 2,
      createdAt: 1700000000,
    });
  });

  it('returns null for invalid hit', () => {
    const hit: AlgoliaHitRaw = {
      objectID: 'x',
      author: 'bob',
      _tags: ['comment'],
    };

    const mapped = mapHitToStory(hit);
    expect(mapped).toBeNull();
  });

  it('maps Algolia story_id to HNItem storyId for comments', () => {
    const item: AlgoliaItemResponse = {
      id: 456,
      created_at: '2025-01-01T00:00:00Z',
      created_at_i: 1735689600,
      type: 'comment',
      author: 'alice',
      title: null,
      url: null,
      text: 'Hello',
      points: null,
      parent_id: 789,
      story_id: 123,
      children: [],
    };

    expect(mapAlgoliaItemToHNItem(item).storyId).toBe(123);
  });
});
