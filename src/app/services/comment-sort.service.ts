// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, signal } from '@angular/core';
import {
  COMMENT_SORT_ORDERS,
  CommentSortOrder,
} from '../components/shared/comment-sort-dropdown/comment-sort-dropdown.component';

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
}
