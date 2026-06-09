// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, signal } from '@angular/core';
import {
  COMMENT_SORT_ORDERS,
  CommentSortOrder,
} from '@components/shared/comment-sort-dropdown/comment-sort-dropdown.component';
import { HNItem } from '@models/hn';

@Injectable({
  providedIn: 'root',
})
export class CommentSortService {
  private readonly STORAGE_KEY = 'hnews_comment_sort';
  private readonly DEFAULT_SORT: CommentSortOrder = 'default';

  sortOrder = signal<CommentSortOrder>(this.loadSortOrder());

  private loadSortOrder(): CommentSortOrder {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.DEFAULT_SORT;
    }

    const stored = window.localStorage.getItem(this.STORAGE_KEY);
    if (COMMENT_SORT_ORDERS.includes(stored as CommentSortOrder)) {
      return stored as CommentSortOrder;
    }

    return this.DEFAULT_SORT;
  }

  setSortOrder(order: CommentSortOrder): void {
    this.sortOrder.set(order);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(this.STORAGE_KEY, order);
    }
  }

  sortComments(
    kids: readonly number[],
    comments: readonly HNItem[],
    order: CommentSortOrder,
  ): number[] {
    if (order === 'default' || comments.length === 0) {
      return [...kids];
    }

    const nativeIndex = new Map(kids.map((id, index) => [id, index]));
    const sortedComments = comments.filter((comment) => nativeIndex.has(comment.id));

    sortedComments.sort((a, b) => {
      let comparison = 0;

      if (order === 'newest') {
        comparison = b.time - a.time;
      } else if (order === 'oldest') {
        comparison = a.time - b.time;
      } else if (order === 'popular') {
        comparison = this.popularityCount(b) - this.popularityCount(a);
      }

      return comparison || nativeIndex.get(a.id)! - nativeIndex.get(b.id)!;
    });

    return sortedComments.map((comment) => comment.id);
  }

  private popularityCount(comment: HNItem): number {
    return Math.max(comment.descendants ?? 0, comment.kids?.length ?? 0);
  }
}
