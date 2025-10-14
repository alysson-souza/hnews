// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pwa-version-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="version-info-card">
      <h3 class="version-info-title">Current Version</h3>
      <div class="version-info-grid">
        <div class="version-detail">
          <div class="version-label">Version</div>
          <div class="version-value">{{ version }}</div>
        </div>
        <div class="version-detail">
          <div class="version-label">Commit</div>
          <div class="version-value">{{ commit }}</div>
        </div>
        <div class="version-detail">
          <div class="version-label">Build Time</div>
          <div class="version-value">{{ buildTime }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .version-info-card {
        @apply p-6 rounded-xl border border-gray-200 dark:border-gray-700;
        @apply bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700;
      }

      .version-info-title {
        @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-4;
      }

      .version-info-grid {
        @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
      }

      .version-detail {
        @apply text-center;
      }

      .version-label {
        @apply text-sm text-gray-600 dark:text-gray-400 mb-1;
      }

      .version-value {
        @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
      }
    `,
  ],
})
export class PwaVersionInfoComponent {
  @Input() version = 'unknown';
  @Input() commit = 'unknown';
  @Input() buildTime = 'unknown';
}
