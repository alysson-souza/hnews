// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, computed, effect, inject, signal } from '@angular/core';
import { take } from 'rxjs/operators';

import { StoryItem } from '@components/story-item/story-item';
import { PageContainerComponent } from '@components/shared/page-container/page-container.component';
import { HNItem } from '@models/hn';
import { HackernewsService } from '@services/hackernews.service';
import { KeyboardNavigationService } from '@services/keyboard-navigation.service';
import { NetworkStateService } from '@services/network-state.service';
import { SavedStoriesService, SavedStoryRecord } from '@services/saved-stories.service';
import { SidebarService } from '@services/sidebar.service';

@Component({
  selector: 'app-saved-stories',
  imports: [PageContainerComponent, StoryItem],
  template: `
    <app-page-container
      [class.lg:w-[60vw]]="sidebarService.isOpen()"
      class="lg:transition-[width] lg:duration-300"
      [noPadding]="true"
    >
      <div class="pt-3 pb-6 sm:py-8">
        @if (isOffline() && records().length > 0) {
          <div class="offline-indicator" role="status" aria-live="polite">
            <span class="offline-text">Showing saved snapshots. Connect to refresh.</span>
          </div>
        }

        @if (error()) {
          <div class="alert-error" role="alert">
            <p>{{ error() }}</p>
            <button (click)="refresh()" class="alert-link" type="button">Try again</button>
          </div>
        }

        @if (records().length === 0) {
          <div class="empty" role="status" aria-live="polite">
            <p class="empty-title">No saved stories</p>
            <p class="empty-text">Saved stories will appear here.</p>
          </div>
        } @else {
          <div class="stories-space">
            @for (record of records(); track record.id; let i = $index) {
              <app-story-item
                [story]="storyFor(record)"
                [loading]="false"
                [index]="i + 1"
                [isSelected]="keyboardNavService.selectedIndex() === i"
                [attr.data-story-index]="i"
                [attr.data-story-id]="record.id"
              />
            }
          </div>
        }

        @if (refreshing()) {
          <div class="loading-wrap" role="status" aria-live="polite">
            <div class="loading-spin"></div>
            <span class="loading-text">Refreshing saved stories...</span>
          </div>
        }
      </div>
    </app-page-container>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .stories-space {
        @apply space-y-3 sm:space-y-4;
      }

      .offline-indicator {
        @apply mb-4 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-center text-yellow-800 dark:text-yellow-300;
      }
      .offline-text {
        @apply text-sm font-medium;
      }

      .alert-error {
        @apply bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4;
      }
      .alert-link {
        @apply mt-2 text-sm underline hover:no-underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1;
      }

      .empty {
        @apply text-center py-10 px-4 text-gray-500 dark:text-gray-400;
      }
      .empty-title {
        @apply text-base font-semibold text-gray-800 dark:text-gray-200 mb-1;
      }
      .empty-text {
        @apply text-sm;
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
    `,
  ],
})
export class SavedStoriesComponent {
  private savedStories = inject(SavedStoriesService);
  private hackernews = inject(HackernewsService);
  private networkState = inject(NetworkStateService);
  sidebarService = inject(SidebarService);
  keyboardNavService = inject(KeyboardNavigationService);

  records = computed(() => this.savedStories.getAll());
  refreshing = signal(false);
  error = signal<string | null>(null);
  isOffline = computed(() => this.networkState.isOffline());

  constructor() {
    effect(() => {
      this.keyboardNavService.setTotalItems(this.records().length);
    });

    queueMicrotask(() => {
      if (this.networkState.isOnline() && this.records().length > 0) {
        this.refresh();
      }
    });
  }

  refresh(): void {
    const ids = this.records().map((record) => record.id);
    if (!ids.length || this.refreshing() || this.networkState.isOffline()) {
      return;
    }

    this.refreshing.set(true);
    this.error.set(null);
    this.keyboardNavService.clearSelection();

    this.hackernews
      .getItems(ids, true)
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.savedStories.updateSnapshots(items);
          this.refreshing.set(false);
        },
        error: () => {
          this.error.set('Unable to refresh saved stories.');
          this.refreshing.set(false);
        },
      });
  }

  storyFor(record: SavedStoryRecord): HNItem {
    return (
      record.story ?? {
        id: record.id,
        type: 'story',
        time: Math.floor(record.savedAt / 1000),
        title: `Story ${record.id}`,
      }
    );
  }
}
