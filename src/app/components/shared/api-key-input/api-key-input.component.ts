// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, OnInit, output, input } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-api-key-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (!hideLabel()) {
      <label
        class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"
        [attr.for]="inputId"
      >
        {{ label() }}
      </label>
    }
    <div class="relative">
      <input
        [id]="inputId"
        [type]="secret() && !show ? 'password' : 'text'"
        [class]="inputClasses"
        [placeholder]="placeholder()"
        [(ngModel)]="model"
        (ngModelChange)="onChange()"
        [attr.aria-label]="label()"
        [attr.aria-describedby]="hint() ? hintId : null"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
      />
      @if (secret()) {
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-sm p-1 text-gray-500 dark:text-blue-300 hover:text-gray-700 dark:hover:text-blue-200 cursor-pointer"
          (click)="toggleVisibility()"
          [attr.aria-label]="show ? 'Hide API key' : 'Show API key'"
          [attr.aria-pressed]="show"
          [title]="show ? 'Hide API key' : 'Show API key'"
        >
          {{ show ? 'Hide' : 'Show' }}
        </button>
      }
    </div>
    @if (hint()) {
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1" [id]="hintId">{{ hint() }}</p>
    }
  `,
})
export class ApiKeyInputComponent implements OnInit {
  readonly label = input('API Key');
  readonly placeholder = input('');
  readonly hint = input<string>();
  readonly secret = input(true);
  readonly hideLabel = input(false);
  readonly value = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly valueChange = output<string | undefined>();

  show = false;
  model?: string;
  inputId = `api-input-` + Math.random().toString(36).slice(2);
  get hintId() {
    return this.inputId + '-hint';
  }

  get inputClasses(): string {
    let classes = 'app-input w-full';
    const size = this.size();
    if (size === 'sm') classes += ' app-input-sm';
    if (size === 'lg') classes += ' app-input-lg';
    if (this.secret()) classes += ' pr-12';
    return classes;
  }

  ngOnInit() {
    this.model = this.value();
  }

  onChange() {
    this.valueChange.emit(this.model);
  }

  toggleVisibility() {
    this.show = !this.show;
  }
}
