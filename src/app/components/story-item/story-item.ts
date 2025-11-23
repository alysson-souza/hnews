// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, inject, signal, computed, input, viewChild } from '@angular/core';
import { LocationStrategy, DecimalPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HNItem } from '../../models/hn';
import { VisitedService } from '../../services/visited.service';
import { formatRelativeTimeFromSeconds } from '../../services/relative-time.util';
import { StoryThumbnailComponent } from '../shared/story-thumbnail/story-thumbnail.component';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { UserTagComponent } from '../user-tag/user-tag.component';
import { UserSettingsService } from '../../services/user-settings.service';
import { StoryShareService } from '../../services/story-share.service';
import { getDomain } from '../../services/domain.utils';
import { StoryActionsMenuComponent } from './story-actions-menu.component';

@Component({
  selector: 'app-story-item',
  standalone: true,
  imports: [
    RouterLink,
    StoryThumbnailComponent,
    UserTagComponent,
    StoryActionsMenuComponent,
    DecimalPipe,
  ],
  templateUrl: './story-item.html',
  styleUrls: ['./story-item.css'],
})
export class StoryItem {
  @Input() set story(value: HNItem | undefined) {
    this._story = value;
    this.storyId.set(value?.id);
  }
  get story(): HNItem | undefined {
    return this._story;
  }
  private _story?: HNItem;
  readonly index = input(0);
  readonly isSelected = input(false);
  @Input() loading = false;

  private votedItems = signal<Set<number>>(new Set());
  private storyId = signal<number | undefined>(undefined);
  private router = inject(Router);
  private visitedService = inject(VisitedService);
  private sidebarService = inject(SidebarService);
  public deviceService = inject(DeviceService);
  private locationStrategy = inject(LocationStrategy);
  private userSettings = inject(UserSettingsService);
  private shareService = inject(StoryShareService);
  private static itemComponentPrefetched = false;

  // Computed property to safely determine loading state
  isLoading = computed(() => this.loading || !this.story);

  constructor() {
    StoryItem.prefetchItemComponent();
    // Load voted items from localStorage
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('votedItems');
      if (stored) {
        this.votedItems.set(new Set(JSON.parse(stored)));
      }
    }
  }

  hasVoted = computed(() => (this.storyId() ? this.votedItems().has(this.storyId()!) : false));

  // Expose getDomain utility for template
  getDomain = getDomain;

  private static async prefetchItemComponent(): Promise<void> {
    if (StoryItem.itemComponentPrefetched || typeof window === 'undefined') {
      return;
    }

    StoryItem.itemComponentPrefetched = true;
    try {
      await import('../../pages/item/item.component');
    } catch (error) {
      StoryItem.itemComponentPrefetched = false;
      console.warn('Failed to prefetch item component chunk', error);
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

  readonly actionsMenu = viewChild(StoryActionsMenuComponent);

  openCommentsInSidebar = computed(() => this.userSettings.settings().openCommentsInSidebar);

  canUseWebShare = computed(() => this.shareService.canUseWebShare());
  getStoryActionText = computed(() => this.shareService.getStoryActionText());
  getCommentsActionText = computed(() => this.shareService.getCommentsActionText());

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

  async shareStory(): Promise<void> {
    if (!this.story) return;
    await this.shareService.shareStory(this.story);
    this.actionsMenu()?.closeMenu();
  }

  async shareComments(): Promise<void> {
    if (!this.story) return;
    await this.shareService.shareComments(this.story);
    this.actionsMenu()?.closeMenu();
  }

  openCommentsInNewTab(): void {
    if (!this.story) return;

    const path = this.locationStrategy.prepareExternalUrl(`/item/${this.story.id}`);
    const url = `${window.location.origin}${path}`;
    window.open(url, '_blank');
    this.actionsMenu()?.closeMenu();
  }

  getItemLink(): string {
    if (!this.story) {
      return this.locationStrategy.prepareExternalUrl('/item');
    }
    return this.locationStrategy.prepareExternalUrl(`/item/${this.story.id}`);
  }

  openComments(event: MouseEvent | KeyboardEvent): void {
    if (!this.story) return;

    // Check for modifier keys FIRST, before any other code
    // This ensures we don't interfere with the browser's native Shift+click behavior
    if (event instanceof MouseEvent) {
      const isShiftClick = event.shiftKey;
      const isCmdClick = event.metaKey;
      const isCtrlClick = event.ctrlKey;
      // For auxclick events (non-primary mouse buttons), always allow default navigation
      const isAuxClick = event.type === 'auxclick';
      const isMiddleClick = event.button === 1;

      // Allow default navigation for modifier clicks - return immediately without any side effects
      if (isShiftClick || isCmdClick || isCtrlClick || isMiddleClick || isAuxClick) {
        return;
      }
    }

    // Only mark as visited for regular clicks (non-modifier)
    this.markAsVisited();

    const shouldUseSidebar = this.deviceService.isDesktop() && this.openCommentsInSidebar();

    if (!shouldUseSidebar) {
      if (this.sidebarService.isOpen()) {
        this.sidebarService.closeSidebar();
      }
      return;
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
