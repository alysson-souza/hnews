// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  PrivacyRedirectConfig,
  PrivacyRedirectSettings,
  PRIVACY_REDIRECT_REGISTRY,
  DEFAULT_PRIVACY_SETTINGS,
} from '@models/privacy-redirect';

const SETTINGS_STORAGE_KEY = 'privacy.redirect.settings.v1';

/**
 * Core service for privacy URL redirects.
 * Manages settings and URL transformation.
 */
@Injectable({ providedIn: 'root' })
export class PrivacyRedirectService {
  private destroyRef = inject(DestroyRef);
  private storageListener: ((e: StorageEvent) => void) | null = null;
  private _settings = signal<PrivacyRedirectSettings>(this.loadSettings());

  readonly settings = this._settings.asReadonly();

  /** Registry of all supported redirect configurations */
  get registry(): readonly PrivacyRedirectConfig[] {
    return PRIVACY_REDIRECT_REGISTRY;
  }

  constructor() {
    this.setupStorageListener();
    this.destroyRef.onDestroy(() => this.removeStorageListener());
  }

  /**
   * Set up listener for storage changes from other tabs.
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') return;

    this.storageListener = (e: StorageEvent) => {
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Partial<PrivacyRedirectSettings>;
          this._settings.set(this.mergeSettings(parsed));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', this.storageListener);
  }

  /**
   * Remove the storage event listener.
   */
  private removeStorageListener(): void {
    if (typeof window === 'undefined' || !this.storageListener) return;
    window.removeEventListener('storage', this.storageListener);
    this.storageListener = null;
  }

  /**
   * Enable or disable privacy redirects.
   */
  setEnabled(enabled: boolean): void {
    const current = this._settings();
    if (current.enabled === enabled) return;

    const next: PrivacyRedirectSettings = { ...current, enabled };
    this._settings.set(next);
    this.saveSettings(next);
  }

  /**
   * Transform a URL to its privacy-respecting alternative.
   * Returns the original URL if no redirect is enabled.
   *
   * @param url The original URL to transform
   * @returns The redirected URL or original if no redirect applies
   */
  transformUrl(url: string): string {
    if (!this._settings().enabled) {
      return url;
    }

    for (const config of this.registry) {
      if (config.urlPatterns.some((pattern) => pattern.test(url))) {
        return this.applyRedirect(url, config);
      }
    }

    return url;
  }

  /**
   * Check if a URL would be redirected.
   */
  wouldRedirect(url: string): boolean {
    if (!this._settings().enabled) {
      return false;
    }

    return this.registry.some((config) => config.urlPatterns.some((pattern) => pattern.test(url)));
  }

  /**
   * Get the service that would handle a URL redirect.
   */
  getMatchingService(url: string): PrivacyRedirectConfig | null {
    if (!this._settings().enabled) {
      return null;
    }

    for (const config of this.registry) {
      if (config.urlPatterns.some((pattern) => pattern.test(url))) {
        return config;
      }
    }

    return null;
  }

  private applyRedirect(url: string, config: PrivacyRedirectConfig): string {
    try {
      const originalUrl = new URL(url);
      return new URL(
        originalUrl.pathname + originalUrl.search + originalUrl.hash,
        config.baseUrl,
      ).toString();
    } catch {
      return url;
    }
  }

  private loadSettings(): PrivacyRedirectSettings {
    if (typeof window === 'undefined') {
      return structuredClone(DEFAULT_PRIVACY_SETTINGS);
    }

    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_PRIVACY_SETTINGS);

      const parsed = JSON.parse(raw) as Partial<PrivacyRedirectSettings>;
      return this.mergeSettings(parsed);
    } catch {
      return structuredClone(DEFAULT_PRIVACY_SETTINGS);
    }
  }

  private mergeSettings(override?: Partial<PrivacyRedirectSettings>): PrivacyRedirectSettings {
    if (!override) return structuredClone(DEFAULT_PRIVACY_SETTINGS);

    return {
      enabled:
        typeof override.enabled === 'boolean' ? override.enabled : DEFAULT_PRIVACY_SETTINGS.enabled,
    };
  }

  private saveSettings(settings: PrivacyRedirectSettings): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }
}
