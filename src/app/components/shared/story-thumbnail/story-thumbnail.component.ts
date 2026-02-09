// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  Component,
  output,
  input,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ElementRef,
  viewChild,
} from '@angular/core';
import { StoryFaviconComponent } from '../story-favicon/story-favicon.component';
import { PrivacyRedirectService } from '../../../services/privacy-redirect.service';
import { OgImageService, OgImageResult } from '../../../services/og-image.service';

@Component({
  selector: 'app-story-thumbnail',
  imports: [StoryFaviconComponent],
  template: `
    <div class="thumb" #thumbEl>
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
        <a
          [href]="storyUrl()"
          target="_blank"
          rel="noopener noreferrer nofollow"
          (click)="handleLinkClick($event)"
          class="thumb-link"
        >
          @if (ogImageUrl()) {
            <!-- OG preview image -->
            <img
              [src]="ogImageUrl()"
              [alt]="'Preview for ' + storyTitle()"
              [attr.title]="ogTooltip()"
              class="og-image"
              [class.og-image-loaded]="ogImageLoaded()"
              decoding="async"
              loading="lazy"
              (load)="handleOgImageLoad()"
              (error)="handleOgImageError()"
            />
          } @else {
            <!-- Favicon fallback -->
            <app-story-favicon [url]="storyUrl()" [altText]="'Favicon for ' + storyTitle()" />
          }
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
      .og-image {
        @apply w-full h-full object-cover opacity-0;
        transition: opacity 0.3s ease-in;
      }
      .og-image-loaded {
        @apply opacity-100;
      }
    `,
  ],
})
export class StoryThumbnailComponent implements OnInit, OnDestroy {
  readonly storyUrl = input<string>();
  readonly storyTitle = input.required<string>();
  readonly isTextPost = input(false);
  readonly linkClicked = output<void>();

  private redirectService = inject(PrivacyRedirectService);
  private ogImageService = inject(OgImageService);

  /** The resolved OG image URL (proxied), or null to show favicon. */
  readonly ogImageUrl = signal<string | null>(null);
  /** Whether the OG image has finished loading (triggers fade-in). */
  readonly ogImageLoaded = signal(false);
  /** The og:title from the article. */
  readonly ogTitle = signal<string | null>(null);
  /** The og:description from the article. */
  readonly ogDescription = signal<string | null>(null);
  /** Tooltip text built from og:title + og:description, falls back to story title. */
  readonly ogTooltip = computed(() => {
    const parts = [this.ogTitle(), this.ogDescription()].filter(Boolean);
    return parts.join('\n') || this.storyTitle() || null;
  });

  private readonly thumbEl = viewChild<ElementRef<HTMLElement>>('thumbEl');
  private cleanupObserver: (() => void) | null = null;

  ngOnInit(): void {
    const url = this.storyUrl();
    if (!url || this.isTextPost()) return;

    // Defer observation to next microtask so the element ref is available
    queueMicrotask(() => {
      const el = this.thumbEl()?.nativeElement;
      if (!el) return;

      this.cleanupObserver = this.ogImageService.observe(el, url, (result: OgImageResult) => {
        this.ogImageLoaded.set(false);
        this.ogImageUrl.set(result.imageUrl);
        this.ogTitle.set(result.title);
        this.ogDescription.set(result.description);
      });
    });
  }

  ngOnDestroy(): void {
    this.cleanupObserver?.();
  }

  handleOgImageLoad(): void {
    this.ogImageLoaded.set(true);
  }

  handleOgImageError(): void {
    // OG image failed to load — fall back to favicon
    this.ogImageUrl.set(null);
    this.ogImageLoaded.set(false);
    this.ogTitle.set(null);
    this.ogDescription.set(null);
  }

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
