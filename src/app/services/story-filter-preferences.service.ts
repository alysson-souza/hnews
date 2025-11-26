// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza

import { Injectable, signal } from '@angular/core';
import { StoryFilterMode } from '../models/story-filter';

const STORAGE_KEY = 'hnews-story-filter-mode';

/**
 * Service to manage story filter preference persistence.
 * Saves and restores the user's filter choice using localStorage.
 * Safely no-ops on SSR.
 */
@Injectable({ providedIn: 'root' })
export class StoryFilterPreferencesService {
  private readonly _filterMode = signal<StoryFilterMode>(this.load());

  /** Readonly signal for the current filter mode preference */
  readonly filterMode = this._filterMode.asReadonly();

  /**
   * Updates the filter mode preference and persists to localStorage.
   */
  setFilterMode(mode: StoryFilterMode): void {
    if (this._filterMode() === mode) {
      return;
    }
    this._filterMode.set(mode);
    this.save(mode);
  }

  /**
   * Loads the filter mode from localStorage.
   * Returns 'default' if not set or on SSR.
   */
  private load(): StoryFilterMode {
    if (typeof window === 'undefined') {
      return 'default';
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && this.isValidFilterMode(stored)) {
        return stored;
      }
    } catch {
      // Ignore storage errors (private browsing, etc.)
    }

    return 'default';
  }

  /**
   * Saves the filter mode to localStorage.
   * No-ops on SSR or storage errors.
   */
  private save(mode: StoryFilterMode): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (mode === 'default') {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, mode);
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Type guard to validate filter mode values.
   */
  private isValidFilterMode(value: string): value is StoryFilterMode {
    return value === 'default' || value === 'todayTop20' || value === 'topHalf';
  }
}
