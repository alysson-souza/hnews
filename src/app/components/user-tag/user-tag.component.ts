// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import {
  Component,
  inject,
  signal,
  ElementRef,
  ChangeDetectionStrategy,
  effect,
  viewChild,
  input,
  HostListener,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { RouterLink } from '@angular/router';
import { UserTagsService, UserTag } from '@services/user-tags.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarTagLinear } from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-user-tag',
  imports: [RouterLink, NgIconComponent],
  viewProviders: [provideIcons({ solarTagLinear })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="user-tag">
      <!-- Username link -->
      <a
        [routerLink]="['/user', username()]"
        class="username-link"
        tabindex="0"
        [attr.aria-label]="'View Profile Of ' + username()"
      >
        {{ username() }}
      </a>

      <!-- Tag display -->
      @if (tag()) {
        <button
          #editTrigger
          type="button"
          class="tag-chip"
          [style.background-color]="tag()!.color"
          [title]="tag()!.notes || ''"
          (click)="startEdit($event, editTrigger)"
          (keyup.enter)="startEdit($event, editTrigger)"
          (keyup.space)="startEdit($event, editTrigger)"
          role="button"
          tabindex="0"
          [attr.aria-label]="'Tag: ' + tag()!.tag + (tag()!.notes ? ' — ' + tag()!.notes : '')"
        >
          {{ tag()!.tag }}
        </button>
      }

      <!-- Add/Edit tag button -->
      @if (!tag()) {
        <button
          #addTrigger
          (click)="startEdit($event, addTrigger)"
          class="add-btn"
          role="button"
          tabindex="0"
          [attr.aria-label]="'Add Tag For ' + username()"
          (keydown.enter)="startEdit($event, addTrigger)"
          (keydown.space)="startEdit($event, addTrigger)"
        >
          <ng-icon name="solarTagLinear" class="icon" />
        </button>
      }

      <!-- Popover editor -->
      @if (editing()) {
        <div
          #popoverBackdrop
          class="popover-backdrop"
          (click)="cancelEdit()"
          role="button"
          tabindex="-1"
          aria-label="Close editor"
        ></div>
        <div
          #tagPopover
          class="tag-popover"
          [style.top.px]="popoverTop()"
          [style.left.px]="popoverLeft()"
        >
          <input
            type="text"
            [value]="editValue"
            (input)="editValue = $any($event.target).value"
            (keyup.enter)="saveTag()"
            (keydown.space)="$event.stopPropagation()"
            class="tag-input app-input app-input-xs w-full px-2 py-1"
            placeholder="Tag..."
            [attr.aria-label]="'Enter Tag For ' + username()"
            #tagInput
          />
          <textarea
            [value]="editNotes"
            (input)="editNotes = $any($event.target).value"
            (keydown.space)="$event.stopPropagation()"
            class="notes-input app-input app-input-xs w-full px-2 py-1"
            rows="2"
            placeholder="Notes (optional)..."
            [attr.aria-label]="'Notes For ' + username()"
          ></textarea>
          <div class="popover-actions">
            <button
              (click)="saveTag()"
              class="save-btn"
              role="button"
              tabindex="0"
              [attr.aria-label]="'Save Tag'"
              (keydown.enter)="saveTag()"
              (keydown.space)="saveTag()"
            >
              Save
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
                Remove
              </button>
            }
            <button
              (click)="cancelEdit()"
              class="cancel-btn"
              role="button"
              tabindex="0"
              [attr.aria-label]="'Cancel Editing'"
              (keydown.enter)="cancelEdit()"
              (keydown.space)="cancelEdit()"
            >
              Cancel
            </button>
          </div>
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
        @apply text-blue-600 dark:text-blue-300 hover:underline cursor-pointer transition-colors duration-200;
        @apply rounded focus-visible:outline-2 focus-visible:outline-blue-500 dark:focus-visible:outline-blue-400 focus-visible:outline-offset-1;
      }

      .tag-chip {
        @apply px-1.5 py-0.5 text-xs text-white rounded-lg cursor-pointer transition-all duration-200;
        @apply hover:shadow-md active:scale-95;
      }

      .add-btn {
        @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs cursor-pointer transition-colors duration-200;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 rounded px-1;
        @apply hover:bg-gray-100 dark:hover:bg-gray-700 p-0.5 rounded;
      }

      .icon {
        vertical-align: -2px;
      }

      .popover-backdrop {
        @apply fixed inset-0 z-[60] bg-slate-950/24 dark:bg-black/40;
      }

      .tag-popover {
        @apply fixed z-[70] p-3 space-y-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700;
        @apply bg-white dark:bg-gray-800;
        @apply min-w-[calc(100vw-2rem)] sm:min-w-0 sm:w-64;
      }

      .tag-input {
        @apply text-xs;
      }

      .notes-input {
        @apply text-xs resize-none;
      }

      .popover-actions {
        @apply flex items-center gap-2;
      }

      .save-btn {
        @apply text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-xs cursor-pointer transition-colors duration-200;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:focus-visible:ring-green-400 rounded p-0.5;
      }

      .remove-btn {
        @apply text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs cursor-pointer transition-colors duration-200;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-red-400 rounded p-0.5;
      }

      .cancel-btn {
        @apply text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs cursor-pointer transition-colors duration-200;
        @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400 rounded p-0.5;
      }
    `,
  ],
})
export class UserTagComponent {
  readonly username = input.required<string>();
  private readonly document = inject(DOCUMENT);

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.editing()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancelEdit();
    } else if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      this.saveTag();
    }
  }

  private tagsService = inject(UserTagsService);

  tag = signal<UserTag | undefined>(undefined);
  editing = signal(false);
  editValue = '';
  editNotes = '';
  popoverTop = signal(0);
  popoverLeft = signal(0);

  private readonly tagInput = viewChild<ElementRef<HTMLInputElement>>('tagInput');
  private readonly popoverBackdrop = viewChild<ElementRef<HTMLElement>>('popoverBackdrop');
  private readonly popoverElement = viewChild<ElementRef<HTMLElement>>('tagPopover');
  private triggerRect: Pick<DOMRect, 'left' | 'top' | 'bottom'> | null = null;

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.editing()) {
      this.updatePopoverPosition();
    }
  }

  constructor() {
    // Refresh the tag whenever the input username changes
    effect(() => {
      const currentUsername = this.username();
      this.tag.set(this.tagsService.getTag(currentUsername));
    });

    effect((onCleanup) => {
      if (!this.editing()) {
        return;
      }

      // Wait for the template to render, then move the overlay to the document root
      // so it is not trapped inside transformed or filtered containers like the sidebar.
      queueMicrotask(() => {
        this.moveOverlayToBody();
        this.updatePopoverPosition();

        const input = this.tagInput()?.nativeElement;
        if (input) {
          input.focus();
          input.select();
        }
      });

      onCleanup(() => {
        this.removeOverlayFromBody(this.popoverBackdrop()?.nativeElement);
        this.removeOverlayFromBody(this.popoverElement()?.nativeElement);
      });
    });
  }

  startEdit(event: Event, triggerElement?: HTMLElement): void {
    event.preventDefault();
    event.stopPropagation();
    this.editValue = this.tag()?.tag || '';
    this.editNotes = this.tag()?.notes || '';
    this.triggerRect = this.getTriggerRect(triggerElement ?? this.getTriggerElement(event));
    this.updatePopoverPosition();
    this.editing.set(true);
  }

  saveTag(): void {
    const trimmedValue = this.editValue.trim();
    const trimmedNotes = this.editNotes.trim() || undefined;
    const currentUsername = this.username();

    if (trimmedValue) {
      this.tagsService.setTag(currentUsername, trimmedValue, undefined, trimmedNotes);
      this.tag.set(this.tagsService.getTag(currentUsername));
    } else if (this.tag()) {
      // Empty tag deletes existing tag
      this.tagsService.removeTag(currentUsername);
      this.tag.set(undefined);
    }

    this.editing.set(false);
    this.editValue = '';
    this.editNotes = '';
  }

  removeTag(): void {
    this.tagsService.removeTag(this.username());
    this.tag.set(undefined);
    this.editing.set(false);
    this.editValue = '';
    this.editNotes = '';
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editValue = '';
    this.editNotes = '';
    this.triggerRect = null;
  }

  private getTriggerElement(event: Event): HTMLElement | null {
    return (event.currentTarget || event.target) as HTMLElement | null;
  }

  private getTriggerRect(
    element: HTMLElement | null,
  ): Pick<DOMRect, 'left' | 'top' | 'bottom'> | null {
    if (!element?.getBoundingClientRect) {
      return null;
    }

    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      bottom: rect.bottom,
    };
  }

  private moveOverlayToBody(): void {
    const body = this.document.body;
    const backdrop = this.popoverBackdrop()?.nativeElement;
    const popover = this.popoverElement()?.nativeElement;

    if (!body || !backdrop || !popover) {
      return;
    }

    if (backdrop.parentElement !== body) {
      body.appendChild(backdrop);
    }
    if (popover.parentElement !== body) {
      body.appendChild(popover);
    }
  }

  private removeOverlayFromBody(element: HTMLElement | undefined): void {
    if (element?.parentElement === this.document.body) {
      element.remove();
    }
  }

  private updatePopoverPosition(): void {
    const rect = this.triggerRect;
    if (!rect) {
      return;
    }

    const popoverRect = this.popoverElement()?.nativeElement.getBoundingClientRect();
    const popoverWidth = popoverRect?.width || 256;
    const popoverHeight = popoverRect?.height || 150;
    const viewportPadding = 16;
    const offset = 8;

    let top = rect.bottom + offset;
    let left = rect.left;

    // Viewport-aware: keep popover within visible area
    if (left + popoverWidth > window.innerWidth - viewportPadding) {
      left = window.innerWidth - popoverWidth - viewportPadding;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }
    if (top + popoverHeight > window.innerHeight - viewportPadding) {
      top = rect.top - popoverHeight - offset;
    }
    if (top < viewportPadding) {
      top = viewportPadding;
    }

    this.popoverTop.set(top);
    this.popoverLeft.set(left);
  }
}
