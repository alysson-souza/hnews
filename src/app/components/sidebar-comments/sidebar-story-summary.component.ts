// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, ChangeDetectionStrategy, input } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { HNItem } from '@models/hn';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { CommentTextComponent } from '../comment-text/comment-text.component';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { StoryLinkComponent } from '../shared/story-link/story-link.component';
import { StoryActionsMenuComponent } from '../story-item/story-actions-menu.component';
import { SavedStoriesService } from '@services/saved-stories.service';

@Component({
  selector: 'app-sidebar-story-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RelativeTimePipe,
    CommentTextComponent,
    UserTagComponent,
    StoryLinkComponent,
    StoryActionsMenuComponent,
    RouterLink,
  ],
  template: `
    <section class="story">
      @if (item().type === 'comment') {
        @if (item().text) {
          @if (boxedText()) {
            <div class="quote-surface-shell">
              <app-comment-text [html]="item().text!" />
            </div>
          } @else {
            <app-comment-text [html]="item().text!" />
          }
        }

        <div class="meta comment-meta">
          @if (item().by) {
            <span>by <app-user-tag [username]="item().by!" /></span>
          }
          @if (item().by) {
            <span>•</span>
          }
          <span class="time-text">{{ item().time | relativeTime }}</span>
          @if (parentDiscussionId()) {
            <span>•</span>
            <a
              class="open-link parent-discussion-meta-link"
              [routerLink]="['/item', parentDiscussionId()]"
              aria-label="Go to parent discussion"
            >
              Parent discussion
            </a>
          }
        </div>
      } @else {
        <div class="story-summary-header">
          <div class="story-summary-main">
            <h3 class="story-title">
              <app-story-link
                [url]="item().url"
                [textContent]="item().title"
                [linkTitle]="item().title || ''"
                class="story-link"
              />
            </h3>

            <!-- Domain - clickable -->
            @if (item().url && getDomain(item().url)) {
              <button
                type="button"
                role="button"
                (click)="searchByDomain($event)"
                (keyup.enter)="searchByDomain($event)"
                (keyup.space)="searchByDomain($event)"
                class="domain-btn"
                [attr.aria-label]="'Search for more stories from ' + getDomain(item().url)"
                [attr.title]="'Search for more stories from ' + getDomain(item().url)"
              >
                {{ getDomain(item().url) }}
              </button>
            }
          </div>

          <div class="story-actions-slot">
            <app-story-actions-menu [story]="item()" />
          </div>
        </div>

        <div class="meta">
          @if (item().score !== undefined && item().score !== null) {
            <span>{{ item().score }} points</span>
          }
          @if (item().by) {
            @if (item().score !== undefined && item().score !== null) {
              <span>•</span>
            }
            <span>by <app-user-tag [username]="item().by!" /></span>
          }
          @if (hasMetaPrefix()) {
            <span>•</span>
          }
          <span class="time-text">{{ item().time | relativeTime }}</span>
          <span>•</span>
          <button
            type="button"
            class="bookmark-btn"
            [attr.aria-pressed]="isSaved()"
            [attr.aria-label]="
              (isSaved() ? 'Remove saved story ' : 'Save ') + (item().title || 'story')
            "
            (click)="toggleSaved($event)"
          >
            {{ isSaved() ? 'Saved' : 'Save' }}
          </button>
        </div>

        @if (item().text) {
          @if (boxedText()) {
            <div class="quote-surface-shell">
              <app-comment-text [html]="item().text!" />
            </div>
          } @else {
            <app-comment-text [html]="item().text!" />
          }
        }
      }
    </section>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .story {
        @apply mb-0;
        display: flex;
        flex-direction: column;
        gap: var(--thread-gap);
      }
      .story-title {
        @apply text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100;
      }
      .story-summary-header {
        @apply grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2;
      }
      .story-summary-main {
        @apply min-w-0;
        display: flex;
        flex-direction: column;
        gap: calc(var(--thread-gap) / 2);
      }
      .story-actions-slot {
        @apply relative flex-shrink-0 self-start;
      }
      .story-link {
        @apply text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
      }
      .domain-btn {
        @apply inline-block text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline cursor-pointer break-all;
        align-self: flex-start;
        max-width: 100%;
        text-align: left;
      }
      .quote-surface-shell {
        padding: var(--thread-gap);
      }
      .meta {
        @apply flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400;
      }
      .open-link {
        @apply inline-flex items-center text-blue-600 dark:text-blue-300 hover:underline cursor-pointer transition-colors duration-200;
        @apply rounded focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400 focus-visible:outline-offset-1;
      }
      .bookmark-btn {
        @apply inline-flex items-center rounded px-1 py-0.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 hover:underline cursor-pointer font-medium;
        @apply focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400 focus-visible:outline-offset-1;
      }
      .bookmark-btn[aria-pressed='true'] {
        @apply text-blue-600 dark:text-blue-300;
      }
      .time-text {
        @apply text-gray-500 dark:text-gray-500;
      }
    `,
  ],
})
export class SidebarStorySummaryComponent {
  readonly item = input.required<HNItem>();
  readonly boxedText = input(false);
  readonly parentDiscussionId = input<number | null>(null);
  private router = inject(Router);
  private savedStories = inject(SavedStoriesService);

  isSaved(): boolean {
    return this.savedStories.isSaved(this.item().id);
  }

  toggleSaved(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const item = this.item();
    if (item.type !== 'comment') {
      this.savedStories.toggle(item);
    }
  }

  hasMetaPrefix(): boolean {
    return this.item().score != null || !!this.item().by;
  }

  getDomain(url?: string): string {
    if (!url) return '';
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./i, '');
    } catch {
      return '';
    }
  }

  searchByDomain(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const item = this.item();
    if (!item) return;

    const domain = this.getDomain(item.url);
    if (domain) {
      this.router.navigate(['/search'], {
        queryParams: { q: `site:${domain}` },
      });
    }
  }
}
