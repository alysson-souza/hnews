// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable, ApplicationRef, inject } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { concat, interval } from 'rxjs';
import { first } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly appRef = inject(ApplicationRef);
  private readonly updates = inject(SwUpdate);

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
        try {
          await this.updates.activateUpdate();
        } finally {
          document.location.reload();
        }
      }
    });
  }
}
