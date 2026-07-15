// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Component, signal } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { RefreshableRoute, RefreshStatus } from '@models/refresh';
import { PwaUpdateService } from '@services/pwa-update.service';

import { App } from './app';

@Component({ template: '' })
class LoadingRouteComponent implements RefreshableRoute {
  static instance: LoadingRouteComponent;
  readonly refreshStatus = signal<RefreshStatus>('loading');

  constructor() {
    LoadingRouteComponent.instance = this;
  }

  refresh(): void {}
}

describe('App refresh status integration', () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: '', component: LoadingRouteComponent }]),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: SwUpdate,
          useValue: {
            isEnabled: false,
            versionUpdates: { subscribe: () => ({ unsubscribe: () => undefined }) },
          },
        },
        {
          provide: PwaUpdateService,
          useValue: {
            updateAvailable: signal(false),
            updateVersionInfo: signal(null),
            applyUpdate: vi.fn(),
            dismissUpdate: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
  });

  it('renders and reacts to the active route loading status', async () => {
    const loadingButtons = fixture.nativeElement.querySelectorAll(
      'button[aria-label="Loading app"]',
    ) as NodeListOf<HTMLButtonElement>;

    expect(loadingButtons.length).toBeGreaterThan(0);
    for (const button of loadingButtons) {
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.querySelector('ng-icon')?.classList.contains('animate-spin')).toBe(true);
    }

    LoadingRouteComponent.instance.refreshStatus.set('idle');
    await fixture.whenStable();

    const idleButtons = fixture.nativeElement.querySelectorAll(
      'button[aria-label="Refresh app"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(idleButtons).toHaveLength(loadingButtons.length);
    for (const button of idleButtons) {
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-busy')).toBe('false');
      expect(button.querySelector('ng-icon')?.classList.contains('animate-spin')).toBe(false);
    }
  });
});
