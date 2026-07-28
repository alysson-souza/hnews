// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import {
  Component,
  input,
  linkedSignal,
  computed,
  inject,
  effect,
  ElementRef,
  signal,
} from '@angular/core';
import { ThumbnailRecoveryService } from '@services/thumbnail-recovery.service';

@Component({
  selector: 'app-story-favicon',
  imports: [],
  template: `
    @if (!hasError() && imageMounted()) {
      <img
        [src]="faviconUrl()"
        width="64"
        height="64"
        [alt]="altText()"
        class="w-full h-full object-contain"
        decoding="async"
        (error)="handleError()"
        (load)="handleLoad($event)"
      />
    } @else {
      <div
        class="w-full h-full flex items-center justify-center font-bold text-5xl text-gray-400 select-none"
      >
        {{ domainLetter() }}
      </div>
    }
  `,
  styles: [
    `
      @reference '../../../../styles.css';
      :host {
        @apply block w-full h-full;
      }
      img {
        image-rendering: high-quality;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
    `,
  ],
})
export class StoryFaviconComponent {
  readonly url = input<string>();
  readonly preferredFaviconUrl = input<string | null>(null);
  readonly altText = input.required<string>();
  private recovery = inject(ThumbnailRecoveryService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private lastHandledRecoveryVersion = 0;
  readonly imageMounted = signal(true);

  constructor() {
    // Re-render the favicon image on shared recovery events so the browser can retry it.
    effect(() => {
      const version = this.recovery.recoveryVersion();
      if (version <= this.lastHandledRecoveryVersion) {
        return;
      }

      this.lastHandledRecoveryVersion = version;

      if (version === 0) {
        return;
      }

      if (this.hasError()) {
        this.faviconUrl.set(this.preferredFaviconUrl() || this.googleFaviconUrl());
        return;
      }

      const img = this.host.nativeElement.querySelector('img');
      if (!img || !img.complete || img.naturalWidth <= 16 || img.naturalHeight <= 16) {
        this.remountImage();
      }
    });
  }

  readonly googleFaviconUrl = computed(() => {
    const domain = this.getDomain(this.url());
    if (!domain) return '/assets/default-thumb.svg';
    return `/api/favicons?domain=${domain}`;
  });

  readonly faviconUrl = linkedSignal<string | null>(() => {
    const preferred = this.preferredFaviconUrl();
    const google = this.googleFaviconUrl();
    return preferred || google;
  });

  readonly hasError = computed(() => this.faviconUrl() === null);

  readonly domainLetter = computed(() => {
    const url = this.url();
    if (!url) return '?';
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase();
    } catch {
      return '?';
    }
  });

  handleError(): void {
    if (this.faviconUrl() === this.preferredFaviconUrl() && this.preferredFaviconUrl()) {
      this.faviconUrl.set(this.googleFaviconUrl());
      return;
    }
    this.faviconUrl.set(null);
  }

  handleLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Google returns a 16×16 globe for domains with no favicon, even when sz=64
    // is requested. A publisher-declared favicon may legitimately be 16×16.
    if (
      this.faviconUrl() === this.googleFaviconUrl() &&
      img.naturalWidth <= 16 &&
      img.naturalHeight <= 16
    ) {
      this.faviconUrl.set(null);
    }
  }

  private getDomain(url?: string): string {
    if (!url) return '';
    try {
      return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  private remountImage(): void {
    this.imageMounted.set(false);
    queueMicrotask(() => this.imageMounted.set(true));
  }
}
