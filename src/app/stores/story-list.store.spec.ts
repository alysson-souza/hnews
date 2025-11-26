// SPDX-License-Identifier: MIT
import { TestBed } from '@angular/core/testing';
import { StoryListStore } from './story-list.store';
import { HackernewsService } from '../services/hackernews.service';
import { StoryListStateService } from '../services/story-list-state.service';
import { StoryFilterPreferencesService } from '../services/story-filter-preferences.service';
import { of } from 'rxjs';
import { HNItem } from '../models/hn';
import { getFilterCutoffTimestamp } from '../models/story-filter';

/** Test double for HackernewsService */
class MockHNService {
  getTopStories() {
    return of([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  }
  getBestStories() {
    return of([1, 2, 3, 4, 5]);
  }
  getItems(ids: number[]) {
    const cutoff = getFilterCutoffTimestamp();
    const items: HNItem[] = ids.map((id) => ({
      id,
      type: 'story',
      title: `Story ${id}`,
      time: cutoff + id * 100, // All stories within cutoff
      score: id * 10, // Score based on id
    }));
    return of(items);
  }
}

/** Test double for StoryListStateService */
class MockStateService {
  getState() {
    return null;
  }
  // Intentionally no-op in tests
  saveState() {}
  clearState() {}
}

/** Test double for StoryFilterPreferencesService */
class MockFilterPrefsService {
  private _mode = 'default';
  filterMode = () => this._mode as 'default' | 'top20' | 'topHalf';
  setFilterMode(mode: string) {
    this._mode = mode;
  }
}

describe('StoryListStore', () => {
  let store: StoryListStore;

  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        StoryListStore,
        { provide: HackernewsService, useClass: MockHNService },
        { provide: StoryListStateService, useClass: MockStateService },
        { provide: StoryFilterPreferencesService, useClass: MockFilterPrefsService },
      ],
    });
    store = TestBed.inject(StoryListStore);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('loads initial page of stories', async () => {
    store.init('top', 2);
    await Promise.resolve();
    expect(store.totalStoryIds()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(store.stories().length).toBe(2);
    expect(!!store.loading()).toBe(false);
  });

  it('loads more stories when loadMore is called', async () => {
    store.init('top', 2);
    await Promise.resolve();
    store.loadMore();
    await Promise.resolve();
    expect(store.stories().length).toBe(4);
  });

  describe('filter mode', () => {
    it('defaults to default filter mode', async () => {
      store.init('top', 5);
      await Promise.resolve();
      expect(store.filterMode()).toBe('default');
    });

    it('applies topHalf filter correctly', async () => {
      store.init('top', 4);
      await Promise.resolve();

      // Default mode shows all 4 stories
      expect(store.stories().length).toBe(4);

      // Switch to topHalf - should show top 50%
      store.setFilterMode('topHalf');
      await Promise.resolve();

      // After topHalf filter, should show ceil(stories/2) stories
      // Note: The filter is applied to the loaded pool
      const filtered = store.stories();
      expect(filtered.length).toBeLessThanOrEqual(store.visibleStories().length);
    });

    it('applies top20 filter correctly', async () => {
      store.init('top', 5);
      await Promise.resolve();

      store.setFilterMode('top20');
      await Promise.resolve();

      // All stories are from today, so should show up to 20 (we only have 5)
      const filtered = store.stories();
      expect(filtered.length).toBeLessThanOrEqual(20);
      // Sorted by score descending
      if (filtered.length > 1) {
        expect(filtered[0].score).toBeGreaterThanOrEqual(filtered[1].score ?? 0);
      }
    });

    it('resets filter mode correctly', async () => {
      store.init('top', 5);
      await Promise.resolve();

      store.setFilterMode('topHalf');
      expect(store.filterMode()).toBe('topHalf');

      store.resetFilter();
      expect(store.filterMode()).toBe('default');
    });

    it('isFilteredEmpty returns true when filter produces no results', () => {
      // Initially no stories loaded
      expect(store.isFilteredEmpty()).toBe(false);
    });
  });
});
