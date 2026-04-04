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
  readonly altText = input.required<string>();
  private recovery = inject(ThumbnailRecoveryService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private lastHandledRecoveryVersion = 0;
  readonly imageMounted = signal(true);

  readonly hasError = linkedSignal(() => {
    this.url(); // track url input — reset on change
    return false;
  });

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
        this.hasError.set(false);
        return;
      }

      const img = this.host.nativeElement.querySelector('img');
      if (!img || !img.complete || img.naturalWidth <= 16 || img.naturalHeight <= 16) {
        this.remountImage();
      }
    });
  }

  readonly faviconUrl = computed(() => {
    const domain = this.getDomain(this.url());
    if (!domain) return '/assets/default-thumb.svg';
    return `/api/favicons?domain=${domain}`;
  });

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
    this.hasError.set(true);
  }

  handleLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Google returns a 16×16 globe for domains with no favicon, even when sz=64 is
    // requested. Real favicons come back at the requested size. Treat tiny images as missing.
    if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
      this.hasError.set(true);
    }
  }

  private getDomain(url?: string): string {
    if (!url) return '';
    try {
      const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      const parts = hostname.split('.');
      if (parts.length <= 2) return hostname;
      // Detect compound country-code TLDs (e.g. co.uk, com.au) — keep 3 labels.
      // Otherwise strip subdomains: edition.cnn.com → cnn.com.
      const tld = parts[parts.length - 1];
      const sld = parts[parts.length - 2];
      const compoundSlds = ['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'ne', 'me'];
      if (tld.length === 2 && compoundSlds.includes(sld)) {
        return parts.slice(-3).join('.');
      }
      return parts.slice(-2).join('.');
    } catch {
      return '';
    }
  }

  private remountImage(): void {
    this.imageMounted.set(false);
    queueMicrotask(() => this.imageMounted.set(true));
  }
}
