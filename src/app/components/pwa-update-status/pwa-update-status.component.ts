// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudDownload, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

export type UpdateStatusType = 'available' | 'checking' | 'up-to-date' | 'none';

@Component({
  selector: 'app-pwa-update-status',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    @if (status !== 'none') {
      <div [class]="getStatusClass()">
        <fa-icon
          [icon]="getStatusIcon()"
          class="text-xl"
          [class.animate-spin]="status === 'checking'"
        ></fa-icon>
        <div class="flex-1">
          <div class="font-semibold">{{ getStatusTitle() }}</div>
          <div class="text-sm">{{ getStatusDescription() }}</div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .update-status {
        @apply flex items-center gap-3 p-4 rounded-lg border;
      }

      .update-status.available {
        @apply bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300;
        @apply border-green-200 dark:border-green-800/50;
      }

      .update-status.checking {
        @apply bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300;
        @apply border-blue-200 dark:border-blue-800/50;
      }

      .update-status.up-to-date {
        @apply bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300;
        @apply border-gray-200 dark:border-gray-700;
      }
    `,
  ],
})
export class PwaUpdateStatusComponent {
  @Input() status: UpdateStatusType = 'none';

  faCloudDownload = faCloudDownload;
  faCheckCircle = faCheckCircle;
  faSpinner = faSpinner;

  getStatusClass(): string {
    return `update-status ${this.status}`;
  }

  getStatusIcon() {
    switch (this.status) {
      case 'available':
        return this.faCloudDownload;
      case 'checking':
        return this.faSpinner;
      case 'up-to-date':
        return this.faCheckCircle;
      default:
        return this.faCheckCircle;
    }
  }

  getStatusTitle(): string {
    switch (this.status) {
      case 'available':
        return 'Update Available';
      case 'checking':
        return 'Checking for Updates';
      case 'up-to-date':
        return 'Up to Date';
      default:
        return '';
    }
  }

  getStatusDescription(): string {
    switch (this.status) {
      case 'available':
        return 'A new version is ready to install';
      case 'checking':
        return 'Please wait while we check for updates...';
      case 'up-to-date':
        return 'You are running the latest version';
      default:
        return '';
    }
  }
}
