// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SegmentOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-segmented-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="segmented-control-container" role="tablist">
      <button
        *ngFor="let option of options"
        type="button"
        [class.active]="value === option.value"
        [attr.role]="'tab'"
        [attr.aria-selected]="value === option.value"
        [attr.aria-label]="option.label"
        (click)="selectOption(option.value)"
        (keydown)="handleKeydown($event)"
        class="segment-button"
      >
        {{ option.label }}
      </button>
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      .segmented-control-container {
        @apply inline-flex items-center gap-0 p-1 rounded-full;
        @apply bg-gray-200 dark:bg-gray-700;
        @apply transition-colors duration-200;
        @apply w-full sm:w-auto;
      }

      .segment-button {
        @apply px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium;
        @apply text-gray-700 dark:text-gray-300;
        @apply hover:text-gray-900 dark:hover:text-gray-100;
        @apply transition-all duration-200 cursor-pointer;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
        @apply focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400;
        @apply dark:focus-visible:ring-offset-gray-800;
        @apply flex-1 sm:flex-initial;
      }

      .segment-button:first-child {
        @apply rounded-l-full;
      }

      .segment-button:last-child {
        @apply rounded-r-full;
      }

      .segment-button.active {
        @apply bg-white dark:bg-gray-600;
        @apply text-gray-900 dark:text-white;
        @apply shadow-sm dark:shadow-md;
      }

      .segment-button:hover:not(.active) {
        @apply bg-gray-300 dark:bg-gray-600;
      }
    `,
  ],
})
export class SegmentedControlComponent {
  @Input() options: SegmentOption[] = [];
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  selectOption(value: string): void {
    this.valueChange.emit(value);
  }

  handleKeydown(event: KeyboardEvent): void {
    const optionValues = this.options.map((o) => o.value);
    const currentIndex = optionValues.indexOf(this.value);

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
