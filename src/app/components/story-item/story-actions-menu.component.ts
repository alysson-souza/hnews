// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, ElementRef, signal, OnInit, output, input, viewChild } from '@angular/core';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarMenuDotsLinear } from '@ng-icons/solar-icons/linear';

@Component({
  selector: 'app-story-actions-menu',
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ solarMenuDotsLinear })],
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
        <ng-icon name="solarMenuDotsLinear" class="text-[16px] sm:text-[20px]" />
      </button>

      @if (isOpen()) {
        <div
          #actionsMenu
          class="story-actions-menu story-actions-menu-fixed"
          role="menu"
          (keydown)="onMenuKeydown($event)"
          [attr.id]="menuId()"
          [attr.aria-labelledby]="buttonId()"
          [attr.data-testid]="'story-actions-menu'"
          tabindex="-1"
          [style.top.px]="menuTop()"
          [style.left.px]="menuLeft()"
        >
          <button
            class="story-actions-item story-actions-item-top"
            role="menuitem"
            [attr.data-index]="0"
            (click)="shareStory.emit()"
            (keyup.enter)="shareStory.emit()"
            (keyup.space)="shareStory.emit()"
          >
            {{ shareStoryText() }}
          </button>
          <button
            class="story-actions-item"
            role="menuitem"
            [attr.data-index]="1"
            (click)="shareComments.emit()"
            (keyup.enter)="shareComments.emit()"
            (keyup.space)="shareComments.emit()"
          >
            {{ shareCommentsText() }}
          </button>
          <div class="story-actions-divider"></div>
          <button
            class="story-actions-item story-actions-item-bottom"
            role="menuitem"
            [attr.data-index]="2"
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
        @apply w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-2xl border border-gray-200 dark:border-slate-700 z-50;
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
  readonly storyId = input(0);
  readonly shareStoryText = input('Copy Story Link');
  readonly shareCommentsText = input('Copy Comments Link');

  readonly shareStory = output<void>();
  readonly shareComments = output<void>();
  readonly openInNewTab = output<void>();

  readonly actionsBtn = viewChild<ElementRef<HTMLButtonElement>>('actionsBtn');
  readonly actionsMenu = viewChild<ElementRef<HTMLDivElement>>('actionsMenu');

  isOpen = signal(false);
  menuTop = signal(0);
  menuLeft = signal(0);
  activeIndex = signal(0);

  buttonId = signal('');
  menuId = signal('');

  ngOnInit(): void {
    this.updateIds();
  }

  private updateIds(): void {
    const storyId = this.storyId();
    this.buttonId.set(`actions-btn-${storyId}`);
    this.menuId.set(`actions-menu-${storyId}`);
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
      this.focusFirstItem();
    }
  }

  private positionMenu(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.setTimeout(() => {
      const btn = this.actionsBtn()?.nativeElement;
      const menu = this.actionsMenu()?.nativeElement;
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
          // Restore focus to the actions button for continuity
          this.actionsBtn()?.nativeElement?.focus();
        }
      };
      if (typeof window !== 'undefined') {
        window.document.addEventListener('click', closeMenu);
      }
    }, 0);
  }

  closeMenu(): void {
    this.isOpen.set(false);
    // Restore focus to the toggle button
    this.actionsBtn()?.nativeElement?.focus();
  }

  // =============================
  // Keyboard Navigation
  // =============================

  private getMenuItems(): HTMLElement[] {
    const menu = this.actionsMenu()?.nativeElement;
    if (!menu) return [];
    return Array.from(menu.querySelectorAll('.story-actions-item')) as HTMLElement[];
  }

  private focusFirstItem(): void {
    this.activeIndex.set(0);
    this.focusActiveItem();
  }

  private focusActiveItem(): void {
    const items = this.getMenuItems();
    const index = this.activeIndex();
    if (items[index]) {
      items[index].focus();
    }
  }

  private moveFocus(delta: number): void {
    const items = this.getMenuItems();
    if (items.length === 0) return;
    const current = this.activeIndex();
    const next = (current + delta + items.length) % items.length;
    this.activeIndex.set(next);
    this.focusActiveItem();
  }

  private moveToEdge(edge: 'first' | 'last'): void {
    const items = this.getMenuItems();
    if (items.length === 0) return;
    this.activeIndex.set(edge === 'first' ? 0 : items.length - 1);
    this.focusActiveItem();
  }

  onMenuKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const navigationKeys = [
      'ArrowDown',
      'ArrowUp',
      'Home',
      'End',
      'Escape',
      'Enter',
      ' ',
      'j',
      'k',
    ];
    if (!navigationKeys.includes(key)) return; // Ignore other keys

    // Prevent global handlers
    event.preventDefault();
    event.stopPropagation();

    switch (key) {
      case 'ArrowDown':
      case 'j':
        this.moveFocus(1);
        break;
      case 'ArrowUp':
      case 'k':
        this.moveFocus(-1);
        break;
      case 'Home':
        this.moveToEdge('first');
        break;
      case 'End':
        this.moveToEdge('last');
        break;
      case 'Escape':
        this.closeMenu();
        break;
      case 'Enter':
      case ' ': {
        const items = this.getMenuItems();
        const index = this.activeIndex();
        if (items[index]) {
          // Trigger click programmatically
          items[index].click();
        }
        break;
      }
    }
  }
}
