// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-story-actions-menu',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="story-actions-container">
      <button
        #actionsBtn
        class="story-actions-btn"
        (click)="toggleMenu($event)"
        (keyup.enter)="toggleMenu($event)"
        (keyup.space)="toggleMenu($event)"
        [attr.aria-label]="'Actions for story'"
        [attr.aria-haspopup]="'menu'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="menuId()"
        [attr.id]="buttonId()"
        [title]="'More Actions'"
      >
        <fa-icon [icon]="faEllipsisVertical" class="text-[16px] sm:text-[20px]"></fa-icon>
      </button>

      @if (isOpen()) {
        <div
          #actionsMenu
          class="story-actions-menu story-actions-menu-fixed"
          role="menu"
          [attr.id]="menuId()"
          [attr.aria-labelledby]="buttonId()"
          [style.top.px]="menuTop()"
          [style.left.px]="menuLeft()"
        >
          <button
            class="story-actions-item story-actions-item-top"
            role="menuitem"
            (click)="shareStory.emit()"
            (keyup.enter)="shareStory.emit()"
            (keyup.space)="shareStory.emit()"
          >
            {{ shareStoryText }}
          </button>
          <button
            class="story-actions-item"
            role="menuitem"
            (click)="shareComments.emit()"
            (keyup.enter)="shareComments.emit()"
            (keyup.space)="shareComments.emit()"
          >
            {{ shareCommentsText }}
          </button>
          <div class="story-actions-divider"></div>
          <button
            class="story-actions-item story-actions-item-bottom"
            role="menuitem"
            (click)="openInNewTab.emit()"
            (keyup.enter)="openInNewTab.emit()"
            (keyup.space)="openInNewTab.emit()"
          >
            Open Comments in New Tab
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .story-actions-container {
        position: relative;
      }

      /* Actions Button */
      .story-actions-btn {
        @apply p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }

      /* Actions Menu */
      .story-actions-menu {
        @apply w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-2xl border border-gray-200 dark:border-slate-700 z-20;
      }
      .story-actions-menu-fixed {
        @apply fixed;
      }

      /* Menu Items */
      .story-actions-item {
        @apply w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500;
      }
      .story-actions-item-top {
        @apply rounded-t-lg;
      }
      .story-actions-divider {
        @apply border-t border-gray-200 dark:border-slate-700;
      }
      .story-actions-item-bottom {
        @apply rounded-b-lg;
      }
    `,
  ],
})
export class StoryActionsMenuComponent implements OnInit {
  @Input() storyId = 0;
  @Input() shareStoryText = 'Copy Story Link';
  @Input() shareCommentsText = 'Copy Comments Link';

  @Output() shareStory = new EventEmitter<void>();
  @Output() shareComments = new EventEmitter<void>();
  @Output() openInNewTab = new EventEmitter<void>();

  @ViewChild('actionsBtn') actionsBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('actionsMenu') actionsMenu?: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  menuTop = signal(0);
  menuLeft = signal(0);

  buttonId = signal('');
  menuId = signal('');

  faEllipsisVertical = faEllipsisVertical;

  ngOnInit(): void {
    this.updateIds();
  }

  private updateIds(): void {
    this.buttonId.set(`actions-btn-${this.storyId}`);
    this.menuId.set(`actions-menu-${this.storyId}`);
  }

  toggleMenu(event: Event): void {
    event.preventDefault();
    if ('stopPropagation' in event) {
      event.stopPropagation();
    }
    const newState = !this.isOpen();
    this.isOpen.set(newState);

    if (newState) {
      this.positionMenu();
      this.setupClickOutside();
    }
  }

  private positionMenu(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.setTimeout(() => {
      const btn = this.actionsBtn?.nativeElement;
      const menu = this.actionsMenu?.nativeElement;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const viewportPadding = 8;
      const menuWidth = menu?.offsetWidth ?? 256;
      const menuHeight = menu?.offsetHeight ?? 0;
      const maxLeft = window.innerWidth - menuWidth - viewportPadding;
      const minLeft = viewportPadding;
      const desiredLeft = rect.right - menuWidth;
      this.menuLeft.set(Math.max(minLeft, Math.min(maxLeft, desiredLeft)));

      const maxTop = window.innerHeight - menuHeight - viewportPadding;
      const desiredTop = rect.bottom + viewportPadding;
      this.menuTop.set(Math.max(viewportPadding, Math.min(maxTop, desiredTop)));
    }, 0);
  }

  private setupClickOutside(): void {
    window.setTimeout(() => {
      const closeMenu = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('.story-actions-container')) {
          this.isOpen.set(false);
          if (typeof window !== 'undefined') {
            window.document.removeEventListener('click', closeMenu);
          }
        }
      };
      if (typeof window !== 'undefined') {
        window.document.addEventListener('click', closeMenu);
      }
    }, 0);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }
}
