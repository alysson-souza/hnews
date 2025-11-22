// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { NetworkStateService } from './network-state.service';

describe('NetworkStateService', () => {
  let service: NetworkStateService;
  let originalNavigatorOnLine: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    // Save original navigator.onLine value
    originalNavigatorOnLine = navigator.onLine;
  });

  afterEach(() => {
    vi.useRealTimers();
    // Restore navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalNavigatorOnLine,
    });
  });

  describe('initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(NetworkStateService);
      expect(service).toBeTruthy();
    });

    it('should initialize with current online state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      service = TestBed.inject(NetworkStateService);
      expect(service.isOnline()).toBe(true);
    });

    it('should initialize with offline state when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      service = TestBed.inject(NetworkStateService);
      expect(service.isOnline()).toBe(false);
      expect(service.offlineSince()).not.toBeNull();
    });

    it('should set offlineSince to null when starting online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      service = TestBed.inject(NetworkStateService);
      expect(service.offlineSince()).toBeNull();
    });

    it('should initialize connectionQuality as fast when online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      service = TestBed.inject(NetworkStateService);
      expect(service.connectionQuality()).toBe('fast');
    });

    it('should initialize connectionQuality as offline when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      service = TestBed.inject(NetworkStateService);
      expect(service.connectionQuality()).toBe('offline');
    });
  });

  describe('online/offline events', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      service = TestBed.inject(NetworkStateService);
    });

    it('should update isOnline when offline event is fired', () => {
      expect(service.isOnline()).toBe(true);
      window.dispatchEvent(new Event('offline'));
      expect(service.isOnline()).toBe(false);
    });

    it('should set offlineSince when going offline', () => {
      const beforeOffline = Date.now();
      window.dispatchEvent(new Event('offline'));
      const offlineSince = service.offlineSince();
      expect(offlineSince).not.toBeNull();
      expect(offlineSince!.getTime()).toBeGreaterThanOrEqual(beforeOffline);
    });

    it('should update connectionQuality to offline when offline event is fired', () => {
      window.dispatchEvent(new Event('offline'));
      expect(service.connectionQuality()).toBe('offline');
    });

    it('should update isOnline when online event is fired', () => {
      window.dispatchEvent(new Event('offline'));
      expect(service.isOnline()).toBe(false);
      window.dispatchEvent(new Event('online'));
      expect(service.isOnline()).toBe(true);
    });

    it('should clear offlineSince when going back online', () => {
      window.dispatchEvent(new Event('offline'));
      expect(service.offlineSince()).not.toBeNull();
      window.dispatchEvent(new Event('online'));
      expect(service.offlineSince()).toBeNull();
    });

    it('should update connectionQuality when going back online', () => {
      window.dispatchEvent(new Event('offline'));
      expect(service.connectionQuality()).toBe('offline');
      window.dispatchEvent(new Event('online'));
      expect(['fast', 'slow']).toContain(service.connectionQuality());
    });
  });

  describe('getConnectionStatus', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      service = TestBed.inject(NetworkStateService);
    });

    it('should return connection status object when online', () => {
      const status = service.getConnectionStatus();
      expect(status.isOnline).toBe(true);
      expect(status.quality).toBeTruthy();
      expect(status.offlineDuration).toBe(0);
    });

    it('should return connection status object when offline', () => {
      window.dispatchEvent(new Event('offline'));
      const status = service.getConnectionStatus();
      expect(status.isOnline).toBe(false);
      expect(status.quality).toBe('offline');
      expect(status.offlineDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isOffline', () => {
    beforeEach(() => {
      service = TestBed.inject(NetworkStateService);
    });

    it('should return true when offline', () => {
      window.dispatchEvent(new Event('offline'));
      expect(service.isOffline()).toBe(true);
    });

    it('should return false when online', () => {
      window.dispatchEvent(new Event('online'));
      expect(service.isOffline()).toBe(false);
    });
  });

  describe('offlineDuration', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      service = TestBed.inject(NetworkStateService);
    });

    it('should return 0 when online', () => {
      expect(service.offlineDuration()).toBe(0);
    });

    it('should return positive duration when offline', () => {
      window.dispatchEvent(new Event('offline'));
      vi.advanceTimersByTime(50);
      expect(service.offlineDuration()).toBeGreaterThan(0);
    });

    it('should reset to 0 when going back online', () => {
      window.dispatchEvent(new Event('offline'));
      vi.advanceTimersByTime(50);
      expect(service.offlineDuration()).toBeGreaterThan(0);
      window.dispatchEvent(new Event('online'));
      expect(service.offlineDuration()).toBe(0);
    });
  });

  describe('getOfflineDurationFormatted', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      service = TestBed.inject(NetworkStateService);
    });

    it('should return empty string when online', () => {
      window.dispatchEvent(new Event('online'));
      expect(service.getOfflineDurationFormatted()).toBe('');
    });

    it('should return seconds for short durations', () => {
      // Mock offlineSince to be 2 seconds ago
      const twoSecondsAgo = new Date(Date.now() - 2000);
      service.offlineSince.set(twoSecondsAgo);
      vi.advanceTimersByTime(10);
      const formatted = service.getOfflineDurationFormatted();
      expect(formatted).toContain('second');
    });

    it('should format singular second correctly', () => {
      // Mock offlineSince to be exactly 1 second ago
      const oneSecondAgo = new Date(Date.now() - 1000);
      service.offlineSince.set(oneSecondAgo);
      const formatted = service.getOfflineDurationFormatted();
      expect(formatted).toBe('1 second');
    });

    it('should format plural seconds correctly', () => {
      // Mock offlineSince to be 5 seconds ago
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      service.offlineSince.set(fiveSecondsAgo);
      const formatted = service.getOfflineDurationFormatted();
      expect(formatted).toContain('seconds');
    });

    it('should format minutes correctly', () => {
      // Mock offlineSince to be 2 minutes ago
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      service.offlineSince.set(twoMinutesAgo);
      const formatted = service.getOfflineDurationFormatted();
      expect(formatted).toBe('2 minutes');
    });

    it('should format singular minute correctly', () => {
      // Mock offlineSince to be 1 minute ago
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      service.offlineSince.set(oneMinuteAgo);
      const formatted = service.getOfflineDurationFormatted();
      expect(formatted).toBe('1 minute');
    });

    it('should format hours correctly', () => {
      // Mock offlineSince to be 3 hours ago
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      service.offlineSince.set(threeHoursAgo);
      const formatted = service.getOfflineDurationFormatted();
      expect(formatted).toBe('3 hours');
    });

    it('should format singular hour correctly', () => {
      // Mock offlineSince to be 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      service.offlineSince.set(oneHourAgo);
      const formatted = service.getOfflineDurationFormatted();
      expect(formatted).toBe('1 hour');
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on destroy', () => {
      service = TestBed.inject(NetworkStateService);
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      service.ngOnDestroy();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should not throw error when destroyed without window', () => {
      service = TestBed.inject(NetworkStateService);
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});
