// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Injectable, effect, inject, signal } from '@angular/core';
import { NetworkStateService } from './network-state.service';
import { PageLifecycleService } from './page-lifecycle.service';

@Injectable({ providedIn: 'root' })
export class ThumbnailRecoveryService {
  private readonly networkState = inject(NetworkStateService);
  private readonly pageLifecycle = inject(PageLifecycleService);

  readonly recoveryVersion = signal(0);

  private previousOnline: boolean | null = null;
  private previousResumeCount: number | null = null;

  constructor() {
    effect(() => {
      const isOnline = this.networkState.isOnline();
      const resumeCount = this.pageLifecycle.resumeCount();

      if (this.previousOnline === null || this.previousResumeCount === null) {
        this.previousOnline = isOnline;
        this.previousResumeCount = resumeCount;
        if (resumeCount > 0) {
          this.recoveryVersion.set(resumeCount);
        }
        return;
      }

      const shouldRecover =
        resumeCount > this.previousResumeCount || (!this.previousOnline && isOnline);

      this.previousOnline = isOnline;
      this.previousResumeCount = resumeCount;

      if (shouldRecover) {
        this.recoveryVersion.update((version) => version + 1);
      }
    });
  }
}
