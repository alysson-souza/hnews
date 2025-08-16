// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HackernewsService, HNItem } from '../../services/hackernews.service';
import { UserTagComponent } from '../user-tag/user-tag.component';

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [CommonModule, CommentThread, UserTagComponent],
  templateUrl: './comment-thread.html',
  styleUrl: './comment-thread.css',
})
export class CommentThread implements OnInit {
  @Input({ required: true }) commentId!: number;
  @Input() depth = 0;
  @Input() lazyLoad = false;

  // Auto-collapse threshold
  private readonly autoCollapseThreshold = 10;

  private hnService = inject(HackernewsService);

  comment = signal<HNItem | null>(null);
  replies = signal<HNItem[]>([]);
  isCollapsed = signal(false);
  loading = signal(true);
  votedComments = signal<Set<number>>(new Set());

  // Reply loading state
  repliesLoaded = signal(false);
  loadingReplies = signal(false);

  // Lazy loading state
  commentLoaded = signal(false);

  private currentPage = signal(0);
  readonly pageSize = 10;
  hasMoreReplies = signal(false);
  loadingMore = signal(false);
  allKidsIds: number[] = [];

  constructor() {
    // Load voted comments from localStorage
    const stored = localStorage.getItem('votedComments');
    if (stored) {
      this.votedComments.set(new Set(JSON.parse(stored)));
    }
  }

  hasVoted = computed(() => this.votedComments().has(this.comment()?.id || 0));

  // Auto-collapse logic
  shouldAutoCollapse = computed(() => {
    const comment = this.comment();
    return comment?.kids && comment.kids.length >= this.autoCollapseThreshold;
  });

  totalRepliesCount = computed(() => {
    return this.comment()?.kids?.length || 0;
  });

  showExpandButton = computed(() => {
    return this.totalRepliesCount() > 0 && !this.repliesLoaded();
  });

  showLoadButton = computed(() => {
    return this.lazyLoad && !this.commentLoaded();
  });

  get currentPageValue() {
    return this.currentPage();
  }

  get remainingRepliesCount() {
    const remaining = this.allKidsIds.length - (this.currentPage() + 1) * this.pageSize;
    return Math.min(this.pageSize, remaining);
  }

  ngOnInit() {
    if (!this.lazyLoad) {
      this.loadComment();
    } else {
      this.loading.set(false);
    }
  }

  loadComment() {
    this.loading.set(true);

    this.hnService.getItem(this.commentId).subscribe({
      next: (item) => {
        if (item && !item.deleted) {
          this.comment.set(item);
          this.commentLoaded.set(true);

          // Set up kids array but don't auto-load if should collapse
          if (item.kids && item.kids.length > 0) {
            this.allKidsIds = item.kids;
            this.hasMoreReplies.set(item.kids.length > this.pageSize);

            // Always finish loading the parent first
            this.loading.set(false);

            // Only auto-load replies if comment shouldn't be collapsed
            if (!this.shouldAutoCollapse()) {
              // Small delay to let parent render first
              setTimeout(() => this.loadRepliesPage(0), 50);
            }
          } else {
            this.loading.set(false);
          }
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadRepliesPage(page: number) {
    if (page === 0) {
      this.loadingReplies.set(true);
    } else {
      this.loadingMore.set(true);
    }

    this.hnService.getItemsPage(this.allKidsIds, page, this.pageSize).subscribe({
      next: (items) => {
        const validReplies = items.filter((item) => item !== null && !item.deleted) as HNItem[];

        if (page === 0) {
          this.replies.set(validReplies);
          this.repliesLoaded.set(true);
        } else {
          this.replies.update((current) => [...current, ...validReplies]);
        }

        this.currentPage.set(page);

        const totalLoaded = (page + 1) * this.pageSize;
        this.hasMoreReplies.set(totalLoaded < this.allKidsIds.length);

        this.loadingReplies.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingReplies.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  loadMoreReplies() {
    if (!this.loadingMore() && this.hasMoreReplies()) {
      const nextPage = this.currentPage() + 1;
      this.loadRepliesPage(nextPage);
    }
  }

  expandReplies() {
    if (!this.repliesLoaded() && !this.loadingReplies()) {
      this.loadRepliesPage(0);
    }
  }

  toggleCollapse() {
    this.isCollapsed.update((v) => !v);
  }

  upvoteComment() {
    if (this.hasVoted() || !this.comment()) return;

    const newVoted = new Set(this.votedComments());
    newVoted.add(this.comment()!.id);
    this.votedComments.set(newVoted);

    // Save to localStorage
    localStorage.setItem('votedComments', JSON.stringify(Array.from(newVoted)));
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

  getIndentClass(): string {
    // Apply appropriate indentation based on depth
    const indentLevel = Math.min(this.depth, 8); // Cap at 8 levels
    return `ml-${indentLevel * 4}`;
  }
}
