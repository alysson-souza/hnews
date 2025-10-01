// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal } from '@angular/core';
import { formatRelativeTime } from '../../services/relative-time.util';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HackernewsService } from '../../services/hackernews.service';
import { SearchOptions } from '../../models/search';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';
import { AppButtonComponent } from '../../components/shared/app-button/app-button.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';

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
  _highlightResult?: HighlightResult;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PageContainerComponent,
    CardComponent,
    AppButtonComponent,
  ],
  template: `
    <app-page-container
      [class.lg:w-[60vw]]="sidebarService.isOpen() && deviceService.isDesktop()"
      class="transition-all duration-300"
    >
      <div class="space-y-2 sm:space-y-3">
        <!-- Search Header -->
        <app-card class="mb-2 sm:mb-3">
          <h1 class="search-title">Search Hacker News</h1>

          <!-- Search Input -->
          <div class="relative">
            <input
              type="search"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search stories, comments, users..."
              aria-label="Search Hacker News content"
              aria-describedby="search-hint"
              class="app-input app-input-lg pr-12"
            />
            <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <p id="search-hint" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Tip: use site:example.com to filter by domain, or quotes to match exact phrases.
          </p>

          <!-- Search Filters -->
          <div class="filters">
            <select
              [(ngModel)]="searchType"
              (ngModelChange)="performSearch()"
              class="app-select"
              aria-label="Filter by type"
            >
              <option value="all">All</option>
              <option value="story">Stories</option>
              <option value="comment">Comments</option>
            </select>

            <select
              [(ngModel)]="sortBy"
              (ngModelChange)="performSearch()"
              class="app-select"
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
              class="app-select"
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
          <app-card class="block" [noPadding]="true">
            <div class="results-header">
              <div class="skel-line-3 w-1/3"></div>
            </div>
            <div class="results-list animate-pulse px-4 pb-4 space-y-1 sm:space-y-2">
              @for (row of [0, 1, 2, 3, 4, 5]; track row) {
                <div class="result-row">
                  <div class="skel-title w-3/4 mb-2"></div>
                  <div class="skel-snippet w-11/12 mb-3"></div>
                  <div class="skel-meta w-1/3"></div>
                </div>
              }
            </div>
          </app-card>
        } @else if (results().length > 0) {
          <app-card class="block" [noPadding]="true">
            <div class="results-header">
              <p class="results-summary">
                Found {{ totalResults() }} results for <strong>"{{ searchQuery }}"</strong>
              </p>
            </div>

            <div class="results-list px-4 pb-4 space-y-1 sm:space-y-2">
              @for (hit of results(); track hit.objectID) {
                <div class="result-row">
                  @if (hit.title) {
                    <!-- Story Result -->
                    <h3 class="result-title">
                      @if (hit.url) {
                        <a
                          [href]="hit.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="title-link"
                          [innerHTML]="getHighlightedText(hit, 'title')"
                        >
                        </a>
                      } @else {
                        <a
                          [routerLink]="['/item', hit.objectID]"
                          class="title-link"
                          [innerHTML]="getHighlightedText(hit, 'title')"
                        >
                        </a>
                      }
                    </h3>

                    @if (hit.story_text) {
                      <div
                        class="item-prose prose prose-sm max-w-none dark:prose-invert result-snippet line-clamp-2"
                        [innerHTML]="getHighlightedText(hit, 'story_text')"
                      ></div>
                    }
                  } @else if (hit.comment_text) {
                    <!-- Comment Result -->
                    <div
                      class="result-comment comment-body prose prose-sm max-w-none dark:prose-invert line-clamp-3"
                      [innerHTML]="getHighlightedText(hit, 'comment_text')"
                    ></div>
                  }

                  <!-- Metadata -->
                  <div class="result-meta">
                    <span>{{ hit.points || 0 }} points</span>
                    <span>•</span>
                    <span
                      >by
                      <a [routerLink]="['/user', hit.author]" class="result-meta-link">
                        {{ hit.author }}
                      </a>
                    </span>
                    <span>•</span>
                    <span>{{ getTimeAgo(hit.created_at) }}</span>
                    <span>•</span>
                    <a [routerLink]="['/item', hit.objectID]" class="result-meta-link">
                      {{ hit.num_comments || 0 }} comments
                    </a>
                  </div>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if (hasMore()) {
              <div class="pagination-bar px-4">
                <app-button
                  (clicked)="loadMore()"
                  [disabled]="loadingMore()"
                  variant="primary"
                  size="sm"
                  [fullWidth]="true"
                >
                  {{ loadingMore() ? 'Loading...' : 'Load More' }}
                </app-button>
              </div>
            }
          </app-card>
        } @else if (searchQuery && !loading()) {
          <app-card class="block" [noPadding]="true">
            <div class="results-header">
              <p class="results-summary">
                No results for <strong>"{{ searchQuery }}"</strong>
              </p>
            </div>
            <div class="p-6 text-center">
              <svg
                class="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01"
                ></path>
              </svg>
              <p class="empty-main">Try adjusting your search terms or filters</p>
            </div>
          </app-card>
        } @else {
          <app-card class="block" [noPadding]="true">
            <div class="results-header">
              <p class="results-summary">Search Hacker News</p>
            </div>
            <div class="p-6 text-center">
              <svg
                class="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              <p class="empty-main">Enter a search term to get started</p>
              <p class="empty-sub mt-2">Search across all Hacker News stories and comments</p>
            </div>
          </app-card>
        }
      </div>
    </app-page-container>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .search-title {
        @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4;
      }
      .search-input {
        @apply w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-200;
      }
      .search-icon {
        @apply absolute right-4 top-3.5 w-6 h-6 text-gray-400 dark:text-gray-500;
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

      .skel-line-4 {
        @apply h-4 bg-gray-200 dark:bg-gray-700 rounded-xl;
      }
      .skel-line-3 {
        @apply h-3 bg-gray-200 dark:bg-gray-700 rounded-xl;
      }
      .skel-title {
        @apply h-4 bg-gray-200 dark:bg-gray-700 rounded-xl;
      }
      .skel-snippet {
        @apply h-3 bg-gray-200 dark:bg-gray-700 rounded-xl;
      }
      .skel-meta {
        @apply h-3 bg-gray-200 dark:bg-gray-700 rounded-xl;
      }

      .results-header {
        @apply px-4 py-2;
      }
      .results-summary {
        @apply text-sm text-gray-600 dark:text-gray-300;
      }
      .result-row {
        @apply py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl;
      }
      .result-title {
        @apply font-medium text-gray-900 dark:text-gray-100 mb-1;
      }
      .title-link {
        @apply hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200;
      }

      /* Search highlighting styles */
      .title-link em,
      .result-snippet em,
      .result-comment em {
        @apply font-semibold not-italic bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-1 rounded;
      }

      .title-link:hover em,
      .result-snippet:hover em,
      .result-comment:hover em {
        @apply bg-yellow-300 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-50;
      }
      .result-snippet {
        @apply text-sm text-gray-600 dark:text-gray-300 mb-2;
      }
      .result-comment {
        @apply text-gray-800 dark:text-gray-200 mb-2;
      }
      .result-meta {
        @apply flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400;
      }
      .result-meta-link {
        @apply text-blue-600 dark:text-blue-300 hover:underline transition-colors duration-200;
      }

      .pagination-bar {
        @apply p-4 border-t border-gray-200 dark:border-gray-700;
      }

      .empty-main {
        @apply text-gray-600 dark:text-gray-300;
      }
      .empty-sub {
        @apply text-sm text-gray-500 dark:text-gray-400;
      }
    `,
  ],
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hnService = inject(HackernewsService);
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
}
