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

      :host {
        display: block;
      }

      .card-base {
        @apply bg-white dark:bg-gray-800;
        @apply border border-gray-200 dark:border-gray-700;
        @apply rounded-xl shadow-sm;
      }

      .card-hoverable {
        @apply hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700;
        @apply transition-all duration-200;
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
