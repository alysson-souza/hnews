// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { HNItem } from '../models/hn';
import { StoryFilterMode, applyStoryFilter } from '../models/story-filter';
import { HackernewsService } from '../services/hackernews.service';
import { StoryListStateService } from '../services/story-list-state.service';
import { StoryFilterPreferencesService } from '../services/story-filter-preferences.service';
import { map, switchMap, take } from 'rxjs/operators';
import { of } from 'rxjs';

export type StoryType = 'top' | 'best' | 'new' | 'ask' | 'show' | 'job';

@Injectable({ providedIn: 'root' })
export class StoryListStore {
  private hn = inject(HackernewsService);
  private state = inject(StoryListStateService);
  private filterPrefs = inject(StoryFilterPreferencesService);

  /** Input: current list category */
  readonly storyType = signal<StoryType>('top');
  /** Input: number of items per page */
  readonly pageSize = signal<number>(30);

  /** Raw pool of loaded stories (before filtering) */
  private readonly loadedStories = signal<HNItem[]>([]);
  /** Current filter mode */
  readonly filterMode = signal<StoryFilterMode>(this.filterPrefs.filterMode());

  /** Visible stories after applying the current filter */
  readonly visibleStories: Signal<HNItem[]> = computed(() =>
    applyStoryFilter(this.loadedStories(), this.filterMode()),
  );

  /** Current page items - exposed for backward compatibility */
  readonly stories = this.visibleStories;
  /** Network/processing state */
  readonly loading = signal<boolean>(true);
  /** Non-fatal user-visible error */
  readonly error = signal<string | null>(null);
  /** Zero-based page index */
  readonly currentPage = signal<number>(0);
  /** All IDs for the selected category */
  readonly totalStoryIds = signal<number[]>([]);
  /** True while explicit refresh is active */
  readonly refreshing = signal<boolean>(false);
  /** Count of new items detected at top during background refresh */
  readonly newStoriesAvailable = signal<number>(0);
  /** Pending fresh IDs detected by background refresh; applied on user intent */
  private readonly pendingTotalIds = signal<number[] | null>(null);
  /** Number of IDs that have been fetched/materialized */
  private readonly fetchedCount = signal<number>(0);

  /** Minimum pool size for filtered modes */
  private readonly FILTERED_MIN_POOL_SIZE = 60;
  /** Target count for todayTop20 mode */
  private readonly TODAY_TOP_20_TARGET = 20;
  /** Batch size for fetching in filtered modes */
  private readonly FILTERED_BATCH_SIZE = 50;

  /** True when another page is available */
  readonly hasMore: Signal<boolean> = computed(() => {
    const mode = this.filterMode();
    if (mode === 'default') {
      return (this.currentPage() + 1) * this.pageSize() < this.totalStoryIds().length;
    }
    // For filtered modes, check if there are more IDs to fetch
    return this.fetchedCount() < this.totalStoryIds().length;
  });

  /** True when filter returned no results but raw pool has items */
  readonly isFilteredEmpty: Signal<boolean> = computed(
    () => this.visibleStories().length === 0 && this.loadedStories().length > 0,
  );

