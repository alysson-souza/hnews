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
    describe('with meaningful version changes', () => {
      const mockVersionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
        latestVersion: {
          hash: 'def456',
          appData: { version: '1.1.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
      };

      beforeEach(() => {
        versionUpdatesSubject.next(mockVersionEvent);
      });

      it('should set updateAvailable to true', (done) => {
        // Use setTimeout to allow async validation to complete
        setTimeout(() => {
          expect(service.updateAvailable()).toBe(true);
          done();
        }, 0);
      });

      it('should store version information correctly', (done) => {
        // Use setTimeout to allow async validation to complete
        setTimeout(() => {
          const versionInfo = service.updateVersionInfo();
          expect(versionInfo).toEqual({
            current: 'abc123',
            available: 'def456',
          });
          done();
        }, 0);
      });
    });

    describe('with non-meaningful changes', () => {
      const mockVersionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
        latestVersion: {
          hash: 'def456',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
      };

      beforeEach(() => {
        versionUpdatesSubject.next(mockVersionEvent);
      });

      it('should NOT set updateAvailable to true', (done) => {
        // Use setTimeout to allow async validation to complete
        setTimeout(() => {
          expect(service.updateAvailable()).toBe(false);
          done();
        }, 0);
      });

      it('should NOT store version information', (done) => {
        // Use setTimeout to allow async validation to complete
        setTimeout(() => {
          const versionInfo = service.updateVersionInfo();
          expect(versionInfo).toBeNull();
          done();
        }, 0);
      });
    });
  });

  describe('applyUpdate()', () => {
    beforeEach((done) => {
      // Set up an available update first with meaningful version change
      const versionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
        latestVersion: {
          hash: 'def456',
          appData: { version: '1.1.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
      };
      versionUpdatesSubject.next(versionEvent);

      // Wait for async validation to complete
      setTimeout(done, 0);
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
      // Should restore version info when activation fails
      expect(service.updateVersionInfo()).toEqual({
        current: 'abc123',
        available: 'def456',
      });
    });
  });

  describe('dismissUpdate()', () => {
    beforeEach((done) => {
      // Set up an available update first with meaningful version change
      const versionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
        latestVersion: {
          hash: 'def456',
          appData: { version: '1.1.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
      };
      versionUpdatesSubject.next(versionEvent);

      // Wait for async validation to complete
      setTimeout(done, 0);
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

  describe('isMeaningfulUpdate method', () => {
    let serviceWithAccess: PwaUpdateService & {
      isMeaningfulUpdate: (
        current: { hash: string; appData?: Record<string, unknown> },
        latest: { hash: string; appData?: Record<string, unknown> },
      ) => Promise<boolean>;
    };

    beforeEach(() => {
      serviceWithAccess = service as PwaUpdateService & {
        isMeaningfulUpdate: (
          current: { hash: string; appData?: Record<string, unknown> },
          latest: { hash: string; appData?: Record<string, unknown> },
        ) => Promise<boolean>;
      };
    });

    describe('same hash detection', () => {
      it('should return false when hashes are identical', async () => {
        const current = { hash: 'same123', appData: {} };
        const latest = { hash: 'same123', appData: {} };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(false);
      });
    });

    describe('production mode validation', () => {
      it('should return true when version changes', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        };
        const latest = {
          hash: 'def456',
          appData: { version: '1.1.0', commit: 'commit1', buildTime: '2024-01-01' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(true);
      });

      it('should return true when commit changes', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        };
        const latest = {
          hash: 'def456',
          appData: { version: '1.0.0', commit: 'commit2', buildTime: '2024-01-01' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(true);
      });

      it('should return true when buildTime changes', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        };
        const latest = {
          hash: 'def456',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-02' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(true);
      });

      it('should return false when all version info is identical despite hash change', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        };
        const latest = {
          hash: 'def456',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(false);
      });
    });

    describe('development mode validation', () => {
      it('should return true only when commit changes in development mode', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: 'development', commit: 'commit1', buildTime: '2024-01-01' },
        };
        const latest = {
          hash: 'def456',
          appData: { version: 'development', commit: 'commit2', buildTime: '2024-01-01' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(true);
      });

      it('should return false when only buildTime changes in development mode', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: 'development', commit: 'commit1', buildTime: '2024-01-01' },
        };
        const latest = {
          hash: 'def456',
          appData: { version: 'development', commit: 'commit1', buildTime: '2024-01-02' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(false);
      });

      it('should return false when only version changes from development to development', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: 'development', commit: 'commit1', buildTime: '2024-01-01' },
        };
        const latest = {
          hash: 'def456',
          appData: { version: 'development', commit: 'commit1', buildTime: '2024-01-01' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(false);
      });
    });

    describe('missing appData handling', () => {
      it('should handle missing appData gracefully', async () => {
        const current = { hash: 'abc123' };
        const latest = { hash: 'def456' };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(false); // Should be false since all values will be 'unknown'
      });

      it('should handle partial appData gracefully', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: '1.0.0' }, // Missing commit and buildTime
        };
        const latest = {
          hash: 'def456',
          appData: { version: '1.0.0' }, // Missing commit and buildTime
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle null/undefined appData values', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: null, commit: undefined, buildTime: '' },
        };
        const latest = {
          hash: 'def456',
          appData: { version: null, commit: undefined, buildTime: '' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(false);
      });
    });
  });

  describe('integrated update detection with validation', () => {
    let consoleSpy: jasmine.Spy;

    beforeEach(() => {
      consoleSpy = spyOn(console, 'log');
    });

    it('should log detailed update information when VERSION_READY is received', (done) => {
      const mockVersionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
        latestVersion: {
          hash: 'def456',
          appData: { version: '1.1.0', commit: 'commit2', buildTime: '2024-01-02' },
        },
      };

      versionUpdatesSubject.next(mockVersionEvent);

      // Use setTimeout to allow async validation to complete
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'PWA Update: VERSION_READY detected',
          jasmine.any(Object),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          'PWA Update: Version comparison',
          jasmine.any(Object),
        );
        expect(consoleSpy).toHaveBeenCalledWith('PWA Update: Is meaningful update?', true);
        done();
      }, 0);
    });

    it('should ignore non-meaningful updates and log accordingly', (done) => {
      const mockVersionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
        latestVersion: {
          hash: 'def456',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
      };

      versionUpdatesSubject.next(mockVersionEvent);

      // Use setTimeout to allow async validation to complete
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'PWA Update: VERSION_READY detected',
          jasmine.any(Object),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          'PWA Update: Version comparison',
          jasmine.any(Object),
        );
        expect(consoleSpy).toHaveBeenCalledWith('PWA Update: Is meaningful update?', false);
        expect(consoleSpy).toHaveBeenCalledWith(
          'PWA Update: Ignoring non-meaningful update (same version/commit)',
        );
        expect(service.updateAvailable()).toBe(false);
        done();
      }, 0);
    });

    it('should show update indicator for meaningful updates', (done) => {
      const mockVersionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: {
          hash: 'abc123',
          appData: { version: '1.0.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
        latestVersion: {
          hash: 'def456',
          appData: { version: '1.1.0', commit: 'commit1', buildTime: '2024-01-01' },
        },
      };

      versionUpdatesSubject.next(mockVersionEvent);

      // Use setTimeout to allow async validation to complete
      setTimeout(() => {
        expect(service.updateAvailable()).toBe(true);
        expect(service.updateVersionInfo()).toEqual({
          current: 'abc123',
          available: 'def456',
        });
        done();
      }, 0);
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
