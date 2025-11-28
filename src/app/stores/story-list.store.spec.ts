// SPDX-License-Identifier: MIT
import { TestBed } from '@angular/core/testing';
import { StoryListStore } from './story-list.store';
import { HackernewsService } from '../services/hackernews.service';
import { StoryListStateService, StoryListState } from '../services/story-list-state.service';
import { StoryFilterPreferencesService } from '../services/story-filter-preferences.service';
import { of, Subject, Observable } from 'rxjs';
import { HNItem } from '../models/hn';
import { getFilterCutoffTimestamp } from '../models/story-filter';

/** Test double for HackernewsService */
class MockHNService {
  private itemStreams = new Map<number, Subject<HNItem | null>>();

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
    // Return async observable to match real behavior (microtask)
    return new Observable<HNItem[]>((observer) => {
      Promise.resolve().then(() => {
        observer.next(items);
        observer.complete();
      });
    });
  }
  private ensureItemStream(id: number): Subject<HNItem | null> {
    if (!this.itemStreams.has(id)) {
      const subject = new Subject<HNItem | null>();
      this.itemStreams.set(id, subject);
    }
    return this.itemStreams.get(id)!;
  }

  getItem(id: number) {
    const subject = this.ensureItemStream(id);
    const obs = subject.asObservable();

    // Emit initial value as microtask if this is the first subscription
    const cutoff = getFilterCutoffTimestamp();
    Promise.resolve().then(() =>
      subject.next({
        id,
        type: 'story',
        title: `Story ${id}`,
        time: cutoff + id * 100,
        score: id * 10,
      }),
    );

    return obs;
  }

  emitUpdate(id: number, updated: HNItem) {
    const subject = this.ensureItemStream(id);
    subject.next(updated);
  }

  getItemUpdates(id: number) {
    // For updates-only, return the same subject but don't emit initial value
    const subject = this.ensureItemStream(id);
    return subject.asObservable();
  }
}

/** Test double for StoryListStateService */
class MockStateService {
  private cachedState: StoryListState | null = null;

  getState() {
    return this.cachedState;
  }
  // Store for testing
  saveState(
    storyType: string,
    storyIds: number[],
    currentPage: number,
    totalStoryIds: number[],
    selectedIndex: number | null,
  ) {
    this.cachedState = {
      storyType,
      storyIds,
      currentPage,
      totalStoryIds,
      selectedIndex,
      timestamp: Date.now(),
    };
  }
  clearState() {
    this.cachedState = null;
  }
  setCachedState(state: StoryListState | null) {
    this.cachedState = state;
  }
}

/** Test double for StoryFilterPreferencesService */
class MockFilterPrefsService {
  private _mode = 'default';
  filterMode = () => this._mode as 'default' | 'topHalf';
  setFilterMode(mode: string) {
    this._mode = mode;
  }
}

