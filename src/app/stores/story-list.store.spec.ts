// SPDX-License-Identifier: MIT
import { TestBed } from '@angular/core/testing';
import { StoryListStore } from './story-list.store';
import { HackernewsService } from '../services/hackernews.service';
import { StoryListStateService } from '../services/story-list-state.service';
import { of } from 'rxjs';

interface TestItem {
  id: number;
  type: string;
  title: string;
}

/** Test double for HackernewsService */
class MockHNService {
  getTopStories() {
    return of([1, 2, 3, 4, 5]);
  }
  getItems(ids: number[]) {
    const items: TestItem[] = ids.map((id) => ({ id, type: 'story', title: `Story ${id}` }));
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

describe('StoryListStore', () => {
  let store: StoryListStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StoryListStore,
        { provide: HackernewsService, useClass: MockHNService },
        { provide: StoryListStateService, useClass: MockStateService },
      ],
    });
    store = TestBed.inject(StoryListStore);
  });

  it('loads initial page of stories', async () => {
    store.init('top', 2);
    await Promise.resolve();
    expect(store.totalStoryIds()).toEqual([1, 2, 3, 4, 5]);
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
});
