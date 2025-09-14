// SPDX-License-Identifier: MIT
import { mapToHNItem, isStory, isComment } from './hn';

describe('HN mappers and guards', () => {
  it('maps valid raw item', () => {
    const raw = {
      id: 100,
      type: 'story',
      time: 1700000000,
      by: 'alice',
      title: 'Hello',
      url: 'https://example.com',
      score: 12,
      descendants: 3,
      kids: [1, 2, 3],
    };

    const item = mapToHNItem(raw)!;
    expect(item.id).toBe(100);
    expect(item.type).toBe('story');
    expect(item.title).toBe('Hello');
    expect(isStory(item)).toBeTrue();
    expect(isComment(item)).toBeFalse();
  });

  it('returns null for malformed raw', () => {
    const raw: unknown = { id: 'x', time: 'y' };
    const item = mapToHNItem(raw);
    expect(item).toBeNull();
  });
});
