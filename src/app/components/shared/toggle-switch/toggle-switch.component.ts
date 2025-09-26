// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checked"
      [attr.aria-label]="ariaLabel"
      [attr.aria-describedby]="descriptionId"
      [disabled]="disabled"
      [class]="containerClasses"
      (click)="toggle()"
    >
      <span [class]="sliderClasses"></span>
    </button>
  `,
  styles: [
    `
      @reference '../../../../styles.css';

      button {
        @apply relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
      }

      button:not(.enabled) {
        @apply bg-gray-200 dark:bg-slate-700;
      }

      button.enabled {
        @apply bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700;
      }

      button:disabled {
        @apply opacity-50 cursor-not-allowed;
      }

      .slider {
        @apply pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white dark:bg-slate-200 shadow transform transition ease-in-out duration-200;
      }

      .slider.translate-x-5 {
        @apply translate-x-5;
      }

      .slider.translate-x-0 {
        @apply translate-x-0;
      }

      .slider:disabled {
        @apply opacity-100;
      }
    `,
  ],
})
export class ToggleSwitchComponent {
  @Input() checked = false;
  @Input() ariaLabel = '';
  @Input() descriptionId = '';
  @Input() disabled = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  get containerClasses(): string {
    return this.checked ? 'enabled' : '';
  }

  get sliderClasses(): string {
    return `slider ${this.checked ? 'translate-x-5' : 'translate-x-0'} ${this.disabled ? 'disabled' : ''}`;
  }

  toggle(): void {
    if (!this.disabled) {
      this.checked = !this.checked;
      this.checkedChange.emit(this.checked);
    }
  }
}
