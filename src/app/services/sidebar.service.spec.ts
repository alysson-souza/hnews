// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, NavigationStart, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { SidebarService } from './sidebar.service';

class MockRouter {
  private subject = new Subject<Event>();
  events = this.subject.asObservable();

  emitNavigationEnd(id = 1, url = '/test'): void {
    this.subject.next(new NavigationEnd(id, url, url));
  }

  emitNavigationStart(id = 1, url = '/test'): void {
    this.subject.next(new NavigationStart(id, url));
  }

  destroy(): void {
    this.subject.complete();
  }
}

describe('SidebarService', () => {
  let service: SidebarService;
  let mockRouter: MockRouter;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [SidebarService, { provide: Router, useClass: MockRouter }],
    });

    service = TestBed.inject(SidebarService);
    mockRouter = TestBed.inject(Router) as unknown as MockRouter;
  });

  afterEach(() => {
    mockRouter.destroy();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with closed sidebar and null item ID', () => {
      expect(service.isOpen()).toBe(false);
      expect(service.currentItemId()).toBeNull();
    });

    it('should subscribe to router events on construction', () => {
      vi.spyOn(service, 'closeSidebar');

      // Open sidebar first so we can verify it gets closed
      service.openSidebar(123);
      expect(service.isOpen()).toBe(true);

      // Emit navigation event
      mockRouter.emitNavigationEnd();

      expect(service.closeSidebar).toHaveBeenCalled();
    });
  });

  describe('core functionality', () => {
    it('should open sidebar with item ID', () => {
      service.openSidebar(123);

      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(123);
    });

    it('should close sidebar and clear item ID after delay', () => {
      // Open sidebar first
      service.openSidebar(456);
      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(456);

      // Close sidebar
      service.closeSidebar();
      expect(service.isOpen()).toBe(false);
      expect(service.currentItemId()).toBe(456); // Still set for animation

      // Wait for timeout
      vi.advanceTimersByTime(300);
      expect(service.currentItemId()).toBeNull();
    });

    it('should not clear item ID if sidebar is reopened during animation', () => {
      service.openSidebar(789);
      service.closeSidebar();

      // Reopen before timeout
      vi.advanceTimersByTime(150);
      service.openSidebar(999);

      // Complete original timeout
      vi.advanceTimersByTime(200);

      // Item ID should not be cleared because sidebar is open again
      expect(service.currentItemId()).toBe(999);
      expect(service.isOpen()).toBe(true);
    });

    it('should toggle sidebar when closed', () => {
      expect(service.isOpen()).toBe(false);

      service.toggleSidebar(456);

      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(456);
    });

    it('should close sidebar when toggling with same item', () => {
      service.openSidebar(456);
      expect(service.isOpen()).toBe(true);

      service.toggleSidebar(456);

      expect(service.isOpen()).toBe(false);
    });

    it('should switch to new item when toggling with different item', () => {
      service.openSidebar(123);
      expect(service.currentItemId()).toBe(123);

      service.toggleSidebar(456);

      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(456);
    });
  });

  describe('router event handling', () => {
    it('should close sidebar on NavigationEnd when sidebar is open', () => {
      service.openSidebar(123);
      expect(service.isOpen()).toBe(true);

      mockRouter.emitNavigationEnd();

      expect(service.isOpen()).toBe(false);
    });

    it('should not affect sidebar when already closed', () => {
      expect(service.isOpen()).toBe(false);
      expect(service.currentItemId()).toBeNull();

      mockRouter.emitNavigationEnd();

      expect(service.isOpen()).toBe(false);
      expect(service.currentItemId()).toBeNull();
    });

    it('should ignore non-NavigationEnd router events', () => {
      service.openSidebar(456);
      expect(service.isOpen()).toBe(true);

      mockRouter.emitNavigationStart();

      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(456);
    });

    it('should handle multiple NavigationEnd events correctly', () => {
      // First navigation
      service.openSidebar(123);
      mockRouter.emitNavigationEnd(1, '/page1');
      expect(service.isOpen()).toBe(false);

      // Second navigation
      service.openSidebar(456);
      mockRouter.emitNavigationEnd(2, '/page2');
      expect(service.isOpen()).toBe(false);
    });

    it('should close sidebar with different URLs', () => {
      service.openSidebar(789);

      mockRouter.emitNavigationEnd(1, '/different-page');

      expect(service.isOpen()).toBe(false);
    });
  });

  describe('signal behavior', () => {
    it('should have reactive signals for isOpen and currentItemId', () => {
      // Test initial values
      expect(service.isOpen()).toBe(false);
      expect(service.currentItemId()).toBeNull();

      // Test opening changes both signals
      service.openSidebar(789);
      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(789);

      // Test closing changes isOpen immediately
      service.closeSidebar();
      expect(service.isOpen()).toBe(false);
      expect(service.currentItemId()).toBe(789); // Still set during animation
    });

    it('should allow signal composition and computed values', () => {
      let computedValue: string;

      TestBed.runInInjectionContext(() => {
        // Create a computed signal based on the service signals
        const computedSignal = () => {
          const isOpen = service.isOpen();
          const itemId = service.currentItemId();
          return isOpen ? `open-${itemId}` : 'closed';
        };
        computedValue = computedSignal();

        // Initial state
        expect(computedValue).toBe('closed');

        service.openSidebar(456);
        computedValue = computedSignal();
        expect(computedValue).toBe('open-456');

        service.closeSidebar();
        computedValue = computedSignal();
        expect(computedValue).toBe('closed');
      });
    });

    it('should maintain signal consistency during operations', () => {
      // Test toggle behavior maintains signal consistency
      service.toggleSidebar(123);
      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(123);

      service.toggleSidebar(123); // Same ID should close
      expect(service.isOpen()).toBe(false);

      service.toggleSidebar(456); // Different ID should open
      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(456);
    });
  });

  describe('edge cases', () => {
    it('should handle router events during close animation', () => {
      service.openSidebar(123);
      service.closeSidebar();

      // Emit navigation event during animation
      vi.advanceTimersByTime(150); // Halfway through 300ms timeout
      mockRouter.emitNavigationEnd();

      // Should still be closed
      expect(service.isOpen()).toBe(false);

      // Complete animation
      vi.advanceTimersByTime(200);
      expect(service.currentItemId()).toBeNull();
    });

    it('should handle rapid open/close operations', () => {
      service.openSidebar(111);
      service.closeSidebar();
      service.openSidebar(222);
      service.closeSidebar();
      service.openSidebar(333);

      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(333);

      // Fast forward through all timeouts
      vi.advanceTimersByTime(300);

      // Should still be open with latest item
      expect(service.isOpen()).toBe(true);
      expect(service.currentItemId()).toBe(333);
    });

    it('should handle opening with same item ID multiple times', () => {
      service.openSidebar(123);
      const firstState = {
        isOpen: service.isOpen(),
        itemId: service.currentItemId(),
      };

      service.openSidebar(123);

      expect(service.isOpen()).toBe(firstState.isOpen);
      expect(service.currentItemId()).toBe(firstState.itemId);
    });

    it('should handle navigation events when sidebar was never opened', () => {
      expect(service.isOpen()).toBe(false);
      expect(service.currentItemId()).toBeNull();

      mockRouter.emitNavigationEnd();

      expect(service.isOpen()).toBe(false);
      expect(service.currentItemId()).toBeNull();
    });

    it('should handle multiple rapid navigation events', () => {
      service.openSidebar(456);

      mockRouter.emitNavigationEnd(1, '/page1');
      mockRouter.emitNavigationEnd(2, '/page2');
      mockRouter.emitNavigationEnd(3, '/page3');

      expect(service.isOpen()).toBe(false);
    });
  });
});
