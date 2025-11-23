// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable } from '@angular/core';
import { HNItem } from '../models/hn';

interface SerializedStoryListState {
  stories: HNItem[];
  currentPage: number;
  totalStoryIds: number[];
  storyType: string;
  selectedIndex: number | null;
  timestamp: number;
}

export interface StoryListState {
  stories: HNItem[];
  currentPage: number;
  totalStoryIds: number[];
  storyType: string;
  selectedIndex: number | null;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class StoryListStateService {
  private readonly cacheExpiration = 10 * 60 * 1000; // 10 minutes
  private readonly storagePrefix = 'hnews-story-list-';

  /**
   * Save the current story list state to sessionStorage
   */
  saveState(
    storyType: string,
    stories: HNItem[],
    currentPage: number,
    totalStoryIds: number[],
    selectedIndex: number | null,
  ): void {
    const serializedState: SerializedStoryListState = {
      stories,
      currentPage,
      totalStoryIds,
      storyType,
      selectedIndex,
      timestamp: Date.now(),
    };

    try {
      const key = this.storagePrefix + storyType;
      sessionStorage.setItem(key, JSON.stringify(serializedState));
    } catch (e) {
      // Handle quota exceeded or other storage errors
      console.warn('Failed to save story list state:', e);
    }
  }

  /**
   * Get cached state for a story type from sessionStorage
   */
  getState(storyType: string): StoryListState | null {
    try {
      const key = this.storagePrefix + storyType;
      const stored = sessionStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const serializedState: SerializedStoryListState = JSON.parse(stored);

      // Check if cache has expired
      if (Date.now() - serializedState.timestamp > this.cacheExpiration) {
        sessionStorage.removeItem(key);
        return null;
      }

      const state: StoryListState = {
        ...serializedState,
      };

      return state;
    } catch (e) {
      console.warn('Failed to retrieve story list state:', e);
      return null;
    }
  }

  /**
   * Clear cached state for a story type
   */
  clearState(storyType: string): void {
    const key = this.storagePrefix + storyType;
    sessionStorage.removeItem(key);
  }

  /**
   * Clear all cached states
   */
  clearAllStates(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.storagePrefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Check if we have valid cached state
   */
  hasValidState(storyType: string): boolean {
    const state = this.getState(storyType);
    return state !== null && state.stories.length > 0;
  }
}
