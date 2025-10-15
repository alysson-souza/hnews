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
        console.log('PWA Update: VERSION_READY detected', {
          currentVersion: {
            hash: event.currentVersion.hash,
            appData: event.currentVersion.appData,
          },
          availableVersion: {
            hash: event.latestVersion.hash,
            appData: event.latestVersion.appData,
          },
        });

        // Check if this is a meaningful update (different version or commit)
        const isMeaningfulUpdate = await this.isMeaningfulUpdate(
          event.currentVersion as { hash: string; appData?: Record<string, unknown> },
          event.latestVersion as { hash: string; appData?: Record<string, unknown> },
        );

        console.log('PWA Update: Is meaningful update?', isMeaningfulUpdate);

        if (isMeaningfulUpdate) {
          // Update is available, don't auto-activate
          this.updateAvailable.set(true);
          this.updateVersionInfo.set({
            current: event.currentVersion.hash,
            available: event.latestVersion.hash,
          });
        } else {
          console.log('PWA Update: Ignoring non-meaningful update (same version/commit)');
        }
      }
    });
  }

  /**
   * Check if the update is meaningful (different version or commit)
   * to prevent false positives from minor asset changes
   */
  protected async isMeaningfulUpdate(
    currentVersion: { hash: string; appData?: Record<string, unknown> },
    latestVersion: { hash: string; appData?: Record<string, unknown> },
  ): Promise<boolean> {
    // If hashes are the same, no update needed
    if (currentVersion.hash === latestVersion.hash) {
      return false;
    }

    // Extract version information from appData
    const currentData = currentVersion.appData || {};
    const latestData = latestVersion.appData || {};

    const currentVersionInfo = {
      version: (currentData['version'] as string) || 'unknown',
      commit: (currentData['commit'] as string) || 'unknown',
      buildTime: (currentData['buildTime'] as string) || 'unknown',
    };

    const latestVersionInfo = {
      version: (latestData['version'] as string) || 'unknown',
      commit: (latestData['commit'] as string) || 'unknown',
      buildTime: (latestData['buildTime'] as string) || 'unknown',
    };

    console.log('PWA Update: Version comparison', {
      current: currentVersionInfo,
      latest: latestVersionInfo,
    });

    // Check if version, commit, or build time has changed
    const versionChanged = currentVersionInfo.version !== latestVersionInfo.version;
    const commitChanged = currentVersionInfo.commit !== latestVersionInfo.commit;
    const buildTimeChanged = currentVersionInfo.buildTime !== latestVersionInfo.buildTime;

    // In development mode, be more strict about what constitutes an update
    if (
      currentVersionInfo.version === 'development' ||
      latestVersionInfo.version === 'development'
    ) {
      // In development, only consider it an update if commit changed
      return commitChanged;
    }

    // In production, consider it meaningful if version, commit, or build time changed
    return versionChanged || commitChanged || buildTimeChanged;
  }

  /**
   * Apply the available PWA update and reload the page
   * Called when user clicks the update button or presses 'R'
   */
  async applyUpdate(): Promise<void> {
    if (!this.updateAvailable()) return;

    // Store current version info in case we need to restore it
    const currentVersionInfo = this.updateVersionInfo();

    try {
      // Activate the update first
      await this.updates.activateUpdate();

      // Clear the update signals after successful activation
      this.updateAvailable.set(false);
      this.updateVersionInfo.set(null);

      // Then reload the page
      this.reloadPage();
    } catch (error) {
      console.error('Failed to apply PWA update:', error);
      // If activation fails, restore signals so user can try again
      this.updateAvailable.set(true);
      if (currentVersionInfo) {
        this.updateVersionInfo.set(currentVersionInfo);
      }
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
