// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-story-thumbnail',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <div class="thumb">
      @if (isTextPost) {
        <!-- Text post placeholder -->
        <div class="thumb-placeholder">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            ></path>
          </svg>
        </div>
      } @else {
        <!-- Favicon thumbnail -->
        <a
          [href]="storyUrl"
          target="_blank"
          rel="noopener noreferrer nofollow"
          (click)="handleLinkClick()"
          class="thumb-link"
        >
          <img
            [ngSrc]="getFaviconUrl(storyUrl)"
            width="64"
            height="64"
            [alt]="'Favicon for ' + storyTitle"
            class="thumb-img-contain"
            decoding="async"
            (error)="handleImageError($event)"
          />
        </a>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .thumb {
        @apply w-20 h-20 relative overflow-hidden rounded-md border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-700;
      }
      .thumb-link {
        @apply block w-full h-full hover:opacity-90 transition-opacity;
      }
      .thumb-img-cover {
        @apply w-full h-full object-cover;
      }
      .thumb-img-contain {
        @apply w-full h-full object-contain;
      }
      .thumb-placeholder {
        @apply w-full h-full flex items-center justify-center;
      }
    `,
  ],
})
export class StoryThumbnailComponent {
  @Input() storyUrl?: string;
  @Input({ required: true }) storyTitle = '';
  @Input() isTextPost = false;
  @Output() linkClicked = new EventEmitter<void>();

  handleLinkClick(): void {
    // Don't prevent default - let the link work normally
    // Just emit the event for parent to handle (e.g., mark as visited)
    this.linkClicked.emit();
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/default-thumb.svg';
  }

  private getDomain(url?: string): string {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return '';
    }
  }

  getFaviconUrl(url?: string): string {
    const domain = this.getDomain(url);
    if (!domain) return '/assets/default-thumb.svg';
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }
}
