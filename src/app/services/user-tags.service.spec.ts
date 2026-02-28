// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { UserTagsService } from './user-tags.service';

function seedTags(service: UserTagsService, total: number) {
  for (let index = 1; index <= total; index++) {
    service.setTag(`user-${index}`, `Tag ${index}`);
  }
}

function hexToRGB(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function contrastWithWhite(hex: string): number {
  const [r, g, b] = hexToRGB(hex).map((v) => v / 255);
  const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return 1.05 / (luminance + 0.05);
}

describe('UserTagsService', () => {
  let service: UserTagsService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserTagsService);
    service.clearAllTags(); // Ensure service state is cleared
  });

  afterEach(() => {
    service.clearAllTags();
    window.localStorage.clear();
  });

  it('filters tags by username and label', () => {
    service.setTag('alice', 'Angular Fan');
    service.setTag('bob', 'RxJS Pro');
    service.setTag('charlie', 'Design Guru');
    service.setTag('bobby', 'Angular Enthusiast');

    const result = service.getPaginatedTags('bob', 1, 10);

    expect(result.totalCount).toBe(2);
    expect(result.tags.map((tag) => tag.username)).toEqual(['bob', 'bobby']);
  });

  it('filters tags and does NOT return all tags for nonsense query', () => {
    service.setTag('alice', 'Angular Fan');
    service.setTag('bob', 'RxJS Pro');
    service.setTag('charlie', 'Design Guru');
    service.setTag('dang', 'HN Moderator');

    const result = service.getPaginatedTags('adjnasd', 1, 10);

    expect(result.totalCount).toBe(0);
    expect(result.tags).toEqual([]);
  });

  it('filters tags correctly for "dang" query', () => {
    service.setTag('alice', 'Angular Fan');
    service.setTag('bob', 'RxJS Pro');
    service.setTag('charlie', 'Design Guru');
    service.setTag('dang', 'HN Moderator');

    const result = service.getPaginatedTags('dang', 1, 10);

    expect(result.totalCount).toBe(1);
    expect(result.tags.map((tag) => tag.username)).toEqual(['dang']);
  });

  it('filters correctly with 105 tags - should only match relevant ones', () => {
    // Seed 105 tags similar to real scenario
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }
    // Add specific user
    service.setTag('dang', 'HN Moderator');

    const resultDang = service.getPaginatedTags('dang', 1, 10);
    expect(resultDang.totalCount).toBe(1);
    expect(resultDang.tags[0].username).toBe('dang');

    const resultNonsense = service.getPaginatedTags('adjnasd', 1, 10);
    expect(resultNonsense.totalCount).toBe(0);
    expect(resultNonsense.tags).toEqual([]);
  });

  it('filters tags after loading from localStorage', () => {
    // Seed tags and persist
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }
    service.setTag('dang', 'HN Moderator');

    // Create a new service instance (simulates page reload)
    const service2 = TestBed.inject(UserTagsService);

    // Test filtering on the reloaded service
    const resultDang = service2.getPaginatedTags('dang', 1, 10);
    expect(resultDang.totalCount).toBe(1);
    expect(resultDang.tags[0].username).toBe('dang');

    const resultNonsense = service2.getPaginatedTags('adjnasd', 1, 10);
    expect(resultNonsense.totalCount).toBe(0);
    expect(resultNonsense.tags).toEqual([]);
  });

  it('getFilteredTags should NOT return all tags for nonsense query', () => {
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }

    const filtered = service.getFilteredTags('adjnasd');
    expect(filtered.length).toBe(0);
  });

  it('getFilteredTags should return only matching tags for "dang"', () => {
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }
    service.setTag('dang', 'HN Moderator');

    const filtered = service.getFilteredTags('dang');
    expect(filtered.length).toBe(1);
    expect(filtered[0].username).toBe('dang');
  });

  it('REGRESSION: should handle when searchQuery evaluates to falsy after trim', () => {
    service.setTag('alice', 'Tag 1');
    service.setTag('bob', 'Tag 2');
    service.setTag('charlie', 'Tag 3');

    // These should all return all tags (valid behavior for empty search)
    expect(service.getFilteredTags('').length).toBe(3);
    expect(service.getFilteredTags('   ').length).toBe(3); // spaces only
    expect(service.getFilteredTags('\t').length).toBe(3); // tab only
  });

  it('REGRESSION BUG: Empty search should return all tags, non-matching search should return zero', () => {
    for (let i = 1; i <= 105; i++) {
      service.setTag(`user${i}`, `Tag ${i}`);
    }

    // Empty search should return all
    const emptyResult = service.getPaginatedTags('', 1, 10);
    expect(emptyResult.totalCount).toBe(105);

    // But a search with actual text that doesn't match should return ZERO
    const noMatchResult = service.getPaginatedTags('adjnasd', 1, 10);
    expect(noMatchResult.totalCount, 'adjnasd should match zero tags').toBe(0);
    expect(noMatchResult.tags.length).toBe(0);
  });

  it('clamps the current page within bounds when the requested page is too high', () => {
    seedTags(service, 15);

    const result = service.getPaginatedTags('', 5, 10);

    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(2);
    expect(result.tags.length).toBe(5);
  });

  it('guards against invalid pagination parameters', () => {
    seedTags(service, 3);

    const result = service.getPaginatedTags('', 0, 0);

    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.tags.length).toBe(1);
  });

  it('always returns at least one page even when there are no tags', () => {
    const result = service.getPaginatedTags('', 3, 10);

    expect(result.totalCount).toBe(0);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.tags).toEqual([]);
  });

  describe('notes support', () => {
    it('should store and retrieve notes', () => {
      service.setTag('alice', 'Expert', undefined, 'Great Rust contributor');

      expect(service.getTag('alice')?.notes).toBe('Great Rust contributor');
    });

    it('should preserve existing notes when updating tag without notes arg', () => {
      service.setTag('alice', 'Expert', undefined, 'Great Rust contributor');
      service.setTag('alice', 'Guru');

      expect(service.getTag('alice')?.tag).toBe('Guru');
      expect(service.getTag('alice')?.notes).toBe('Great Rust contributor');
    });

    it('should clear notes when empty string is passed', () => {
      service.setTag('alice', 'Expert', undefined, 'Great Rust contributor');
      service.setTag('alice', 'Expert', undefined, '');

      expect(service.getTag('alice')?.notes).toBeUndefined();
    });

    it('tags without notes should still work (backwards compat)', () => {
      // Seed old-format data (no notes key) via importTags
      const oldData = JSON.stringify([
        {
          username: 'old-user',
          tag: 'OG',
          color: '#B91C1C',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      service.importTags(oldData);

      expect(service.getTag('old-user')?.tag).toBe('OG');
      expect(service.getTag('old-user')?.notes).toBeUndefined();
    });
  });

  describe('setNotes', () => {
    it('should update notes via setNotes', () => {
      service.setTag('alice', 'Expert');
      service.setNotes('alice', 'Added via setNotes');

      expect(service.getTag('alice')?.notes).toBe('Added via setNotes');
    });

    it('should be no-op if user has no tag', () => {
      service.setNotes('nonexistent', 'note');

      expect(service.getTag('nonexistent')).toBeUndefined();
    });

    it('should clear notes when empty string is passed', () => {
      service.setTag('alice', 'Expert', undefined, 'Some note');
      service.setNotes('alice', '');

      expect(service.getTag('alice')?.notes).toBeUndefined();
    });
  });

  describe('notes in filter and import/export', () => {
    it('getFilteredTags should match within notes text', () => {
      service.setTag('alice', 'Expert', undefined, 'Rust and WebAssembly');
      service.setTag('bob', 'Dev');

      const filtered = service.getFilteredTags('WebAssembly');

      expect(filtered.length).toBe(1);
      expect(filtered[0].username).toBe('alice');
    });

    it('should import tags with notes', () => {
      const json = JSON.stringify([
        {
          username: 'imported-user',
          tag: 'Imported',
          color: '#B91C1C',
          notes: 'Has notes',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      service.importTags(json);

      expect(service.getTag('imported-user')?.notes).toBe('Has notes');
    });

    it('should import tags without notes (backwards compat)', () => {
      const json = JSON.stringify([
        {
          username: 'old-import',
          tag: 'Old',
          color: '#B91C1C',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      service.importTags(json);

      expect(service.getTag('old-import')?.tag).toBe('Old');
      expect(service.getTag('old-import')?.notes).toBeUndefined();
    });

    it('should export tags with notes', () => {
      service.setTag('alice', 'Expert', undefined, 'Great contributor');

      const exported = JSON.parse(service.exportTags());

      expect(exported[0].notes).toBe('Great contributor');
    });
  });

  describe('accessible color generation', () => {
    it('should generate a valid 7-char hex color', () => {
      service.setTag('alice', 'Test');
      const color = service.getTag('alice')?.color;
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should generate colors that meet WCAG AA 4.5:1 contrast with white', () => {
      for (let i = 0; i < 50; i++) {
        service.setTag(`user-${i}`, `Tag ${i}`);
        const color = service.getTag(`user-${i}`)!.color!;
        expect(contrastWithWhite(color)).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('should never generate grays or near-black colors', () => {
      for (let i = 0; i < 50; i++) {
        service.setTag(`user-${i}`, `Tag ${i}`);
        const color = service.getTag(`user-${i}`)!.color!;
        const [r, g, b] = hexToRGB(color);
        // Not near-black: at least one channel > 50
        expect(Math.max(r, g, b)).toBeGreaterThan(50);
        // Not gray: channels should NOT all be within 20 of each other
        const spread = Math.max(r, g, b) - Math.min(r, g, b);
        expect(spread).toBeGreaterThan(20);
      }
    });

    it('should produce distinct hues across sequential tags', () => {
      for (let i = 0; i < 6; i++) {
        service.setTag(`user-${i}`, `Tag ${i}`);
      }
      const colors = Array.from({ length: 6 }, (_, i) => service.getTag(`user-${i}`)!.color!);
      const unique = new Set(colors);
      expect(unique.size).toBe(6); // all different
    });
  });

  describe('export strips color', () => {
    it('should not include color in exported JSON', () => {
      service.setTag('alice', 'Expert');
      const exported = JSON.parse(service.exportTags());
      expect(exported[0].color).toBeUndefined();
    });

    it('should still include other fields in export', () => {
      service.setTag('alice', 'Expert', undefined, 'A note');
      const exported = JSON.parse(service.exportTags());
      expect(exported[0].username).toBe('alice');
      expect(exported[0].tag).toBe('Expert');
      expect(exported[0].notes).toBe('A note');
      expect(exported[0].createdAt).toBeDefined();
    });
  });

  describe('import ignores color', () => {
    it('should ignore imported color and assign an accessible one', () => {
      const json = JSON.stringify([
        {
          username: 'imported',
          tag: 'Tag',
          color: '#FAEA49', // bad-contrast yellow
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      service.importTags(json);
      const color = service.getTag('imported')!.color!;
      expect(color).not.toBe('#FAEA49');
      expect(contrastWithWhite(color)).toBeGreaterThanOrEqual(4.5);
    });

    it('should assign accessible color when imported tag has no color', () => {
      const json = JSON.stringify([
        {
          username: 'no-color',
          tag: 'Tag',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      service.importTags(json);
      const color = service.getTag('no-color')!.color!;
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(contrastWithWhite(color)).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('loadTags', () => {
    it('should load tags from localStorage without modifying colors', () => {
      const data = JSON.stringify([
        {
          username: 'alice',
          tag: 'Expert',
          color: '#B91C1C',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      window.localStorage.setItem('hn_user_tags', data);
      const freshService = new UserTagsService();
      expect(freshService.getTag('alice')?.color).toBe('#B91C1C');
    });
  });
});
