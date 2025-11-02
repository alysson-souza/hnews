// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component } from '@angular/core';

@Component({
  selector: 'app-op-badge',
  standalone: true,
  template: `
    <span class="op-badge" role="img" [attr.aria-label]="'Original Poster'" title="Original Poster">
      OP
    </span>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .op-badge {
        @apply inline-flex items-center px-1.5 py-0.5 text-xs text-white rounded-lg;
        @apply bg-orange-600 dark:bg-orange-500;
        @apply transition-colors duration-200;
      }
    `,
  ],
})
export class OPBadgeComponent {}
