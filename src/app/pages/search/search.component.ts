// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { formatRelativeTime } from '../../services/relative-time.util';
import { DecimalPipe } from '@angular/common';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HackernewsService } from '../../services/hackernews.service';
import { NetworkStateService } from '../../services/network-state.service';
import { SearchOptions } from '../../models/search';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { ResultListComponent } from '../../components/result-list/result-list.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarMagniferLinear } from '@ng-icons/solar-icons/linear';
import { UserTagComponent } from '../../components/user-tag/user-tag.component';
import { CommentTextComponent } from '../../components/comment-text/comment-text.component';
import { getDomain } from '../../services/domain.utils';
import { StoryLinkComponent } from '../../components/shared/story-link/story-link.component';

interface HighlightField {
  value: string;
}
type HighlightResult = Record<string, HighlightField>;
interface SearchHit {
  objectID: string;
  title: string;
  url: string;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  story_text?: string;
  comment_text?: string;
  story_id?: number;
  parent_id?: number;
  _highlightResult?: HighlightResult;
}

@Component({
  selector: 'app-search',
  imports: [
    FormsModule,
    PageContainerComponent,
    CardComponent,
    ResultListComponent,
    NgIconComponent,
    UserTagComponent,
    CommentTextComponent,
    RouterLink,
    DecimalPipe,
    StoryLinkComponent,
  ],
  viewProviders: [provideIcons({ solarMagniferLinear })],
  template: `
    <app-page-container
      [class.lg:w-[60vw]]="sidebarService.isOpen() && deviceService.isDesktop()"
      class="lg:transition-[width] lg:duration-300"
    >
      <div class="space-y-3 sm:space-y-4">
        <!-- Search Header -->
        <app-card class="mb-2 sm:mb-3 search-card">
          <h1 class="search-title">Search Hacker News</h1>

          <!-- Offline Warning -->
          @if (isOffline()) {
            <div class="offline-warning" role="alert" aria-live="polite">
              <p class="font-medium">Search unavailable offline</p>
            </div>
          }

          <!-- Search Input -->
          <form (ngSubmit)="performSearch()" class="relative">
            <button
              type="submit"
              class="search-button"
              aria-label="Submit Search"
              title="Search"
              [disabled]="isOffline()"
              [class.opacity-50]="isOffline()"
              [class.cursor-not-allowed]="isOffline()"
            >
              <ng-icon name="solarMagniferLinear" class="text-2xl" />
            </button>
            <input
              type="search"
              [(ngModel)]="searchQuery"
              name="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search stories, comments, users..."
              aria-label="Search Hacker News content"
              aria-describedby="search-hint"
              [disabled]="isOffline()"
              [class.opacity-50]="isOffline()"
              [class.cursor-not-allowed]="isOffline()"
              class="app-input app-input-lg !pl-12"
            />
          </form>
          @if (!isOffline()) {
            <p id="search-hint" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Tip: use site:example.com to filter by domain, or quotes to match exact phrases.
            </p>
          }

          <!-- Search Filters -->
          <div class="filters">
            <select
              [(ngModel)]="searchType"
              (ngModelChange)="performSearch()"
              [disabled]="isOffline()"
              class="app-select"
              [class.opacity-50]="isOffline()"
              [class.cursor-not-allowed]="isOffline()"
              aria-label="Filter by type"
            >
              <option value="all">All</option>
              <option value="story">Stories</option>
              <option value="comment">Comments</option>
            </select>

            <select
              [(ngModel)]="sortBy"
              (ngModelChange)="performSearch()"
              [disabled]="isOffline()"
              class="app-select"
              [class.opacity-50]="isOffline()"
              [class.cursor-not-allowed]="isOffline()"
              aria-label="Sort by"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="points">Points</option>
              <option value="comments">Comments</option>
            </select>

            <select
              [(ngModel)]="dateRange"
              (ngModelChange)="performSearch()"
              [disabled]="isOffline()"
              class="app-select"
              [class.opacity-50]="isOffline()"
              [class.cursor-not-allowed]="isOffline()"
              aria-label="Date range"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="year">Past Year</option>
            </select>
          </div>
        </app-card>

        <!-- Search Results -->
        @if (loading()) {
          <app-result-list [showHeader]="true" [showLoadMore]="false">
            <ng-container header>
              <div class="skel-line-3 w-1/3"></div>
            </ng-container>
            @for (row of [0, 1, 2, 3, 4, 5]; track row) {
              <div class="activity-skeleton">
                <div class="flex items-center gap-2 mb-2">
                  <div class="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
                <div class="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
                <div class="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            }
          </app-result-list>
        } @else if (results().length > 0) {
          <app-result-list
            [showHeader]="true"
            [showLoadMore]="hasMore()"
            [loadingMore]="loadingMore()"
            (loadMore)="loadMore()"
          >
            <ng-container header>
              Found {{ totalResults() | number }} results for <strong>"{{ searchQuery }}"</strong>
            </ng-container>

            @for (hit of results(); track hit.objectID) {
              <article class="activity-item" [class.comment-item]="isComment(hit)">
                <div class="item-top">
                  <span
                    class="type-pill"
                    [class.type-comment]="isComment(hit)"
                    [class.type-story]="!isComment(hit)"
                  >
                    {{ isComment(hit) ? 'Comment' : 'Story' }}
                  </span>
                  <span class="muted">{{ getTimeAgo(hit.created_at) }}</span>
                  @if (!isComment(hit) && hit.url && getDomain(hit.url)) {
                    <span class="pill-soft" [title]="hit.url">{{ getDomain(hit.url) }}</span>
                  }
                </div>

                @if (!isComment(hit)) {
                  <h3 class="activity-title">
                    @if (hit.url) {
                      <app-story-link
                        [url]="hit.url"
                        [htmlContent]="getHighlightedText(hit, 'title')"
                        class="title-link"
                      />
                    } @else {
                      <a
                        [routerLink]="['/item', hit.objectID]"
                        class="title-link"
                        [innerHTML]="getHighlightedText(hit, 'title')"
                      ></a>
                    }
                  </h3>
                  <div class="item-meta">
                    @if (hit.author) {
                      <span class="inline-flex items-center gap-1">
                        by <app-user-tag [username]="hit.author" />
                      </span>
                      <span>•</span>
                    }
                    <span>{{ hit.points || 0 }} points</span>
                    <span>•</span>
                    <a [routerLink]="['/item', hit.objectID]" class="meta-link">
                      {{ hit.num_comments || 0 }}
                      {{ hit.num_comments === 1 ? 'comment' : 'comments' }}
                    </a>
                  </div>
                } @else {
                  <div class="comment-shell">
                    <app-comment-text [html]="getHighlightedText(hit, 'comment_text')" />
                  </div>
                  <div class="item-meta">
                    <a [routerLink]="['/item', hit.objectID]" class="meta-link">View thread</a>
                    @if (hit.story_id) {
                      <span>•</span>
                      <a [routerLink]="['/item', hit.story_id]" class="meta-link">View Story</a>
                    }
                    @if (hit.author) {
                      <span>•</span>
                      <span class="inline-flex items-center gap-1">
                        by <app-user-tag [username]="hit.author" />
                      </span>
                    }
                  </div>
                }
              </article>
            }
          </app-result-list>
        } @else if (searchQuery && !loading()) {
          <app-result-list [showHeader]="true" [showLoadMore]="false">
            <ng-container header>
              No results for <strong>"{{ searchQuery }}"</strong>
            </ng-container>
            <div class="p-6 text-center">
              <ng-icon name="solarMagniferLinear" class="text-6xl text-gray-400 mx-auto mb-4" />
              <p class="empty-main">Try adjusting your search terms or filters</p>
            </div>
          </app-result-list>
        } @else {
          <app-result-list [showHeader]="true" [showLoadMore]="false">
            <ng-container header> Search Hacker News </ng-container>
            <div class="p-6 text-center">
              <ng-icon name="solarMagniferLinear" class="text-6xl text-gray-400 mx-auto mb-4" />
              <p class="empty-main">Enter a search term to get started</p>
              <p class="empty-sub mt-2">Search across all Hacker News stories and comments</p>
            </div>
          </app-result-list>
        }
      </div>
    </app-page-container>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .search-card .card-base {
        @apply bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-950;
      }

      .search-title {
        @apply text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 leading-tight;
      }
      .search-input {
        @apply w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-200;
      }
      .search-button {
        @apply absolute left-3 top-1/2 transform -translate-y-1/2;
        @apply flex items-center justify-center;
        @apply text-gray-500 dark:text-gray-400;
        @apply hover:text-gray-700 dark:hover:text-gray-200;
        @apply cursor-pointer p-1;
        @apply transition-colors duration-200;
      }
      .filters {
        /* Responsive layout: stack on small screens, wrap on larger */
        @apply flex flex-col gap-3 mt-4 sm:flex-row sm:flex-wrap sm:gap-4;
      }
      .filters .app-select {
        /* Make selects full-width on mobile for better tap targets */
        @apply w-full sm:w-auto;
        @apply px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer;
      }

      /* Activity / Results Styles (Copied from UserComponent) */
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

      /* Skeleton Styles */
      .activity-skeleton {
        @apply py-4;
      }

      .muted {
        @apply text-sm text-gray-500 dark:text-gray-400;
      }

      .skel-line-3 {
        @apply h-3 bg-gray-200 dark:bg-gray-700 rounded-xl;
      }

      .empty-main {
        @apply text-gray-600 dark:text-gray-300;
      }
      .empty-sub {
        @apply text-sm text-gray-500 dark:text-gray-400;
      }

      .offline-warning {
        @apply mb-4 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center text-yellow-800 dark:text-yellow-300;
      }
    `,
  ],
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hnService = inject(HackernewsService);
  private networkState = inject(NetworkStateService);
  sidebarService = inject(SidebarService);
  deviceService = inject(DeviceService);

  searchQuery = '';
  searchType = 'all';
  sortBy = 'relevance';
  dateRange = 'all';

  results = signal<SearchHit[]>([]);
  totalResults = signal(0);
  loading = signal(false);
  loadingMore = signal(false);
  currentPage = signal(0);

  // Offline state
  isOffline = computed(() => this.networkState.isOffline());

  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Set up search debouncing
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.performSearch();
    });

    // Check for query params
    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.searchQuery = params['q'];
        this.performSearch();
      }
    });
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);

    // Update URL with search query
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query },
      queryParamsHandling: 'merge',
    });
  }

  performSearch() {
    if (!this.searchQuery.trim()) {
      this.results.set([]);
      this.totalResults.set(0);
      return;
    }

    this.loading.set(true);
    this.currentPage.set(0);

    const searchOptions: SearchOptions = {
      query: this.searchQuery,
      tags: this.searchType,
      sortBy: this.sortBy as 'relevance' | 'date' | 'points' | 'comments',
      dateRange: this.dateRange as 'all' | '24h' | 'week' | 'month' | 'year',
      page: this.currentPage(),
    };

    this.hnService.searchStories(searchOptions).subscribe({
      next: (response) => {
        const hits = Array.isArray(response.hits) ? (response.hits as SearchHit[]) : [];
        this.results.set(hits);
        this.totalResults.set(response.nbHits || 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadMore() {
    this.loadingMore.set(true);
    this.currentPage.update((p) => p + 1);

    const searchOptions: SearchOptions = {
      query: this.searchQuery,
      tags: this.searchType,
      sortBy: this.sortBy as 'relevance' | 'date' | 'points' | 'comments',
      dateRange: this.dateRange as 'all' | '24h' | 'week' | 'month' | 'year',
      page: this.currentPage(),
    };

    this.hnService.searchStories(searchOptions).subscribe({
      next: (response) => {
        const hits = Array.isArray(response.hits) ? (response.hits as SearchHit[]) : [];
        this.results.update((results) => [...results, ...hits]);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  hasMore(): boolean {
    return this.results().length < this.totalResults();
  }

  getHighlightedText(hit: SearchHit, field: string): string {
    const result = hit._highlightResult?.[field]?.value;
    if (typeof result === 'string') return result;
    return ((hit as unknown as Record<string, unknown>)[field] as string) || '';
  }

  getTimeAgo(dateString: string): string {
    return formatRelativeTime(dateString);
  }

  getDomain(url: string): string {
    return getDomain(url);
  }

  isComment(hit: SearchHit): boolean {
    return !!hit.comment_text;
  }
}
