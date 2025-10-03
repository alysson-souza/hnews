// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      (click)="clicked.emit($event)"
      [class]="getButtonClasses()"
      [attr.aria-label]="ariaLabel"
      [attr.aria-pressed]="pressed"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .btn-base {
        @apply font-medium rounded-lg transition-all duration-200 cursor-pointer;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
        @apply dark:focus-visible:ring-offset-gray-800;
      }

      .btn-primary {
        @apply bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm;
        @apply hover:from-blue-700 hover:to-blue-800 hover:shadow-md;
        @apply dark:from-blue-500 dark:to-blue-600;
        @apply dark:hover:from-blue-600 dark:hover:to-blue-700;
        @apply focus-visible:ring-blue-500;
      }

      .btn-secondary {
        @apply bg-gray-100 text-gray-800 border border-gray-300 shadow-sm;
        @apply hover:bg-gray-200 hover:shadow-md;
        @apply dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600;
        @apply dark:hover:bg-gray-600;
        @apply focus-visible:ring-gray-500;
      }

      .btn-danger {
        @apply bg-red-600 text-white border border-red-600 shadow-sm;
        @apply hover:bg-red-700 hover:border-red-700 hover:shadow-md;
        @apply dark:bg-red-700 dark:border-red-700 dark:text-white;
        @apply dark:hover:bg-red-600 dark:hover:border-red-600;
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
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ariaLabel?: string;
  @Input() pressed?: boolean;
  @Output() clicked = new EventEmitter<Event>();

  getButtonClasses(): string {
    const classes = ['btn-base', `btn-${this.variant}`, `btn-${this.size}`];

    if (this.disabled) {
      classes.push('btn-disabled');
    }

    if (this.fullWidth) {
      classes.push('btn-full');
    }

    return classes.join(' ');
  }
}
