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
        @apply inline-flex items-center justify-center font-medium rounded-lg border cursor-pointer whitespace-nowrap;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
        @apply dark:focus-visible:ring-offset-gray-800;
        @apply transition-[background-color,border-color,color,box-shadow,transform] duration-200;
        color: var(--btn-text);
        background-color: var(--btn-bg);
        border-color: var(--btn-border);
        box-shadow: var(--btn-shadow, none);
      }

      .btn-base:hover:enabled {
        color: var(--btn-text-hover, var(--btn-text));
        background-color: var(--btn-bg-hover, var(--btn-bg));
        border-color: var(--btn-border-hover, var(--btn-border));
        box-shadow: var(--btn-shadow-hover, var(--btn-shadow, none));
      }

      .btn-base:active:enabled {
        transform: translateY(1px);
      }

      .btn-primary {
        --btn-text: var(--app-accent-contrast);
        --btn-text-hover: var(--app-accent-contrast);
        --btn-bg: var(--app-accent);
        --btn-bg-hover: var(--app-accent-hover);
        --btn-border: transparent;
        --btn-border-hover: transparent;
        --btn-shadow: var(--app-shadow);
        --btn-shadow-hover: var(--app-shadow-strong);
        @apply focus-visible:ring-blue-500;
      }

      .btn-secondary {
        --btn-text: var(--app-muted);
        --btn-text-hover: var(--app-text);
        --btn-bg: transparent;
        --btn-bg-hover: color-mix(in srgb, var(--app-surface) 92%, var(--app-text) 8%);
        --btn-border: var(--app-border);
        --btn-border-hover: var(--app-border-strong);
        @apply focus-visible:ring-gray-500;
      }

      .btn-danger {
        --btn-text: rgb(220 38 38);
        --btn-text-hover: rgb(185 28 28);
        --btn-bg: transparent;
        --btn-bg-hover: rgb(254 242 242);
        --btn-border: rgb(254 202 202);
        --btn-border-hover: rgb(252 165 165);
        @apply focus-visible:ring-red-500;
      }

      :host-context(.dark) .btn-danger {
        --btn-text: rgb(248 113 113);
        --btn-text-hover: rgb(252 165 165);
        --btn-bg-hover: rgb(127 29 29 / 0.2);
        --btn-border: rgb(127 29 29 / 0.5);
        --btn-border-hover: rgb(153 27 27 / 0.65);
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
        --btn-shadow: none;
        --btn-shadow-hover: none;
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
