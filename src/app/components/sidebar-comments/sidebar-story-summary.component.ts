// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, ChangeDetectionStrategy, input, computed } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { HNItem } from '@models/hn';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { CommentTextComponent } from '../comment-text/comment-text.component';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { StoryLinkComponent } from '../shared/story-link/story-link.component';
import { StoryArchiveService } from '@services/story-archive.service';

@Component({
  selector: 'app-sidebar-story-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RelativeTimePipe,
    CommentTextComponent,
    UserTagComponent,
    StoryLinkComponent,
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
          @if (archiveUrl()) {
            <span>•</span>
            <a
              class="open-link"
              [href]="archiveUrl()!"
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label="Open story in Internet Archive"
            >
              Open in Internet Archive
            </a>
          }
        </div>

        @if (item().text) {
          @if (boxedText()) {
            <div class="quote-surface-shell mt-3">
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
      }
      .story-title {
        @apply text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100;
      }
      .story-link {
        @apply text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
      }
      .domain-btn {
        @apply inline-block text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline cursor-pointer break-all mb-2;
      }
      .meta {
        @apply flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400;
      }
      .comment-meta {
        @apply mt-3;
      }
      .open-link {
        @apply inline-flex items-center text-blue-600 dark:text-blue-300 hover:underline cursor-pointer transition-colors duration-200;
        @apply rounded focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400 focus-visible:outline-offset-1;
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
  private storyArchive = inject(StoryArchiveService);
  readonly archiveUrl = computed(() => this.storyArchive.getArchiveUrl(this.item()));

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
