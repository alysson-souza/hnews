// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ThumbnailRecoveryService } from './thumbnail-recovery.service';
import { NetworkStateService } from './network-state.service';
import { PageLifecycleService } from './page-lifecycle.service';

class NetworkStateServiceStub {
  readonly isOnline = signal(true);
}

class PageLifecycleServiceStub {
  hiddenSince = signal<number | null>(null);
  isVisible = signal(true);
  resumeCount = signal(0);
  wasDiscarded = false;
}

describe('ThumbnailRecoveryService', () => {
  let service: ThumbnailRecoveryService;
  let networkState: NetworkStateServiceStub;
  let pageLifecycle: PageLifecycleServiceStub;

  beforeEach(() => {
    networkState = new NetworkStateServiceStub();
    pageLifecycle = new PageLifecycleServiceStub();

    TestBed.configureTestingModule({
      providers: [
        ThumbnailRecoveryService,
        { provide: NetworkStateService, useValue: networkState },
        { provide: PageLifecycleService, useValue: pageLifecycle },
      ],
    });

    service = TestBed.inject(ThumbnailRecoveryService);
  });

  it('starts with recovery version at zero', () => {
    expect(service.recoveryVersion()).toBe(0);
  });

  it('does not increment on a normal hide/show cycle', () => {
    pageLifecycle.isVisible.set(false);
    TestBed.flushEffects();

    pageLifecycle.isVisible.set(true);
    TestBed.flushEffects();

    expect(service.recoveryVersion()).toBe(0);
  });

  it('increments when the network comes back online', () => {
    networkState.isOnline.set(false);
    TestBed.flushEffects();

    networkState.isOnline.set(true);
    TestBed.flushEffects();

    expect(service.recoveryVersion()).toBe(1);
  });

  it('increments when resumeCount increases', () => {
    pageLifecycle.resumeCount.set(1);
    TestBed.flushEffects();

    expect(service.recoveryVersion()).toBe(1);
  });

  it('preserves discard-restore recovery on initial load', () => {
    pageLifecycle.resumeCount.set(1);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ThumbnailRecoveryService,
        { provide: NetworkStateService, useValue: networkState },
        { provide: PageLifecycleService, useValue: pageLifecycle },
      ],
    });

    service = TestBed.inject(ThumbnailRecoveryService);

    expect(service.recoveryVersion()).toBe(1);
  });
});
