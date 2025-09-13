// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal } from '@angular/core';
export type UserSettings = Record<string, never>;

const STORAGE_KEY = 'user.settings.v1';

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly defaults: UserSettings = {} as const;

  private _settings = signal<UserSettings>(this.load());

  settings = this._settings.asReadonly();

  private load(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(this.defaults);
      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      return this.mergeSettings(structuredClone(this.defaults), parsed);
    } catch {
      return structuredClone(this.defaults);
    }
  }

  private save(value: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // ignore storage errors
    }
  }

  private mergeSettings(base: UserSettings, override?: Partial<UserSettings>): UserSettings {
    // Shallow-merge settings; fallback to base if no override provided
    if (!override) return base;
    // Cast to generic records to allow spread; runtime stays a simple object merge
    const merged = {
      ...(base as Record<string, unknown>),
      ...(override as Record<string, unknown>),
    } as UserSettings;
    return merged;
  }
}
