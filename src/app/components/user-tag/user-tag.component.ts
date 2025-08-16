// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserTagsService } from '../../services/user-tags.service';

@Component({
  selector: 'app-user-tag',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <span class="inline-flex items-center gap-1">
      <!-- Username link -->
      <a
        [routerLink]="['/user', username]"
        class="text-blue-600 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        [attr.aria-label]="'View profile of ' + username"
      >
        {{ username }}
      </a>

      <!-- Tag display -->
      @if (tag() && !editing()) {
        <button
          type="button"
          class="px-1.5 py-0.5 text-xs text-white rounded cursor-pointer"
          [style.background-color]="tag()!.color"
          (click)="startEdit($event)"
          (keyup.enter)="startEdit($event)"
          (keyup.space)="startEdit($event)"
          [attr.aria-label]="'Tag: ' + tag()!.tag"
        >
          {{ tag()!.tag }}
        </button>
      }

      <!-- Add/Edit tag button -->
      @if (!tag() && !editing()) {
        <button
          (click)="startEdit($event)"
          class="text-gray-400 hover:text-gray-600 text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
          [attr.aria-label]="'Add tag for ' + username"
        >
          [+]
        </button>
      }

      <!-- Edit form -->
      @if (editing()) {
        <div class="inline-flex items-center gap-1">
          <input
            type="text"
            [(ngModel)]="editValue"
            (keyup.enter)="saveTag()"
            (keyup.escape)="cancelEdit()"
            (blur)="onInputBlur()"
            class="px-1 py-0 text-xs border border-gray-300 rounded w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tag..."
            [attr.aria-label]="'Enter tag for ' + username"
            #tagInput
          />
          <button
            (mousedown)="saveTag()"
            class="text-green-600 hover:text-green-800 text-xs cursor-pointer"
            [attr.aria-label]="'Save tag'"
          >
            ✓
          </button>
          @if (tag()) {
            <button
              (click)="removeTag()"
              class="text-red-600 hover:text-red-800 text-xs cursor-pointer"
              [attr.aria-label]="'Remove tag'"
            >
              ✗
            </button>
          }
        </div>
      }
    </span>
  `,
})
export class UserTagComponent implements OnInit {
  @Input({ required: true }) username!: string;

  private tagsService = inject(UserTagsService);

  tag = signal(this.tagsService.getTag(this.username));
  editing = signal(false);
  editValue = '';

  ngOnInit() {
    this.tag.set(this.tagsService.getTag(this.username));
  }

  startEdit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.editing.set(true);
    this.editValue = this.tag()?.tag || '';

    // Focus input after render
    setTimeout(() => {
      const input = document.querySelector(
        'input[aria-label*="' + this.username + '"]',
      ) as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 0);
  }

  saveTag(): void {
    const trimmedValue = this.editValue.trim();

    if (trimmedValue) {
      this.tagsService.setTag(this.username, trimmedValue);
      this.tag.set(this.tagsService.getTag(this.username));
    } else if (this.tag()) {
      // Empty tag deletes existing tag
      this.tagsService.removeTag(this.username);
      this.tag.set(undefined);
    }

    this.editing.set(false);
    this.editValue = '';
  }

  removeTag(): void {
    this.tagsService.removeTag(this.username);
    this.tag.set(undefined);
    this.editing.set(false);
    this.editValue = '';
  }

  onInputBlur(): void {
    // Delay cancel to allow button clicks to process first
    setTimeout(() => {
      if (this.editing()) {
        this.cancelEdit();
      }
    }, 100);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editValue = '';
  }
}
