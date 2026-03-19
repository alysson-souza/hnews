// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, OnDestroy, signal } from '@angular/core';

/** Threshold in ms: tab must be hidden longer than this to count as "dormant". */
const DORMANT_THRESHOLD = 30_000;

/**
 * Shared service for page lifecycle events (visibility, freeze/resume, discard).
 *
 * Extracts the visibility tracking that previously lived in StoryList and adds
 * support for detecting tab resume after dormancy, BFCache restore, and discard
 * recovery.
 */
@Injectable({ providedIn: 'root' })
export class PageLifecycleService implements OnDestroy {
  /** Timestamp when the tab was last hidden (null if visible). */
  readonly hiddenSince = signal<number | null>(null);

  /** Whether the tab is currently visible. */
  readonly isVisible = signal(true);

  /**
   * Monotonically increasing counter that bumps when the tab resumes after
   * being dormant (hidden > 30 s), restored from BFCache, or recovered from
   * a discard.  Components can watch this with `effect()` to refresh stale
   * UI (e.g. images whose decoded data was evicted).
   */
  readonly resumeCount = signal(0);

  /** True if the current page load was a discard recovery. */
  readonly wasDiscarded: boolean;

  private readonly visibilityHandler: () => void;
  private readonly pageshowHandler: (e: PageTransitionEvent) => void;

  constructor() {
    // SSR guard
    if (typeof document === 'undefined') {
      this.wasDiscarded = false;
      this.visibilityHandler = () => {};
      this.pageshowHandler = () => {};
      return;
    }

    // Detect discard recovery (Chromium-only API)
    this.wasDiscarded = !!(document as Document & { wasDiscarded?: boolean }).wasDiscarded;

    // If this is a discard recovery, bump resumeCount immediately
    if (this.wasDiscarded) {
      this.resumeCount.update((c) => c + 1);
    }

    // Initial state
    this.isVisible.set(document.visibilityState === 'visible');
    if (document.visibilityState === 'hidden') {
      this.hiddenSince.set(Date.now());
    }

    // --- visibilitychange ---
    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.hiddenSince.set(Date.now());
        this.isVisible.set(false);
      } else {
        const hiddenAt = this.hiddenSince();
        const wasDormant = hiddenAt !== null && Date.now() - hiddenAt > DORMANT_THRESHOLD;

        this.hiddenSince.set(null);
        this.isVisible.set(true);

        if (wasDormant) {
          this.resumeCount.update((c) => c + 1);
        }
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // --- pageshow (BFCache restore) ---
    this.pageshowHandler = (event: PageTransitionEvent) => {
      if (event.persisted) {
        this.hiddenSince.set(null);
        this.isVisible.set(true);
        this.resumeCount.update((c) => c + 1);
      }
    };
    window.addEventListener('pageshow', this.pageshowHandler);
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pageshow', this.pageshowHandler);
    }
  }
}
