// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-api-key-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (!hideLabel) {
      <label
        class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1"
        [attr.for]="inputId"
      >
        {{ label }}
      </label>
    }
    <div class="relative">
      <input
        [id]="inputId"
        [type]="secret && !show ? 'password' : 'text'"
        class="w-full px-3 py-2 rounded border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        [placeholder]="placeholder"
        [(ngModel)]="model"
        (ngModelChange)="onChange()"
        [attr.aria-label]="label"
        [attr.aria-describedby]="hint ? hintId : null"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
      />
      @if (secret) {
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          (click)="toggleVisibility()"
          [attr.aria-label]="show ? 'Hide API key' : 'Show API key'"
          [attr.aria-pressed]="show"
          [title]="show ? 'Hide API key' : 'Show API key'"
        >
          {{ show ? 'Hide' : 'Show' }}
        </button>
      }
    </div>
    @if (hint) {
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1" [id]="hintId">{{ hint }}</p>
    }
  `,
})
export class ApiKeyInputComponent implements OnInit {
  @Input() label = 'API Key';
  @Input() placeholder = '';
  @Input() hint?: string;
  @Input() secret = true;
  @Input() hideLabel = false;
  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string | undefined>();

  show = false;
  model?: string;
  inputId = `api-input-` + Math.random().toString(36).slice(2);
  get hintId() {
    return this.inputId + '-hint';
  }

  ngOnInit() {
    this.model = this.value;
  }

  onChange() {
    this.valueChange.emit(this.model);
  }

  toggleVisibility() {
    this.show = !this.show;
  }
}
