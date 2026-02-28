// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, signal } from '@angular/core';

export interface UserTag {
  username: string;
  tag: string;
  color?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserTagsService {
  private readonly STORAGE_KEY = 'hn_user_tags';
  private tagsMap = signal<Map<string, UserTag>>(new Map());

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
        data.forEach((tag) => {
          map.set(tag.username, tag);
        });
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

  setTag(username: string, tag: string, color?: string, notes?: string): void {
    const now = Date.now();
    const existingTag = this.tagsMap().get(username);

    const resolvedNotes = notes === undefined ? existingTag?.notes : notes.trim() || undefined;

    const userTag: UserTag = {
      username,
      tag,
      color: color || existingTag?.color || this.generateAccessibleColor(this.tagsMap().size),
      notes: resolvedNotes,
      createdAt: existingTag?.createdAt || now,
      updatedAt: now,
    };

    const newMap = new Map(this.tagsMap());
    newMap.set(username, userTag);
    this.tagsMap.set(newMap);
    this.saveTags();
  }

  setNotes(username: string, notes: string): void {
    const existingTag = this.tagsMap().get(username);
    if (!existingTag) return;

    const updatedTag: UserTag = {
      ...existingTag,
      notes: notes.trim() || undefined,
      updatedAt: Date.now(),
    };

    const newMap = new Map(this.tagsMap());
    newMap.set(username, updatedTag);
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

    // Handle null/undefined/falsy values
    const normalizedQuery = searchQuery?.trim() ?? '';

    if (!normalizedQuery) {
      return allTags;
    }

    const query = normalizedQuery.toLowerCase();
    return allTags.filter((tag) => {
      // Defensive: skip tags with invalid data
      if (!tag.username || !tag.tag) {
        return false;
      }
      return (
        tag.username.toLowerCase().includes(query) ||
        tag.tag.toLowerCase().includes(query) ||
        (tag.notes?.toLowerCase().includes(query) ?? false)
      );
    });
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

  private generateAccessibleColor(hueIndex: number): string {
    const h = (hueIndex * 137.508) % 360;
    const c = 0.1 + Math.random() * 0.07;

    // Binary search for max L where contrast with white >= 4.5:1
    let lo = 0.35;
    let hi = 0.7;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (this.contrastWithWhite(this.oklchToHex(mid, c, h)) >= 4.5) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    return this.oklchToHex(lo, c, h);
  }

  private oklchToHex(l: number, c: number, h: number): string {
    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    // OKLAB → LMS (cube-root space)
    const lms_l = l + 0.3963377774 * a + 0.2158037573 * b;
    const lms_m = l - 0.1055613458 * a - 0.0638541728 * b;
    const lms_s = l - 0.0894841775 * a - 1.291485548 * b;

    // Cube to get LMS
    const L = lms_l ** 3;
    const M = lms_m ** 3;
    const S = lms_s ** 3;

    // LMS → linear RGB
    const rLin = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
    const gLin = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
    const bLin = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;

    // Linear RGB → sRGB (gamma)
    const toSrgb = (v: number) =>
      v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;

    const r = Math.round(Math.max(0, Math.min(1, toSrgb(rLin))) * 255);
    const g = Math.round(Math.max(0, Math.min(1, toSrgb(gLin))) * 255);
    const bVal = Math.round(Math.max(0, Math.min(1, toSrgb(bLin))) * 255);

    return `#${r.toString(16).padStart(2, '0').toUpperCase()}${g.toString(16).padStart(2, '0').toUpperCase()}${bVal.toString(16).padStart(2, '0').toUpperCase()}`;
  }

  private contrastWithWhite(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

    return 1.05 / (luminance + 0.05);
  }

  exportTags(): string {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tags = this.getAllTags().map(({ color, ...rest }) => rest);
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
          color: this.generateAccessibleColor(newMap.size),
          notes: tag.notes || undefined,
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
