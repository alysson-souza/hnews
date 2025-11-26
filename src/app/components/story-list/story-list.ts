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
  effect,
  computed,
} from '@angular/core';
import { environment } from '../../../environments/environment';

import { StoryItem } from '../story-item/story-item';
import { interval, filter, takeUntil, Subject } from 'rxjs';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { KeyboardNavigationService } from '../../services/keyboard-navigation.service';
import { NetworkStateService } from '../../services/network-state.service';
import { StoryListStore } from '../../stores/story-list.store';
import { PageContainerComponent } from '../shared/page-container/page-container.component';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../shared/segmented-control/segmented-control.component';
import { StoryFilterMode, FILTER_MODE_LABELS } from '../../models/story-filter';

@Component({
  selector: 'app-story-list',
  standalone: true,
  imports: [StoryItem, PageContainerComponent, SegmentedControlComponent],
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
        @apply space-y-3 sm:space-y-4;
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

      .offline-indicator {
        @apply mb-4 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-center text-yellow-800 dark:text-yellow-300;
      }
      .offline-text {
        @apply text-sm font-medium;
      }

      .new-stories-indicator {
        @apply fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg dark:shadow-gray-800/50 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 font-medium text-sm animate-bounce;
      }

      @media (display-mode: standalone) {
        .new-stories-indicator {
          top: calc(5rem + env(safe-area-inset-top, 0px));
          left: calc(50% + (env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)) / 2);
        }
      }

      .filter-bar {
        @apply mb-4 flex justify-center sm:justify-start;
      }

      .filter-empty {
        @apply text-center py-8 px-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg;
      }
      .filter-empty-title {
        @apply text-gray-700 dark:text-gray-300 font-medium mb-2;
      }
      .filter-empty-text {
        @apply text-gray-500 dark:text-gray-400 text-sm mb-4;
      }
      .filter-reset-btn {
        @apply text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1;
      }
    `,
  ],
})
export class StoryList implements OnInit, OnDestroy, OnChanges {
  @Input() storyType: 'top' | 'best' | 'new' | 'ask' | 'show' | 'job' = 'top';
  @Input() pageSize = 30;

  private store = inject(StoryListStore);
  sidebarService = inject(SidebarService);
  deviceService = inject(DeviceService);
  keyboardNavService = inject(KeyboardNavigationService);
  networkState = inject(NetworkStateService);

  stories = this.store.stories;
  loading = this.store.loading;
  error = this.store.error;
  currentPage = this.store.currentPage;
  totalStoryIds = this.store.totalStoryIds;
  refreshing = this.store.refreshing;
  newStoriesAvailable = this.store.newStoriesAvailable;

  // Filter state
  filterMode = this.store.filterMode;
  isFilteredEmpty = this.store.isFilteredEmpty;

  // Filter options for segmented control
  readonly filterOptions: SegmentOption[] = [
    { value: 'default', label: FILTER_MODE_LABELS.default },
    { value: 'topHalf', label: FILTER_MODE_LABELS.topHalf },
  ];

  // Offline state
  isOffline = computed(() => this.networkState.isOffline());

  // Array for skeleton count based on page size
  skeletonArray = Array(this.pageSize)
    .fill(0)
    .map((_, i) => i);

  // Auto-refresh management
  private destroy$ = new Subject<void>();
  private autoRefreshInterval = environment.autoRefreshInterval;
  private maxBackgroundRefreshTime = environment.maxBackgroundRefreshTime;
  private tabHiddenTime: number | null = null;
  private backgroundRefreshEnabled = true;

  constructor() {
    effect(() => {
      const storyCount = this.stories().length;
      this.keyboardNavService.setTotalItems(storyCount);
    });
  }

  ngOnInit() {
    // Check cache on initial load
    this.store.init(this.storyType, this.pageSize);

    // Start auto-refresh timer
    this.startAutoRefresh();

    // Track tab visibility for background refresh
    this.setupVisibilityTracking();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['storyType'] && !changes['storyType'].firstChange) {
      this.store.init(this.storyType, this.pageSize);
    }
  }

  ngOnDestroy() {
    // Clean up auto-refresh timer
    this.destroy$.next();
    this.destroy$.complete();

    // Save current state when component is destroyed
    // State persisted by store
  }

  loadStories(isRefresh = false, refreshStartTime?: number) {
    this.store.loadStories(isRefresh, refreshStartTime);
  }

  loadMore() {
    if (!this.hasMore()) return;
    this.store.loadMore();
  }

  hasMore(): boolean {
    return this.store.hasMore();
  }

  refresh() {
    this.keyboardNavService.clearSelection();
    this.store.refresh();
  }

  private startAutoRefresh(): void {
    interval(this.autoRefreshInterval)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.shouldRefresh()),
        filter(() => !this.refreshing()), // Don't interfere with manual refresh
        filter(() => !this.isUserInteracting()), // Don't disrupt user when visible
      )
      .subscribe(() => {
        this.silentRefreshStoryList();
      });
  }

  private shouldRefresh(): boolean {
    // Always refresh if tab is visible
    if (document.visibilityState === 'visible') {
      return true;
    }

    // For hidden tabs, check if background refresh is enabled and within time limit
    if (!this.backgroundRefreshEnabled || this.tabHiddenTime === null) {
      return false;
    }

    const hiddenDuration = Date.now() - this.tabHiddenTime;
    return hiddenDuration < this.maxBackgroundRefreshTime;
  }

  private setupVisibilityTracking(): void {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab became hidden - start tracking
        this.tabHiddenTime = Date.now();
      } else {
        // Tab became visible - reset tracking and re-enable background refresh
        this.tabHiddenTime = null;
        this.backgroundRefreshEnabled = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up listener on destroy
    this.destroy$.subscribe(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  private isUserInteracting(): boolean {
    // Only check user interaction if tab is visible
    // When tab is hidden, user interaction doesn't matter
    if (document.visibilityState === 'hidden') {
      return false;
    }

    // Don't refresh if:
    // - User has scrolled down (reading)
    // - User has item selected (keyboard nav)
    return window.scrollY > 200 || this.keyboardNavService.selectedIndex() !== null;
  }

  private silentRefreshStoryList(): void {
    this.store.silentRefreshStoryList();
  }

  loadNewStories(): void {
    // User clicked the "X new stories" button
    this.newStoriesAvailable.set(0);

    // Trigger a manual refresh to load the new stories
    this.refresh();
  }

  /**
   * Handles filter mode changes from the segmented control.
   */
  onFilterModeChange(mode: string): void {
    this.store.setFilterMode(mode as StoryFilterMode);
    this.keyboardNavService.clearSelection();
  }

  /**
   * Resets the filter to default mode.
   */
  resetFilter(): void {
    this.store.resetFilter();
    this.keyboardNavService.clearSelection();
  }

  /**
   * Gets the empty message text based on the current filter mode.
   */
  getFilterEmptyMessage(): string {
    const mode = this.filterMode();
    if (mode === 'topHalf') {
      return 'No stories from today to show top 50%. Try again later or switch to a different filter.';
    }
    return 'No stories match the current filter.';
  }
}
