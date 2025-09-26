// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  Component,
  Input,
  inject,
  signal,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserTagsService, UserTag } from '../../services/user-tags.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUserTag } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-user-tag',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="user-tag">
      <!-- Username link -->
      <a
        [routerLink]="['/user', username]"
        class="username-link"
        [attr.aria-label]="'View Profile Of ' + username"
      >
        {{ username }}
      </a>

      <!-- Tag display -->
      @if (tag() && !editing()) {
        <button
          type="button"
          class="tag-chip"
          [style.background-color]="tag()!.color"
          (click)="startEdit($event)"
          (keyup.enter)="startEdit($event)"
          (keyup.space)="startEdit($event)"
          role="button"
          tabindex="0"
          [attr.aria-label]="'Tag: ' + tag()!.tag"
        >
          {{ tag()!.tag }}
        </button>
      }

      <!-- Add/Edit tag button -->
      @if (!tag() && !editing()) {
        <button
          (click)="startEdit($event)"
          class="add-btn"
          role="button"
          tabindex="0"
          [attr.aria-label]="'Add Tag For ' + username"
          (keydown.enter)="startEdit($event)"
          (keydown.space)="startEdit($event)"
        >
          <fa-icon [icon]="faUserTag" class="icon"></fa-icon>
        </button>
      }

      <!-- Edit form -->
      @if (editing()) {
        <div class="editor">
          <input
            type="text"
            [(ngModel)]="editValue"
            (keyup.enter)="saveTag()"
            (keyup.escape)="cancelEdit()"
            (blur)="onInputBlur()"
            class="tag-input app-input app-input-xs w-20 px-2 py-1"
            placeholder="Tag..."
            [attr.aria-label]="'Enter Tag For ' + username"
            #tagInput
          />
          <button
            (mousedown)="saveTag()"
            class="save-btn"
            role="button"
            tabindex="0"
            [attr.aria-label]="'Save Tag'"
            (keydown.enter)="saveTag()"
            (keydown.space)="saveTag()"
          >
            ✓
          </button>
          @if (tag()) {
            <button
              (click)="removeTag()"
              class="remove-btn"
              role="button"
              tabindex="0"
              [attr.aria-label]="'Remove Tag'"
              (keydown.enter)="removeTag()"
              (keydown.space)="removeTag()"
            >
              ✗
            </button>
          }
        </div>
      }
    </span>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .user-tag {
        @apply inline-flex items-center gap-1;
      }

      .username-link {
        @apply text-blue-600 dark:text-blue-300 hover:underline cursor-pointer;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded;
      }

      .tag-chip {
        @apply px-1.5 py-0.5 text-xs text-white rounded cursor-pointer;
      }

      .add-btn {
        @apply text-gray-400 hover:text-gray-600 text-xs cursor-pointer;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1;
      }

      .icon {
        vertical-align: -2px;
      }

      .editor {
        @apply inline-flex items-center gap-1;
      }

      .tag-input {
        @apply text-xs;
      }

      .save-btn {
        @apply text-green-600 hover:text-green-800 text-xs cursor-pointer;
      }

      .remove-btn {
        @apply text-red-600 hover:text-red-800 text-xs cursor-pointer;
      }
    `,
  ],
})
export class UserTagComponent {
  private _username = '';

  @Input({ required: true })
  set username(value: string) {
    this._username = value;
    // Refresh the tag whenever the input username changes
    this.tag.set(this.tagsService.getTag(value));
  }
  get username(): string {
    return this._username;
  }

  private tagsService = inject(UserTagsService);

  tag = signal<UserTag | undefined>(undefined);
  editing = signal(false);
  editValue = '';
  protected faUserTag = faUserTag;

  @ViewChild('tagInput') private tagInput?: ElementRef<HTMLInputElement>;

  startEdit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.editing.set(true);
    this.editValue = this.tag()?.tag || '';

    // Focus input after it renders
    setTimeout(() => {
      const input = this.tagInput?.nativeElement;
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
