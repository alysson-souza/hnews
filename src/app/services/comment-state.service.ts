// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal } from '@angular/core';

export interface CommentStateEntry {
  collapsed: boolean;
  repliesExpanded: boolean;
  loadedPages: number;
  lastAccessed: number;
}

@Injectable({
  providedIn: 'root',
})
export class CommentStateService {
  private readonly STORAGE_KEY = 'hn_comment_state.v1';
  private readonly MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
  private readonly MAX_ENTRIES = 1000;

  private statesMap = signal(new Map<number, CommentStateEntry>());

  constructor() {
    this.load();
    this.cleanup();
  }

  /**
   * Get the complete state for a comment.
   */
  getState(commentId: number): CommentStateEntry | undefined {
    return this.statesMap().get(commentId);
  }

  /**
   * Set the state for a comment (merges with existing state).
   */
  setState(commentId: number, partialState: Partial<CommentStateEntry>): void {
    const current = this.statesMap().get(commentId);
    const newState: CommentStateEntry = {
      collapsed: current?.collapsed ?? false,
      repliesExpanded: current?.repliesExpanded ?? false,
      loadedPages: current?.loadedPages ?? 0,
      lastAccessed: Date.now(),
      ...partialState,
    };

    const newMap = new Map(this.statesMap());
    newMap.set(commentId, newState);
    this.statesMap.set(newMap);
    this.save();
  }

  /**
   * Check if a comment is collapsed (default: false).
   */
  isCollapsed(commentId: number): boolean {
    return this.statesMap().get(commentId)?.collapsed ?? false;
  }

  /**
   * Check if replies are expanded (default: false).
   */
  areRepliesExpanded(commentId: number): boolean {
    return this.statesMap().get(commentId)?.repliesExpanded ?? false;
  }

  /**
   * Get the number of loaded pages (default: 0).
   */
  getLoadedPages(commentId: number): number {
    return this.statesMap().get(commentId)?.loadedPages ?? 0;
  }

  /**
   * Set collapsed state for a comment.
   */
  setCollapsed(commentId: number, collapsed: boolean): void {
    this.setState(commentId, { collapsed });
  }

  /**
   * Set replies expanded state for a comment.
   */
  setRepliesExpanded(commentId: number, expanded: boolean): void {
    this.setState(commentId, { repliesExpanded: expanded });
  }

  /**
   * Set the number of loaded pages for a comment.
   */
  setLoadedPages(commentId: number, pages: number): void {
    this.setState(commentId, { loadedPages: Math.max(0, pages) });
  }

  /**
   * Clear all saved states.
   */
  clearAll(): void {
    this.statesMap.set(new Map());
    this.save();
  }

  private load(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return;
      }

      const data = JSON.parse(stored) as Record<string, CommentStateEntry>;
      const newMap = new Map<number, CommentStateEntry>();

      Object.entries(data).forEach(([key, value]) => {
        const commentId = parseInt(key, 10);
        if (!isNaN(commentId) && this.isValidEntry(value)) {
          newMap.set(commentId, value);
        }
      });

      this.statesMap.set(newMap);
    } catch (error) {
      console.error('Failed to load comment states:', error);
    }
  }

  private save(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data: Record<string, CommentStateEntry> = {};
      this.statesMap().forEach((value, key) => {
        data[key.toString()] = value;
      });

      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save comment states:', error);
    }
  }

  private cleanup(): void {
    const currentMap = this.statesMap();
    if (currentMap.size === 0) {
      return;
    }

    const now = Date.now();
    const entries = Array.from(currentMap.entries());

    // 1. Remove entries older than MAX_AGE_MS
    const recent = entries.filter(([, entry]) => now - entry.lastAccessed < this.MAX_AGE_MS);

    // 2. If still over MAX_ENTRIES, keep only the most recent ones
    let cleaned = recent;
    if (recent.length > this.MAX_ENTRIES) {
      cleaned = recent
        .sort((a, b) => b[1].lastAccessed - a[1].lastAccessed)
        .slice(0, this.MAX_ENTRIES);
    }

    // 3. Only update if we removed something
    if (cleaned.length < entries.length) {
      const newMap = new Map(cleaned);
      this.statesMap.set(newMap);
      this.save();
    }
  }

  private isValidEntry(value: unknown): value is CommentStateEntry {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const entry = value as Partial<CommentStateEntry>;
    return (
      typeof entry.collapsed === 'boolean' &&
      typeof entry.repliesExpanded === 'boolean' &&
      typeof entry.loadedPages === 'number' &&
      typeof entry.lastAccessed === 'number' &&
      !isNaN(entry.lastAccessed)
    );
  }
}
