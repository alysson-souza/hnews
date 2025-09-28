// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal } from '@angular/core';

export interface UserSettings {
  /**
   * When true, desktop clicks on story comments open the sidebar instead of navigating directly.
   */
  openCommentsInSidebar: boolean;
}

const STORAGE_KEY = 'user.settings.v1';

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly defaults: UserSettings = {
    openCommentsInSidebar: true,
  } as const;

  private _settings = signal<UserSettings>(this.load());

  settings = this._settings.asReadonly();

  private load(): UserSettings {
    try {
      if (typeof window === 'undefined') {
        return structuredClone(this.defaults);
      }

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(this.defaults);
      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      return this.mergeSettings(structuredClone(this.defaults), parsed);
    } catch {
      return structuredClone(this.defaults);
    }
  }

  private save(value: UserSettings): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // ignore storage errors
    }
  }

  private mergeSettings(base: UserSettings, override?: Partial<UserSettings>): UserSettings {
    if (!override) return base;

    const merged: UserSettings = {
      ...base,
      ...override,
    };

    // Ensure boolean coercion for persisted values
    if (typeof merged.openCommentsInSidebar !== 'boolean') {
      merged.openCommentsInSidebar = base.openCommentsInSidebar;
    }

    return merged;
  }

  updateSettings(update: Partial<UserSettings>): void {
    const current = this._settings();
    const next = this.mergeSettings(current, update);
    if (current.openCommentsInSidebar === next.openCommentsInSidebar) {
      return;
    }
    this._settings.set(next);
    this.save(next);
  }

  setSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    this.updateSettings({ [key]: value } as Partial<UserSettings>);
  }

  getSetting<K extends keyof UserSettings>(key: K): UserSettings[K] {
    return this._settings()[key];
  }
}
