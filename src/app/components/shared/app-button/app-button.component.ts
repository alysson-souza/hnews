// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, output, input } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      (click)="clicked.emit($event)"
      [class]="getButtonClasses()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-pressed]="pressed()"
    >
      <ng-content />
    </button>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .btn-base {
        @apply inline-flex items-center justify-center font-medium rounded-lg cursor-pointer whitespace-nowrap;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
        @apply dark:focus-visible:ring-offset-gray-800;
      }

      .btn-primary {
        background-color: var(--app-brand);
        @apply text-white;
        @apply hover:brightness-110;
        @apply focus-visible:ring-blue-500;
      }

      .btn-secondary {
        @apply text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700;
        @apply hover:bg-gray-50 dark:hover:bg-gray-800;
        @apply focus-visible:ring-gray-500;
      }

      .btn-danger {
        @apply text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50;
        @apply hover:bg-red-50 dark:hover:bg-red-900/20;
        @apply focus-visible:ring-red-500;
      }

      .btn-sm {
        @apply px-3 py-1.5 text-sm;
      }
      .btn-md {
        @apply px-4 py-2;
      }
      .btn-lg {
        @apply px-6 py-3 text-lg;
      }

      .btn-disabled {
        @apply opacity-50 cursor-not-allowed;
      }
      .btn-full {
        @apply w-full;
      }
    `,
  ],
})
export class AppButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input(false);
  readonly fullWidth = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly ariaLabel = input<string>();
  readonly pressed = input<boolean>();
  readonly clicked = output<Event>();

  getButtonClasses(): string {
    const classes = ['btn-base', `btn-${this.variant()}`, `btn-${this.size()}`];

    if (this.disabled()) {
      classes.push('btn-disabled');
    }

    if (this.fullWidth()) {
      classes.push('btn-full');
    }

    return classes.join(' ');
  }
}
