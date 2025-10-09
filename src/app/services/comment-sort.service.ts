// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal } from '@angular/core';
import { CommentSortOrder } from '../components/shared/comment-sort-dropdown/comment-sort-dropdown.component';

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
    if (stored === 'default' || stored === 'best' || stored === 'newest' || stored === 'oldest') {
      return stored;
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
