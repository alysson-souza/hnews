// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, signal } from '@angular/core';
import type { ApiConfig } from '../config/api.config';

export interface OpenGraphSettings {
  microlink: {
    apiKey?: string; // 'free' enables free tier; empty disables
  };
  linkpreview: {
    apiKey?: string; // empty disables
  };
  opengraphio: {
    appId?: string; // empty disables
  };
}

export interface UserSettings {
  opengraph: OpenGraphSettings;
}

const STORAGE_KEY = 'user.settings.v1';

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly defaults: UserSettings = {
    opengraph: {
      microlink: { apiKey: undefined },
      linkpreview: { apiKey: undefined },
      opengraphio: { appId: undefined },
    },
  };

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

  // Convenience updaters
  setMicrolinkApiKey(key?: string) {
    const next = structuredClone(this._settings());
    next.opengraph.microlink.apiKey = key;
    this._settings.set(next);
    this.save(next);
  }
  setLinkPreviewApiKey(key?: string) {
    const next = structuredClone(this._settings());
    next.opengraph.linkpreview.apiKey = key;
    this._settings.set(next);
    this.save(next);
  }
  setOpenGraphIoAppId(id?: string) {
    const next = structuredClone(this._settings());
    next.opengraph.opengraphio.appId = id;
    this._settings.set(next);
    this.save(next);
  }

  clearAllOpenGraph(): void {
    const next = structuredClone(this._settings());
    next.opengraph = structuredClone(this.defaults.opengraph);
    this._settings.set(next);
    this.save(next);
  }

  // Produce ApiConfig overrides from user settings (only defined fields)
  getApiConfigOverrides(): ApiConfig {
    const s = this._settings().opengraph;
    const out: ApiConfig = {};
    if (s.microlink.apiKey !== undefined) {
      out.microlink = { apiKey: s.microlink.apiKey };
    }
    if (s.linkpreview.apiKey !== undefined) {
      out.linkpreview = { apiKey: s.linkpreview.apiKey };
    }
    if (s.opengraphio.appId !== undefined) {
      out.opengraphio = { appId: s.opengraphio.appId };
    }
    return out;
  }

  private mergeSettings(base: UserSettings, override?: Partial<UserSettings>): UserSettings {
    if (!override) return base;
    const out = structuredClone(base);
    if (override.opengraph) {
      out.opengraph.microlink = {
        ...out.opengraph.microlink,
        ...(override.opengraph.microlink ?? {}),
      };
      out.opengraph.linkpreview = {
        ...out.opengraph.linkpreview,
        ...(override.opengraph.linkpreview ?? {}),
      };
      out.opengraph.opengraphio = {
        ...out.opengraph.opengraphio,
        ...(override.opengraph.opengraphio ?? {}),
      };
    }
    return out;
  }
}
