// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { DeviceService } from './device.service';

describe('DeviceService', () => {
  let service: DeviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    service = TestBed.inject(DeviceService);
    expect(service).toBeTruthy();
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
      const eventSpy = spyOn(window, 'addEventListener').and.callThrough();

      // Create a new service instance to trigger constructor
      const testService = new DeviceService();

      // Verify orientationchange listener was registered
      const calls = eventSpy.calls.all();
      const orientationCall = calls.find((call) => call.args[0] === 'orientationchange');
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
      // Service is already created with the current userAgent
      // Just test with the current environment
      const isMac = /Mac|iPhone|iPad|iPod/.test(window.navigator.userAgent);
      expect(service.isMacOS()).toBe(isMac);
      expect(service.getModifierKey()).toBe(isMac ? 'Cmd' : 'Ctrl');
    });
  });

  describe('Keyboard Hints', () => {
    it('should show keyboard hints only on desktop', () => {
      service = TestBed.inject(DeviceService);

      const shouldShow = service.shouldShowKeyboardHints();
      const isDesktop = service.isDesktop();

      // Keyboard hints visibility should match desktop status
      expect(shouldShow).toBe(isDesktop);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up event listeners on destroy', () => {
      // Create spy on removeEventListener
      const removeEventListenerSpy = spyOn(window, 'removeEventListener').and.callThrough();

      // Create a new service instance
      const testService = new DeviceService();

      // Destroy it
      testService.ngOnDestroy();

      // Verify event listeners were removed
      const calls = removeEventListenerSpy.calls.all();
      const resizeCall = calls.find((call) => call.args[0] === 'resize');
      const orientationCall = calls.find((call) => call.args[0] === 'orientationchange');

      expect(resizeCall).toBeDefined();
      expect(orientationCall).toBeDefined();
    });

    it('should clear pending timers on destroy', () => {
      const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();

      const testService = new DeviceService();

      // Trigger a resize to start the timer
      window.dispatchEvent(new Event('resize'));

      // Destroy should clear the timer
      testService.ngOnDestroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
