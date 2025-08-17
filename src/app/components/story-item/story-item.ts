// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  Component,
  Input,
  inject,
  signal,
  computed,
  OnInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule, LocationStrategy } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HNItem } from '../../services/hackernews.service';
import { OpenGraphService, OpenGraphData } from '../../services/opengraph.service';
import { VisitedService } from '../../services/visited.service';
import { StoryThumbnailComponent } from '../shared/story-thumbnail/story-thumbnail.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-story-item',
  standalone: true,
  imports: [CommonModule, RouterLink, StoryThumbnailComponent],
  templateUrl: './story-item.html',
  styles: [
    `
      @reference '../../../styles.css';

      /* Story Item Card */
      .story-card {
        @apply relative flex flex-col sm:flex-row bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-3 overflow-hidden;
      }

      /* Vote Sections */
      .vote-section {
        @apply flex items-center justify-center px-4 py-3 bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-gradient-to-b dark:from-digg-blue-dark dark:to-digg-blue rounded-l-lg w-[100px] flex-shrink-0;
      }
      .vote-section-mobile {
        @apply flex items-center justify-between px-3 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:bg-gradient-to-r dark:from-digg-blue-dark dark:to-digg-blue rounded-t-lg w-full overflow-hidden;
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
        @apply flex-1 p-3 min-w-0 overflow-hidden;
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
        @apply flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400;
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
        @apply text-blue-600 dark:text-blue-300 hover:underline cursor-pointer transition-colors;
      }
      .new-comments-badge {
        @apply text-gray-500 dark:text-gray-400 text-xs ml-1;
      }
      .story-domain {
        @apply text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-[200px];
      }
      .domain-btn {
        @apply inline-block text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline cursor-pointer break-all;
      }

      /* Share */
      .story-share-btn {
        @apply p-1 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500;
      }
      .story-share-menu {
        @apply w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-20;
      }
      .story-share-menu-fixed {
        @apply fixed;
      }
      .story-share-item {
        @apply w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500;
      }
      .story-share-item-top {
        @apply rounded-t-lg;
      }
      .story-share-item-bottom {
        @apply rounded-b-lg;
      }

      /* Indicators & tags */
      .visited-indicator {
        @apply absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-blue-600 dark:border-t-blue-500 border-l-[20px] border-l-transparent;
      }
      .story-tag {
        @apply px-2 py-0.5 text-xs text-white rounded-full;
      }
    `,
  ],
})
export class StoryItem implements OnInit {
  @Input({ required: true }) story!: HNItem;
  @Input() index = 0;
  @Input() ogData?: OpenGraphData;

  private votedItems = signal<Set<number>>(new Set());
  private ogService = inject(OpenGraphService);
  private router = inject(Router);
  private visitedService = inject(VisitedService);
  private sidebarService = inject(SidebarService);
  private deviceService = inject(DeviceService);
  private locationStrategy = inject(LocationStrategy);

  ogDataSignal = signal<OpenGraphData | null>(null);
  loadingOg = signal(true);

  constructor() {
    // Load voted items from localStorage
    const stored = localStorage.getItem('votedItems');
    if (stored) {
      this.votedItems.set(new Set(JSON.parse(stored)));
    }
  }

  ngOnInit() {
    // If OpenGraph data was provided as input, use it
    if (this.ogData) {
      this.ogDataSignal.set(this.ogData);
      this.loadingOg.set(false);
    }
    // Otherwise, fetch it individually (for direct navigation or sidebar)
    else if (this.story?.url && !this.isTextPost()) {
      this.loadingOg.set(true);
      this.ogService.getOpenGraphData(this.story.url).subscribe({
        next: (data) => {
          this.ogDataSignal.set(data);
          this.loadingOg.set(false);
        },
        error: () => {
          this.loadingOg.set(false);
        },
      });
    } else {
      this.loadingOg.set(false);
    }
  }

