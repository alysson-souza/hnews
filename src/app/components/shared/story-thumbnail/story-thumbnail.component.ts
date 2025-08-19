// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenGraphData } from '../../../services/opengraph.service';

@Component({
  selector: 'app-story-thumbnail',
  standalone: true,
  imports: [CommonModule],
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
      } @else if (loading) {
        <!-- Loading skeleton -->
        <div class="thumb-skeleton"></div>
      } @else if (ogData?.image) {
        <!-- OpenGraph image -->
        <a
          [href]="storyUrl"
          target="_blank"
          rel="noopener noreferrer nofollow"
          (click)="handleLinkClick()"
          class="thumb-link"
        >
          <img
            [src]="ogData!.image"
            [alt]="'Thumbnail for ' + storyTitle"
            class="thumb-img-cover"
            loading="lazy"
            (error)="handleImageError($event)"
          />
        </a>
      } @else {
        <!-- Favicon fallback -->
        <a
          [href]="storyUrl"
          target="_blank"
          rel="noopener noreferrer nofollow"
          (click)="handleLinkClick()"
          class="thumb-link"
        >
          <img
            [src]="ogData?.favicon || '/assets/default-thumb.svg'"
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
      .thumb-skeleton {
        @apply w-full h-full bg-gray-200 dark:bg-slate-800 animate-pulse;
      }
    `,
  ],
})
export class StoryThumbnailComponent {
  @Input() storyUrl?: string;
  @Input({ required: true }) storyTitle = '';
  @Input() ogData?: OpenGraphData | null;
  @Input() loading = false;
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
}