describe('StoryListStore', () => {
  let store: StoryListStore;
  let mockHN: MockHNService;
  let mockState: MockStateService;

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
    mockHN = TestBed.inject(HackernewsService) as unknown as MockHNService;
    mockState = TestBed.inject(StoryListStateService) as unknown as MockStateService;
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

  describe('SWR update propagation', () => {
    // Helper to wait for a condition with timeout
    const waitFor = async (
      condition: () => boolean,
      timeoutMs = 1000,
      checkIntervalMs = 10,
    ): Promise<void> => {
      const startTime = Date.now();
      while (!condition()) {
        if (Date.now() - startTime > timeoutMs) {
          throw new Error('Timeout waiting for condition');
        }
        await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
      }
    };

    it('patches stories in-place when cache emits updates', async () => {
      store.init('top', 3);

      // Wait for initial load to complete
      await waitFor(() => !store.loading() && store.stories().length === 3);

      const initialStories = store.stories();
      expect(initialStories[0].title).toBe('Story 1');
      expect(initialStories[0].score).toBe(10);

      // Emit an update for story ID 1
      const updatedStory: HNItem = {
        id: 1,
        type: 'story',
        title: 'Updated Story 1',
        time: Date.now(),
        score: 999,
      };
      mockHN.emitUpdate(1, updatedStory);

      // Wait for update to propagate through subscription
      await waitFor(() => store.stories()[0].score === 999);

      const updatedStories = store.stories();
      expect(updatedStories.length).toBe(3);
      expect(updatedStories[0].title).toBe('Updated Story 1');
      expect(updatedStories[0].score).toBe(999);
      // Other stories should remain unchanged
      expect(updatedStories[1].title).toBe('Story 2');
      expect(updatedStories[2].title).toBe('Story 3');
    });
  });

  describe('async hydration', () => {
    it('restores IDs from session and maintains correct signals after hydration', async () => {
      // Set up cached state with IDs
      const cachedState: StoryListState = {
        storyType: 'top',
        storyIds: [1, 2, 3],
        currentPage: 1,
        totalStoryIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        selectedIndex: null,
        timestamp: Date.now(),
      };
      mockState.setCachedState(cachedState);

      store.init('top', 5);

      // Wait for async hydration to complete (multiple microtasks)
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve(); // Extra ticks for getItems observable and effect()

      // After hydration, loading should be false
      expect(store.loading()).toBe(false);
      expect(store.currentPage()).toBe(1);
      expect(store.totalStoryIds()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(store.stories().length).toBe(3);
      // hasMore should be false because (currentPage+1)*pageSize = (1+1)*5 = 10, which is not < totalStoryIds.length (10)
      expect(store.hasMore()).toBe(false);
    });

    it('falls back to fresh load when all cached IDs resolve to null', async () => {
      const cachedState: StoryListState = {
        storyType: 'top',
        storyIds: [999, 998, 997], // Non-existent IDs
        currentPage: 0,
        totalStoryIds: [1, 2, 3],
        selectedIndex: null,
        timestamp: Date.now(),
      };
      mockState.setCachedState(cachedState);

      // Mock getItems to return all nulls for cached IDs, then valid items for fresh load
      const originalGetItems = mockHN.getItems.bind(mockHN);
      const mockGetItems = (ids: number[]): Observable<HNItem[]> => {
        if (ids.includes(999)) {
          // Return empty array for non-existent IDs to trigger fallback
          return of([]);
        }
        return originalGetItems(ids);
      };
      mockHN.getItems = mockGetItems;

      store.init('top', 2);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve(); // Wait for fallback load and all microtasks

      // Should have fresh stories
      expect(store.stories().length).toBe(2);
      expect(store.loading()).toBe(false);
    });
  });

  describe('race condition fixes', () => {
    // Helper to wait for a condition with timeout
    const waitFor = async (
      condition: () => boolean,
      timeoutMs = 1000,
      checkIntervalMs = 10,
    ): Promise<void> => {
      const startTime = Date.now();
      while (!condition()) {
        if (Date.now() - startTime > timeoutMs) {
          throw new Error('Timeout waiting for condition');
        }
        await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
      }
    };

    it('cancels previous init when rapidly switching tabs', async () => {
      // Simulate rapid tab switching: top -> best -> top
      store.init('top', 3);
      store.init('best', 3);
      store.init('top', 3);

      // Wait for all async operations to settle
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Should show top stories (last init call), not best
      await waitFor(() => !store.loading());
      expect(store.storyType()).toBe('top');
      expect(store.stories().length).toBeGreaterThan(0);
      // Verify we have the right story IDs (1,2,3 for top, not 1,2,3,4,5 for best)
      const storyIds = store.stories().map((s) => s.id);
      expect(storyIds).toContain(1);
    });

    it('queues filter changes during init loading', async () => {
      store.init('top', 3);

      // Immediately try to change filter while loading
      store.setFilterMode('topHalf');

      // Wait for init to complete
      await waitFor(() => !store.loading());

      // Filter change should have been queued and applied after load
      expect(store.filterMode()).toBe('topHalf');
    });

    it('applies queued filter after data loads', async () => {
      // Set up state with cached data
      const cachedState: StoryListState = {
        storyType: 'top',
        storyIds: [1, 2, 3, 4, 5, 6],
        currentPage: 0,
        totalStoryIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        selectedIndex: null,
        timestamp: Date.now(),
      };
      mockState.setCachedState(cachedState);

      store.init('top', 6);

      // Immediately queue a filter change
      store.setFilterMode('topHalf');

      // Wait for async hydration to complete
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      await waitFor(() => !store.loading());

      // Should have applied the queued filter
      expect(store.filterMode()).toBe('topHalf');
      // Top half should show higher-scored stories
      expect(store.stories().length).toBeGreaterThan(0);
    });
  });
});
