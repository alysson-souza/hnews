// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal } from '@angular/core';

export interface UserTag {
  username: string;
  tag: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserTagsService {
  private readonly STORAGE_KEY = 'hn_user_tags';
  private tagsMap = signal<Map<string, UserTag>>(new Map());

  private readonly DEFAULT_COLORS = [
    '#EF4444', // red
    '#F97316', // orange
    '#EAB308', // yellow
    '#22C55E', // green
    '#14B8A6', // teal
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#6B7280', // gray
  ];

  constructor() {
    this.loadTags();
  }

  private loadTags(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data: UserTag[] = JSON.parse(stored);
        const map = new Map<string, UserTag>();
        data.forEach((tag) => map.set(tag.username, tag));
        this.tagsMap.set(map);
      }
    } catch (error) {
      console.error('Failed to load user tags:', error);
    }
  }

  private saveTags(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = Array.from(this.tagsMap().values());
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save user tags:', error);
    }
  }

  setTag(username: string, tag: string, color?: string): void {
    const now = Date.now();
    const existingTag = this.tagsMap().get(username);

    const userTag: UserTag = {
      username,
      tag,
      color: color || this.getRandomColor(),
      createdAt: existingTag?.createdAt || now,
      updatedAt: now,
    };

    const newMap = new Map(this.tagsMap());
    newMap.set(username, userTag);
    this.tagsMap.set(newMap);
    this.saveTags();
  }

  getTag(username: string): UserTag | undefined {
    return this.tagsMap().get(username);
  }

  removeTag(username: string): void {
    const newMap = new Map(this.tagsMap());
    newMap.delete(username);
    this.tagsMap.set(newMap);
    this.saveTags();
  }

  getAllTags(): UserTag[] {
    return Array.from(this.tagsMap().values());
  }

  getFilteredTags(searchQuery: string = ''): UserTag[] {
    const allTags = this.getAllTags();

    if (!searchQuery.trim()) {
      return allTags;
    }

    const query = searchQuery.toLowerCase().trim();
    return allTags.filter(
      (tag) => tag.username.toLowerCase().includes(query) || tag.tag.toLowerCase().includes(query),
    );
  }

  getPaginatedTags(
    searchQuery: string = '',
    page: number = 1,
    itemsPerPage: number = 10,
  ): {
    tags: UserTag[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  } {
    const filteredTags = this.getFilteredTags(searchQuery);
    const totalCount = filteredTags.length;
    const safeItemsPerPage = Math.max(1, itemsPerPage);
    const totalPages = Math.max(1, Math.ceil(totalCount / safeItemsPerPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * safeItemsPerPage;
    const endIndex = startIndex + safeItemsPerPage;
    const tags = filteredTags.slice(startIndex, endIndex);

    return {
      tags,
      totalCount,
      totalPages,
      currentPage: safePage,
    };
  }

  private getRandomColor(): string {
    return this.DEFAULT_COLORS[Math.floor(Math.random() * this.DEFAULT_COLORS.length)];
  }

  exportTags(): string {
    const tags = this.getAllTags();
    return JSON.stringify(tags, null, 2);
  }

  importTags(jsonString: string): boolean {
    try {
      const tags: UserTag[] = JSON.parse(jsonString);

      // Validate structure
      if (!Array.isArray(tags)) {
        throw new Error('Invalid format: expected an array');
      }

      for (const tag of tags) {
        if (!tag.username || !tag.tag) {
          throw new Error('Invalid tag format');
        }
      }

      // Merge with existing tags
      const newMap = new Map(this.tagsMap());
      tags.forEach((tag) => {
        newMap.set(tag.username, {
          ...tag,
          createdAt: tag.createdAt || Date.now(),
          updatedAt: tag.updatedAt || Date.now(),
          color: tag.color || this.getRandomColor(),
        });
      });

      this.tagsMap.set(newMap);
      this.saveTags();
      return true;
    } catch (error) {
      console.error('Failed to import tags:', error);
      return false;
    }
  }

  clearAllTags(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.tagsMap.set(new Map());
    window.localStorage.removeItem(this.STORAGE_KEY);
  }
}
