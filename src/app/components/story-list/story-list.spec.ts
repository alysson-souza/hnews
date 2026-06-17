// SPDX-License-Identifier: MIT
// Copyright (C) 2025-2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { StoryList } from './story-list';
import { StoryListStore } from '@stores/story-list.store';
import { HackernewsService } from '@services/hackernews.service';
import { StoryListStateService } from '@services/story-list-state.service';
import { KeyboardNavigationService } from '@services/keyboard-navigation.service';
import { SidebarService } from '@services/sidebar.service';
import { DeviceService } from '@services/device.service';
import { PageLifecycleService } from '@services/page-lifecycle.service';
import { signal } from '@angular/core';
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

  getBestStories(forceRefresh = false) {
    return this.getTopStories(forceRefresh);
  }

  getNewStories(forceRefresh = false) {
    return this.getTopStories(forceRefresh);
  }

  getAskStories(forceRefresh = false) {
    return this.getTopStories(forceRefresh);
  }

  getShowStories(forceRefresh = false) {
    return this.getTopStories(forceRefresh);
  }

  getJobStories(forceRefresh = false) {
    return this.getTopStories(forceRefresh);
  }

  getItems(ids: number[]) {
    const items: TestItem[] = ids.map((id) => ({ id, type: 'story', title: `Story ${id}` }));
    return of(items);
  }

  getItemUpdates(id: number) {
    return of({ id, type: 'story', title: `Story ${id}` });
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
  selectedIndex = signal<number | null>(null);
  clearSelection = vi.fn();
  setTotalItems = vi.fn();
}

/** Test double for SidebarService */
class MockSidebarService {
  isOpen = vi.fn().mockReturnValue(false);
}

/** Test double for DeviceService */
class MockDeviceService {
  isDesktop = vi.fn().mockReturnValue(false);
  shouldShowKeyboardHints = vi.fn().mockReturnValue(false);
}

/** Test double for PageLifecycleService */
class MockPageLifecycleService {
  hiddenSince = signal<number | null>(null);
  isVisible = signal(true);
  resumeCount = signal(0);
  wasDiscarded = false;
}

describe('StoryList', () => {
  let component: StoryList;
  let fixture: ComponentFixture<StoryList>;
  let store: StoryListStore;
  let keyboardNavService: MockKeyboardNavigationService;
  let mockHNService: MockHNService;

  beforeEach(async () => {
    mockHNService = new MockHNService();

    await TestBed.configureTestingModule({
      imports: [StoryList],
      providers: [
        provideRouter([]),
        StoryList,
        { provide: HackernewsService, useValue: mockHNService },
        { provide: StoryListStateService, useClass: MockStateService },
        { provide: KeyboardNavigationService, useClass: MockKeyboardNavigationService },
        { provide: SidebarService, useClass: MockSidebarService },
        { provide: DeviceService, useClass: MockDeviceService },
        { provide: PageLifecycleService, useClass: MockPageLifecycleService },
      ],
    }).compileComponents();
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

  describe('loadMore', () => {
    it('should call store.loadMore when hasMore is true', async () => {
      store.init('top', 30);
      await Promise.resolve();

      vi.spyOn(store, 'loadMore');
      vi.spyOn(store, 'hasMore').mockReturnValue(true);

      component.loadMore();

      expect(store.loadMore).toHaveBeenCalled();
    });

    it('should not call store.loadMore when hasMore is false', () => {
      vi.spyOn(store, 'loadMore');
      vi.spyOn(store, 'hasMore').mockReturnValue(false);

      component.loadMore();

      expect(store.loadMore).not.toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('renders the load more button as a primary shared action', () => {
      fixture = TestBed.createComponent(StoryList);
      const rendered = fixture.componentInstance;

      rendered.loading = signal(false);
      rendered.refreshing = signal(false);
      rendered.error = signal<string | null>(null);
      rendered.stories = signal([]);
      rendered.newStoriesAvailable = signal(0);
      rendered.isFilteredEmpty = signal(false);

      vi.spyOn(rendered, 'hasMore').mockReturnValue(true);

      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.load-more-btn button'));
      expect(button).toBeTruthy();
      expect(button.nativeElement.classList).toContain('btn-primary');
    });
  });

  describe('hasMore', () => {
    it('should return true when more stories are available', () => {
      vi.spyOn(store, 'hasMore').mockReturnValue(true);

      expect(component.hasMore()).toBe(true);
    });

    it('should return false when no more stories are available', () => {
      vi.spyOn(store, 'hasMore').mockReturnValue(false);

      expect(component.hasMore()).toBe(false);
    });
  });

  describe('loadStories', () => {
    it('should call store.loadStories with refresh flag', () => {
      vi.spyOn(store, 'loadStories');

      component.loadStories(true);

      expect(store.loadStories).toHaveBeenCalledWith(true, undefined);
    });

    it('should call store.loadStories with refresh time', () => {
      vi.spyOn(store, 'loadStories');
      const time = Date.now();

      component.loadStories(true, time);

      expect(store.loadStories).toHaveBeenCalledWith(true, time);
    });
  });

  describe('loadNewStories', () => {
    it('should reset newStoriesAvailable and trigger refresh', () => {
      store.newStoriesAvailable.set(5);
      vi.spyOn(component, 'refresh');

      component.loadNewStories();

      expect(store.newStoriesAvailable()).toBe(0);
      expect(component.refresh).toHaveBeenCalled();
    });
  });

  describe('input changes', () => {
    it('should initialize store with storyType and pageSize', () => {
      fixture = TestBed.createComponent(StoryList);
      vi.spyOn(store, 'init');

      fixture.detectChanges();

      expect(store.init).toHaveBeenCalledWith('top', 30);
    });

    it('should re-initialize store when storyType changes', () => {
      fixture = TestBed.createComponent(StoryList);
      vi.spyOn(store, 'init');

      fixture.detectChanges();
      vi.mocked(store.init).mockClear();

      fixture.componentRef.setInput('storyType', 'best');
      fixture.detectChanges();

      expect(store.init).toHaveBeenCalledWith('best', 30);
    });

    it('should re-initialize store when pageSize changes', () => {
      fixture = TestBed.createComponent(StoryList);
      vi.spyOn(store, 'init');

      fixture.detectChanges();
      vi.mocked(store.init).mockClear();

      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      expect(store.init).toHaveBeenCalledWith('top', 10);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('isOffline computed', () => {
    it('should be defined', () => {
      expect(component.isOffline).toBeDefined();
    });
  });

  describe('skeletonArray', () => {
    it('should create array with pageSize elements', () => {
      const skelArr = component.skeletonArray();

      expect(skelArr.length).toBe(30);
      expect(skelArr[0]).toBe(0);
      expect(skelArr[29]).toBe(29);
    });

    it('should update when pageSize changes', async () => {
      fixture = TestBed.createComponent(StoryList);

      fixture.componentRef.setInput('pageSize', 10);
      await fixture.whenStable();

      expect(fixture.componentInstance.skeletonArray()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });
});
