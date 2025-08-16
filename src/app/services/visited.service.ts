// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable } from '@angular/core';

interface VisitedData {
  storyId: number;
  visitedAt: number;
  commentCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class VisitedService {
  private readonly STORAGE_KEY = 'hn_visited_stories';
  private readonly MAX_VISITED = 1000;
  private visitedMap = new Map<number, VisitedData>();

  constructor() {
    this.loadVisited();
  }

  private loadVisited(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data: VisitedData[] = JSON.parse(stored);
        data.forEach((item) => this.visitedMap.set(item.storyId, item));
      }
    } catch (error) {
      console.error('Failed to load visited stories:', error);
    }
  }

  private saveVisited(): void {
    try {
      const data = Array.from(this.visitedMap.values())
        .sort((a, b) => b.visitedAt - a.visitedAt)
        .slice(0, this.MAX_VISITED);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save visited stories:', error);
    }
  }

  markAsVisited(storyId: number, commentCount?: number): void {
    const existingData = this.visitedMap.get(storyId);
    const visitedData: VisitedData = {
      storyId,
      visitedAt: Date.now(),
      commentCount: commentCount ?? existingData?.commentCount,
    };

    this.visitedMap.set(storyId, visitedData);
    this.saveVisited();
  }

  isVisited(storyId: number): boolean {
    return this.visitedMap.has(storyId);
  }

  getVisitedData(storyId: number): VisitedData | undefined {
    return this.visitedMap.get(storyId);
  }

  hasNewComments(storyId: number, currentCommentCount: number): boolean {
    const visitedData = this.visitedMap.get(storyId);
    if (!visitedData || visitedData.commentCount === undefined) {
      return false;
    }
    return currentCommentCount > visitedData.commentCount;
  }

  getNewCommentCount(storyId: number, currentCommentCount: number): number {
    const visitedData = this.visitedMap.get(storyId);
    if (!visitedData || visitedData.commentCount === undefined) {
      return 0;
    }
    return Math.max(0, currentCommentCount - visitedData.commentCount);
  }

  clearVisited(): void {
    this.visitedMap.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
