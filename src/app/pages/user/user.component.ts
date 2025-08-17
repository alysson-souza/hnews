// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HackernewsService, HNUser, HNItem } from '../../services/hackernews.service';
import { forkJoin } from 'rxjs';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterLink, PageContainerComponent, CardComponent],
  template: `
    <app-page-container>
      @if (loading()) {
        <!-- Loading skeleton -->
        <div class="animate-pulse">
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
        <app-card class="block mb-6">
          <h1 class="user-title">{{ user()!.id }}</h1>

          <!-- User Stats -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
            <div class="mb-6">
              <h2 class="about-title">About</h2>
              <div class="about-prose" [innerHTML]="user()!.about"></div>
            </div>
          }
        </app-card>

        <!-- Recent Submissions -->
        <app-card class="block">
          <h2 class="subs-title">Recent Submissions</h2>

          @if (loadingSubmissions()) {
            <div class="animate-pulse space-y-4">
              <div class="skel-item"></div>
              <div class="skel-item"></div>
              <div class="skel-item"></div>
            </div>
          } @else if (submissions().length > 0) {
            <div class="space-y-4">
              @for (item of submissions(); track item.id) {
                <div class="sub-item">
                  @if (item.type === 'story') {
                    <!-- Story -->
                    <div>
                      <h3 class="sub-title">
                        @if (item.url) {
                          <a
                            [href]="item.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="title-link"
                          >
                            {{ item.title }}
                          </a>
                        } @else {
                          <a [routerLink]="['/item', item.id]" class="title-link">
                            {{ item.title }}
                          </a>
                        }
                      </h3>
                      <div class="sub-meta">
                        <span>{{ item.score || 0 }} points</span>
                        <span>•</span>
                        <span>{{ getTimeAgo(item.time) }}</span>
                        <span>•</span>
                        <a [routerLink]="['/item', item.id]" class="sub-meta-link">
                          {{ item.descendants || 0 }} comments
                        </a>
                      </div>
                    </div>
                  } @else if (item.type === 'comment') {
                    <!-- Comment -->
                    <div>
                      <div
                        class="sub-comment prose prose-sm max-w-none mb-2 line-clamp-3"
                        [innerHTML]="item.text"
                      ></div>
                      <div class="sub-meta">
                        <span>{{ getTimeAgo(item.time) }}</span>
                        <span>•</span>
                        <a [routerLink]="['/item', item.parent]" class="sub-meta-link">
                          View Context
                        </a>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            @if (hasMore()) {
              <button
                (click)="loadMoreSubmissions()"
                [disabled]="loadingMore()"
                class="subs-load-btn"
              >
                {{ loadingMore() ? 'Loading...' : 'Load More' }}
              </button>
            }
          } @else {
            <p class="empty">No submissions yet</p>
          }
        </app-card>
      } @else if (error()) {
        <!-- Error State -->
        <div class="error-card">
          <p class="error-text">{{ error() }}</p>
          <button (click)="loadUser()" class="error-btn">Try Again</button>
        </div>
      }
    </app-page-container>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      /* Skeleton */
      .skel-title {
        @apply h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/4;
      }
      .skel-line {
        @apply h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2;
      }
      .skel-block {
        @apply h-20 bg-gray-200 dark:bg-slate-800 rounded;
      }
      .skel-item {
        @apply h-16 bg-gray-200 dark:bg-slate-800 rounded;
      }

      /* Titles */
      .user-title {
        @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4;
      }
      .about-title {
        @apply text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 md:mb-4;
      }
      .subs-title {
        @apply text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-4;
      }

      /* Improve Recent Submissions header contrast specifically in dark mode */
      :host-context(.dark) .subs-title {
        @apply text-white;
      }

      /* Stats */
      .stat-box {
        @apply rounded p-3 bg-gray-50 dark:bg-slate-900 border border-transparent dark:border-slate-800;
      }
      .stat-label {
        @apply text-sm text-gray-600 dark:text-gray-400;
      }
      .stat-value {
        @apply text-xl font-semibold text-gray-900 dark:text-gray-100;
      }

      /* About */
      .about-prose {
        @apply prose prose-sm max-w-none text-gray-800 dark:text-gray-200;
      }

      /* Submissions */
      .sub-item {
        @apply border-b border-gray-200 dark:border-slate-800 pb-4 last:border-0;
      }
      .sub-title {
        @apply font-medium text-gray-900 dark:text-gray-100 mb-1;
      }
      .title-link {
        @apply hover:text-blue-600 dark:hover:text-blue-400;
      }
      .sub-meta {
        @apply flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400;
      }
      .sub-meta-link {
        @apply text-blue-600 dark:text-blue-300 hover:underline;
      }
      .sub-comment {
        @apply text-gray-800 dark:text-gray-200;
      }
      .subs-load-btn {
        @apply mt-6 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50;
      }

      /* Empty */
      .empty {
        @apply text-gray-500 dark:text-gray-400 text-center py-8;
      }

      /* Error */
      .error-card {
        @apply bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center;
      }
      .error-text {
        @apply text-red-800 dark:text-red-300;
      }
      .error-btn {
        @apply mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500;
      }
    `,
  ],
})
export class UserComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private hnService = inject(HackernewsService);

  user = signal<HNUser | null>(null);
  submissions = signal<HNItem[]>([]);
  loading = signal(true);
  loadingSubmissions = signal(true);
  loadingMore = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(0);
  pageSize = 20;

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
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }

  getDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }
}
