// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { inject, Injectable, InjectionToken, signal } from '@angular/core';

export const COMMENT_VOTE_STORAGE = new InjectionToken<Storage | null>('COMMENT_VOTE_STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      return localStorage;
    } catch {
      return null;
    }
  },
});

@Injectable({ providedIn: 'root' })
export class CommentVoteStoreService {
  private readonly storage = inject(COMMENT_VOTE_STORAGE);
  private readonly storageKey = 'votedComments';
  private readonly votedIdsSignal = signal<Set<number>>(this.restoreFromStorage());
  readonly votedCommentIds = this.votedIdsSignal.asReadonly();

  has(id: number): boolean {
    return this.votedCommentIds().has(id);
  }

  vote(id: number): void {
    this.votedIdsSignal.update((current) => {
      if (current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.add(id);
      this.persist(next);
      return next;
    });
  }

  private restoreFromStorage(): Set<number> {
    if (!this.storage) {
      return new Set();
    }

    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) {
        return new Set();
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return new Set();
      }

      const ids = parsed.filter((value): value is number => Number.isInteger(value));
      return new Set(ids);
    } catch {
      return new Set();
    }
  }

  private persist(next: Set<number>): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(this.storageKey, JSON.stringify(Array.from(next)));
    } catch {
      // Ignore persistence failures.
    }
  }
}
