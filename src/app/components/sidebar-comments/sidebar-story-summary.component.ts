// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HNItem } from '../../services/hackernews.service';
import { RelativeTimeComponent } from '../relative-time/relative-time.component';
import { CommentTextComponent } from '../comment-text/comment-text.component';

@Component({
  selector: 'app-sidebar-story-summary',
  standalone: true,
  imports: [CommonModule, RouterLink, RelativeTimeComponent, CommentTextComponent],
  template: `
    <section class="story">
      <h3 class="story-title">
        @if (item.url) {
          <a
            [href]="item.url"
            target="_blank"
            rel="noopener noreferrer nofollow"
            class="story-link"
          >
            {{ item.title }}
          </a>
          <span class="domain ml-1">({{ getDomain(item.url) }})</span>
        } @else {
          {{ item.title }}
        }
      </h3>

      <div class="meta">
        <span>{{ item.score || 0 }} points</span>
        <span>•</span>
        <span>by {{ item.by }}</span>
        <span>•</span>
        <app-relative-time [timestamp]="item.time"></app-relative-time>
      </div>

      @if (item.text) {
        <app-comment-text [html]="item.text!"></app-comment-text>
      }

      @if (showActions) {
        <div class="actions">
          <a [routerLink]="['/item', item.id]" target="_blank" class="open-link">
            Open in full view ↗
          </a>
        </div>
      }
    </section>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .story {
        @apply mb-4 sm:mb-6;
      }
      .story-title {
        @apply text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2;
      }
      .story-link {
        @apply text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
      }
      .domain {
        @apply text-xs text-gray-600 dark:text-gray-400;
      }
      .meta {
        @apply flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3;
      }
      .actions {
        @apply flex gap-3;
      }
      .open-link {
        @apply text-blue-600 hover:underline text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
      }
    `,
  ],
})
export class SidebarStorySummaryComponent {
  @Input({ required: true }) item!: HNItem;
  @Input() showActions = true;
  getDomain(url?: string): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./i, '');
    } catch {
      return null;
    }
  }
}
