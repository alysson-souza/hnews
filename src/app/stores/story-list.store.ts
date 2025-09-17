// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { HNItem } from '../models/hn';
import { HackernewsService } from '../services/hackernews.service';
import { StoryListStateService } from '../services/story-list-state.service';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export type StoryType = 'top' | 'best' | 'new' | 'ask' | 'show' | 'job';

@Injectable({ providedIn: 'root' })
export class StoryListStore {
  private hn = inject(HackernewsService);
  private state = inject(StoryListStateService);

  /** Input: current list category */
  readonly storyType = signal<StoryType>('top');
  /** Input: number of items per page */
  readonly pageSize = signal<number>(30);

  /** Current page items */
  readonly stories = signal<HNItem[]>([]);
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

  /** True when another page is available */
  readonly hasMore: Signal<boolean> = computed(
    () => (this.currentPage() + 1) * this.pageSize() < this.totalStoryIds().length,
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
      this.stories.set([]);
      this.totalStoryIds.set([]);
      this.newStoriesAvailable.set(0);
    }

    const cachedState = this.state.getState(type);
    if (cachedState) {
      this.stories.set(cachedState.stories);
      this.currentPage.set(cachedState.currentPage);
      this.totalStoryIds.set(cachedState.totalStoryIds);
      this.loading.set(false);
      if (cachedState.scrollPosition !== undefined) {
        setTimeout(() => {
          window.scrollTo({ top: cachedState.scrollPosition, behavior: 'instant' });
        }, 50);
      }
    } else {
      this.loadStories();
    }
  }

  /**
   * Fetch IDs and current page items; when isRefresh is true, applies a short
   * minimum display time and then performs a background details refresh.
   */
  loadStories(isRefresh = false, refreshStartTime?: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.getStoryIds(isRefresh)
      .pipe(
        switchMap((ids) => {
          this.totalStoryIds.set(ids);
          const start = this.currentPage() * this.pageSize();
          const end = start + this.pageSize();
          const pageIds = ids.slice(start, end);
          return this.hn.getItems(pageIds);
        }),
        map((items) => items.filter((i): i is HNItem => !!i)),
      )
      .subscribe({
        next: (items) => {
          this.stories.set(items);
          this.loading.set(false);

          if (isRefresh && refreshStartTime) {
            const elapsed = Date.now() - refreshStartTime;
            const remainingTime = Math.max(0, 500 - elapsed);
            if (remainingTime > 0) {
              setTimeout(() => this.refreshing.set(false), remainingTime);
            } else {
              this.refreshing.set(false);
            }
            const storyIds = this.totalStoryIds().slice(0, this.pageSize());
            this.refreshStoryDetails(storyIds);
          }

          this.saveCurrentState();
        },
        error: () => {
          this.error.set('Failed to load stories. Please try again.');
          this.loading.set(false);
          if (isRefresh) this.refreshing.set(false);
        },
      });
  }

  /** Clear persisted state for current category and reload from network. */
  refresh(): void {
    this.refreshing.set(true);
    this.state.clearState(this.storyType());
    this.currentPage.set(0);
    this.stories.set([]);

    const refreshStartTime = Date.now();
    this.loadStories(true, refreshStartTime);
  }

  /** Append next page items if available. */
  loadMore(): void {
    if (!this.hasMore()) return;
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
          this.stories.update((s) => [...s, ...items]);
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
    this.getStoryIds(true).subscribe({
      next: (freshIds) => {
        const currentIds = this.totalStoryIds();
        const newStoryCount = this.countNewStoriesAtTop(currentIds, freshIds);
        console.debug(`🔄 Auto refresh: Found ${newStoryCount} new stories`);
        if (newStoryCount > 0 && window.scrollY < 100) {
          console.debug(
            `🔄 Auto refresh: Showing new stories indicator with ${newStoryCount} stories`,
          );
          this.newStoriesAvailable.set(newStoryCount);
        }
        this.totalStoryIds.set(freshIds);
      },
    });
  }

  loadNewStories(): void {
    this.newStoriesAvailable.set(0);
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
          this.stories.set(validItems);
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

    const currentStories = this.stories();
    const currentIds = currentStories.map((s) => s.id);
    const trulyNew = validNewStories.filter((s) => !currentIds.includes(s.id));
    if (trulyNew.length > 0) {
      const merged = [...trulyNew, ...currentStories];
      this.stories.set(merged.slice(0, this.pageSize()));
      this.saveCurrentState();
    }
  }

  /** Persist snapshot to session storage via StoryListStateService. */
  private saveCurrentState(): void {
    this.state.saveState(
      this.storyType(),
      this.stories(),
      this.currentPage(),
      this.totalStoryIds(),
      null,
    );
  }
}
