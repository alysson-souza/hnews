// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 [class]="getTitleClass()">
      <ng-content></ng-content>
    </h1>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .section-title {
        @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6;
      }

      .section-subtitle {
        @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4;
      }
    `,
  ],
})
export class SectionTitleComponent {
  @Input() variant: 'title' | 'subtitle' = 'title';

  getTitleClass(): string {
    return this.variant === 'title' ? 'section-title' : 'section-subtitle';
  }
}
