// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer, Subscription } from 'rxjs';
import { LibreDirectApiClient } from '../data/libredirect-api.client';
import {
  LibreDirectInstances,
  PrivacyRedirectConfig,
  PrivacyRedirectSettings,
  PrivacyRedirectState,
  PrivacyService,
  PRIVACY_REDIRECT_REGISTRY,
  DEFAULT_PRIVACY_SETTINGS,
  RETRY_CONFIG,
} from '../models/privacy-redirect';

const SETTINGS_STORAGE_KEY = 'privacy.redirect.settings.v1';

/**
 * Core service for privacy URL redirects.
 * Manages instance fetching, retry logic, and URL transformation.
 */
@Injectable({ providedIn: 'root' })
export class PrivacyRedirectService {
  private apiClient = inject(LibreDirectApiClient);
  private destroyRef = inject(DestroyRef);

  // Internal state
  private instances = signal<LibreDirectInstances | null>(null);
  private storageListener: ((e: StorageEvent) => void) | null = null;
  private _state = signal<PrivacyRedirectState>({
    loading: false,
    error: null,
    retryCount: 0,
    nextRetryAt: null,
    ready: false,
  });
  private _settings = signal<PrivacyRedirectSettings>(this.loadSettings());

  private retrySubscription: Subscription | null = null;

  // Public readonly signals
  readonly state = this._state.asReadonly();
  readonly settings = this._settings.asReadonly();

  /** Whether redirects are available (instances loaded and enabled) */
  readonly isAvailable = computed(() => this._state().ready && this._settings().enabled);

  /** Registry of all supported redirect configurations */
  get registry(): readonly PrivacyRedirectConfig[] {
    return PRIVACY_REDIRECT_REGISTRY;
  }

  constructor() {
    // Listen for storage changes from other tabs
    this.setupStorageListener();

    // Initialize on first access if enabled
    if (this._settings().enabled) {
      this.initialize();
    }

    // Clean up listener on destroy
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
          const merged = this.mergeSettings(parsed);
          this._settings.set(merged);

          // Initialize if now enabled and not ready
          if (merged.enabled && !this._state().ready && !this._state().loading) {
            this.initialize();
          }
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
   * Initialize the service by fetching instances.
   * Safe to call multiple times.
   */
  initialize(): void {
    if (this._state().loading || this._state().ready) {
      return;
    }
    this.fetchInstances();
  }

  /**
   * Enable or disable privacy redirects.
   * When enabled, will fetch instances if not already loaded.
   */
  setEnabled(enabled: boolean): void {
    const current = this._settings();
    if (current.enabled === enabled) return;

    const next: PrivacyRedirectSettings = { ...current, enabled };
    this._settings.set(next);
    this.saveSettings(next);

    if (enabled && !this._state().ready) {
      this.initialize();
    }
  }

  /**
   * Enable or disable a specific service.
   */
  setServiceEnabled(service: PrivacyService, enabled: boolean): void {
    const current = this._settings();
    if (current.services[service] === enabled) return;

    const next: PrivacyRedirectSettings = {
      ...current,
      services: { ...current.services, [service]: enabled },
    };
    this._settings.set(next);
    this.saveSettings(next);
  }

  /**
   * Transform a URL to its privacy-respecting alternative.
   * Returns the original URL if no redirect is available or enabled.
   *
   * @param url The original URL to transform
   * @returns The redirected URL or original if no redirect applies
   */
  transformUrl(url: string): string {
    if (!this.isAvailable()) {
      return url;
    }

    const instances = this.instances();
    if (!instances) {
      return url;
    }

    const settings = this._settings();

    // Find matching redirect config
    for (const config of this.registry) {
      if (!settings.services[config.service]) {
        continue;
      }

      for (const pattern of config.urlPatterns) {
        if (pattern.test(url)) {
          const redirected = this.applyRedirect(url, config, instances);
          if (redirected) {
            return redirected;
          }
        }
      }
    }

    return url;
  }

  /**
   * Check if a URL would be redirected.
   */
  wouldRedirect(url: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    const settings = this._settings();

    for (const config of this.registry) {
      if (!settings.services[config.service]) {
        continue;
      }

      for (const pattern of config.urlPatterns) {
        if (pattern.test(url)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the service that would handle a URL redirect.
   */
  getMatchingService(url: string): PrivacyRedirectConfig | null {
    if (!this._settings().enabled) {
      return null;
    }

    const settings = this._settings();

    for (const config of this.registry) {
      if (!settings.services[config.service]) {
        continue;
      }

      for (const pattern of config.urlPatterns) {
        if (pattern.test(url)) {
          return config;
        }
      }
    }

    return null;
  }

  /**
   * Force refetch of instances.
   */
  refresh(): void {
    this.apiClient.clearCache();
    this._state.set({
      loading: false,
      error: null,
      retryCount: 0,
      nextRetryAt: null,
      ready: false,
    });
    this.cancelRetry();
    this.fetchInstances();
  }

  private fetchInstances(): void {
    this._state.update((s) => ({ ...s, loading: true, error: null }));

    this.apiClient
      .fetchInstances()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data) {
            this.instances.set(data);
            this._state.set({
              loading: false,
              error: null,
              retryCount: 0,
              nextRetryAt: null,
              ready: true,
            });
          } else {
            this.handleFetchError('Failed to load privacy instances');
          }
        },
        error: (err) => {
          this.handleFetchError(err.message || 'Network error');
        },
      });
  }

  private handleFetchError(message: string): void {
    const currentState = this._state();
    const retryCount = currentState.retryCount + 1;
    const delay = this.calculateRetryDelay(retryCount);
    const nextRetryAt = Date.now() + delay;

    this._state.set({
      loading: false,
      error: message,
      retryCount,
      nextRetryAt,
      ready: false,
    });

    this.scheduleRetry(delay);
  }

  private calculateRetryDelay(retryCount: number): number {
    const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.multiplier, retryCount - 1);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
  }

  private scheduleRetry(delay: number): void {
    this.cancelRetry();

    this.retrySubscription = timer(delay)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this._settings().enabled) {
          this.fetchInstances();
        }
      });
  }

  private cancelRetry(): void {
    if (this.retrySubscription) {
      this.retrySubscription.unsubscribe();
      this.retrySubscription = null;
    }
  }

  private applyRedirect(
    url: string,
    config: PrivacyRedirectConfig,
    instances: LibreDirectInstances,
  ): string | null {
    const clearnetInstances = this.apiClient.getClearnetInstances(instances, config.frontend);

    if (clearnetInstances.length === 0) {
      return null;
    }

    // Select a random instance
    const randomIndex = Math.floor(Math.random() * clearnetInstances.length);
    const instanceUrl = clearnetInstances[randomIndex];

    try {
      const originalUrl = new URL(url);
      const instanceBase = new URL(instanceUrl);

      // Replace the host while preserving path and query
      const redirected = new URL(originalUrl.pathname + originalUrl.search, instanceBase);
      return redirected.toString();
    } catch {
      return null;
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
      services: {
        ...DEFAULT_PRIVACY_SETTINGS.services,
        ...(override.services ?? {}),
      },
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
