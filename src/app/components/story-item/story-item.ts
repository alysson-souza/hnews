// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HNItem } from '../../services/hackernews.service';
import { OpenGraphService, OpenGraphData } from '../../services/opengraph.service';
import { VisitedService } from '../../services/visited.service';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { StoryThumbnailComponent } from '../shared/story-thumbnail/story-thumbnail.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-story-item',
  standalone: true,
  imports: [CommonModule, RouterLink, UserTagComponent, StoryThumbnailComponent],
  templateUrl: './story-item.html',
  styleUrl: './story-item.css',
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
      setTimeout(() => {
        const closeMenu = (e: MouseEvent) => {
          if (!(e.target as HTMLElement).closest('.relative')) {
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
      window.open(`/item/${this.story.id}`, '_blank');
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
