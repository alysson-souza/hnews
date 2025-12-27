// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, computed, input } from '@angular/core';

import { RouterLink } from '@angular/router';
import {
  formatRelativeTime,
  formatRelativeTimeFromSeconds,
} from '../../services/relative-time.util';
import { HNItem } from '../../models/hn';
import { ResultMetaComponent } from '../result-meta/result-meta.component';
import { transformQuotesHtml } from '../comment-text/quote.transform';
import { PrivacyRedirectDirective } from '../shared/privacy-redirect/privacy-redirect.directive';
import { EnhanceLinksDirective } from '../comment-text/enhance-links.directive';

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
  _highlightResult?: Record<string, { value: string }>;
}

@Component({
  selector: 'app-search-result',
  imports: [RouterLink, ResultMetaComponent, PrivacyRedirectDirective, EnhanceLinksDirective],
  template: `
    <div class="result-row">
      @if (isStory()) {
        <!-- Story Result -->
        <h3 class="result-title">
          @if (isDead()) {
            <a
              [routerLink]="['/item', getItemId()]"
              class="title-link dead-item"
              [attr.title]="getPlainTitle()"
            >
              [flagged]
            </a>
          } @else if (getExternalUrl()) {
            <a
              [href]="getExternalUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="title-link"
              [attr.title]="getPlainTitle()"
              [innerHTML]="getHighlightedTitle()"
              appPrivacyRedirect
            >
            </a>
          } @else {
            <a
              [routerLink]="['/item', getItemId()]"
              class="title-link"
              [attr.title]="getPlainTitle()"
              [innerHTML]="getHighlightedTitle()"
            >
            </a>
          }
        </h3>

        @if (getStoryText()) {
          <div
            class="result-snippet item-prose prose prose-sm max-w-none dark:prose-invert line-clamp-2"
            [innerHTML]="getHighlightedStoryText()"
            appEnhanceLinks
          ></div>
        }
      } @else if (isComment()) {
        <!-- Comment Result -->
        @if (getHighlightedCommentText()) {
          <div
            class="result-comment comment-body prose prose-sm max-w-none dark:prose-invert line-clamp-3"
            [innerHTML]="getHighlightedCommentText()"
            appEnhanceLinks
          ></div>
        }
      }

      <!-- Metadata -->
      <app-result-meta
        [author]="getAuthor()"
        [timeAgo]="getTimeAgo()"
        [points]="getPoints()"
        [commentCount]="getCommentCount()"
        [itemId]="getItemId()"
        [parentId]="getParentId()"
        [isComment]="isComment()"
      />
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .result-row {
        @apply py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200;
      }

      .result-title {
        @apply font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2;
      }

      .title-link {
        @apply hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 sm:w-full sm:max-w-full sm:line-clamp-1;
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

      .dead-item {
        @apply text-gray-500 dark:text-gray-600 italic;
      }
    `,
  ],
})
export class SearchResultComponent {
  readonly item = input<HNItem | SearchHit>();
  readonly isSearchResult = input(false);

  // Computed properties to determine item type
  isStory = computed(() => {
    const item = this.item();
    if (!item) return false;
    if (this.isSearchResult()) {
      return !!(item as SearchHit).title;
    }
    const hnItem = item as HNItem;
    return hnItem.type === 'story' || hnItem.type === 'job';
  });

  isComment = computed(() => {
    const item = this.item();
    if (!item) return false;
    if (this.isSearchResult()) {
      return !!(item as SearchHit).comment_text;
    }
    return (item as HNItem).type === 'comment';
  });

  // Getters for different properties
  isDead(): boolean {
    const item = this.item();
    if (!item || this.isSearchResult()) return false;
    return (item as HNItem).dead || false;
  }

  getHighlightedTitle(): string {
    const item = this.item();
    if (!item) return '';

    if (this.isSearchResult()) {
      const searchHit = item as SearchHit;
      return searchHit._highlightResult?.['title']?.value || searchHit.title || '';
    }

    return (item as HNItem).title || '[untitled]';
  }

  getPlainTitle(): string {
    const item = this.item();
    if (!item) return '';

    if (this.isSearchResult()) {
      return (item as SearchHit).title || '';
    }

    return (item as HNItem).title || '[untitled]';
  }

  getExternalUrl(): string | undefined {
    const item = this.item();
    if (!item) return undefined;

    if (this.isSearchResult()) {
      return (item as SearchHit).url;
    }

    return (item as HNItem).url;
  }

  getItemId(): string {
    const item = this.item();
    if (!item) return '';

    if (this.isSearchResult()) {
      return (item as SearchHit).objectID;
    }

    return String((item as HNItem).id);
  }

  getStoryText(): string | undefined {
    const item = this.item();
    if (!item) return undefined;

    if (this.isSearchResult()) {
      return (item as SearchHit).story_text;
    }

    return (item as HNItem).text;
  }

  getHighlightedStoryText(): string {
    const item = this.item();
    if (!item) return '';

    if (this.isSearchResult()) {
      const searchHit = item as SearchHit;
      const rawHtml =
        searchHit._highlightResult?.['story_text']?.value || searchHit.story_text || '';
      return transformQuotesHtml(rawHtml);
    }

    return (item as HNItem).text || '';
  }

  getHighlightedCommentText(): string {
    const item = this.item();
    if (!item) return '';

    if (this.isSearchResult()) {
      const searchHit = item as SearchHit;
      const rawHtml =
        searchHit._highlightResult?.['comment_text']?.value || searchHit.comment_text || '';
      return transformQuotesHtml(rawHtml);
    }

    return (item as HNItem).text || '';
  }

  getAuthor(): string | undefined {
    const item = this.item();
    if (!item) return undefined;

    if (this.isSearchResult()) {
      return (item as SearchHit).author;
    }

    return (item as HNItem).by;
  }

  getPoints(): number {
    const item = this.item();
    if (!item) return 0;

    if (this.isSearchResult()) {
      return (item as SearchHit).points || 0;
    }

    return (item as HNItem).score || 0;
  }

  getCommentCount(): number {
    const item = this.item();
    if (!item) return 0;

    if (this.isSearchResult()) {
      return (item as SearchHit).num_comments || 0;
    }

    return (item as HNItem).descendants || 0;
  }

  getParentId(): string {
    const item = this.item();
    if (!item) return '';

    if (this.isSearchResult()) {
      const searchHit = item as SearchHit;
      return String(searchHit.story_id || '');
    }

    return String((item as HNItem).parent || '');
  }

  getTimeAgo(): string {
    const item = this.item();
    if (!item) return '';

    if (this.isSearchResult()) {
      return formatRelativeTime((item as SearchHit).created_at);
    }

    return formatRelativeTimeFromSeconds((item as HNItem).time);
  }
}
