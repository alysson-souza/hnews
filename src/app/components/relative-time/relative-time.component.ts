// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-relative-time',
  standalone: true,
  template: ` <span class="time-text">{{ format(timestamp) }}</span> `,
  styles: [
    `
      @reference '../../../styles.css';

      .time-text {
        @apply text-gray-500 dark:text-gray-500;
      }
    `,
  ],
})
export class RelativeTimeComponent {
  @Input({ required: true }) timestamp!: number;

  format(ts: number): string {
    const seconds = Math.floor(Date.now() / 1000 - ts);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}
