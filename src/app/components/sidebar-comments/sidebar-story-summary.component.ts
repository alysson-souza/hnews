// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, ChangeDetectionStrategy, input } from '@angular/core';

import { Router } from '@angular/router';
import { HNItem } from '../../models/hn';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { CommentTextComponent } from '../comment-text/comment-text.component';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { StoryLinkComponent } from '../shared/story-link/story-link.component';
import { isHnLink } from '../comment-text/hn-link.utils';

@Component({
  selector: 'app-sidebar-story-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RelativeTimePipe, CommentTextComponent, UserTagComponent, StoryLinkComponent],
  template: `
    <section class="story">
      <h3 class="story-title">
        <app-story-link
          [url]="item().url"
          [textContent]="item().title"
          [linkTitle]="item().title || ''"
          class="story-link"
        />
      </h3>

      <!-- Domain - clickable (hidden for HN links) -->
      @if (item().url && getDomain(item().url) && !isHnUrl(item().url!)) {
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
        <span>{{ item().score || 0 }} points</span>
        @if (item().by) {
          <span>•</span>
          <span>by <app-user-tag [username]="item().by!" /></span>
        }
        <span>•</span>
        <span class="time-text">{{ item().time | relativeTime }}</span>
      </div>

      @if (item().text) {
        <app-comment-text [html]="item().text!" />
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
      .actions {
        @apply flex gap-3 mt-3;
      }
      .open-link {
        @apply inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
      }
      .time-text {
        @apply text-gray-500 dark:text-gray-500;
      }
    `,
  ],
})
export class SidebarStorySummaryComponent {
  readonly item = input.required<HNItem>();
  private router = inject(Router);

  // Expose for template
  isHnUrl(url: string): boolean {
    return isHnLink(url);
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
