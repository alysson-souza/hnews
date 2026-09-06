// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { DeviceService } from './device.service';

describe('DeviceService', () => {
  let service: DeviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  describe('Device Detection', () => {
    it('should correctly classify device types based on width', () => {
      service = TestBed.inject(DeviceService);

      // Test the logic rather than actual window dimensions
      const deviceType = service.getDeviceType();
      expect(['mobile', 'tablet', 'desktop']).toContain(deviceType);

      // Verify consistency between methods
      if (service.isMobile()) {
        expect(service.getDeviceType()).toBe('mobile');
        expect(service.isTablet()).toBe(false);
        expect(service.isDesktop()).toBe(false);
      } else if (service.isTablet()) {
        expect(service.getDeviceType()).toBe('tablet');
        expect(service.isMobile()).toBe(false);
        expect(service.isDesktop()).toBe(false);
      } else if (service.isDesktop()) {
        expect(service.getDeviceType()).toBe('desktop');
        expect(service.isMobile()).toBe(false);
        expect(service.isTablet()).toBe(false);
      }
    });
  });

  describe('Orientation Change Handling', () => {
    it('should listen to orientationchange events', () => {
      service = TestBed.inject(DeviceService);

      // Create spy to verify event listener is attached
      const eventSpy = vi.spyOn(window, 'addEventListener');

      // Create a new service instance to trigger constructor
      const testService = new DeviceService();

      // Verify orientationchange listener was registered
      const calls = vi.mocked(eventSpy).mock.calls;
      const orientationCall = calls.find((call) => call[0] === 'orientationchange');
      expect(orientationCall).toBeDefined();

      // Clean up
      testService.ngOnDestroy();
    });

    it('should set CSS custom properties for viewport dimensions on initialization', () => {
      service = TestBed.inject(DeviceService);

      const computedStyle = getComputedStyle(document.documentElement);
      const viewportWidth = computedStyle.getPropertyValue('--viewport-width');
      const viewportHeight = computedStyle.getPropertyValue('--viewport-height');
      const vh = computedStyle.getPropertyValue('--vh');

      // Properties should be set
      expect(viewportWidth.trim()).toBeTruthy();
      expect(viewportHeight.trim()).toBeTruthy();
      expect(vh.trim()).toBeTruthy();

      // Should contain 'px' unit
      expect(viewportWidth).toContain('px');
      expect(viewportHeight).toContain('px');
      expect(vh).toContain('px');
    });
  });

  describe('Platform Detection', () => {
    it('should detect macOS/iOS devices', () => {
      const originalUserAgent = window.navigator.userAgent;
      let macService: DeviceService | undefined;
      let windowsService: DeviceService | undefined;
      try {
        Object.defineProperty(window.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
          configurable: true,
        });
        macService = new DeviceService();
        expect(macService.isMacOS()).toBe(true);
        expect(macService.getModifierKey()).toBe('Cmd');

        Object.defineProperty(window.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          configurable: true,
        });
        windowsService = new DeviceService();
        expect(windowsService.isMacOS()).toBe(false);
        expect(windowsService.getModifierKey()).toBe('Ctrl');
      } finally {
        Object.defineProperty(window.navigator, 'userAgent', {
          value: originalUserAgent,
          configurable: true,
        });
        macService?.ngOnDestroy();
        windowsService?.ngOnDestroy();
      }
    });
  });

  describe('Keyboard Hints', () => {
    it('should show keyboard hints only on desktop', () => {
      const originalWidth = window.innerWidth;
      const originalVisualViewport = window.visualViewport;
      let desktopService: DeviceService | undefined;
      let mobileService: DeviceService | undefined;
      try {
        Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
        Object.defineProperty(window, 'visualViewport', {
          value: {
            width: 1280,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          } as unknown as VisualViewport,
          configurable: true,
        });
        desktopService = new DeviceService();
        expect(desktopService.shouldShowKeyboardHints()).toBe(true);

        Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
        Object.defineProperty(window, 'visualViewport', {
          value: {
            width: 375,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          } as unknown as VisualViewport,
          configurable: true,
        });
        mobileService = new DeviceService();
        expect(mobileService.shouldShowKeyboardHints()).toBe(false);
      } finally {
        Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true });
        Object.defineProperty(window, 'visualViewport', {
          value: originalVisualViewport,
          configurable: true,
        });
        desktopService?.ngOnDestroy();
        mobileService?.ngOnDestroy();
      }
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up event listeners on destroy', () => {
      // Create spy on removeEventListener
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Create a new service instance
      const testService = new DeviceService();

      // Destroy it
      testService.ngOnDestroy();

      // Verify event listeners were removed
      const calls = vi.mocked(removeEventListenerSpy).mock.calls;
      const resizeCall = calls.find((call) => call[0] === 'resize');
      const orientationCall = calls.find((call) => call[0] === 'orientationchange');

      expect(resizeCall).toBeDefined();
      expect(orientationCall).toBeDefined();
    });

    it('should clear pending timers on destroy', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      const testService = new DeviceService();

      // Trigger a resize to start the timer
      window.dispatchEvent(new Event('resize'));

      // Destroy should clear the timer
      testService.ngOnDestroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
