// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, LocationStrategy } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HNItem } from '../../models/hn';
import { VisitedService } from '../../services/visited.service';
import { formatRelativeTimeFromSeconds } from '../../services/relative-time.util';
import { StoryThumbnailComponent } from '../shared/story-thumbnail/story-thumbnail.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { VisitedIndicatorComponent } from '../shared/visited-indicator/visited-indicator.component';
import { UserSettingsService } from '../../services/user-settings.service';

@Component({
  selector: 'app-story-item',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StoryThumbnailComponent,
    UserTagComponent,
    FontAwesomeModule,
    VisitedIndicatorComponent,
  ],
  templateUrl: './story-item.html',
  styles: [
    `
      @reference '../../../styles.css';

      /* Story Item Card */
      .story-card {
        @apply relative flex flex-col sm:flex-row border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md dark:shadow-md dark:hover:shadow-lg mb-3 overflow-hidden;
        @apply bg-gradient-to-b from-white to-gray-300/30;
        @apply dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-700/40;
        transition: all 0.2s ease;
      }

      .story-card:hover {
        @apply bg-gradient-to-b from-white to-gray-300/10;
        @apply dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-700/60;
      }

      .story-card-selected {
        @apply ring-2 ring-blue-500 dark:ring-blue-400 border-blue-500 dark:border-blue-400;
        @apply bg-gradient-to-b from-blue-50 to-blue-100/50;
        @apply dark:bg-gradient-to-b dark:from-blue-900/30 dark:to-slate-800/90;
      }

      /* Vote Sections */
      .vote-section {
        @apply flex items-center justify-center px-4 py-3 bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-gradient-to-b dark:from-digg-blue-dark dark:to-digg-blue rounded-l-lg w-[100px] flex-shrink-0;
        @screen md {
          width: 72px;
          min-width: 72px;
          max-width: 72px;
          padding-left: 2px;
          padding-right: 2px;
        }
      }
      .vote-section-mobile {
        @apply flex items-center justify-start px-3 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:bg-gradient-to-r dark:from-digg-blue-dark dark:to-digg-blue rounded-t-lg w-full overflow-hidden;
      }
      .vote-button {
        @apply hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1;
      }
      .vote-button-active {
        @apply text-blue-600 dark:text-blue-400;
      }
      .vote-button-voted {
        @apply text-gray-400 dark:text-gray-400 opacity-50;
      }
      .vote-count {
        @apply font-bold;
      }
      .vote-count-active {
        @apply text-blue-600 dark:text-blue-400;
      }
      .vote-count-voted {
        @apply text-gray-500 dark:text-gray-400;
      }

      /* Content */
      .story-content {
        @apply flex-1 p-3 min-w-0 overflow-hidden relative;
      }

      .story-content::before {
        content: '';
        @apply absolute inset-0 pointer-events-none rounded-r-lg;
        @apply bg-gradient-to-r from-transparent via-transparent to-gray-50/20;
        @apply dark:bg-gradient-to-r dark:from-transparent dark:via-transparent dark:to-slate-700/20;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .story-card:hover .story-content::before {
        opacity: 1;
      }

      .story-title {
        @apply text-base sm:text-lg font-semibold mb-1 break-words;
      }
      .story-title-unread {
        @apply text-gray-900 dark:text-gray-100;
      }
      .story-title-visited {
        @apply text-gray-800 dark:text-gray-200;
      }
      .story-title-link {
        @apply hover:text-blue-600 dark:hover:text-blue-400 transition-colors;
      }
      .story-desc {
        @apply hidden sm:block text-sm mt-1 truncate text-gray-600 dark:text-gray-300;
      }

      /* Meta */
      .story-meta {
        @apply flex flex-nowrap items-center gap-2 whitespace-nowrap leading-none text-xs sm:text-sm text-gray-600 dark:text-gray-400;
      }
      .story-points {
        @apply font-medium;
      }
      .story-points-high {
        @apply text-orange-600 dark:text-orange-400;
      }
      .story-author {
        @apply font-medium hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors;
      }
      .author-link {
        @apply text-blue-600 dark:text-blue-300 hover:underline cursor-pointer;
      }
      .story-time {
        @apply text-gray-500 dark:text-gray-400;
      }
      .story-comments {
        @apply inline-flex items-center text-blue-600 dark:text-blue-300 hover:underline cursor-pointer transition-colors;
      }

      .story-meta app-user-tag {
        display: inline-flex;
        align-items: center;
      }
      .new-comments-badge {
        @apply text-gray-500 dark:text-gray-400 text-xs ml-1;
      }
      .story-domain {
        @apply text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-[200px];
      }
      .domain-btn {
        @apply inline-block text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline cursor-pointer break-all;
      }

      /* Actions */
      .story-actions-btn {
        @apply p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }
      .story-actions-menu {
        @apply w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg dark:shadow-2xl border border-gray-200 dark:border-slate-700 z-20;
      }
      .story-actions-menu-fixed {
        @apply fixed;
      }
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

      /* Indicators & tags */
      .story-tag {
        @apply px-2 py-0.5 text-xs text-white rounded-full;
      }
    `,
  ],
})
export class StoryItem {
  @Input() story?: HNItem;
  @Input() index = 0;
  @Input() isSelected = false;
  @Input() loading = false;

