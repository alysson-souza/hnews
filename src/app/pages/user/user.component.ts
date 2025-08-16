// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HackernewsService, HNUser, HNItem } from '../../services/hackernews.service';
import { forkJoin } from 'rxjs';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterLink, PageContainerComponent],
  template: `
    <app-page-container>
      @if (loading()) {
        <!-- Loading skeleton -->
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
          <div class="space-y-4">
            <div class="h-20 bg-gray-200 rounded"></div>
            <div class="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      } @else if (user()) {
        <!-- User Profile -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ user()!.id }}</h1>

          <!-- User Stats -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 rounded p-3">
              <div class="text-sm text-gray-600">Karma</div>
              <div class="text-xl font-semibold text-gray-900">{{ user()!.karma }}</div>
            </div>
            <div class="bg-gray-50 rounded p-3">
              <div class="text-sm text-gray-600">Member Since</div>
              <div class="text-xl font-semibold text-gray-900">{{ getDate(user()!.created) }}</div>
            </div>
            <div class="bg-gray-50 rounded p-3">
              <div class="text-sm text-gray-600">Submissions</div>
              <div class="text-xl font-semibold text-gray-900">
                {{ user()!.submitted?.length || 0 }}
              </div>
            </div>
          </div>

          <!-- About Section -->
          @if (user()!.about) {
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <div
                class="prose prose-sm max-w-none text-gray-800"
                [innerHTML]="user()!.about"
              ></div>
            </div>
          }
        </div>

        <!-- Recent Submissions -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Submissions</h2>

          @if (loadingSubmissions()) {
            <div class="animate-pulse space-y-4">
              <div class="h-16 bg-gray-200 rounded"></div>
              <div class="h-16 bg-gray-200 rounded"></div>
              <div class="h-16 bg-gray-200 rounded"></div>
            </div>
          } @else if (submissions().length > 0) {
            <div class="space-y-4">
              @for (item of submissions(); track item.id) {
                <div class="border-b border-gray-200 pb-4 last:border-0">
                  @if (item.type === 'story') {
                    <!-- Story -->
                    <div>
                      <h3 class="font-medium text-gray-900 mb-1">
                        @if (item.url) {
                          <a
                            [href]="item.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="hover:text-blue-600"
                          >
                            {{ item.title }}
                          </a>
                        } @else {
                          <a [routerLink]="['/item', item.id]" class="hover:text-blue-600">
                            {{ item.title }}
                          </a>
                        }
                      </h3>
                      <div class="flex items-center gap-3 text-sm text-gray-600">
                        <span>{{ item.score || 0 }} points</span>
                        <span>•</span>
                        <span>{{ getTimeAgo(item.time) }}</span>
                        <span>•</span>
                        <a [routerLink]="['/item', item.id]" class="text-blue-600 hover:underline">
                          {{ item.descendants || 0 }} comments
                        </a>
                      </div>
                    </div>
                  } @else if (item.type === 'comment') {
                    <!-- Comment -->
                    <div>
                      <div
                        class="prose prose-sm max-w-none text-gray-800 mb-2 line-clamp-3"
                        [innerHTML]="item.text"
                      ></div>
                      <div class="flex items-center gap-3 text-sm text-gray-600">
                        <span>{{ getTimeAgo(item.time) }}</span>
                        <span>•</span>
                        <a
                          [routerLink]="['/item', item.parent]"
                          class="text-blue-600 hover:underline"
                        >
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
                class="mt-6 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {{ loadingMore() ? 'Loading...' : 'Load More' }}
              </button>
            }
          } @else {
            <p class="text-gray-500 text-center py-8">No submissions yet</p>
          }
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p class="text-red-800">{{ error() }}</p>
          <button
            (click)="loadUser()"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      }
    </app-page-container>
  `,
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