  hasVoted = computed(() => this.votedItems().has(this.story?.id || 0));

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
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }

  upvote(): void {
    if (this.hasVoted()) return;

    const newVoted = new Set(this.votedItems());
    newVoted.add(this.story.id);
    this.votedItems.set(newVoted);

    localStorage.setItem('votedItems', JSON.stringify(Array.from(newVoted)));
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
    const domain = this.getDomain(this.story.url);
    if (domain) {
      this.router.navigate(['/search'], {
        queryParams: { q: `site:${domain}` },
      });
    }
  }

  showShareMenu = false;
  copiedStory = false;
  copiedComments = false;

  @ViewChild('shareBtn') shareBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild('shareMenu') shareMenu?: ElementRef<HTMLDivElement>;
  shareMenuTop = 0;
  shareMenuLeft = 0;

  canUseWebShare = computed(() => {
    return 'share' in navigator && typeof navigator.share === 'function';
  });

  getStoryShareText = computed(() => {
    if (this.copiedStory) return '✓ Copied!';
    return this.canUseWebShare() ? 'Share Story' : 'Copy Story Link';
  });

  getCommentsShareText = computed(() => {
    if (this.copiedComments) return '✓ Copied!';
    return this.canUseWebShare() ? 'Share Comments' : 'Copy Comments Link';
  });

  isVisited(): boolean {
    return this.visitedService.isVisited(this.story.id);
  }

  hasNewComments(): boolean {
    return this.visitedService.hasNewComments(this.story.id, this.story.descendants || 0);
  }

  getNewCommentCount(): number {
    return this.visitedService.getNewCommentCount(this.story.id, this.story.descendants || 0);
  }

  markAsVisited(): void {
    this.visitedService.markAsVisited(this.story.id, this.story.descendants);
  }

  toggleShareMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showShareMenu = !this.showShareMenu;

    // Close menu when clicking outside
    if (this.showShareMenu) {
      // Position the menu using viewport coordinates to avoid clipping
      setTimeout(() => {
        const btn = this.shareBtn?.nativeElement;
        const menu = this.shareMenu?.nativeElement;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const viewportPadding = 8;
        const menuWidth = menu?.offsetWidth ?? 192;
        const menuHeight = menu?.offsetHeight ?? 0;
        const maxLeft = window.innerWidth - menuWidth - viewportPadding;
        const minLeft = viewportPadding;
        const desiredLeft = rect.right - menuWidth; // right-align to button
        this.shareMenuLeft = Math.max(minLeft, Math.min(maxLeft, desiredLeft));
        const maxTop = window.innerHeight - menuHeight - viewportPadding;
        const desiredTop = rect.bottom + viewportPadding;
        this.shareMenuTop = Math.max(viewportPadding, Math.min(maxTop, desiredTop));
      }, 0);

      setTimeout(() => {
        const closeMenu = (e: MouseEvent) => {
          if (!(e.target as HTMLElement).closest('.story-share-container')) {
            this.showShareMenu = false;
            document.removeEventListener('click', closeMenu);
          }
        };
        document.addEventListener('click', closeMenu);
      }, 0);
    }
  }

  async shareStory(): Promise<void> {
    const url = this.story.url || `https://news.ycombinator.com/item?id=${this.story.id}`;
    const shareData = {
      title: this.story.title,
      url: url,
    };

    // Try Web Share API first
    if (navigator.share && this.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        this.showShareMenu = false;
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name !== 'AbortError') {
          console.log('Share failed, falling back to clipboard');
        }
      }
    }

    // Fallback to clipboard
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.copiedStory = true;
        this.copiedComments = false;
        setTimeout(() => {
          this.copiedStory = false;
          this.showShareMenu = false;
        }, 1500);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }

  async shareComments(): Promise<void> {
    const url = `${window.location.origin}/item/${this.story.id}`;
    const shareData = {
      title: `${this.story.title} - Comments`,
      text: `Discussion on HNews`,
      url: url,
    };

    // Try Web Share API first
    if (navigator.share && this.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        this.showShareMenu = false;
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name !== 'AbortError') {
          console.log('Share failed, falling back to clipboard');
        }
      }
    }

    // Fallback to clipboard
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.copiedComments = true;
        this.copiedStory = false;
        setTimeout(() => {
          this.copiedComments = false;
          this.showShareMenu = false;
        }, 1500);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }

  private canShare(data: ShareData): boolean {
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (typeof nav.canShare === 'function') {
      return nav.canShare(data);
    }
    return true;
  }

  openComments(event: Event): void {
    if (!this.deviceService.isDesktop()) {
      // On mobile, navigate directly to item page
      this.router.navigate(['/item', this.story.id]);
      this.markAsVisited();
      return;
    }

    const isShiftClick = (event as MouseEvent).shiftKey;
    const isCmdClick = (event as MouseEvent).metaKey;
    const isCtrlClick = (event as MouseEvent).ctrlKey;

    if (isShiftClick || isCmdClick || isCtrlClick) {
      // Open in new window if modifier key is pressed
      // Use LocationStrategy to get the correct external URL with base href
      const path = this.locationStrategy.prepareExternalUrl(`/item/${this.story.id}`);
      const url = `${window.location.origin}${path}`;
      window.open(url, '_blank');
    } else {
      // Open sidebar on desktop
      event.preventDefault();
      this.sidebarService.toggleSidebar(this.story.id);
      this.markAsVisited();
    }
  }

  getCommentTooltip(): string {
    if (!this.deviceService.shouldShowKeyboardHints()) {
      return 'View comments';
    }
    return `View comments (${this.deviceService.getModifierKey()}+Click for new window)`;
  }
}
