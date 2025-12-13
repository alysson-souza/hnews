// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  imports: [],
  template: `
    <div [class]="getCardClasses()">
      <ng-content />
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      :host {
        display: block;
      }

      .card-base {
        @apply bg-white dark:bg-slate-900;
        @apply border border-gray-200 dark:border-slate-700;
        @apply rounded-xl shadow-sm dark:shadow-md dark:shadow-black/20;
        @apply overflow-hidden;
        @apply transition-all duration-200;
      }

      .card-hoverable {
        @apply hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600 dark:hover:shadow-lg dark:hover:shadow-black/30;
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
  readonly noPadding = input(false);
  readonly hoverable = input(false);
  readonly clickable = input(false);

  getCardClasses(): string {
    const classes = ['card-base'];

    if (!this.noPadding()) {
      classes.push('card-padding');
    }

    if (this.hoverable()) {
      classes.push('card-hoverable');
    }

    if (this.clickable()) {
      classes.push('card-clickable');
    }

    return classes.join(' ');
  }
}
