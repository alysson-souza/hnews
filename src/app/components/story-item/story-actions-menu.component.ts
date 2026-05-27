// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { LocationStrategy } from '@angular/common';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { solarMenuDotsLinear } from '@ng-icons/solar-icons/linear';
import { HNItem } from '@models/hn';
import { StoryArchiveService } from '@services/story-archive.service';
import { StoryShareService } from '@services/story-share.service';

@Component({
  selector: 'app-story-actions-menu',
  imports: [NgIconComponent],
  viewProviders: [provideIcons({ solarMenuDotsLinear })],
  template: `
    <div class="story-actions-container">
      <button
        #actionsBtn
        tabindex="0"
        class="story-actions-btn"
        (click)="toggleMenu($event)"
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
            (click)="shareStory()"
          >
            {{ shareStoryText() }}
          </button>
          <button
            class="story-actions-item"
            role="menuitem"
            [attr.data-index]="1"
            (click)="shareComments()"
          >
            {{ shareCommentsText() }}
          </button>
          <div class="story-actions-divider"></div>
          @if (showArchiveAction()) {
            <button
              class="story-actions-item"
              role="menuitem"
              [attr.data-index]="2"
              (click)="openStoryInArchive()"
            >
              Open in Internet Archive
            </button>
          }
          <button
            class="story-actions-item story-actions-item-bottom"
            role="menuitem"
            [attr.data-index]="showArchiveAction() ? 3 : 2"
            (click)="openCommentsInNewTab()"
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
        @apply p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2;
      }

      /* Actions Menu */
      .story-actions-menu {
        @apply w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-2xl border border-gray-200 dark:border-slate-700;
        z-index: 70;
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
export class StoryActionsMenuComponent {
  readonly story = input.required<HNItem>();

  private locationStrategy = inject(LocationStrategy);
  private shareService = inject(StoryShareService);
  private storyArchive = inject(StoryArchiveService);

  readonly shareStoryText = this.shareService.getStoryActionText;
  readonly shareCommentsText = this.shareService.getCommentsActionText;
  readonly archiveUrl = computed(() => this.storyArchive.getArchiveUrl(this.story()));
  readonly showArchiveAction = computed(() => this.archiveUrl() !== null);

  readonly actionsBtn = viewChild<ElementRef<HTMLButtonElement>>('actionsBtn');
  readonly actionsMenu = viewChild<ElementRef<HTMLDivElement>>('actionsMenu');

  isOpen = signal(false);
  menuTop = signal(0);
  menuLeft = signal(0);
  activeIndex = signal(0);

  readonly buttonId = computed(() => `actions-btn-${this.story().id}`);
  readonly menuId = computed(() => `actions-menu-${this.story().id}`);

  toggleMenu(event: Event): void {
    event.preventDefault();
    if ('stopPropagation' in event) {
      event.stopPropagation();
    }
    const newState = !this.isOpen();

    if (newState) {
      this.isOpen.set(true);
      this.positionMenu();
      this.setupClickOutside();
      setTimeout(() => this.focusFirstItem(), 0);
    } else {
      this.closeMenu();
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
      const fixedOrigin = this.getFixedPositionOrigin(menu);
      const viewportPadding = 8;
      const menuWidth = menu?.offsetWidth ?? 256;
      const menuHeight = menu?.offsetHeight ?? 0;
      const maxLeft = window.innerWidth - menuWidth - viewportPadding;
      const minLeft = viewportPadding;
      const desiredLeft = rect.right - menuWidth;
      const viewportLeft = Math.max(minLeft, Math.min(maxLeft, desiredLeft));

      const maxTop = window.innerHeight - menuHeight - viewportPadding;
      const desiredTop = rect.bottom + viewportPadding;
      const viewportTop = Math.max(viewportPadding, Math.min(maxTop, desiredTop));

      this.menuLeft.set(viewportLeft - fixedOrigin.left);
      this.menuTop.set(viewportTop - fixedOrigin.top);
    }, 0);
  }

  private getFixedPositionOrigin(menu: HTMLDivElement | undefined): { left: number; top: number } {
    if (!menu) {
      return { left: 0, top: 0 };
    }

    const previousLeft = menu.style.left;
    const previousTop = menu.style.top;
    menu.style.left = '0px';
    menu.style.top = '0px';
    const rect = menu.getBoundingClientRect();
    menu.style.left = previousLeft;
    menu.style.top = previousTop;

    return { left: rect.left, top: rect.top };
  }

  private setupClickOutside(): void {
    window.setTimeout(() => {
      const closeMenu = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('.story-actions-container')) {
          if (typeof window !== 'undefined') {
            window.document.removeEventListener('click', closeMenu);
          }
          this.closeMenu();
        }
      };
      if (typeof window !== 'undefined') {
        window.document.addEventListener('click', closeMenu);
      }
    }, 0);
  }

  closeMenu(): void {
    this.isOpen.set(false);
    this.focusStoryCard();
  }

  async shareStory(): Promise<void> {
    try {
      await this.shareService.shareStory(this.story());
    } finally {
      this.closeMenu();
    }
  }

  async shareComments(): Promise<void> {
    try {
      await this.shareService.shareComments(this.story());
    } finally {
      this.closeMenu();
    }
  }

  openCommentsInNewTab(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const path = this.locationStrategy.prepareExternalUrl(`/item/${this.story().id}`);
    const url = `${window.location.origin}${path}`;
    window.open(url, '_blank');
    this.closeMenu();
  }

  openStoryInArchive(): void {
    const archiveUrl = this.archiveUrl();
    if (!archiveUrl || typeof window === 'undefined') {
      return;
    }

    window.open(archiveUrl, '_blank', 'noopener,noreferrer');
    this.closeMenu();
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

  private focusStoryCard(): void {
    const storyItem = this.actionsBtn()?.nativeElement.closest('app-story-item');
    const storyCard = storyItem?.querySelector('article.story-card') as HTMLElement | null;
    if (storyCard) {
      storyCard.focus();
      return;
    }

    this.actionsBtn()?.nativeElement.focus();
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
