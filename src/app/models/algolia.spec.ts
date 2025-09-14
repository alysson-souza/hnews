// SPDX-License-Identifier: MIT
import { mapHitToStory, AlgoliaHitRaw } from './algolia';

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
});
