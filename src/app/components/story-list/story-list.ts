// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HackernewsService, HNItem } from '../../services/hackernews.service';
import { StoryItem } from '../story-item/story-item';
import { StorySkeletonComponent } from '../story-skeleton/story-skeleton.component';
import { Observable, switchMap, map, tap, interval, filter, takeUntil, Subject } from 'rxjs';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { OpenGraphService, OpenGraphData } from '../../services/opengraph.service';
import { KeyboardNavigationService } from '../../services/keyboard-navigation.service';
import { StoryListStateService } from '../../services/story-list-state.service';
import { PageContainerComponent } from '../shared/page-container/page-container.component';

@Component({
  selector: 'app-story-list',
  standalone: true,
  imports: [CommonModule, StoryItem, StorySkeletonComponent, PageContainerComponent],
  templateUrl: './story-list.html',
  styleUrl: './story-list.css',
  styles: [
    `
      @reference '../../../styles.css';

      .alert-error {
        @apply bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4;
      }
      .alert-link {
        @apply mt-2 text-sm underline hover:no-underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1;
      }

      .stories-space {
        @apply space-y-2 sm:space-y-3;
      }

      .load-more-btn {
        @apply px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 focus-visible:ring-blue-500 text-sm sm:text-base;
      }

      .loading-wrap {
        @apply flex justify-center items-center py-8;
      }
      .loading-spin {
        @apply inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600;
      }
      .loading-text {
        @apply ml-3 text-gray-600 dark:text-gray-400;
      }

      .empty {
        @apply text-center py-8 text-gray-500 dark:text-gray-400;
      }

      .new-stories-indicator {
        @apply fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg dark:shadow-gray-800/50 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 font-medium text-sm animate-bounce;
      }
    `,
  ],
})
export class StoryList implements OnInit, OnDestroy, OnChanges {
  @Input() storyType: 'top' | 'best' | 'new' | 'ask' | 'show' | 'job' = 'top';
  @Input() pageSize = 30;

  private hnService = inject(HackernewsService);
  private ogService = inject(OpenGraphService);
  private stateService = inject(StoryListStateService);
  sidebarService = inject(SidebarService);
  deviceService = inject(DeviceService);
  keyboardNavService = inject(KeyboardNavigationService);

  stories = signal<HNItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(0);
  totalStoryIds = signal<number[]>([]);
  openGraphData = signal<Map<string, OpenGraphData>>(new Map());
  refreshing = signal(false);
  newStoriesAvailable = signal(0);

  // Array for skeleton count based on page size
  skeletonArray = Array(this.pageSize)
    .fill(0)
    .map((_, i) => i);

  // Auto-refresh management
  private destroy$ = new Subject<void>();
  private autoRefreshInterval = 10 * 1000; // 10 seconds for development

  constructor() {
    effect(() => {
      const storyCount = this.stories().length;
      this.keyboardNavService.setTotalItems(storyCount);
    });
  }

  ngOnInit() {
    // Check cache on initial load
    this.checkCacheForCurrentType();

    // Start auto-refresh timer
    this.startAutoRefresh();
  }

  ngOnChanges(changes: SimpleChanges) {
    // When storyType changes, check cache for the new type
    if (changes['storyType'] && !changes['storyType'].firstChange) {
      this.saveCurrentState(); // Save state for the previous type
      this.checkCacheForCurrentType();
    }
  }

  ngOnDestroy() {
    // Clean up auto-refresh timer
    this.destroy$.next();
    this.destroy$.complete();

    // Save current state when component is destroyed
    this.saveCurrentState();
  }

