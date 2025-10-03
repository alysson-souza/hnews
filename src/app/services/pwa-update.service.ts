// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, ApplicationRef, inject, signal } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { concat, interval } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly appRef = inject(ApplicationRef);
  private readonly updates = inject(SwUpdate);

  // Signal to track when an update is available
  updateAvailable = signal(false);

  // Signal to store update version information
  updateVersionInfo = signal<{ current: string; available: string } | null>(null);

  constructor() {
    if (!this.updates.isEnabled) return;

    // Enable navigation preload to speed up initial navigations
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.navigationPreload?.enable?.())
        .catch(() => undefined);
    }

    const appIsStable$ = this.appRef.isStable.pipe(first((stable) => stable === true));
    const every15Min$ = interval(15 * 60 * 1000);
    concat(appIsStable$, every15Min$).subscribe(() => {
      this.updates.checkForUpdate().catch(() => undefined);
    });

    this.updates.versionUpdates.subscribe(async (event: VersionEvent) => {
      if (event.type === 'VERSION_READY') {
        // Update is available, don't auto-activate
        this.updateAvailable.set(true);
        this.updateVersionInfo.set({
          current: event.currentVersion.hash,
          available: event.latestVersion.hash,
        });
      }
    });
  }

  /**
   * Apply the available PWA update and reload the page
   * Called when user clicks the update button or presses 'R'
   */
  async applyUpdate(): Promise<void> {
    if (!this.updateAvailable()) return;

    try {
      // Clear the update signals first to prevent multiple clicks
      this.updateAvailable.set(false);
      this.updateVersionInfo.set(null);

      // Activate the update and reload
      await this.updates.activateUpdate();
      this.reloadPage();
    } catch (error) {
      console.error('Failed to apply PWA update:', error);
      // If activation fails, reset the signals so user can try again
      this.updateAvailable.set(true);
    }
  }

  // Extracted for easier testing
  protected reloadPage(): void {
    document.location.reload();
  }

  /**
   * Dismiss the update notification without applying it
   * User can still apply the update later through the indicator
   */
  dismissUpdate(): void {
    this.updateAvailable.set(false);
    this.updateVersionInfo.set(null);
  }
}
