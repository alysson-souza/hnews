// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, input, signal, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-story-favicon',
  imports: [NgOptimizedImage],
  template: `
    @if (!hasError()) {
      <img
        [ngSrc]="faviconUrl()"
        width="64"
        height="64"
        [alt]="altText()"
        class="w-full h-full object-contain"
        decoding="async"
        (error)="handleError()"
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
    `,
  ],
})
export class StoryFaviconComponent {
  readonly url = input<string>();
  readonly altText = input.required<string>();

  readonly hasError = signal(false);

  readonly faviconUrl = computed(() => {
    const domain = this.getDomain(this.url());
    if (!domain) return '/assets/default-thumb.svg';
    // Unavatar aggregates multiple providers (Clearbit, DDG, Google) to find the best icon
    // fallback=false ensures 404 if not found, triggering our local error handler
    return `https://unavatar.io/${domain}?fallback=false`;
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

  private getDomain(url?: string): string {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return '';
    }
  }
}
