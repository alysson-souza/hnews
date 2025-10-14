// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { CardComponent } from '../shared/card/card.component';
import { SectionTitleComponent } from '../shared/section-title/section-title.component';
import { PwaVersionInfoComponent } from '../pwa-version-info/pwa-version-info.component';
import {
  PwaUpdateStatusComponent,
  UpdateStatusType,
} from '../pwa-update-status/pwa-update-status.component';
import { PwaUpdateActionsComponent } from '../pwa-update-actions/pwa-update-actions.component';
import { PwaUpdateService } from '../../services/pwa-update.service';
import { DeviceService } from '../../services/device.service';
import { VERSION, BUILD_TIME, COMMIT_SHA_SHORT } from '../../version';

@Component({
  selector: 'app-pwa-update-section',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    CardComponent,
    SectionTitleComponent,
    PwaVersionInfoComponent,
    PwaUpdateStatusComponent,
    PwaUpdateActionsComponent,
  ],
  template: `
    @if (deviceService.isPWA()) {
      <app-card class="block setting-section" role="region" aria-label="PWA Updates">
        <div class="section-header">
          <fa-icon [icon]="faSync" class="section-icon"></fa-icon>
          <app-section-title>App Updates</app-section-title>
        </div>

        <div class="space-y-6">
          <app-pwa-version-info
            [version]="currentVersion"
            [commit]="currentCommit"
            [buildTime]="buildTime"
          ></app-pwa-version-info>

          <app-pwa-update-status [status]="updateStatus()"></app-pwa-update-status>

          <app-pwa-update-actions
            [isChecking]="isChecking()"
            [updateAvailable]="pwaUpdate.updateAvailable()"
            (checkForUpdate)="checkForUpdate()"
            (installUpdate)="installUpdate()"
          ></app-pwa-update-actions>

          @if (statusMessage()) {
            <div [class]="statusError() ? 'alert-danger' : 'alert-success'">
              {{ statusMessage() }}
            </div>
          }

          <p class="info-text">
            Updates are checked automatically every 15 minutes. Installing an update will restart
            the app.
          </p>
        </div>
      </app-card>
    }
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .setting-section {
        @apply relative overflow-hidden;
      }

      .section-header {
        @apply flex items-center gap-3 mb-6;
      }

      .section-icon {
        @apply text-lg text-gray-500 dark:text-gray-400 flex-shrink-0;
      }

      .alert-success {
        @apply p-4 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50;
      }

      .alert-danger {
        @apply p-4 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50;
      }

      .info-text {
        @apply text-sm text-gray-600 dark:text-gray-400;
      }
    `,
  ],
})
export class PwaUpdateSectionComponent implements OnInit {
  readonly pwaUpdate = inject(PwaUpdateService);
  readonly deviceService = inject(DeviceService);

  faSync = faSync;
  currentVersion = VERSION;
  currentCommit = COMMIT_SHA_SHORT;
  buildTime = BUILD_TIME;

  isChecking = signal(false);
  statusMessage = signal('');
  statusError = signal(false);

  updateStatus = computed<UpdateStatusType>(() => {
    if (this.isChecking()) return 'checking';
    if (this.pwaUpdate.updateAvailable()) return 'available';
    return 'none';
  });

  ngOnInit(): void {
    if (!this.pwaUpdate.updates.isEnabled) {
      this.showMessage('Service Worker is not enabled (development mode)', true);
    }
  }

  async checkForUpdate(): Promise<void> {
    this.isChecking.set(true);
    this.showMessage('Checking for updates...', false);

    try {
      const updateFound = await this.pwaUpdate.updates.checkForUpdate();

      if (updateFound) {
        this.showMessage('Update available!', false);
      } else {
        this.showMessage('You are running the latest version', false);
      }
    } catch (error) {
      console.error('Update check failed:', error);
      this.showMessage('Failed to check for updates', true);
    } finally {
      this.isChecking.set(false);
    }
  }

  async installUpdate(): Promise<void> {
    await this.pwaUpdate.applyUpdate();
  }

  private showMessage(msg: string, error: boolean): void {
    this.statusMessage.set(msg);
    this.statusError.set(error);
    setTimeout(() => this.statusMessage.set(''), 5000);
  }
}
