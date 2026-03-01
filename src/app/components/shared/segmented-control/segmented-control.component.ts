// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, output, input } from '@angular/core';

export interface SegmentOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-segmented-control',
  imports: [],
  template: `
    <div class="segmented-control-container" role="tablist">
      @for (option of options(); track option) {
        <button
          type="button"
          [class.active]="value() === option.value"
          [attr.role]="'tab'"
          [attr.aria-selected]="value() === option.value"
          [attr.aria-label]="option.label"
          (click)="selectOption(option.value)"
          (keydown)="handleKeydown($event)"
          class="segment-button"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .segmented-control-container {
        @apply inline-flex max-w-full items-center gap-1 p-1 rounded-xl w-full sm:w-auto;
        @apply border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/70;
        @apply shadow-[inset_0_1px_3px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_3px_rgb(0_0_0/0.3)];
      }

      .segment-button {
        @apply relative px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-widest whitespace-nowrap;
        @apply text-gray-500 dark:text-gray-400;
        @apply cursor-pointer rounded-lg select-none;
        @apply hover:text-gray-700 dark:hover:text-gray-300;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
        @apply flex-1 sm:flex-initial;
      }

      .segment-button.active {
        @apply bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm;
      }
    `,
  ],
})
export class SegmentedControlComponent {
  readonly options = input<SegmentOption[]>([]);
  readonly value = input<string>('');
  readonly valueChange = output<string>();

  selectOption(value: string): void {
    this.valueChange.emit(value);
  }

  handleKeydown(event: KeyboardEvent): void {
    const optionValues = this.options().map((o) => o.value);
    const currentIndex = optionValues.indexOf(this.value());

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % optionValues.length;
        this.selectOption(optionValues[nextIndex]);
        break;
      }

      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault();
        const prevIndex: number = (currentIndex - 1 + optionValues.length) % optionValues.length;
        this.selectOption(optionValues[prevIndex]);
        break;
      }

      case 'Home':
        event.preventDefault();
        this.selectOption(optionValues[0]);
        break;

      case 'End':
        event.preventDefault();
        this.selectOption(optionValues[optionValues.length - 1]);
        break;
    }
  }
}
