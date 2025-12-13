// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  imports: [],
  template: `
    <div class="stat-card">
      <div class="stat-label">{{ label() }}</div>
      <div class="stat-value">{{ value() }}</div>
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .stat-card {
        @apply bg-gray-50 dark:bg-gray-900 p-4 rounded;
      }

      .stat-label {
        @apply text-sm text-gray-600 dark:text-gray-400;
      }

      .stat-value {
        @apply text-xl font-semibold text-gray-900 dark:text-gray-100;
      }
    `,
  ],
})
export class StatCardComponent {
  readonly label = input('');
  readonly value = input('');
}
