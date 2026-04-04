// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  Component,
  output,
  input,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  OnDestroy,
  ElementRef,
  viewChild,
} from '@angular/core';
import { StoryFaviconComponent } from '../story-favicon/story-favicon.component';
import { PrivacyRedirectService } from '@services/privacy-redirect.service';
import { OgImageService, OgImageResult } from '@services/og-image.service';
import { ThumbnailRecoveryService } from '@services/thumbnail-recovery.service';

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
          @if (showOgImage()) {
            <!-- OG preview image -->
            @if (ogImageMounted()) {
              <img
                [src]="ogImageUrl()"
                [alt]="'Preview for ' + storyTitle()"
                [attr.title]="ogTooltip()"
                class="og-image"
                [class.og-image-loaded]="ogImageLoaded()"
                [class.object-left-top]="isGithubImage()"
                decoding="async"
                loading="lazy"
                (load)="handleOgImageLoad()"
                (error)="handleOgImageError()"
              />
            }
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
        image-rendering: high-quality;
        transform: translateZ(0);
        backface-visibility: hidden;
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
  private recovery = inject(ThumbnailRecoveryService);

  /** The resolved OG image URL (proxied), or null to show favicon. */
  readonly ogImageUrl = signal<string | null>(null);
  /** Whether the OG image has finished loading (triggers fade-in). */
  readonly ogImageLoaded = signal(false);
  /** The og:title from the article. */
  readonly ogTitle = signal<string | null>(null);
  /** The og:description from the article. */
  readonly ogDescription = signal<string | null>(null);
  /** Tracks whether the proxied OG image element failed to load and is waiting for recovery. */
  readonly ogImageLoadFailed = signal(false);
  /** Toggles the OG image element to force a fresh browser load when needed. */
  readonly ogImageMounted = signal(true);
  /** Tooltip text built from og:title + og:description, falls back to story title. */
  readonly ogTooltip = computed(() => {
    const parts = [this.ogTitle(), this.ogDescription()].filter(Boolean);
    return parts.join('\n') || this.storyTitle() || null;
  });
  /** Whether the OG image should be rendered instead of the favicon fallback. */
  readonly showOgImage = computed(() => !!this.ogImageUrl() && !this.ogImageLoadFailed());

  /** Whether the image is from GitHub (used to anchor the crop to the left). */
  readonly isGithubImage = computed(() => {
    const url = this.ogImageUrl();
    if (!url) return false;
    return url.includes('githubusercontent.com') || url.includes('githubassets.com');
  });

  private readonly thumbEl = viewChild<ElementRef<HTMLElement>>('thumbEl');
  private cleanupObserver: (() => void) | null = null;
  private lastHandledRecoveryVersion = 0;

  constructor() {
    // Retry or re-validate thumbnails after shared recovery events.
    effect(() => {
      const version = this.recovery.recoveryVersion();
      if (version === 0 || version <= this.lastHandledRecoveryVersion) return;

      const url = this.ogImageUrl();
      if (!url) return;

      this.lastHandledRecoveryVersion = version;

      if (this.ogImageLoadFailed()) {
        this.ogImageLoadFailed.set(false);
        this.ogImageLoaded.set(false);
        return;
      }

      // Only remount the element if the restored node is broken or undecoded.
      queueMicrotask(() => {
        const img = this.thumbEl()?.nativeElement.querySelector(
          'img.og-image',
        ) as HTMLImageElement | null;
        if (img?.complete && img.naturalWidth > 0) {
          // Image is still decoded — restore immediately (no flicker)
          this.ogImageLoaded.set(true);
          this.ogImageMounted.set(true);
          return;
        }
        this.ogImageLoaded.set(false);
        this.remountOgImage();
      });
    });
  }

  ngOnInit(): void {
    const url = this.storyUrl();
    if (!url || this.isTextPost()) return;

    // Defer observation to next microtask so the element ref is available
    queueMicrotask(() => {
      const el = this.thumbEl()?.nativeElement;
      if (!el) return;

      this.cleanupObserver = this.ogImageService.observe(el, url, (result: OgImageResult) => {
        const previousUrl = this.ogImageUrl();
        const shouldResetLoadState = this.ogImageLoadFailed() || previousUrl !== result.imageUrl;

        this.ogImageLoadFailed.set(false);
        if (shouldResetLoadState) {
          this.ogImageLoaded.set(false);
        }
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
    this.ogImageLoadFailed.set(true);
    this.ogImageLoaded.set(false);
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

  private remountOgImage(): void {
    this.ogImageMounted.set(false);
    queueMicrotask(() => this.ogImageMounted.set(true));
  }
}
