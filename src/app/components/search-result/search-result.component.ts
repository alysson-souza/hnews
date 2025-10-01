// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  formatRelativeTime,
  formatRelativeTimeFromSeconds,
} from '../../services/relative-time.util';
import { HNItem } from '../../models/hn';
import { UserTagComponent } from '../user-tag/user-tag.component';

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
  _highlightResult?: Record<string, { value: string }>;
}

@Component({
  selector: 'app-search-result',
  standalone: true,
  imports: [CommonModule, RouterLink, UserTagComponent],
  template: `
    <div class="result-row">
      @if (isStory()) {
        <!-- Story Result -->
        <h3 class="result-title">
          @if (isDead()) {
            <a [routerLink]="['/item', getItemId()]" class="title-link dead-item"> [flagged] </a>
          } @else if (getExternalUrl()) {
            <a
              [href]="getExternalUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="title-link"
              [innerHTML]="getHighlightedTitle()"
            >
            </a>
          } @else {
            <a
              [routerLink]="['/item', getItemId()]"
              class="title-link"
              [innerHTML]="getHighlightedTitle()"
            >
            </a>
          }
        </h3>

        @if (getStoryText()) {
          <div
            class="result-snippet item-prose prose prose-sm max-w-none dark:prose-invert line-clamp-2"
            [innerHTML]="getHighlightedStoryText()"
          ></div>
        }
      } @else if (isComment()) {
        <!-- Comment Result -->
        <div
          class="result-comment comment-body prose prose-sm max-w-none dark:prose-invert line-clamp-3"
          [innerHTML]="getHighlightedCommentText()"
        ></div>
      }

      <!-- Metadata -->
      <div class="result-meta">
        <span>{{ getPoints() }} points</span>
        <span>•</span>
        @if (!isComment()) {
          <span
            >by
            @if (getAuthor()) {
              <a [routerLink]="['/user', getAuthor()]" class="result-meta-link">
                <app-user-tag [username]="getAuthor()!"></app-user-tag>
              </a>
            }
          </span>
          <span>•</span>
        }
        <span>{{ getTimeAgo() }}</span>
        <span>•</span>
        @if (isComment()) {
          <a [routerLink]="['/item', getParentId()]" class="result-meta-link"> View Context </a>
        } @else {
          <a [routerLink]="['/item', getItemId()]" class="result-meta-link">
            {{ getCommentCount() }} comments
          </a>
        }
      </div>
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .result-row {
        @apply py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200;
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

      .dead-item {
        @apply text-gray-500 dark:text-gray-600 italic;
      }
    `,
  ],
})
export class SearchResultComponent {
  @Input() item?: HNItem | SearchHit;
  @Input() isSearchResult = false;

  // Computed properties to determine item type
  isStory = computed(() => {
    if (!this.item) return false;
    if (this.isSearchResult) {
      return !!(this.item as SearchHit).title;
    }
    return (this.item as HNItem).type === 'story';
  });

  isComment = computed(() => {
    if (!this.item) return false;
    if (this.isSearchResult) {
      return !!(this.item as SearchHit).comment_text;
    }
    return (this.item as HNItem).type === 'comment';
  });

  // Getters for different properties
  isDead(): boolean {
    if (!this.item || this.isSearchResult) return false;
    return (this.item as HNItem).dead || false;
  }

  getHighlightedTitle(): string {
    if (!this.item) return '';

    if (this.isSearchResult) {
      const searchHit = this.item as SearchHit;
      return searchHit._highlightResult?.['title']?.value || searchHit.title || '';
    }

    return (this.item as HNItem).title || '[untitled]';
  }

  getExternalUrl(): string | undefined {
    if (!this.item) return undefined;

    if (this.isSearchResult) {
      return (this.item as SearchHit).url;
    }

    return (this.item as HNItem).url;
  }

  getItemId(): string {
    if (!this.item) return '';

    if (this.isSearchResult) {
      return (this.item as SearchHit).objectID;
    }

    return String((this.item as HNItem).id);
  }

  getStoryText(): string | undefined {
    if (!this.item) return undefined;

    if (this.isSearchResult) {
      return (this.item as SearchHit).story_text;
    }

    return (this.item as HNItem).text;
  }

  getHighlightedStoryText(): string {
    if (!this.item) return '';

    if (this.isSearchResult) {
      const searchHit = this.item as SearchHit;
      return searchHit._highlightResult?.['story_text']?.value || searchHit.story_text || '';
    }

    return (this.item as HNItem).text || '';
  }

  getHighlightedCommentText(): string {
    if (!this.item) return '';

    if (this.isSearchResult) {
      const searchHit = this.item as SearchHit;
      return searchHit._highlightResult?.['comment_text']?.value || searchHit.comment_text || '';
    }

    return (this.item as HNItem).text || '';
  }

  getAuthor(): string | undefined {
    if (!this.item) return undefined;

    if (this.isSearchResult) {
      return (this.item as SearchHit).author;
    }

    return (this.item as HNItem).by;
  }

  getPoints(): number {
    if (!this.item) return 0;

    if (this.isSearchResult) {
      return (this.item as SearchHit).points || 0;
    }

    return (this.item as HNItem).score || 0;
  }

  getCommentCount(): number {
    if (!this.item) return 0;

    if (this.isSearchResult) {
      return (this.item as SearchHit).num_comments || 0;
    }

    return (this.item as HNItem).descendants || 0;
  }

  getParentId(): string {
    if (!this.item) return '';

    if (this.isSearchResult) {
      return ''; // Search hits don't have parent info
    }

    return String((this.item as HNItem).parent || '');
  }

  getTimeAgo(): string {
    if (!this.item) return '';

    if (this.isSearchResult) {
      return formatRelativeTime((this.item as SearchHit).created_at);
    }

    return formatRelativeTimeFromSeconds((this.item as HNItem).time);
  }
}
