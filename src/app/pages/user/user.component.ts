// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { formatRelativeTimeFromSeconds } from '../../services/relative-time.util';
import { DecimalPipe } from '@angular/common';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HackernewsService } from '../../services/hackernews.service';
import { HNUser, HNItem, isStory, isComment } from '../../models/hn';
import { forkJoin } from 'rxjs';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { UserTagComponent } from '../../components/user-tag/user-tag.component';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { ScrollService } from '../../services/scroll.service';
import { CommentTextComponent } from '../../components/comment-text/comment-text.component';
import { getDomain } from '../../services/domain.utils';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../components/shared/segmented-control/segmented-control.component';
import { StoryLinkComponent } from '../../components/shared/story-link/story-link.component';

@Component({
  selector: 'app-user',
  imports: [
    PageContainerComponent,
    CardComponent,
    UserTagComponent,
    AppButtonComponent,
    SegmentedControlComponent,
    CommentTextComponent,
    RouterLink,
    DecimalPipe,
    StoryLinkComponent,
  ],
  template: `
    <app-page-container
      [class.lg:w-[60vw]]="sidebarService.isOpen() && deviceService.isDesktop()"
      class="lg:transition-[width] lg:duration-300"
    >
      <div class="space-y-3 sm:space-y-4">
        @if (loading()) {
          <app-card class="block">
            <div class="skeleton space-y-5">
              <div class="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                @for (box of [0, 1, 2]; track box) {
                  <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                }
              </div>
              <div class="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </app-card>
          <app-card class="block">
            <div class="skeleton space-y-4">
              <div class="flex items-center justify-between gap-3">
                <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div class="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              @for (row of [0, 1, 2]; track row) {
                <div
                  class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 p-4 space-y-3"
                >
                  <div class="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div class="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div class="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              }
            </div>
          </app-card>
        } @else if (user()) {
          <app-card class="block profile-card" id="user-profile">
            <div class="space-y-1 mb-4">
              <p class="eyebrow">User</p>
              <h1 class="page-title">
                <app-user-tag [username]="user()!.id" />
              </h1>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div class="stat-box">
                <div class="stat-label">Karma</div>
                <div class="stat-value">{{ user()!.karma | number }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Submissions</div>
                <div class="stat-value">{{ user()!.submitted?.length || 0 | number }}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Member Since</div>
                <div class="stat-value">{{ getDate(user()!.created) }}</div>
              </div>
            </div>

            @if (user()!.about) {
              <div class="space-y-2">
                <p class="section-label">About</p>
                <app-comment-text [html]="user()!.about || ''" />
              </div>
            }
          </app-card>

          <app-card class="block activity-card">
            <div class="activity-header">
              <div>
                <p class="section-label">Recent activity</p>
                <p class="muted">
                  Loaded {{ filteredSubmissions().length | number }} {{ filterLabel() }} •
                  {{ totalSubmissions() | number }} total submissions
                </p>
              </div>
              <app-segmented-control
                class="w-full sm:w-auto"
                [options]="filterOptions"
                [value]="submissionFilter()"
                (valueChange)="onFilterChange($event)"
              />
            </div>

            @if (loadingSubmissions()) {
              <div class="space-y-3">
                @for (row of [0, 1, 2]; track row) {
                  <div class="activity-skeleton skeleton">
                    <div class="flex items-center gap-2 mb-3">
                      <div class="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                    <div class="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
                    <div class="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                }
              </div>
            } @else if (filteredSubmissions().length > 0) {
              <div class="activity-list">
                @for (item of filteredSubmissions(); track item.id) {
                  <article class="activity-item" [class.comment-item]="isComment(item)">
                    <div class="item-top">
                      <span
                        class="type-pill"
                        [class.type-comment]="isComment(item)"
                        [class.type-story]="!isComment(item)"
                      >
                        {{ isComment(item) ? 'Comment' : item.type === 'job' ? 'Job' : 'Story' }}
                      </span>
                      <span class="muted">{{ getTimeAgo(item.time) }}</span>
                      @if (isStory(item) && item.url && getDomain(item.url)) {
                        <span class="pill-soft" [title]="item.url">{{ getDomain(item.url) }}</span>
                      }
                    </div>

                    @if (isStory(item)) {
                      <h3 class="activity-title">
                        @if (item.url) {
                          <app-story-link
                            [url]="item.url"
                            [textContent]="item.title || '[untitled]'"
                            class="title-link"
                          />
                        } @else {
                          <a [routerLink]="['/item', item.id]" class="title-link">
                            {{ item.title || '[untitled]' }}
                          </a>
                        }
                      </h3>
                      <div class="item-meta">
                        @if (item.by) {
                          <span class="inline-flex items-center gap-1">
                            by <app-user-tag [username]="item.by" />
                          </span>
                          <span>•</span>
                        }
                        <span>{{ item.score || 0 | number }} points</span>
                        <span>•</span>
                        <a [routerLink]="['/item', item.id]" class="meta-link">
                          {{ item.descendants || 0 | number }}
                          {{ item.descendants === 1 ? 'comment' : 'comments' }}
                        </a>
                      </div>
                    } @else {
                      <div class="comment-shell">
                        <app-comment-text [html]="item.text || ''" />
                      </div>
                      <div class="item-meta">
                        <a [routerLink]="['/item', item.id]" class="meta-link">View thread</a>
                        @if (item.parent) {
                          <span>•</span>
                          <a [routerLink]="['/item', item.parent]" class="meta-link">Parent</a>
                        }
                        <span>•</span>
                        <span class="muted">
                          {{ item.kids?.length || 0 | number }}
                          {{ (item.kids?.length || 0) === 1 ? 'reply' : 'replies' }}
                        </span>
                      </div>
                    }
                  </article>
                }
              </div>

              @if (hasMore()) {
                <div class="mt-4">
                  <app-button
                    (clicked)="loadMoreSubmissions()"
                    [disabled]="loadingMore()"
                    variant="primary"
                    size="sm"
                    [fullWidth]="deviceService.isMobile()"
                  >
                    {{ loadingMore() ? 'Loading...' : 'Load more' }}
                  </app-button>
                </div>
              }
            } @else {
              <p class="empty">No submissions yet</p>
            }
          </app-card>
        } @else if (error()) {
          <div class="error-card">
            <p class="error-text">{{ error() }}</p>
            <app-button (clicked)="loadUser()" variant="danger" size="sm">Try Again</app-button>
          </div>
        }
      </div>
    </app-page-container>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .profile-card .card-base {
        @apply bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-950;
      }
      .page-title {
        @apply text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight;
      }
      .eyebrow {
        @apply text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400;
      }
      .section-label {
        @apply text-sm font-semibold text-gray-800 dark:text-gray-200;
      }
      .muted {
        @apply text-sm text-gray-500 dark:text-gray-400;
      }

      /* Stats */
      .stat-box {
        @apply rounded-xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-sm;
      }
      .stat-label {
        @apply text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400;
      }
      .stat-value {
        @apply text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100;
      }

      /* Activity */
      .activity-card .card-base {
        @apply border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900;
      }
      .activity-header {
        @apply flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-700;
      }
      .activity-list {
        @apply divide-y divide-gray-200 dark:divide-gray-800;
      }
      .activity-item {
        @apply py-4 space-y-2;
      }
      .item-top {
        @apply flex flex-wrap items-center gap-2 text-xs sm:text-sm;
      }
      .type-pill {
        @apply inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold;
        @apply bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-200;
      }
      .type-story {
        @apply bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200;
      }
      .type-comment {
        @apply bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200;
      }
      .pill-soft {
        @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
        @apply bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-gray-300;
        @apply max-w-[200px] truncate;
      }
      .activity-title {
        @apply text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight;
      }
      .title-link {
        @apply hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 decoration-2 hover:underline transition-colors;
      }
      .item-meta {
        @apply flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-600 dark:text-gray-400;
      }
      .meta-link {
        @apply text-blue-600 dark:text-blue-300 hover:underline decoration-2 underline-offset-2;
      }
      .comment-shell {
        @apply rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/70 p-3 sm:p-4;
      }
      .activity-skeleton {
        @apply rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4;
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

  isStory = isStory;
  isComment = isComment;
  getDomain = getDomain;

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

  filterLabel = computed(() => {
    const filter = this.submissionFilter();
    if (filter === 'stories') return 'stories';
    if (filter === 'comments') return 'comments';
    return 'items';
  });

  totalSubmissions = computed(() => this.user()?.submitted?.length ?? 0);

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
