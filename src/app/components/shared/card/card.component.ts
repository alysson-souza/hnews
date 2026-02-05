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
        background-color: var(--app-surface);
        border: 1px solid var(--app-border);
        box-shadow: var(--app-shadow);
        @apply rounded-xl overflow-hidden;
        @apply transition-[box-shadow,border-color,background-color] duration-200;
      }

      .card-hoverable {
        @apply transition-[box-shadow,border-color,transform] duration-200;
      }

      .card-hoverable:hover {
        border-color: var(--app-border-strong);
        box-shadow: var(--app-shadow-strong);
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