  loadStories(isRefresh = false, refreshStartTime?: number) {
    this.loading.set(true);
    this.error.set(null);

    this.getStoryIds(isRefresh)
      .pipe(
        switchMap((ids) => {
          this.totalStoryIds.set(ids);
          const start = this.currentPage() * this.pageSize;
          const end = start + this.pageSize;
          const pageIds = ids.slice(start, end);
          return this.hnService.getItems(pageIds);
        }),
        map((items) => items.filter((item) => item !== null) as HNItem[]),
        tap((items) => {
          // Extract URLs from stories for OpenGraph fetching
          const urls = items
            .filter((item) => item.url && !this.isTextPost(item))
            .map((item) => item.url!);

          // Fetch OpenGraph data progressively
          if (urls.length > 0) {
            this.ogService.getOpenGraphDataBatch(urls).subscribe({
              next: (partialOgDataMap) => {
                // Accumulate partial results as they stream in
                this.openGraphData.update((existing) => {
                  const updated = new Map(existing);
                  partialOgDataMap.forEach((data, url) => {
                    updated.set(url, data);
                  });
                  return updated;
                });
              },
              error: (err) => {
                console.error('Error fetching OpenGraph data:', err);
              },
            });
          }
        }),
      )
      .subscribe({
        next: (items) => {
          this.stories.set(items);
          this.loading.set(false);

          // If this is a refresh, ensure minimum display time
          if (isRefresh && refreshStartTime) {
            const elapsed = Date.now() - refreshStartTime;
            const remainingTime = Math.max(0, 500 - elapsed);

            if (remainingTime > 0) {
              // Wait remaining time before hiding skeletons
              setTimeout(() => {
                this.refreshing.set(false);
              }, remainingTime);
            } else {
              // Minimum time already passed
              this.refreshing.set(false);
            }

            // Phase 2: Fetch fresh story details in background
            // This updates vote counts and titles
            const storyIds = this.totalStoryIds().slice(0, this.pageSize);
            this.refreshStoryDetails(storyIds);
          }

          // Save state after loading
          this.saveCurrentState();
        },
        error: (err) => {
          this.error.set('Failed to load stories. Please try again.');
          this.loading.set(false);

          // Also hide refresh skeletons on error
          if (isRefresh) {
            this.refreshing.set(false);
          }

          console.error('Error loading stories:', err);
        },
      });
  }

  private getStoryIds(forceRefresh = false): Observable<number[]> {
    switch (this.storyType) {
      case 'top':
        return this.hnService.getTopStories(forceRefresh);
      case 'best':
        return this.hnService.getBestStories(forceRefresh);
      case 'new':
        return this.hnService.getNewStories(forceRefresh);
      case 'ask':
        return this.hnService.getAskStories(forceRefresh);
      case 'show':
        return this.hnService.getShowStories(forceRefresh);
      case 'job':
        return this.hnService.getJobStories(forceRefresh);
      default:
        return this.hnService.getTopStories(forceRefresh);
    }
  }

  loadMore() {
    if (!this.hasMore()) return;

    this.currentPage.update((p) => p + 1);
    this.loading.set(true);

    const start = this.currentPage() * this.pageSize;
    const end = start + this.pageSize;
    const pageIds = this.totalStoryIds().slice(start, end);

    this.hnService
      .getItems(pageIds)
      .pipe(
        map((items) => items.filter((item) => item !== null) as HNItem[]),
        tap((items) => {
          // Extract URLs from new stories for OpenGraph fetching
          const urls = items
            .filter((item) => item.url && !this.isTextPost(item))
            .map((item) => item.url!);

          // Fetch OpenGraph data for new batch progressively
          if (urls.length > 0) {
            this.ogService.getOpenGraphDataBatch(urls).subscribe({
              next: (partialOgDataMap) => {
                // Accumulate partial results as they stream in
                this.openGraphData.update((existing) => {
                  const updated = new Map(existing);
                  partialOgDataMap.forEach((data, url) => {
                    updated.set(url, data);
                  });
                  return updated;
                });
              },
              error: (err) => {
                console.error('Error fetching OpenGraph data:', err);
              },
            });
          }
        }),
      )
      .subscribe({
        next: (items) => {
          this.stories.update((stories) => [...stories, ...items]);
          this.loading.set(false);
          // Save state after loading more
          this.saveCurrentState();
        },
        error: (err) => {
          this.error.set('Failed to load more stories.');
          this.loading.set(false);
          console.error('Error loading more stories:', err);
        },
      });
  }

  hasMore(): boolean {
    return (this.currentPage() + 1) * this.pageSize < this.totalStoryIds().length;
  }

  refresh() {
    this.refreshing.set(true);
    // Clear cached state when explicitly refreshing
    this.stateService.clearState(this.storyType);
    this.currentPage.set(0);
    this.stories.set([]);
    this.openGraphData.set(new Map());
    this.keyboardNavService.clearSelection();

    // Track when we started refreshing for minimum display time
    const refreshStartTime = Date.now();

    // Load stories with refresh flag
    this.loadStories(true, refreshStartTime);
  }

  private refreshStoryDetails(storyIds: number[]): void {
    // Fetch fresh story data in background to update vote counts and titles
    // No loading state shown - seamless update
    this.hnService.getItems(storyIds, true).subscribe({
      next: (freshItems) => {
        // Filter out nulls and update stories
        const validItems = freshItems.filter((item) => item !== null) as HNItem[];
        if (validItems.length > 0) {
          this.stories.set(validItems);
          // Save the updated state with fresh vote counts
          this.saveCurrentState();
        }
      },
      error: (err) => {
        // Silent fail for background refresh - user already has cached data
        console.warn('Background refresh failed:', err);
      },
    });
  }