  /**
   * Initialize or switch category; attempts to restore from session cache,
   * otherwise fetches IDs and first page.
   */
  init(type: StoryType, pageSize = 30): void {
    const typeChanged = this.storyType() !== type;
    this.storyType.set(type);
    this.pageSize.set(pageSize);

    if (typeChanged) {
      // Reset view state when switching categories
      this.loading.set(true);
      this.error.set(null);
      this.currentPage.set(0);
      this.loadedStories.set([]);
      this.totalStoryIds.set([]);
      this.newStoriesAvailable.set(0);
      this.fetchedCount.set(0);
    }

    // Sync filter mode from preferences
    this.filterMode.set(this.filterPrefs.filterMode());

    const cachedState = this.state.getState(type);
    if (cachedState) {
      this.loadedStories.set(cachedState.stories);
      this.currentPage.set(cachedState.currentPage);
      this.totalStoryIds.set(cachedState.totalStoryIds);
      this.fetchedCount.set(cachedState.stories.length);
      this.loading.set(false);
    } else {
      this.loadStories();
    }

    // Always reset scroll to top when (re)initializing the list so tab switches
    // don't jump down to a cached scroll position.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /**
   * Sets the filter mode and persists the preference.
   * Triggers additional fetching if needed for filtered modes.
   */
  setFilterMode(mode: StoryFilterMode): void {
    if (this.filterMode() === mode) {
      return;
    }

    this.filterMode.set(mode);
    this.filterPrefs.setFilterMode(mode);

    // Check if we need to fetch more stories for filtered modes
    if (mode !== 'default' && this.loadedStories().length < this.getRequiredPoolSize(mode)) {
      this.fetchMoreForFilter();
    }

    this.saveCurrentState();
  }

  /**
   * Resets the filter to default mode.
   */
  resetFilter(): void {
    this.setFilterMode('default');
  }

  /**
   * Gets the required pool size for a filtered mode.
   */
  private getRequiredPoolSize(mode: StoryFilterMode): number {
    if (mode === 'todayTop20') {
      // Need at least this many to have a chance of getting 20 from today
      return this.FILTERED_MIN_POOL_SIZE;
    } else if (mode === 'topHalf') {
      // Need at least 2x pageSize for meaningful top-half
      return Math.max(this.FILTERED_MIN_POOL_SIZE, this.pageSize() * 2);
    }
    return this.pageSize();
  }

  /**
   * Fetches more stories to support filtered modes.
   */
  private fetchMoreForFilter(): void {
    const totalIds = this.totalStoryIds();
    const fetched = this.fetchedCount();

    if (fetched >= totalIds.length) {
      return; // No more to fetch
    }

    this.loading.set(true);

    const end = Math.min(fetched + this.FILTERED_BATCH_SIZE, totalIds.length);
    const idsToFetch = totalIds.slice(fetched, end);

    this.hn
      .getItems(idsToFetch)
      .pipe(map((items) => items.filter((i): i is HNItem => !!i)))
      .subscribe({
        next: (items) => {
          // Deduplicate and merge with existing pool
          const currentPool = this.loadedStories();
          const existingIds = new Set(currentPool.map((s) => s.id));
          const newItems = items.filter((item) => !existingIds.has(item.id));
          this.loadedStories.update((pool) => [...pool, ...newItems]);
          this.fetchedCount.set(end);
          this.loading.set(false);
          this.saveCurrentState();
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  /**
   * Fetch IDs and current page items; when isRefresh is true, applies a short
   * minimum display time and then performs a background details refresh.
   */
  loadStories(isRefresh = false, refreshStartTime?: number): void {
    this.loading.set(true);
    this.error.set(null);
    // Use cached-first by default; on explicit refresh, force fetch IDs
    this.getStoryIds(isRefresh)
      .pipe(take(1))
      .pipe(
        switchMap((ids) => {
          this.totalStoryIds.set(ids);

          // Determine how many IDs to fetch based on filter mode
          const mode = this.filterMode();
          const fetchCount = mode === 'default' ? this.pageSize() : this.getRequiredPoolSize(mode);

          const start = mode === 'default' ? this.currentPage() * this.pageSize() : 0;
          const end = mode === 'default' ? start + this.pageSize() : fetchCount;
          const pageIds = ids.slice(start, end);

          // For manual refresh we force-refresh item details to replace cached immediately
          return this.hn.getItems(pageIds, isRefresh);
        }),
        map((items) => items.filter((i): i is HNItem => !!i)),
      )
      .subscribe({
        next: (items) => {
          this.loadedStories.set(items);
          this.fetchedCount.set(items.length);
          this.loading.set(false);

          if (isRefresh && refreshStartTime) {
            const elapsed = Date.now() - refreshStartTime;
            const remainingTime = Math.max(0, 500 - elapsed);
            if (remainingTime > 0) {
              setTimeout(() => this.refreshing.set(false), remainingTime);
            } else {
              this.refreshing.set(false);
            }
            // No indicator in manual refresh, we already replaced content
          }

          // Non-manual loads do not auto-trigger silent refresh here; the component can decide

          this.saveCurrentState();
        },
        error: () => {
          // Preserve existing view; only show an error if we had nothing to show
          if (this.visibleStories().length === 0) {
            this.error.set('Failed to load stories. Please try again.');
          }
          this.loading.set(false);
          if (isRefresh) this.refreshing.set(false);
        },
      });
  }

  /** Clear persisted state for current category and reload from network. */
  refresh(): void {
    // Manual refresh should clear any pending indicators/state
    this.newStoriesAvailable.set(0);
    this.pendingTotalIds.set(null);
    this.refreshing.set(true);
    // Do NOT clear current in-memory stories/ids; keep showing cached content.
    // We'll attempt a network refresh; on success, loadStories will update state
    // and save snapshot. On failure, we keep the existing cached view.
    const refreshStartTime = Date.now();
    this.loadStories(true, refreshStartTime);
  }

  /** Append next page items if available. */
  loadMore(): void {
    if (!this.hasMore()) return;

    const mode = this.filterMode();

    if (mode !== 'default') {
      // For filtered modes, fetch more stories to expand the pool
      this.fetchMoreForFilter();
      return;
    }

    // Default mode: paginated loading
    this.currentPage.update((p) => p + 1);
    this.loading.set(true);

    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    const pageIds = this.totalStoryIds().slice(start, end);

    this.hn
      .getItems(pageIds)
      .pipe(map((items) => items.filter((i): i is HNItem => !!i)))
      .subscribe({
        next: (items) => {
          this.loadedStories.update((s) => [...s, ...items]);
          this.fetchedCount.update((c) => c + items.length);
          this.loading.set(false);
          this.saveCurrentState();
        },
        error: () => {
          this.error.set('Failed to load more stories.');
          this.loading.set(false);
        },
      });
  }

  /** Background refresh; updates top IDs and new-stories indicator only. */
  silentRefreshStoryList(): void {
    console.debug('🔄 Auto refresh: Checking for new stories...');
    this.getStoryIds(true)
      .pipe(take(1))
      .subscribe({
        next: (freshIds) => {
          const currentIds = this.totalStoryIds();
          const newStoryCount = this.countNewStoriesAtTop(currentIds, freshIds);
          console.debug(`🔄 Auto refresh: Found ${newStoryCount} new stories`);
          if (newStoryCount > 0 && window.scrollY < 100) {
            console.debug(
              `🔄 Auto refresh: Showing new stories indicator with ${newStoryCount} stories`,
            );
            this.newStoriesAvailable.set(newStoryCount);
            // Stash fresh ids to apply later when the user chooses
            this.pendingTotalIds.set(freshIds);
          } else {
            // Clear pending if nothing new or user is not at top
            this.pendingTotalIds.set(null);
          }
        },
      });
  }

  loadNewStories(): void {
    this.newStoriesAvailable.set(0);
    // Apply any pending ids discovered via silent refresh
    const pending = this.pendingTotalIds();
    if (pending && pending.length) {
      this.totalStoryIds.set(pending);
      this.pendingTotalIds.set(null);
    }
    this.refresh();
  }

  private getStoryIds(forceRefresh = false) {
    switch (this.storyType()) {
      case 'top':
        return this.hn.getTopStories(forceRefresh);
      case 'best':
        return this.hn.getBestStories(forceRefresh);
      case 'new':
        return this.hn.getNewStories(forceRefresh);
      case 'ask':
        return this.hn.getAskStories(forceRefresh);
      case 'show':
        return this.hn.getShowStories(forceRefresh);
      case 'job':
        return this.hn.getJobStories(forceRefresh);
      default:
        return of([] as number[]);
    }
  }

  /** Fetch fresh details for the first page to update counts/titles. */
  private refreshStoryDetails(storyIds: number[]): void {
    this.hn.getItems(storyIds, true).subscribe({
      next: (freshItems) => {
        const validItems = freshItems.filter((i): i is HNItem => !!i);
        if (validItems.length > 0) {
          this.loadedStories.set(validItems);
          this.saveCurrentState();
        }
      },
    });
  }

  private countNewStoriesAtTop(currentIds: number[], freshIds: number[]): number {
    if (currentIds.length === 0) return 0;
    const firstCurrentId = currentIds[0];
    const firstCurrentIndex = freshIds.indexOf(firstCurrentId);
    return firstCurrentIndex > 0 ? firstCurrentIndex : 0;
  }

  private mergeNewStories(newStories: (HNItem | null)[]): void {
    const validNewStories = newStories.filter((i): i is HNItem => !!i);
    if (validNewStories.length === 0) return;

    const currentStories = this.loadedStories();
    const currentIds = currentStories.map((s) => s.id);
    const trulyNew = validNewStories.filter((s) => !currentIds.includes(s.id));
    if (trulyNew.length > 0) {
      const merged = [...trulyNew, ...currentStories];
      this.loadedStories.set(merged.slice(0, this.pageSize()));
      this.saveCurrentState();
    }
  }

  /** Persist snapshot to session storage via StoryListStateService. */
  private saveCurrentState(): void {
    this.state.saveState(
      this.storyType(),
      this.loadedStories(),
      this.currentPage(),
      this.totalStoryIds(),
      null,
    );
  }
}
