// SPDX-License-Identifier: MIT
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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  saveState() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearState() {}
}

/** Test double for KeyboardNavigationService */
class MockKeyboardNavigationService {
  selectedIndex = jasmine.createSpyObj('Signal', ['set', 'update']);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearSelection() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setTotalItems() {}
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
    expect(component).toBeTruthy();
  });

  describe('silentRefreshStoryList', () => {
    it('should update newStoriesAvailable signal when new stories are detected', (done) => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      setTimeout(() => {
        // Change the mock service to return new stories (with some new ones at the top)
        mockHNService.forceRefreshIds = [6, 7, 1, 2, 3];

        // Set scroll position to top (required for indicator to show)
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

        // Perform silent refresh
        component['silentRefreshStoryList']();

        // Wait for the refresh to complete
        setTimeout(() => {
          // Should have detected 2 new stories (6 and 7)
          expect(store.newStoriesAvailable()).toBe(2);
          // Stories array should remain unchanged
          expect(store.stories().length).toBe(3);
          expect(store.stories()[0].id).toBe(1);
          done();
        }, 0);
      }, 0);
    });

    it('should NOT update stories array during silent refresh', (done) => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      setTimeout(() => {
        // Get current stories
        const initialStories = store.stories();

        // Change the mock service to return new stories
        mockHNService.forceRefreshIds = [6, 7, 8, 1, 2];

        // Set scroll position to top
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

        // Perform silent refresh
        component['silentRefreshStoryList']();

        // Wait for the refresh to complete
        setTimeout(() => {
          // Stories array should remain exactly the same
          expect(store.stories()).toEqual(initialStories);
          done();
        }, 0);
      }, 0);
    });

    it('should NOT show new stories indicator when user has scrolled down', (done) => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      setTimeout(() => {
        // Change the mock service to return new stories
        mockHNService.forceRefreshIds = [6, 7, 1, 2, 3];

        // Set scroll position to scrolled down
        Object.defineProperty(window, 'scrollY', { value: 300, writable: true });

        // Perform silent refresh
        component['silentRefreshStoryList']();

        // Wait for the refresh to complete
        setTimeout(() => {
          // Should not update newStoriesAvailable because user is scrolled down
          expect(store.newStoriesAvailable()).toBe(0);
          done();
        }, 0);
      }, 0);
    });

    it('should update totalStoryIds during silent refresh', (done) => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      setTimeout(() => {
        // Change the mock service to return new stories
        mockHNService.forceRefreshIds = [6, 7, 8, 9, 10];

        // Set scroll position to top
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

        // Perform silent refresh
        component['silentRefreshStoryList']();

        // Wait for the refresh to complete
        setTimeout(() => {
          // Should update totalStoryIds with new array
          expect(store.totalStoryIds()).toEqual([6, 7, 8, 9, 10]);
          done();
        }, 0);
      }, 0);
    });
  });

  describe('manual refresh', () => {
    it('should clear keyboard selection when refreshing', () => {
      spyOn(keyboardNavService, 'clearSelection');
      component.refresh();
      expect(keyboardNavService.clearSelection).toHaveBeenCalled();
    });

    it('should update stories array when manual refresh is triggered', (done) => {
      // Initialize with some stories
      store.init('top', 3);

      // Wait for initial load
      setTimeout(() => {
        // Change the mock service to return new stories for manual refresh
        mockHNService.forceRefreshIds = [6, 7, 8, 9, 10];

        // Trigger manual refresh
        component.refresh();

        // Wait for the refresh to complete
        setTimeout(() => {
          // Should update stories array with new stories
          expect(store.stories().length).toBe(3);
          expect(store.stories()[0].id).toBe(6);
          expect(store.totalStoryIds()).toEqual([6, 7, 8, 9, 10]);
          done();
        }, 0);
      }, 0);
    });
  });
});
