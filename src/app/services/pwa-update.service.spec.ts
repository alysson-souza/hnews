import type { Mock, MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject, of, Observable } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
  let service: PwaUpdateService;
  let mockSwUpdate: MockedObject<SwUpdate>;
  let mockApplicationRef: Pick<ApplicationRef, 'isStable'> & {
    afterTick: Observable<unknown>;
  };
  let versionUpdatesSubject: Subject<VersionEvent>;

  beforeEach(() => {
    vi.useFakeTimers();
    versionUpdatesSubject = new Subject<VersionEvent>();

    mockSwUpdate = {
      checkForUpdate: vi.fn(),
      activateUpdate: vi.fn(),
    } as unknown as MockedObject<SwUpdate>;

    mockApplicationRef = {
      isStable: of(true),
      afterTick: of(null),
    };

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        provideZonelessChangeDetection(),
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: ApplicationRef, useValue: mockApplicationRef },
      ],
    });

    // Configure spies with proper return values
    mockSwUpdate.checkForUpdate.mockReturnValue(Promise.resolve(false));
    mockSwUpdate.activateUpdate.mockReturnValue(Promise.resolve(true));

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

  afterEach(() => {
    vi.useRealTimers();
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

      it('should set updateAvailable to true', async () => {
        // Use setTimeout to allow async validation to complete
        vi.advanceTimersByTime(0);
        await Promise.resolve();
        expect(service.updateAvailable()).toBe(true);
      });

      it('should store version information correctly', async () => {
        // Use setTimeout to allow async validation to complete
        vi.advanceTimersByTime(0);
        await Promise.resolve();
        const versionInfo = service.updateVersionInfo();
        expect(versionInfo).toEqual({
          current: 'abc123',
          available: 'def456',
        });
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

      it('should NOT set updateAvailable to true', async () => {
        // Use setTimeout to allow async validation to complete
        vi.advanceTimersByTime(0);
        await Promise.resolve();
        expect(service.updateAvailable()).toBe(false);
      });

      it('should NOT store version information', async () => {
        // Use setTimeout to allow async validation to complete
        vi.advanceTimersByTime(0);
        await Promise.resolve();
        const versionInfo = service.updateVersionInfo();
        expect(versionInfo).toBeNull();
      });
    });

    describe('with hash-only updates', () => {
      const mockVersionEvent: VersionEvent = {
        type: 'VERSION_READY',
        currentVersion: { hash: 'abc123' },
        latestVersion: { hash: 'def456' },
      };

      beforeEach(() => {
        versionUpdatesSubject.next(mockVersionEvent);
      });

      it('should set updateAvailable to true when appData is missing', async () => {
        vi.advanceTimersByTime(0);
        await Promise.resolve();
        expect(service.updateAvailable()).toBe(true);
      });

      it('should store version information for hash-only updates', async () => {
        vi.advanceTimersByTime(0);
        await Promise.resolve();
        expect(service.updateVersionInfo()).toEqual({
          current: 'abc123',
          available: 'def456',
        });
      });
    });
  });

  describe('applyUpdate()', () => {
    beforeEach(async () => {
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
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    it('should activate update and reload page when update is available', async () => {
      const serviceWithReload = service as unknown as {
        reloadPage: () => void;
      };
      const reloadSpy = vi.spyOn(serviceWithReload, 'reloadPage');

      await service.applyUpdate();

      expect(mockSwUpdate.activateUpdate).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
      expect(service.updateAvailable()).toBe(false);
      expect(service.updateVersionInfo()).toBeNull();
    });

    it('should do nothing when no update is available', async () => {
      // Reset to no update available
      service['updateAvailable'].set(false);
      const serviceWithReload = service as unknown as {
        reloadPage: () => void;
      };
      const reloadSpy = vi.spyOn(serviceWithReload, 'reloadPage');

      await service.applyUpdate();

      expect(mockSwUpdate.activateUpdate).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('should handle activation errors gracefully', async () => {
      const error = new Error('Activation failed');
      mockSwUpdate.activateUpdate.mockReturnValue(Promise.reject(error));
      const consoleSpy = vi.spyOn(console, 'error');
      const serviceWithReload = service as unknown as {
        reloadPage: () => void;
      };
      const reloadSpy = vi.spyOn(serviceWithReload, 'reloadPage');

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
    beforeEach(async () => {
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
      vi.advanceTimersByTime(0);
      await Promise.resolve();
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
        current: {
          hash: string;
          appData?: Record<string, unknown>;
        },
        latest: {
          hash: string;
          appData?: Record<string, unknown>;
        },
      ) => Promise<boolean>;
    };

    beforeEach(() => {
      serviceWithAccess = service as PwaUpdateService & {
        isMeaningfulUpdate: (
          current: {
            hash: string;
            appData?: Record<string, unknown>;
          },
          latest: {
            hash: string;
            appData?: Record<string, unknown>;
          },
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
      it('should treat missing appData as a meaningful hash change', async () => {
        const current = { hash: 'abc123' };
        const latest = { hash: 'def456' };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(true);
      });

      it('should treat partial appData as a meaningful hash change', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: '1.0.0' }, // Missing commit and buildTime
        };
        const latest = {
          hash: 'def456',
          appData: { version: '1.0.0' }, // Missing commit and buildTime
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(true);
      });

      it('should treat mixed metadata availability as a meaningful hash change', async () => {
        const current = { hash: 'abc123' };
        const latest = {
          hash: 'def456',
          appData: { version: '1.0.1', commit: 'commit2', buildTime: '2024-01-02' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should treat null/undefined appData values as a meaningful hash change', async () => {
        const current = {
          hash: 'abc123',
          appData: { version: null, commit: undefined, buildTime: '' },
        };
        const latest = {
          hash: 'def456',
          appData: { version: null, commit: undefined, buildTime: '' },
        };

        const result = await serviceWithAccess.isMeaningfulUpdate(current, latest);
        expect(result).toBe(true);
      });
    });
  });

  describe('integrated update detection with validation', () => {
    let consoleSpy: Mock;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log');
    });

    it('should log detailed update information when VERSION_READY is received', async () => {
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
      vi.advanceTimersByTime(0);
      await Promise.resolve();
      expect(consoleSpy).toHaveBeenCalledWith(
        'PWA Update: VERSION_READY detected',
        expect.any(Object),
      );
      expect(consoleSpy).toHaveBeenCalledWith('PWA Update: Version comparison', expect.any(Object));
      expect(consoleSpy).toHaveBeenCalledWith('PWA Update: Is meaningful update?', true);
    });

    it('should ignore non-meaningful updates and log accordingly', async () => {
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
      vi.advanceTimersByTime(0);
      await Promise.resolve();
      expect(consoleSpy).toHaveBeenCalledWith(
        'PWA Update: VERSION_READY detected',
        expect.any(Object),
      );
      expect(consoleSpy).toHaveBeenCalledWith('PWA Update: Version comparison', expect.any(Object));
      expect(consoleSpy).toHaveBeenCalledWith('PWA Update: Is meaningful update?', false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'PWA Update: Ignoring non-meaningful update (same version/commit)',
      );
      expect(service.updateAvailable()).toBe(false);
    });

    it('should show update indicator for meaningful updates', async () => {
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
      vi.advanceTimersByTime(0);
      await Promise.resolve();
      expect(service.updateAvailable()).toBe(true);
      expect(service.updateVersionInfo()).toEqual({
        current: 'abc123',
        available: 'def456',
      });
    });
  });

  describe('visibilitychange update check', () => {
    let visibilityState: 'visible' | 'hidden';
    let listeners: Map<string, EventListenerOrEventListenerObject[]>;

    beforeEach(() => {
      visibilityState = 'hidden';
      listeners = new Map();

      vi.spyOn(document, 'addEventListener').mockImplementation(
        (type: string, listener: EventListenerOrEventListenerObject) => {
          const existing = listeners.get(type) ?? [];
          existing.push(listener);
          listeners.set(type, existing);
        },
      );

      Object.defineProperty(document, 'visibilityState', {
        get: () => visibilityState,
        configurable: true,
      });

      // Re-create service so the mock addEventListener captures the listener
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          PwaUpdateService,
          provideZonelessChangeDetection(),
          { provide: SwUpdate, useValue: mockSwUpdate },
          { provide: ApplicationRef, useValue: mockApplicationRef },
        ],
      });
      mockSwUpdate.checkForUpdate.mockReturnValue(Promise.resolve(false));
      service = TestBed.inject(PwaUpdateService);
      // Clear call count from initial setup
      mockSwUpdate.checkForUpdate.mockClear();
      mockSwUpdate.checkForUpdate.mockReturnValue(Promise.resolve(false));
    });

    function fireVisibilityChange() {
      const handlers = listeners.get('visibilitychange') ?? [];
      for (const handler of handlers) {
        if (typeof handler === 'function') handler(new Event('visibilitychange'));
        else handler.handleEvent(new Event('visibilitychange'));
      }
    }

    it('should call checkForUpdate when tab becomes visible', () => {
      visibilityState = 'visible';
      fireVisibilityChange();

      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1);
    });

    it('should not call checkForUpdate when tab becomes hidden', () => {
      visibilityState = 'hidden';
      fireVisibilityChange();

      expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();
    });

    it('should debounce rapid visibility changes within 30 seconds', () => {
      visibilityState = 'visible';
      fireVisibilityChange();
      fireVisibilityChange();
      fireVisibilityChange();

      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1);
    });

    it('should check again after 30 seconds have elapsed', () => {
      visibilityState = 'visible';
      fireVisibilityChange();
      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(30_001);
      fireVisibilityChange();
      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('when SwUpdate is disabled', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();

      const disabledSwUpdate = {
        checkForUpdate: vi.fn(),
        activateUpdate: vi.fn(),
      };

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
          provideZonelessChangeDetection(),
          { provide: SwUpdate, useValue: disabledSwUpdate },
          { provide: ApplicationRef, useValue: mockApplicationRef },
        ],
      });

      disabledSwUpdate.checkForUpdate.mockReturnValue(Promise.resolve(false));
      disabledSwUpdate.activateUpdate.mockReturnValue(Promise.resolve(true));

      service = TestBed.inject(PwaUpdateService);
    });

    it('should not crash when SwUpdate is disabled', () => {
      expect(service).toBeTruthy();
      expect(service.updateAvailable()).toBe(false);
    });
  });
});