  private votedItems = signal<Set<number>>(new Set());
  private router = inject(Router);
  private visitedService = inject(VisitedService);
  private sidebarService = inject(SidebarService);
  public deviceService = inject(DeviceService);
  private locationStrategy = inject(LocationStrategy);
  private userSettings = inject(UserSettingsService);

  // Computed property to safely determine loading state
  isLoading = computed(() => this.loading || !this.story);

  // FontAwesome icons
  faEllipsisVertical = faEllipsisVertical;

  constructor() {
    // Load voted items from localStorage
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('votedItems');
      if (stored) {
        this.votedItems.set(new Set(JSON.parse(stored)));
      }
    }
  }

  hasVoted = computed(() => (this.story ? this.votedItems().has(this.story.id) : false));

  getDomain(url?: string): string {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return '';
    }
  }

  getTimeAgo(timestamp: number): string {
    return formatRelativeTimeFromSeconds(timestamp);
  }

  upvote(): void {
    if (this.hasVoted() || !this.story) return;

    const newVoted = new Set(this.votedItems());
    newVoted.add(this.story.id);
    this.votedItems.set(newVoted);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('votedItems', JSON.stringify(Array.from(newVoted)));
    }
  }

  isTextPost(): boolean {
    // Check if it's an Ask HN, Tell HN, or other text-only post
    const title = this.story?.title || '';
    return (
      !this.story?.url ||
      title.startsWith('Ask HN:') ||
      title.startsWith('Tell HN:') ||
      (title.startsWith('Show HN:') && !this.story?.url)
    );
  }

  searchByDomain(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.story) return;

    const domain = this.getDomain(this.story.url);
    if (domain) {
      this.router.navigate(['/search'], {
        queryParams: { q: `site:${domain}` },
      });
    }
  }

  showActionsMenu = false;
  copiedStory = false;
  copiedComments = false;

  @ViewChild('actionsBtn') actionsBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('actionsMenu') actionsMenu?: ElementRef<HTMLDivElement>;
  actionsMenuTop = 0;
  actionsMenuLeft = 0;

  canUseWebShare = computed(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return 'share' in window.navigator && typeof window.navigator.share === 'function';
  });

  openCommentsInSidebar = computed(() => this.userSettings.settings().openCommentsInSidebar);

  getStoryActionText = computed(() => {
    if (this.copiedStory) return '✓ Copied!';
    return this.canUseWebShare() ? 'Share Story' : 'Copy Story Link';
  });

  getCommentsActionText = computed(() => {
    if (this.copiedComments) return '✓ Copied!';
    return this.canUseWebShare() ? 'Share Comments' : 'Copy Comments Link';
  });

  hasNewComments(): boolean {
    return this.story
      ? this.visitedService.hasNewComments(this.story.id, this.story.descendants || 0)
      : false;
  }

  getNewCommentCount(): number {
    return this.story
      ? this.visitedService.getNewCommentCount(this.story.id, this.story.descendants || 0)
      : 0;
  }

  markAsVisited(): void {
    if (this.story) {
      this.visitedService.markAsVisited(this.story.id, this.story.descendants);
    }
  }

  toggleActionsMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showActionsMenu = !this.showActionsMenu;

    // Close menu when clicking outside
    if (this.showActionsMenu) {
      // Position the menu using viewport coordinates to avoid clipping
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
        const desiredLeft = rect.right - menuWidth; // right-align to button
        this.actionsMenuLeft = Math.max(minLeft, Math.min(maxLeft, desiredLeft));
        const maxTop = window.innerHeight - menuHeight - viewportPadding;
        const desiredTop = rect.bottom + viewportPadding;
        this.actionsMenuTop = Math.max(viewportPadding, Math.min(maxTop, desiredTop));
      }, 0);

      window.setTimeout(() => {
        const closeMenu = (e: MouseEvent) => {
          if (!(e.target as HTMLElement).closest('.story-actions-container')) {
            this.showActionsMenu = false;
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
  }

  async shareStory(): Promise<void> {
    if (!this.story) return;

    const url = this.story.url || `https://news.ycombinator.com/item?id=${this.story.id}`;
    const shareData = {
      title: this.story.title,
      url: url,
    };

    // Try Web Share API first
    if (typeof window !== 'undefined' && window.navigator.share && this.canShare(shareData)) {
      try {
        await window.navigator.share(shareData);
        this.showActionsMenu = false;
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name !== 'AbortError') {
          console.log('Share failed, falling back to clipboard');
        }
      }
    }

    // Fallback to clipboard
    if (typeof window === 'undefined' || !window.navigator.clipboard) {
      console.error('Clipboard API not available');
      return;
    }

    window.navigator.clipboard
      .writeText(url)
      .then(() => {
        this.copiedStory = true;
        this.copiedComments = false;
        window.setTimeout(() => {
          this.copiedStory = false;
          this.showActionsMenu = false;
        }, 1500);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }

  async shareComments(): Promise<void> {
    if (!this.story) return;

    if (typeof window === 'undefined') {
      return;
    }

    const url = `${window.location.origin}/item/${this.story.id}`;
    const shareData = {
      title: `${this.story.title} - Comments`,
      text: `Discussion on HNews`,
      url: url,
    };

    // Try Web Share API first
    if (window.navigator.share && this.canShare(shareData)) {
      try {
        await window.navigator.share(shareData);
        this.showActionsMenu = false;
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name !== 'AbortError') {
          console.log('Share failed, falling back to clipboard');
        }
      }
    }

    // Fallback to clipboard
    if (!window.navigator.clipboard) {
      console.error('Clipboard API not available');
      return;
    }

    window.navigator.clipboard
      .writeText(url)
      .then(() => {
        this.copiedComments = true;
        this.copiedStory = false;
        window.setTimeout(() => {
          this.copiedComments = false;
          this.showActionsMenu = false;
        }, 1500);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }

  openCommentsInNewTab(): void {
    if (!this.story) return;

    const path = this.locationStrategy.prepareExternalUrl(`/item/${this.story.id}`);
    const url = `${window.location.origin}${path}`;
    window.open(url, '_blank');
    this.showActionsMenu = false;
  }

  getItemLink(): string {
    if (!this.story) {
      return this.locationStrategy.prepareExternalUrl('/item');
    }
    return this.locationStrategy.prepareExternalUrl(`/item/${this.story.id}`);
  }

  private canShare(data: ShareData): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const nav = window.navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (typeof nav.canShare === 'function') {
      return nav.canShare(data);
    }
    return true;
  }

  openComments(event: MouseEvent | KeyboardEvent): void {
    if (!this.story) return;

    this.markAsVisited();

    const shouldUseSidebar = this.deviceService.isDesktop() && this.openCommentsInSidebar();

    if (!shouldUseSidebar) {
      if (this.sidebarService.isOpen()) {
        this.sidebarService.closeSidebar();
      }
      return;
    }

    if (event instanceof MouseEvent) {
      const isShiftClick = event.shiftKey;
      const isCmdClick = event.metaKey;
      const isCtrlClick = event.ctrlKey;
      // For auxclick events (non-primary mouse buttons), always allow default navigation
      const isAuxClick = event.type === 'auxclick';
      const isMiddleClick = event.button === 1;

      if (isShiftClick || isCmdClick || isCtrlClick || isMiddleClick || isAuxClick) {
        return;
      }
    }

    event.preventDefault();
    if ('stopImmediatePropagation' in event) {
      (event as MouseEvent).stopImmediatePropagation();
    }
    event.stopPropagation();
    this.sidebarService.toggleSidebar(this.story.id);
  }

  getCommentTooltip(): string {
    if (!this.deviceService.shouldShowKeyboardHints()) {
      return 'View Comments';
    }
    return `View Comments (${this.deviceService.getModifierKey()}+Click for New Tab)`;
  }

  isVisited(): boolean {
    return this.story ? this.visitedService.isVisited(this.story.id) : false;
  }
}
