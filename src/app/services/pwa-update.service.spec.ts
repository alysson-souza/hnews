// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { ApplicationRef, NgZone } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject, of, Observable } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
  let service: PwaUpdateService;
  let mockSwUpdate: jasmine.SpyObj<SwUpdate>;
  let mockApplicationRef: Pick<ApplicationRef, 'isStable'> & { afterTick: Observable<unknown> };
  let versionUpdatesSubject: Subject<VersionEvent>;

  beforeEach(() => {
    versionUpdatesSubject = new Subject<VersionEvent>();

    mockSwUpdate = jasmine.createSpyObj(
      'SwUpdate',
      ['checkForUpdate', 'activateUpdate'],
      ['versionUpdates'],
    );

    mockApplicationRef = {
      isStable: of(true),
      afterTick: of(null),
    };

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: ApplicationRef, useValue: mockApplicationRef },
        // Provide a real NgZone so Angular's change detection scheduler can subscribe safely
        { provide: NgZone, useFactory: () => new NgZone({ enableLongStackTrace: false }) },
      ],
    });

    // Configure spies with proper return values
    mockSwUpdate.checkForUpdate.and.returnValue(Promise.resolve(false));
    mockSwUpdate.activateUpdate.and.returnValue(Promise.resolve(true));

    // Set up versionUpdates Observable
    Object.defineProperty(mockSwUpdate, 'isEnabled', {
      writable: true,
      value: true,
    });

    Object.defineProperty(mockSwUpdate, 'versionUpdates', {
      writable: true,
      value: versionUpdatesSubject.asObservable(),
    });

    service = TestBed.inject(PwaUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with updateAvailable set to false', () => {
    expect(service.updateAvailable()).toBe(false);
  });

  it('should initialize with updateVersionInfo set to null', () => {
    expect(service.updateVersionInfo()).toBeNull();
  });

  describe('when VERSION_READY event is received', () => {
    const mockVersionEvent: VersionEvent = {
      type: 'VERSION_READY',
      currentVersion: { hash: 'abc123' },
      latestVersion: { hash: 'def456' },
    };

    beforeEach(() => {
      versionUpdatesSubject.next(mockVersionEvent);
    });

    it('should set updateAvailable to true', () => {
      expect(service.updateAvailable()).toBe(true);
    });

    it('should store version information correctly', () => {
      const versionInfo = service.updateVersionInfo();
      expect(versionInfo).toEqual({
        current: 'abc123',
        available: 'def456',
      });
    });
  });

  describe('applyUpdate()', () => {
    beforeEach(() => {
      // Set up an available update first
      const versionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: { hash: 'abc123' },
        latestVersion: { hash: 'def456' },
      };
      versionUpdatesSubject.next(versionEvent);
    });

    it('should activate update and reload page when update is available', async () => {
      const serviceWithReload = service as unknown as { reloadPage: () => void };
      const reloadSpy = spyOn(serviceWithReload, 'reloadPage');

      await service.applyUpdate();

      expect(mockSwUpdate.activateUpdate).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
      expect(service.updateAvailable()).toBe(false);
      expect(service.updateVersionInfo()).toBeNull();
    });

    it('should do nothing when no update is available', async () => {
      // Reset to no update available
      service['updateAvailable'].set(false);
      const serviceWithReload = service as unknown as { reloadPage: () => void };
      const reloadSpy = spyOn(serviceWithReload, 'reloadPage');

      await service.applyUpdate();

      expect(mockSwUpdate.activateUpdate).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('should handle activation errors gracefully', async () => {
      const error = new Error('Activation failed');
      mockSwUpdate.activateUpdate.and.returnValue(Promise.reject(error));
      const consoleSpy = spyOn(console, 'error');
      const serviceWithReload = service as unknown as { reloadPage: () => void };
      const reloadSpy = spyOn(serviceWithReload, 'reloadPage');

      await service.applyUpdate();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to apply PWA update:', error);
      expect(reloadSpy).not.toHaveBeenCalled();
      // Should reset updateAvailable to true so user can try again
      expect(service.updateAvailable()).toBe(true);
    });
  });

  describe('dismissUpdate()', () => {
    beforeEach(() => {
      // Set up an available update first
      const versionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: { hash: 'abc123' },
        latestVersion: { hash: 'def456' },
      };
      versionUpdatesSubject.next(versionEvent);
    });

    it('should clear updateAvailable signal', () => {
      service.dismissUpdate();

      expect(service.updateAvailable()).toBe(false);
    });

    it('should clear updateVersionInfo signal', () => {
      service.dismissUpdate();

      expect(service.updateVersionInfo()).toBeNull();
    });
  });

  describe('constructor setup', () => {
    it('should check for updates periodically', () => {
      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
    });

    it('should handle service worker when available', () => {
      // Test that constructor doesn't fail when serviceWorker is available
      expect(() => {
        TestBed.inject(PwaUpdateService);
      }).not.toThrow();
    });
  });

  describe('when SwUpdate is disabled', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();

      const disabledSwUpdate = jasmine.createSpyObj('SwUpdate', [
        'checkForUpdate',
        'activateUpdate',
      ]);

      Object.defineProperty(disabledSwUpdate, 'isEnabled', {
        get: () => false,
        configurable: true,
      });

      Object.defineProperty(disabledSwUpdate, 'versionUpdates', {
        get: () => versionUpdatesSubject.asObservable(),
        configurable: true,
      });

      TestBed.configureTestingModule({
        providers: [
          PwaUpdateService,
          { provide: SwUpdate, useValue: disabledSwUpdate },
          { provide: ApplicationRef, useValue: mockApplicationRef },
          { provide: NgZone, useFactory: () => new NgZone({ enableLongStackTrace: false }) },
        ],
      });

      disabledSwUpdate.checkForUpdate.and.returnValue(Promise.resolve(false));
      disabledSwUpdate.activateUpdate.and.returnValue(Promise.resolve(true));

      service = TestBed.inject(PwaUpdateService);
    });

    it('should not crash when SwUpdate is disabled', () => {
      expect(service).toBeTruthy();
      expect(service.updateAvailable()).toBe(false);
    });
  });
});
