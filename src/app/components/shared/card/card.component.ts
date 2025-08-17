// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getCardClasses()">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .card-base {
        @apply bg-white dark:bg-slate-900;
        @apply border border-gray-200 dark:border-slate-700;
        @apply rounded-lg shadow-sm dark:shadow-md;
      }

      .card-hoverable {
        @apply hover:shadow-md dark:hover:shadow-lg;
        @apply transition-shadow duration-200;
      }

      .card-clickable {
        @apply cursor-pointer;
      }

      .card-padding {
        @apply p-6;
      }
    `,
  ],
})
export class CardComponent {
  @Input() noPadding = false;
  @Input() hoverable = false;
  @Input() clickable = false;

  getCardClasses(): string {
    const classes = ['card-base'];

    if (!this.noPadding) {
      classes.push('card-padding');
    }

    if (this.hoverable) {
      classes.push('card-hoverable');
    }

    if (this.clickable) {
      classes.push('card-clickable');
    }

    return classes.join(' ');
  }
}
