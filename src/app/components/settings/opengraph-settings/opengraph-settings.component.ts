// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SectionTitleComponent } from '../../shared/section-title/section-title.component';
import { ApiKeyInputComponent } from '../../shared/api-key-input/api-key-input.component';
import { UserSettingsService } from '../../../services/user-settings.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-opengraph-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SectionTitleComponent,
    ApiKeyInputComponent,
    FontAwesomeModule,
  ],
  template: `
    <div class="space-y-6">
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Open Graph providers are disabled by default. Set an API key/App ID to enable a provider.
        For Microlink, enter <code class="px-1 rounded bg-gray-100 dark:bg-slate-800">free</code> to
        use the free tier.
      </p>

      <div class="space-y-6">
        <div class="provider-block" role="group" aria-label="Microlink settings">
          <app-section-title variant="subtitle">
            Microlink Key
            <a
              class="external-link"
              href="https://microlink.io"
              rel="noopener noreferrer"
              target="_blank"
              aria-label="Open Microlink in a new tab"
              title="Open Microlink"
            >
              <sup><fa-icon [icon]="faExternal" class="external-icon"></fa-icon></sup>
            </a>
          </app-section-title>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <app-api-key-input
              label="Microlink API Key"
              [value]="settings().opengraph.microlink.apiKey"
              (valueChange)="update('microlink', 'apiKey', $event)"
              [secret]="true"
              placeholder="your_api_key"
              hint="Leave empty to disable. Enter 'free' to use the free tier."
              [hideLabel]="true"
            />
          </div>
        </div>

        <div class="provider-block" role="group" aria-label="LinkPreview settings">
          <app-section-title variant="subtitle">
            LinkPreview Key
            <a
              class="external-link"
              href="https://www.linkpreview.net"
              rel="noopener noreferrer"
              target="_blank"
              aria-label="Open LinkPreview in a new tab"
              title="Open LinkPreview"
            >
              <sup><fa-icon [icon]="faExternal" class="external-icon"></fa-icon></sup>
            </a>
          </app-section-title>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <app-api-key-input
              label="LinkPreview API Key"
              [value]="settings().opengraph.linkpreview.apiKey"
              (valueChange)="update('linkpreview', 'apiKey', $event)"
              [secret]="true"
              placeholder="your_api_key"
              hint="Leave empty to disable"
              [hideLabel]="true"
            />
          </div>
        </div>

        <div class="provider-block" role="group" aria-label="OpenGraph.io settings">
          <app-section-title variant="subtitle">
            OpenGraph.io Key
            <a
              class="external-link"
              href="https://www.opengraph.io"
              rel="noopener noreferrer"
              target="_blank"
              aria-label="Open OpenGraph.io in a new tab"
              title="Open OpenGraph.io"
            >
              <sup><fa-icon [icon]="faExternal" class="external-icon"></fa-icon></sup>
            </a>
          </app-section-title>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <app-api-key-input
              label="OpenGraph.io API Key"
              [value]="settings().opengraph.opengraphio.appId"
              (valueChange)="update('opengraphio', 'appId', $event)"
              [secret]="true"
              placeholder="your_api_key"
              hint="Leave empty to disable"
              [hideLabel]="true"
            />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @reference '../../../../styles.css';
      .provider-block {
        @apply p-4 bg-gray-50 dark:bg-slate-900 rounded border border-transparent dark:border-slate-800;
      }
      .external-link {
        @apply inline-flex items-center text-gray-400 dark:text-slate-400;
      }
      .external-link:hover {
        @apply text-gray-600 dark:text-gray-300;
      }
      .external-icon {
        @apply text-xs;
      }
    `,
  ],
})
export class OpenGraphSettingsComponent {
  private svc = inject(UserSettingsService);
  settings = this.svc.settings;
  saved = signal(false);
  protected faExternal = faArrowUpRightFromSquare;

  update(
    provider: 'microlink' | 'linkpreview' | 'opengraphio',
    field: 'apiKey' | 'appId',
    value?: string,
  ) {
    const v = value?.trim() || undefined;
    if (provider === 'microlink' && field === 'apiKey') {
      this.svc.setMicrolinkApiKey(v);
    } else if (provider === 'linkpreview' && field === 'apiKey') {
      this.svc.setLinkPreviewApiKey(v);
    } else if (provider === 'opengraphio' && field === 'appId') {
      this.svc.setOpenGraphIoAppId(v);
    }
    this.flagSaved();
  }

  private flagSaved() {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 1200);
  }
}
