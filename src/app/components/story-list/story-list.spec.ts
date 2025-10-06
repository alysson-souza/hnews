// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { StoryList } from './story-list';
import { StoryListStore } from '../../stores/story-list.store';
import { HackernewsService } from '../../services/hackernews.service';
import { StoryListStateService } from '../../services/story-list-state.service';
import { KeyboardNavigationService } from '../../services/keyboard-navigation.service';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { of } from 'rxjs';

interface TestItem {
  id: number;
  type: string;
  title: string;
}

/** Test double for HackernewsService */
class MockHNService {
  storyIds = [1, 2, 3, 4, 5];
  forceRefreshIds = [6, 7, 8, 9, 10];

  getTopStories(forceRefresh = false) {
    // Return different story IDs when forceRefresh is true to test silent refresh behavior
    if (forceRefresh) {
      return of(this.forceRefreshIds);
    }
    return of(this.storyIds);
  }

  getItems(ids: number[]) {
    const items: TestItem[] = ids.map((id) => ({ id, type: 'story', title: `Story ${id}` }));
    return of(items);
  }

  setStoryIds(ids: number[]) {
    this.storyIds = ids;
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

/** Test double for KeyboardNavigationService */
class MockKeyboardNavigationService {
  selectedIndex = {
    set: jasmine.createSpy('selectedIndex.set'),
    update: jasmine.createSpy('selectedIndex.update'),
  };
  clearSelection = jasmine.createSpy('clearSelection');
  setTotalItems = jasmine.createSpy('setTotalItems');
}

/** Test double for SidebarService */
class MockSidebarService {
  isOpen = jasmine.createSpy('isOpen').and.returnValue(false);
}

/** Test double for DeviceService */
class MockDeviceService {
  isDesktop = jasmine.createSpy('isDesktop').and.returnValue(false);
}

describe('StoryList', () => {
  let component: StoryList;
  let store: StoryListStore;
  let keyboardNavService: MockKeyboardNavigationService;
  let mockHNService: MockHNService;

  beforeEach(() => {
    mockHNService = new MockHNService();

    TestBed.configureTestingModule({
      providers: [
        StoryList,
        { provide: HackernewsService, useValue: mockHNService },
        { provide: StoryListStateService, useClass: MockStateService },
        { provide: KeyboardNavigationService, useClass: MockKeyboardNavigationService },
        { provide: SidebarService, useClass: MockSidebarService },
        { provide: DeviceService, useClass: MockDeviceService },
      ],
    });
    component = TestBed.inject(StoryList);
    store = TestBed.inject(StoryListStore);
    keyboardNavService = TestBed.inject(
      KeyboardNavigationService,
    ) as unknown as MockKeyboardNavigationService;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  describe('silentRefreshStoryList', () => {
    it('should update newStoriesAvailable signal when new stories are detected', async () => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      await Promise.resolve();
      // Change the mock service to return new stories (with some new ones at the top)
      mockHNService.forceRefreshIds = [6, 7, 1, 2, 3];

      // Set scroll position to top (required for indicator to show)
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

      // Perform silent refresh
      component['silentRefreshStoryList']();

      // Wait for the refresh to complete
      await Promise.resolve();
      // Should have detected 2 new stories (6 and 7)
      expect(store.newStoriesAvailable()).toBe(2);
      // Stories array should remain unchanged
      expect(store.stories().length).toBe(3);
      expect(store.stories()[0].id).toBe(1);
    });

    it('should NOT update stories array during silent refresh', async () => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      await Promise.resolve();
      // Get current stories
      const initialStories = store.stories();

      // Change the mock service to return new stories
      mockHNService.forceRefreshIds = [6, 7, 8, 1, 2];

      // Set scroll position to top
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

      // Perform silent refresh
      component['silentRefreshStoryList']();

      // Wait for the refresh to complete
      await Promise.resolve();
      // Stories array should remain exactly the same
      expect(store.stories()).toEqual(initialStories);
    });

    it('should NOT show new stories indicator when user has scrolled down', async () => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      await Promise.resolve();
      // Change the mock service to return new stories
      mockHNService.forceRefreshIds = [6, 7, 1, 2, 3];

      // Set scroll position to scrolled down
      Object.defineProperty(window, 'scrollY', { value: 300, writable: true });

      // Perform silent refresh
      component['silentRefreshStoryList']();

      // Wait for the refresh to complete
      await Promise.resolve();
      // Should not update newStoriesAvailable because user is scrolled down
      expect(store.newStoriesAvailable()).toBe(0);
    });

    it('should stash new IDs and only apply after clicking indicator', async () => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      await Promise.resolve();
      // Change the mock service to return new stories
      mockHNService.forceRefreshIds = [6, 7, 8, 9, 10];

      // Set scroll position to top
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

      // Perform silent refresh
      component['silentRefreshStoryList']();

      // Wait for the refresh to complete
      await Promise.resolve();
      // Should NOT update totalStoryIds yet (stashed only)
      expect(store.totalStoryIds()).toEqual([1, 2, 3, 4, 5]);

      // Simulate user clicking the new stories indicator
      component.loadNewStories();
      await Promise.resolve();
      // Now totalStoryIds should be applied
      expect(store.totalStoryIds()).toEqual([6, 7, 8, 9, 10]);
    });
  });

  describe('manual refresh', () => {
    it('should clear keyboard selection when refreshing', () => {
      component.refresh();
      expect(keyboardNavService.clearSelection).toHaveBeenCalled();
    });

    it('should update stories array when manual refresh is triggered', async () => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      await Promise.resolve();
      // Change the mock service to return new stories for manual refresh
      mockHNService.forceRefreshIds = [6, 7, 8, 9, 10];

      // Trigger manual refresh
      component.refresh();

      // Wait for the refresh to complete
      await Promise.resolve();
      // Should update stories array with new stories
      expect(store.stories().length).toBe(3);
      expect(store.stories()[0].id).toBe(6);
      expect(store.totalStoryIds()).toEqual([6, 7, 8, 9, 10]);
    });
  });
});
