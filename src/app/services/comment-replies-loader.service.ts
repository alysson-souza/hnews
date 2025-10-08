// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, signal } from '@angular/core';
import { HNItem } from '../models/hn';
import { HackernewsService } from './hackernews.service';

@Injectable()
export class CommentRepliesLoaderService {
  readonly pageSize = 10;

  private readonly hnService = inject(HackernewsService);

  private kidsIds: number[] = [];

  private readonly repliesState = signal<HNItem[]>([]);
  readonly replies = this.repliesState.asReadonly();

  private readonly repliesLoadedState = signal(false);
  readonly repliesLoaded = this.repliesLoadedState.asReadonly();

  private readonly loadingRepliesState = signal(false);
  readonly loadingReplies = this.loadingRepliesState.asReadonly();

  private readonly loadingMoreState = signal(false);
  readonly loadingMore = this.loadingMoreState.asReadonly();

  private readonly hasMoreState = signal(false);
  readonly hasMore = this.hasMoreState.asReadonly();

  private readonly currentPageState = signal(0);
  readonly currentPage = this.currentPageState.asReadonly();

  configureKids(ids: number[] | undefined) {
    this.kidsIds = Array.isArray(ids) ? ids : [];

    this.repliesState.set([]);
    this.repliesLoadedState.set(false);
    this.loadingRepliesState.set(false);
    this.loadingMoreState.set(false);
    this.currentPageState.set(0);
    this.hasMoreState.set(this.kidsIds.length > this.pageSize);
  }

  loadFirstPage() {
    if (this.loadingRepliesState() || this.repliesLoadedState()) {
      return;
    }

    if (this.kidsIds.length === 0) {
      this.repliesLoadedState.set(true);
      return;
    }

    this.loadPage(0);
  }

  loadNextPage() {
    if (this.loadingMoreState() || !this.hasMoreState() || !this.repliesLoadedState()) {
      return;
    }

    const nextPage = this.currentPageState() + 1;
    this.loadPage(nextPage);
  }

  /**
   * Load multiple pages up to targetPage (for state restoration).
   * @param targetPage - Zero-based page index to load up to
   * @param onComplete - Optional callback when all pages are loaded
   */
  loadUpToPage(targetPage: number, onComplete?: () => void) {
    if (targetPage < 0 || this.kidsIds.length === 0) {
      onComplete?.();
      return;
    }

    // Cap at available pages
    const maxPage = Math.floor((this.kidsIds.length - 1) / this.pageSize);
    const cappedTarget = Math.min(targetPage, maxPage);

    this.loadPagesSequentially(0, cappedTarget, onComplete);
  }

  remainingCount(): number {
    if (this.kidsIds.length === 0) {
      return 0;
    }

    const loaded = Math.max(0, (this.currentPageState() + 1) * this.pageSize);
    const remaining = this.kidsIds.length - loaded;
    return Math.max(0, Math.min(this.pageSize, remaining));
  }

  private loadPagesSequentially(currentPage: number, targetPage: number, onComplete?: () => void) {
    if (currentPage > targetPage) {
      onComplete?.();
      return;
    }

    this.loadPage(currentPage, () => {
      // Load next page after this one completes
      if (currentPage < targetPage) {
        this.loadPagesSequentially(currentPage + 1, targetPage, onComplete);
      } else {
        onComplete?.();
      }
    });
  }

  private loadPage(page: number, onComplete?: () => void) {
    if (this.kidsIds.length === 0) {
      this.loadingRepliesState.set(false);
      this.loadingMoreState.set(false);
      onComplete?.();
      return;
    }

    if (page === 0) {
      this.loadingRepliesState.set(true);
    } else {
      this.loadingMoreState.set(true);
    }

    this.hnService.getItemsPage(this.kidsIds, page, this.pageSize).subscribe({
      next: (items) => {
        const validReplies = items.filter((item): item is HNItem => item !== null && !item.deleted);

        if (page === 0) {
          this.repliesState.set(validReplies);
          this.repliesLoadedState.set(true);
        } else {
          this.repliesState.update((current) => [...current, ...validReplies]);
        }

        this.currentPageState.set(page);
        const totalLoaded = (page + 1) * this.pageSize;
        this.hasMoreState.set(totalLoaded < this.kidsIds.length);

        this.loadingRepliesState.set(false);
        this.loadingMoreState.set(false);

        onComplete?.();
      },
      error: () => {
        this.loadingRepliesState.set(false);
        this.loadingMoreState.set(false);
        onComplete?.();
      },
    });
  }
}
