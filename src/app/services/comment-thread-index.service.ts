// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, signal } from '@angular/core';
import { HNItem } from '@models/hn';

export type CommentThreadContext = 'item' | 'sidebar';

interface CommentThreadIndexState {
  rootItemId: number | null;
  storyAuthor?: string;
  previousVisitedAt: number | null;
  comments: Map<number, HNItem>;
  parentByChild: Map<number, number>;
}

@Injectable({
  providedIn: 'root',
})
export class CommentThreadIndexService {
  private readonly emptyState: CommentThreadIndexState = {
    rootItemId: null,
    previousVisitedAt: null,
    comments: new Map(),
    parentByChild: new Map(),
  };

  private readonly states = signal<Record<CommentThreadContext, CommentThreadIndexState>>({
    item: this.cloneEmptyState(),
    sidebar: this.cloneEmptyState(),
  });

  configureContext(
    context: CommentThreadContext,
    rootItem: HNItem,
    options?: { comments?: HNItem[]; previousVisitedAt?: number | null },
  ): void {
    const comments = new Map<number, HNItem>();
    const parentByChild = new Map<number, number>();

    for (const comment of options?.comments ?? []) {
      if (comment.deleted || comment.type !== 'comment') {
        continue;
      }

      comments.set(comment.id, comment);
      this.indexChildren(comment, parentByChild);
    }

    this.states.update((states) => ({
      ...states,
      [context]: {
        rootItemId: rootItem.id,
        storyAuthor: rootItem.by,
        previousVisitedAt: options?.previousVisitedAt ?? null,
        comments,
        parentByChild,
      },
    }));
  }

  clearContext(context: CommentThreadContext): void {
    this.states.update((states) => ({
      ...states,
      [context]: this.cloneEmptyState(),
    }));
  }

  registerComment(context: CommentThreadContext, comment: HNItem): void {
    if (comment.deleted || comment.type !== 'comment') {
      return;
    }

    this.states.update((states) => {
      const current = states[context];
      const comments = new Map(current.comments);
      const parentByChild = new Map(current.parentByChild);

      comments.set(comment.id, comment);
      this.indexChildren(comment, parentByChild);

      return {
        ...states,
        [context]: {
          ...current,
          comments,
          parentByChild,
        },
      };
    });
  }

  isUnread(context: CommentThreadContext, commentId: number): boolean {
    const state = this.states()[context];
    if (state.previousVisitedAt === null) {
      return false;
    }

    const comment = state.comments.get(commentId);
    return !!comment && comment.time * 1000 > state.previousVisitedAt;
  }

  hasComment(context: CommentThreadContext, commentId: number): boolean {
    return this.states()[context].comments.has(commentId);
  }

  getPreviousVisitedAt(context: CommentThreadContext): number | null {
    return this.states()[context].previousVisitedAt;
  }

  isOPReply(context: CommentThreadContext, commentId: number): boolean {
    const state = this.states()[context];
    const comment = state.comments.get(commentId);
    return !!comment?.by && !!state.storyAuthor && comment.by === state.storyAuthor;
  }

  getParentPath(context: CommentThreadContext, commentId: number): number[] {
    const state = this.states()[context];
    const path: number[] = [];
    let current = state.parentByChild.get(commentId);

    while (current !== undefined && !path.includes(current)) {
      path.unshift(current);
      current = state.parentByChild.get(current);
    }

    return path;
  }

  private indexChildren(comment: HNItem, parentByChild: Map<number, number>): void {
    for (const childId of comment.kids ?? []) {
      parentByChild.set(childId, comment.id);
    }
  }

  private cloneEmptyState(): CommentThreadIndexState {
    return {
      ...this.emptyState,
      comments: new Map(),
      parentByChild: new Map(),
    };
  }
}
