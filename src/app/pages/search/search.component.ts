// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HackernewsService } from '../../services/hackernews.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PageContainerComponent } from '../../components/shared/page-container/page-container.component';
import { CardComponent } from '../../components/shared/card/card.component';

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
  imports: [CommonModule, FormsModule, RouterLink, PageContainerComponent, CardComponent],
  template: `
    <app-page-container variant="narrow">
      <!-- Search Header -->
      <app-card class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Search Hacker News</h1>

        <!-- Search Input -->
        <div class="relative">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search stories, comments, users..."
            class="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <svg
            class="absolute right-4 top-3.5 w-6 h-6 text-gray-400"
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
        </div>

        <!-- Search Filters -->
        <div class="flex gap-4 mt-4">
          <select
            [(ngModel)]="searchType"
            (ngModelChange)="performSearch()"
            class="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="story">Stories</option>
            <option value="comment">Comments</option>
            <option value="all">All</option>
          </select>

          <select
            [(ngModel)]="sortBy"
            (ngModelChange)="performSearch()"
            class="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="points">Points</option>
            <option value="comments">Comments</option>
          </select>

          <select
            [(ngModel)]="dateRange"
            (ngModelChange)="performSearch()"
            class="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div class="animate-pulse space-y-4">
          <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      } @else if (results().length > 0) {
        <div class="bg-white rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200">
            <p class="text-sm text-gray-600">
              Found {{ totalResults() }} results for <strong>"{{ searchQuery }}"</strong>
            </p>
          </div>

          <div class="divide-y divide-gray-200">
            @for (hit of results(); track hit.objectID) {
              <div class="p-4 hover:bg-gray-50">
                @if (hit.title) {
                  <!-- Story Result -->
                  <h3 class="font-medium text-gray-900 mb-1">
                    @if (hit.url) {
                      <a
                        [href]="hit.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="hover:text-blue-600"
                        [innerHTML]="getHighlightedText(hit, 'title')"
                      >
                      </a>
                    } @else {
                      <a
                        [routerLink]="['/item', hit.objectID]"
                        class="hover:text-blue-600"
                        [innerHTML]="getHighlightedText(hit, 'title')"
                      >
                      </a>
                    }
                  </h3>

                  @if (hit.story_text) {
                    <p
                      class="text-sm text-gray-600 mb-2 line-clamp-2"
                      [innerHTML]="getHighlightedText(hit, 'story_text')"
                    ></p>
                  }
                } @else if (hit.comment_text) {
                  <!-- Comment Result -->
                  <div
                    class="prose prose-sm max-w-none text-gray-800 mb-2 line-clamp-3"
                    [innerHTML]="getHighlightedText(hit, 'comment_text')"
                  ></div>
                }

                <!-- Metadata -->
                <div class="flex items-center gap-3 text-sm text-gray-500">
                  <span>{{ hit.points || 0 }} points</span>
                  <span>•</span>
                  <span
                    >by
                    <a [routerLink]="['/user', hit.author]" class="text-blue-600 hover:underline">
                      {{ hit.author }}
                    </a>
                  </span>
                  <span>•</span>
                  <span>{{ getTimeAgo(hit.created_at) }}</span>
                  <span>•</span>
                  <a [routerLink]="['/item', hit.objectID]" class="text-blue-600 hover:underline">
                    {{ hit.num_comments || 0 }} comments
                  </a>
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (hasMore()) {
            <div class="p-4 border-t border-gray-200">
              <button
                (click)="loadMore()"
                [disabled]="loadingMore()"
                class="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {{ loadingMore() ? 'Loading...' : 'Load More' }}
              </button>
            </div>
          }
        </div>
      } @else if (searchQuery && !loading()) {
        <div class="bg-white rounded-lg shadow-sm p-8 text-center">
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
          <p class="text-gray-600">No results found for "{{ searchQuery }}"</p>
          <p class="text-sm text-gray-500 mt-2">Try adjusting your search terms or filters</p>
        </div>
      } @else {
        <div class="bg-white rounded-lg shadow-sm p-8 text-center">
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
          <p class="text-gray-600">Enter a search term to get started</p>
          <p class="text-sm text-gray-500 mt-2">
            Search across all Hacker News stories and comments
          </p>
        </div>
      }
    </app-page-container>
  `,
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hnService = inject(HackernewsService);

  searchQuery = '';
  searchType = 'story';
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

    const searchUrl = this.buildSearchUrl();

    this.hnService.searchStories(searchUrl).subscribe({
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

    const searchUrl = this.buildSearchUrl();

    this.hnService.searchStories(searchUrl).subscribe({
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

  private buildSearchUrl(): string {
    let url = this.searchQuery;

    // Add type filter
    if (this.searchType !== 'all') {
      url += `&tags=${this.searchType}`;
    }

    // Add date range filter
    if (this.dateRange !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      let timestamp = now;

      switch (this.dateRange) {
        case '24h':
          timestamp = now - 86400;
          break;
        case 'week':
          timestamp = now - 604800;
          break;
        case 'month':
          timestamp = now - 2592000;
          break;
        case 'year':
          timestamp = now - 31536000;
          break;
      }

      url += `&numericFilters=created_at_i>${timestamp}`;
    }

    // Add sorting
    if (this.sortBy === 'date') {
      url = url.replace('search?', 'search_by_date?');
    }

    // Add pagination
    url += `&page=${this.currentPage()}`;

    return url;
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
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}
