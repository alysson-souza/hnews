// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, OnDestroy, signal, computed } from '@angular/core';

export type ConnectionQuality = 'fast' | 'slow' | 'offline';

/**
 * Centralized service for managing network state using Angular signals.
 * Provides reactive state for online/offline status, connection quality,
 * and offline duration tracking.
 */
@Injectable({
  providedIn: 'root',
})
export class NetworkStateService implements OnDestroy {
  private readonly onlineHandler: () => void;
  private readonly offlineHandler: () => void;

  /** Reactive signal tracking online/offline state */
  readonly isOnline = signal<boolean>(this.getInitialOnlineState());

  /** Timestamp when the device went offline (null if online) */
  readonly offlineSince = signal<Date | null>(null);

  /** Connection quality estimate (requires Network Information API) */
  readonly connectionQuality = signal<ConnectionQuality>(this.getInitialConnectionQuality());

  /** Computed signal for offline duration in milliseconds */
  readonly offlineDuration = computed(() => {
    const since = this.offlineSince();
    return since ? Date.now() - since.getTime() : 0;
  });

  constructor() {
    // Initialize offline timestamp if starting offline
    if (!this.isOnline()) {
      this.offlineSince.set(new Date());
    }

    // Set up event listeners with bound handlers for proper cleanup
    this.onlineHandler = () => this.handleOnline();
    this.offlineHandler = () => this.handleOffline();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);

      // Optional: Listen to Network Information API changes if available
      this.setupNetworkInformationAPI();
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
      window.removeEventListener('offline', this.offlineHandler);
    }
  }

  /**
   * Get the current connection status object
   */
  getConnectionStatus(): {
    isOnline: boolean;
    quality: ConnectionQuality;
    offlineDuration: number;
  } {
    return {
      isOnline: this.isOnline(),
      quality: this.connectionQuality(),
      offlineDuration: this.offlineDuration(),
    };
  }

  /**
   * Check if currently offline (convenience method)
   */
  isOffline(): boolean {
    return !this.isOnline();
  }

  /**
   * Get formatted offline duration string
   */
  getOfflineDurationFormatted(): string {
    const duration = this.offlineDuration();
    if (duration === 0) {
      return '';
    }

    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }
    if (minutes > 0) {
      return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    }
    return seconds === 1 ? '1 second' : `${seconds} seconds`;
  }

  private handleOnline(): void {
    this.isOnline.set(true);
    this.offlineSince.set(null);
    this.updateConnectionQuality();
  }

  private handleOffline(): void {
    this.isOnline.set(false);
    this.offlineSince.set(new Date());
    this.connectionQuality.set('offline');
  }

  /**
   * Called by HTTP interceptor on any successful response to affirm connectivity.
   */
  noteRequestSuccess(): void {
    if (!this.isOnline()) {
      this.handleOnline();
    }
  }

  /**
   * Called by HTTP interceptor on failed requests; marks offline for likely
   * connectivity errors (status 0, network errors, or progress event errors).
   */
  noteRequestFailure(error: unknown): void {
    // Heuristics: status === 0 indicates CORS/network/offline in browsers
    const err = error as { status?: number };
    if (typeof err?.status === 'number' && err.status === 0) {
      if (this.isOnline()) {
        this.handleOffline();
      }
    }
  }

  private getInitialOnlineState(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return true; // SSR fallback: assume online
    }
    return navigator.onLine;
  }

  private getInitialConnectionQuality(): ConnectionQuality {
    if (!this.getInitialOnlineState()) {
      return 'offline';
    }
    return this.estimateConnectionQuality();
  }

  private setupNetworkInformationAPI(): void {
    // Network Information API is experimental and not widely supported
    // Use with feature detection and graceful degradation
    const connection = this.getNetworkConnection();
    if (connection && 'addEventListener' in connection) {
      connection.addEventListener('change', () => {
        this.updateConnectionQuality();
      });
    }
  }

  private updateConnectionQuality(): void {
    if (!this.isOnline()) {
      this.connectionQuality.set('offline');
      return;
    }
    this.connectionQuality.set(this.estimateConnectionQuality());
  }

  private estimateConnectionQuality(): ConnectionQuality {
    const connection = this.getNetworkConnection();
    if (!connection) {
      return 'fast'; // Default assumption if API unavailable
    }

    // Network Information API provides effectiveType
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'slow';
    }
    if (effectiveType === '3g') {
      return 'slow';
    }
    // '4g' or better
    return 'fast';
  }

  private getNetworkConnection(): NetworkInformation | null {
    if (typeof navigator === 'undefined') {
      return null;
    }
    // Network Information API (experimental)
    return (
      (navigator as Navigator & { connection?: NetworkInformation }).connection ||
      (navigator as Navigator & { mozConnection?: NetworkInformation }).mozConnection ||
      (navigator as Navigator & { webkitConnection?: NetworkInformation }).webkitConnection ||
      null
    );
  }
}

// Type definition for Network Information API (experimental)
interface NetworkInformation extends EventTarget {
  readonly effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
}
