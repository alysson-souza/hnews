// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { PageLifecycleService } from './page-lifecycle.service';

describe('PageLifecycleService', () => {
  let service: PageLifecycleService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(PageLifecycleService);
      expect(service).toBeTruthy();
    });

    it('should start visible when document is visible', () => {
      service = TestBed.inject(PageLifecycleService);
      expect(service.isVisible()).toBe(true);
      expect(service.hiddenSince()).toBeNull();
    });

    it('should have resumeCount at 0 initially', () => {
      service = TestBed.inject(PageLifecycleService);
      expect(service.resumeCount()).toBe(0);
    });

    it('should have wasDiscarded as false by default', () => {
      service = TestBed.inject(PageLifecycleService);
      expect(service.wasDiscarded).toBe(false);
    });
  });

  describe('discard recovery', () => {
    it('should detect wasDiscarded and bump resumeCount on creation', () => {
      Object.defineProperty(document, 'wasDiscarded', {
        value: true,
        writable: true,
        configurable: true,
      });

      service = TestBed.inject(PageLifecycleService);

      expect(service.wasDiscarded).toBe(true);
      expect(service.resumeCount()).toBe(1);

      // Clean up
      Object.defineProperty(document, 'wasDiscarded', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('visibilitychange events', () => {
    beforeEach(() => {
      service = TestBed.inject(PageLifecycleService);
    });

    it('should set hiddenSince when tab becomes hidden', () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(service.hiddenSince()).not.toBeNull();
      expect(service.isVisible()).toBe(false);
    });

    it('should clear hiddenSince when tab becomes visible', () => {
      // Go hidden first
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Come back visible (short duration — not dormant)
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(service.hiddenSince()).toBeNull();
      expect(service.isVisible()).toBe(true);
    });

    it('should NOT bump resumeCount for short hidden durations', () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // Only 5 seconds hidden — below the 30s threshold
      vi.advanceTimersByTime(5_000);

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(service.resumeCount()).toBe(0);
    });

    it('should bump resumeCount when hidden longer than 30 seconds', () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      // 31 seconds hidden — above threshold
      vi.advanceTimersByTime(31_000);

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(service.resumeCount()).toBe(1);
    });

    it('should bump resumeCount multiple times for repeated dormant cycles', () => {
      for (let i = 0; i < 3; i++) {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));

        vi.advanceTimersByTime(31_000);

        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      }

      expect(service.resumeCount()).toBe(3);
    });
  });

  describe('pageshow (BFCache restore)', () => {
    beforeEach(() => {
      service = TestBed.inject(PageLifecycleService);
    });

    it('should bump resumeCount on pageshow with persisted=true', () => {
      const event = new Event('pageshow') as Event & { persisted: boolean };
      Object.defineProperty(event, 'persisted', { value: true });
      window.dispatchEvent(event);

      expect(service.resumeCount()).toBe(1);
      expect(service.isVisible()).toBe(true);
      expect(service.hiddenSince()).toBeNull();
    });

    it('should NOT bump resumeCount on pageshow with persisted=false', () => {
      const event = new Event('pageshow') as Event & { persisted: boolean };
      Object.defineProperty(event, 'persisted', { value: false });
      window.dispatchEvent(event);

      expect(service.resumeCount()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on destroy', () => {
      service = TestBed.inject(PageLifecycleService);
      const removeDocSpy = vi.spyOn(document, 'removeEventListener');
      const removeWinSpy = vi.spyOn(window, 'removeEventListener');

      service.ngOnDestroy();

      expect(removeDocSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(removeWinSpy).toHaveBeenCalledWith('pageshow', expect.any(Function));
    });
  });
});
