// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal } from '@angular/core';

interface VisitedData {
  storyId: number;
  /**
   * Legacy/general last activity timestamp. Kept for backwards compatibility
   * with previously persisted records.
   */
  visitedAt: number;
  /** Legacy comments count. Prefer commentsCount for new writes. */
  commentCount?: number;
  storyVisitedAt?: number;
  commentsVisitedAt?: number;
  commentsCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class VisitedService {
  private readonly STORAGE_KEY = 'hn_visited_stories';
  private readonly MAX_VISITED = 1000;
  private visitedMap = signal(new Map<number, VisitedData>());

  constructor() {
    this.loadVisited();
  }

  private loadVisited(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data: VisitedData[] = JSON.parse(stored);
        const newMap = new Map<number, VisitedData>();
        data.forEach((item) => newMap.set(item.storyId, this.normalizeVisitedData(item)));
        this.visitedMap.set(newMap);
      }
    } catch (error) {
      console.error('Failed to load visited stories:', error);
    }
  }

  private saveVisited(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = Array.from(this.visitedMap().values())
        .sort((a, b) => this.getLastActivityAt(b) - this.getLastActivityAt(a))
        .slice(0, this.MAX_VISITED);
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save visited stories:', error);
    }
  }

  markStoryVisited(storyId: number): void {
    const currentMap = this.visitedMap();
    const existingData = currentMap.get(storyId);
    const now = Date.now();
    const visitedData: VisitedData = {
      ...existingData,
      storyId,
      visitedAt: Math.max(now, existingData?.commentsVisitedAt ?? 0),
      storyVisitedAt: now,
    };

    const newMap = new Map(currentMap);
    newMap.set(storyId, visitedData);
    this.visitedMap.set(newMap);
    this.saveVisited();
  }

  markCommentsVisited(storyId: number, commentCount?: number): void {
    const currentMap = this.visitedMap();
    const existingData = currentMap.get(storyId);
    const now = Date.now();
    const commentsCount = commentCount ?? existingData?.commentsCount ?? existingData?.commentCount;
    const visitedData: VisitedData = {
      ...existingData,
      storyId,
      visitedAt: Math.max(now, existingData?.storyVisitedAt ?? 0),
      commentsVisitedAt: now,
      commentsCount,
      commentCount: commentsCount,
    };

    const newMap = new Map(currentMap);
    newMap.set(storyId, visitedData);
    this.visitedMap.set(newMap);
    this.saveVisited();
  }

  markAsVisited(storyId: number, commentCount?: number): void {
    this.markCommentsVisited(storyId, commentCount);
  }

  isVisited(storyId: number): boolean {
    const data = this.visitedMap().get(storyId);
    return data?.storyVisitedAt !== undefined;
  }

  getVisitedData(storyId: number): VisitedData | undefined {
    return this.visitedMap().get(storyId);
  }

  getCommentsVisitedData(storyId: number): VisitedData | undefined {
    const visitedData = this.visitedMap().get(storyId);
    if (!visitedData) {
      return undefined;
    }

    const commentsVisitedAt = visitedData.commentsVisitedAt;
    if (commentsVisitedAt === undefined) {
      return undefined;
    }

    return {
      ...visitedData,
      visitedAt: commentsVisitedAt,
      commentCount: visitedData.commentsCount ?? visitedData.commentCount,
    };
  }

  hasNewComments(storyId: number, currentCommentCount: number): boolean {
    const visitedData = this.getCommentsVisitedData(storyId);
    if (!visitedData || visitedData.commentCount === undefined) {
      return false;
    }
    return currentCommentCount > visitedData.commentCount;
  }

  getNewCommentCount(storyId: number, currentCommentCount: number): number {
    const visitedData = this.getCommentsVisitedData(storyId);
    if (!visitedData || visitedData.commentCount === undefined) {
      return 0;
    }
    return Math.max(0, currentCommentCount - visitedData.commentCount);
  }

  clearVisited(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.visitedMap.set(new Map());
    window.localStorage.removeItem(this.STORAGE_KEY);
  }

  private normalizeVisitedData(item: VisitedData): VisitedData {
    const storyVisitedAt = item.storyVisitedAt ?? item.visitedAt;
    const commentsCount = item.commentsCount ?? item.commentCount;
    const commentsVisitedAt =
      item.commentsVisitedAt ?? (item.commentCount !== undefined ? item.visitedAt : undefined);

    return {
      ...item,
      visitedAt: this.maxDefined(item.visitedAt, storyVisitedAt, commentsVisitedAt),
      storyVisitedAt,
      commentsVisitedAt,
      commentsCount,
      commentCount: commentsCount,
    };
  }

  private getLastActivityAt(item: VisitedData): number {
    return this.maxDefined(item.visitedAt, item.storyVisitedAt, item.commentsVisitedAt);
  }

  private maxDefined(...values: Array<number | undefined>): number {
    return Math.max(0, ...values.filter((value): value is number => value !== undefined));
  }
}