  private startAutoRefresh(): void {
    interval(this.autoRefreshInterval)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => document.visibilityState === 'visible'),
        filter(() => !this.refreshing()), // Don't interfere with manual refresh
        filter(() => !this.isUserInteracting()), // Don't disrupt user
      )
      .subscribe(() => {
        this.silentRefreshStoryList();
      });
  }

  private isUserInteracting(): boolean {
    // Don't refresh if:
    // - User has scrolled down (reading)
    // - User has item selected (keyboard nav)
    return window.scrollY > 200 || this.keyboardNavService.selectedIndex() !== null;
  }

  private silentRefreshStoryList(): void {
    this.getStoryIds(true).subscribe({
      next: (freshIds) => {
        const currentIds = this.totalStoryIds();

        // Count new stories at the top
        const newStoryCount = this.countNewStoriesAtTop(currentIds, freshIds);

        if (newStoryCount > 0 && window.scrollY < 100) {
          // User is at top - show new stories indicator
          this.newStoriesAvailable.set(newStoryCount);
        }

        // Update the list silently
        this.totalStoryIds.set(freshIds);

        // Fetch only new stories we don't have cached
        const currentStoryIds = this.stories().map((s) => s.id);
        const newIds = freshIds
          .slice(0, this.pageSize)
          .filter((id) => !currentStoryIds.includes(id));

        if (newIds.length > 0) {
          this.hnService.getItems(newIds).subscribe({
            next: (newStories) => {
              this.mergeNewStories(newStories);
            },
            error: (err) => {
              console.warn('Failed to fetch new stories:', err);
            },
          });
        }
      },
      error: (err) => {
        console.warn('Silent refresh failed:', err);
      },
    });
  }

  private countNewStoriesAtTop(currentIds: number[], freshIds: number[]): number {
    if (currentIds.length === 0) return 0;

    const firstCurrentId = currentIds[0];
    const firstCurrentIndex = freshIds.indexOf(firstCurrentId);

    // If our first story is still in the fresh list, count how many are before it
    return firstCurrentIndex > 0 ? firstCurrentIndex : 0;
  }

  private mergeNewStories(newStories: (HNItem | null)[]): void {
    const validNewStories = newStories.filter((item) => item !== null) as HNItem[];
    if (validNewStories.length === 0) return;

    const currentStories = this.stories();
    const currentIds = currentStories.map((s) => s.id);

    // Add new stories that aren't already displayed
    const trulyNewStories = validNewStories.filter((story) => !currentIds.includes(story.id));

    if (trulyNewStories.length > 0) {
      // Merge new stories at the beginning
      const mergedStories = [...trulyNewStories, ...currentStories];
      this.stories.set(mergedStories.slice(0, this.pageSize));
      this.saveCurrentState();
    }
  }

  loadNewStories(): void {
    // User clicked the "X new stories" button
    this.newStoriesAvailable.set(0);

    // Trigger a manual refresh to load the new stories
    this.refresh();
  }

  checkCacheForCurrentType(): void {
    // Check if we have cached state for the current story type
    const cachedState = this.stateService.getState(this.storyType);
    if (cachedState) {
      // Use cached state
      this.stories.set(cachedState.stories);
      this.currentPage.set(cachedState.currentPage);
      this.totalStoryIds.set(cachedState.totalStoryIds);
      this.openGraphData.set(cachedState.openGraphData);
      this.loading.set(false);

      // Restore scroll position after a delay
      if (cachedState.scrollPosition !== undefined) {
        setTimeout(() => {
          window.scrollTo({ top: cachedState.scrollPosition, behavior: 'instant' });
        }, 50);
      }
    } else {
      // No cached state - load fresh data
      this.loadStories();
    }
  }

  saveCurrentState(): void {
    this.stateService.saveState(
      this.storyType,
      this.stories(),
      this.currentPage(),
      this.totalStoryIds(),
      this.openGraphData(),
      this.keyboardNavService.selectedIndex(),
    );
  }

  private isTextPost(story: HNItem): boolean {
    const title = story?.title || '';
    return (
      !story?.url ||
      title.startsWith('Ask HN:') ||
      title.startsWith('Tell HN:') ||
      (title.startsWith('Show HN:') && !story?.url)
    );
  }

  getOpenGraphForStory(story: HNItem): OpenGraphData | undefined {
    return story.url ? this.openGraphData().get(story.url) : undefined;
  }
}
