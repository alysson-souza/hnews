// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, output, input, inject } from '@angular/core';
import { StoryFaviconComponent } from '../story-favicon/story-favicon.component';
import { PrivacyRedirectService } from '../../../services/privacy-redirect.service';

@Component({
  selector: 'app-story-thumbnail',
  standalone: true,
  imports: [StoryFaviconComponent],
  template: `
    <div class="thumb">
      @if (isTextPost()) {
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
          [href]="storyUrl()"
          target="_blank"
          rel="noopener noreferrer nofollow"
          (click)="handleLinkClick($event)"
          class="thumb-link"
        >
          <app-story-favicon [url]="storyUrl()" [altText]="'Favicon for ' + storyTitle()" />
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
      .thumb-placeholder {
        @apply w-full h-full flex items-center justify-center;
      }
    `,
  ],
})
export class StoryThumbnailComponent {
  readonly storyUrl = input<string>();
  readonly storyTitle = input.required<string>();
  readonly isTextPost = input(false);
  readonly linkClicked = output<void>();

  private redirectService = inject(PrivacyRedirectService);

  handleLinkClick(event: MouseEvent): void {
    const url = this.storyUrl();
    if (!url) {
      this.linkClicked.emit();
      return;
    }

    // Check if privacy redirect applies
    const transformedUrl = this.redirectService.transformUrl(url);
    if (transformedUrl !== url) {
      event.preventDefault();
      this.linkClicked.emit();
      window.open(transformedUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Let the link work normally, just emit the event
      this.linkClicked.emit();
    }
  }
}
