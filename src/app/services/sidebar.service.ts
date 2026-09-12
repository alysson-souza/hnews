// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, inject, signal, computed, DestroyRef, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { HNItem } from '@models/hn';
import { CommentStateEntry } from './comment-state.service';

export interface DiscussionEntry {
  key: number;
  index: number;
  itemId: number;
  captureCommentStates?: () => Map<number, CommentStateEntry>;
  state: {
    scrollTop: number;
    scrollAnchorId?: number;
    selectedCommentId: WritableSignal<number | null>;
    visibleCount: number;
    item: HNItem | null;
    comments: HNItem[];
    commentStates?: Map<number, CommentStateEntry>;
    previousVisitedAt: number | null;
    inheritedPreviousVisitedAt?: number | null;
    visited: boolean;
    selectFirst: boolean;
    scrollFirst?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private sequence = 0;
  private history = signal<{ entries: DiscussionEntry[]; position: number }>({
    entries: [],
    position: -1,
  });
  readonly entries = computed(() => this.history().entries);
  readonly position = computed(() => this.history().position);
  readonly currentEntry = computed<DiscussionEntry | null>(
    () => this.entries()[this.position()] ?? null,
  );
  readonly currentItemId = computed(() => this.currentEntry()?.itemId ?? null);
  readonly isOpen = computed(() => this.position() >= 0);
  readonly canGoBack = computed(() => this.position() >= 0);
  readonly canGoForward = computed(() => this.position() < this.entries().length - 1);
  readonly visibleEntries = computed(() =>
    this.entries().slice(Math.max(0, this.position() - 1), this.position() + 2),
  );

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((event) => {
        if (event instanceof NavigationStart) this.close();
      });
  }
  open(itemId: number): void {
    this.push(itemId);
  }
  push(itemId: number): void {
    if (this.currentItemId() === itemId) return;
    const entries = this.entries().slice(0, this.position() + 1);
    entries.push({
      key: ++this.sequence,
      index: entries.length,
      itemId,
      state: {
        scrollTop: 0,
        selectedCommentId: signal<number | null>(null),
        visibleCount: 10,
        item: null,
        comments: [],
        previousVisitedAt: null,
        visited: false,
        selectFirst: false,
      },
    });
    this.history.set({ entries, position: entries.length - 1 });
  }
  back(): void {
    if (this.canGoBack()) this.history.update((h) => ({ ...h, position: h.position - 1 }));
  }
  forward(): void {
    if (this.canGoForward()) this.history.update((h) => ({ ...h, position: h.position + 1 }));
  }
  close(): void {
    this.history.set({ entries: [], position: -1 });
  }
  openSidebar(id: number): void {
    this.open(id);
  }
  openSidebarWithSlideAnimation(id: number): void {
    this.push(id);
  }
  closeSidebar(): void {
    this.close();
  }
  goBack(): void {
    this.back();
  }
  toggleSidebar(id: number): void {
    if (this.currentItemId() === id) this.close();
    else this.open(id);
  }
}
