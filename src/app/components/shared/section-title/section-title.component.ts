// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-title',
  imports: [],
  template: `
    <h1 [class]="getTitleClass()">
      <ng-content />
    </h1>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .section-title {
        @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-0 leading-none;
        font-family: var(--font-display);
      }

      .section-subtitle {
        @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0 leading-none;
        font-family: var(--font-display);
      }
    `,
  ],
})
export class SectionTitleComponent {
  readonly variant = input<'title' | 'subtitle'>('title');

  getTitleClass(): string {
    return this.variant() === 'title' ? 'section-title' : 'section-subtitle';
  }
}
