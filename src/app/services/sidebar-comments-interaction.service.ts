// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type CommentActionType =
  | 'expand'
  | 'collapse'
  | 'viewThread'
  | 'expandReplies'
  | 'expandAll'
  | 'collapseAll';

export interface CommentAction {
  commentId: number;
  action: CommentActionType;
}

@Injectable({
  providedIn: 'root',
})
export class SidebarCommentsInteractionService {
  private actionSubject = new Subject<CommentAction>();

  // Observable for components to subscribe to
  action$ = this.actionSubject.asObservable();

  /**
   * Dispatch an action for a specific comment
   */
  dispatchAction(commentId: number, action: CommentActionType): void {
    this.actionSubject.next({ commentId, action });
  }
}
