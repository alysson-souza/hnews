// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { formatRelativeTimeFromSeconds } from '../../services/relative-time.util';

import { ActivatedRoute, Router } from '@angular/router';
import { HackernewsService } from '../../services/hackernews.service';
import { HNUser, HNItem, isStory, isComment } from '../../models/hn';
import { forkJoin } from 'rxjs';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { UserTagComponent } from '../../components/user-tag/user-tag.component';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import { SearchResultComponent } from '../../components/search-result/search-result.component';
import { ResultListComponent } from '../../components/result-list/result-list.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { ScrollService } from '../../services/scroll.service';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../components/shared/segmented-control/segmented-control.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    PageContainerComponent,
    CardComponent,
    UserTagComponent,
    AppButtonComponent,
    SearchResultComponent,
    ResultListComponent,
    SegmentedControlComponent,
  ],
  template: `
    <app-page-container
      [class.lg:w-[60vw]]="sidebarService.isOpen() && deviceService.isDesktop()"
      class="transition-all duration-300"
    >
      @if (loading()) {
        <!-- Loading skeleton -->
        <div class="skeleton">
          <div class="skel-title mb-4"></div>
          <div class="skel-line mb-2"></div>
          <div class="skel-line w-3/4 mb-8"></div>
          <div class="space-y-4">
            <div class="skel-block"></div>
            <div class="skel-block"></div>
          </div>
        </div>
      } @else if (user()) {
        <!-- User Profile -->
        <app-card class="block mb-2 sm:mb-3" id="user-profile">
          <h1 class="user-title">
            <app-user-tag [username]="user()!.id" />
          </h1>

          <!-- User Stats -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div class="stat-box">
              <div class="stat-label">Karma</div>
              <div class="stat-value">{{ user()!.karma }}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Member Since</div>
              <div class="stat-value">{{ getDate(user()!.created) }}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Submissions</div>
              <div class="stat-value">{{ user()!.submitted?.length || 0 }}</div>
            </div>
          </div>

          <!-- About Section -->
          @if (user()!.about) {
            <div>
              <h2 class="about-title">About</h2>
              <div class="about-prose" [innerHTML]="user()!.about"></div>
            </div>
          }
        </app-card>

        <!-- Recent Submissions -->
        @if (loadingSubmissions()) {
          <app-result-list [showHeader]="true" [showLoadMore]="false">
            <ng-container header> Recent Submissions </ng-container>
            <div class="skeleton space-y-1 sm:space-y-2">
              <div class="skel-item"></div>
              <div class="skel-item"></div>
              <div class="skel-item"></div>
            </div>
          </app-result-list>
        } @else if (submissions().length > 0) {
          <app-result-list
            [showHeader]="true"
            [showLoadMore]="hasMore()"
            [loadingMore]="loadingMore()"
            (loadMore)="loadMoreSubmissions()"
          >
            <ng-container header>Recent Submissions</ng-container>
            <div filter>
              <app-segmented-control
                [options]="filterOptions"
                [value]="submissionFilter()"
                (valueChange)="onFilterChange($event)"
              />
            </div>
            @for (item of filteredSubmissions(); track item.id) {
              <app-search-result [item]="item" [isSearchResult]="false" />
            }
          </app-result-list>
        } @else {
          <app-result-list [showHeader]="true" [showLoadMore]="false">
            <ng-container header> Recent Submissions </ng-container>
            <p class="empty">No submissions yet</p>
          </app-result-list>
        }
      } @else if (error()) {
        <!-- Error State -->
        <div class="error-card">
          <p class="error-text">{{ error() }}</p>
          <app-button (clicked)="loadUser()" variant="danger" size="sm">Try Again</app-button>
        </div>
      }
    </app-page-container>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      /* Skeleton */
      .skel-title {
        @apply h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/4;
      }
      .skel-line {
        @apply h-4 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/2;
      }
      .skel-block {
        @apply h-20 bg-gray-200 dark:bg-gray-700 rounded-xl;
      }
      .skel-item {
        @apply h-16 bg-gray-200 dark:bg-gray-700 rounded-xl;
      }

      /* Titles */
      .user-title {
        @apply text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4;
      }
      .about-title {
        @apply text-base font-semibold text-gray-900 dark:text-gray-100 mb-4;
      }

      /* Stats */
      .stat-box {
        @apply rounded-xl p-3 sm:p-4 md:p-5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-all duration-200;
        @apply hover:bg-gray-100 dark:hover:bg-gray-600;
      }
      .stat-label {
        @apply text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1;
      }
      .stat-value {
        @apply text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100;
      }

      /* About */
      .about-prose {
        @apply prose prose-sm max-w-none text-gray-800 dark:text-gray-200;
        text-wrap: pretty;
      }

      /* Empty */
      .empty {
        @apply text-gray-500 dark:text-gray-400 text-center py-8;
      }

      /* Error */
      .error-card {
        @apply bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-xl p-6 text-center;
      }
      .error-text {
        @apply text-red-800 dark:text-red-300;
      }
    `,
  ],
})
export class UserComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hnService = inject(HackernewsService);
  sidebarService = inject(SidebarService);
  deviceService = inject(DeviceService);
  private scrollService = inject(ScrollService);

  user = signal<HNUser | null>(null);
  submissions = signal<HNItem[]>([]);
  loading = signal(true);
  loadingSubmissions = signal(true);
  loadingMore = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(0);
  pageSize = 20;

  // Filter for submission type
  submissionFilter = signal<'all' | 'stories' | 'comments'>('all');
  filterOptions: SegmentOption[] = [
    { value: 'all', label: 'All' },
    { value: 'stories', label: 'Stories' },
    { value: 'comments', label: 'Comments' },
  ];

  // Computed signal for filtered submissions
  filteredSubmissions = computed(() => {
    const filter = this.submissionFilter();
    const allSubmissions = this.submissions();

    if (filter === 'all') {
      return allSubmissions;
    } else if (filter === 'stories') {
      return allSubmissions.filter((item) => isStory(item));
    } else if (filter === 'comments') {
      return allSubmissions.filter((item) => isComment(item));
    }

    return allSubmissions;
  });

  ngOnInit() {
    // Check for both path params and query params (HN compatibility)
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadUser(id);
      } else {
        // Check query params for HN-style URLs (?id=username)
        this.route.queryParams.subscribe((queryParams) => {
          const queryId = queryParams['id'];
          if (queryId) {
            this.loadUser(queryId);
          }
        });
      }
    });

    // Read filter from query params
    this.route.queryParams.subscribe((queryParams) => {
      const filter = queryParams['filter'];
      if (filter === 'stories' || filter === 'comments' || filter === 'all') {
        this.submissionFilter.set(filter);
      }
    });
  }

  loadUser(id?: string) {
    const userId = id || this.route.snapshot.params['id'];
    if (!userId) {
      this.error.set('Invalid user ID');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.hnService.getUser(userId).subscribe({
      next: (user) => {
        if (user) {
          this.user.set(user);
          this.loadSubmissions(user);
          // Scroll to user profile after content loads
          this.scrollService.scrollToElement('user-profile', { delay: 100 });
        } else {
          this.error.set('User not found');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load user. Please try again.');
        this.loading.set(false);
      },
    });
  }

  loadSubmissions(user: HNUser) {
    if (!user.submitted || user.submitted.length === 0) {
      this.loadingSubmissions.set(false);
      return;
    }

    this.loadingSubmissions.set(true);
    const start = 0;
    const end = Math.min(this.pageSize, user.submitted.length);
    const itemIds = user.submitted.slice(start, end);

    const requests = itemIds.map((id) => this.hnService.getItem(id));

    forkJoin(requests).subscribe({
      next: (items) => {
        const validItems = items.filter((item) => item !== null && !item.deleted) as HNItem[];
        this.submissions.set(validItems);
        this.loadingSubmissions.set(false);
        this.currentPage.set(1);
      },
      error: () => {
        this.loadingSubmissions.set(false);
      },
    });
  }

  loadMoreSubmissions() {
    const user = this.user();
    if (!user || !user.submitted) return;

    this.loadingMore.set(true);
    const start = this.currentPage() * this.pageSize;
    const end = Math.min(start + this.pageSize, user.submitted.length);
    const itemIds = user.submitted.slice(start, end);

    const requests = itemIds.map((id) => this.hnService.getItem(id));

    forkJoin(requests).subscribe({
      next: (items) => {
        const validItems = items.filter((item) => item !== null && !item.deleted) as HNItem[];
        this.submissions.update((subs) => [...subs, ...validItems]);
        this.loadingMore.set(false);
        this.currentPage.update((p) => p + 1);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  hasMore(): boolean {
    const user = this.user();
    if (!user || !user.submitted) return false;
    return this.currentPage() * this.pageSize < user.submitted.length;
  }

  getTimeAgo(timestamp: number): string {
    return formatRelativeTimeFromSeconds(timestamp);
  }

  getDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  onFilterChange(filter: string): void {
    if (filter === 'stories' || filter === 'comments' || filter === 'all') {
      this.submissionFilter.set(filter);
      // Update query params to persist filter state
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { filter: filter !== 'all' ? filter : null },
        queryParamsHandling: 'merge',
      });
    }
  }
}
