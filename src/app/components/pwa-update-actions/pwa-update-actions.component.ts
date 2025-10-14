// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSync, faCloudDownload } from '@fortawesome/free-solid-svg-icons';
import { AppButtonComponent } from '../shared/app-button/app-button.component';

@Component({
  selector: 'app-pwa-update-actions',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, AppButtonComponent],
  template: `
    <div class="action-buttons">
      <app-button
        (clicked)="onCheckClick()"
        [disabled]="isChecking"
        variant="secondary"
        size="md"
        ariaLabel="Check for app updates"
      >
        <fa-icon [icon]="faSync" [class.animate-spin]="isChecking" class="mr-2"></fa-icon>
        {{ isChecking ? 'Checking...' : 'Check for Updates' }}
      </app-button>

      @if (updateAvailable) {
        <app-button
          (clicked)="onInstallClick()"
          variant="primary"
          size="md"
          ariaLabel="Install update and restart"
        >
          <fa-icon [icon]="faCloudDownload" class="mr-2"></fa-icon>
          Install Update
        </app-button>
      }
    </div>
  `,
  styles: [
    `
      @reference '../../../styles.css';

      .action-buttons {
        @apply flex flex-wrap items-center gap-3;
      }
    `,
  ],
})
export class PwaUpdateActionsComponent {
  @Input() isChecking = false;
  @Input() updateAvailable = false;
  @Output() checkForUpdate = new EventEmitter<void>();
  @Output() installUpdate = new EventEmitter<void>();

  faSync = faSync;
  faCloudDownload = faCloudDownload;

  onCheckClick(): void {
    this.checkForUpdate.emit();
  }

  onInstallClick(): void {
    this.installUpdate.emit();
  }
}
