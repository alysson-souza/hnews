// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { NavigationHistoryService, StateRestorationCallbacks } from './navigation-history.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';

describe('NavigationHistoryService', () => {
  let service: NavigationHistoryService;
  let routerEventsSubject: Subject<NavigationEnd>;
  let mockRouter: {
    url: string;
    events: Subject<NavigationEnd>;
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    routerEventsSubject = new Subject<NavigationEnd>();
    mockRouter = {
      url: '/top',
      events: routerEventsSubject,
      navigateByUrl: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [NavigationHistoryService, { provide: Router, useValue: mockRouter }],
    });

    service = TestBed.inject(NavigationHistoryService);
  });

  describe('pushCurrentState', () => {
    it('should push state to stack', () => {
      service.pushCurrentState(5, 'top');
      expect(service.canGoBack()).toBe(true);
      expect(service.peekPreviousState()).toEqual({
        url: '/top',
        selectedIndex: 5,
        storyType: 'top',
      });
    });

    it('should update existing state if URL matches', () => {
      service.pushCurrentState(5, 'top');
      service.pushCurrentState(10, 'top');

      expect(service.peekPreviousState()?.selectedIndex).toBe(10);
    });

    it('should push new state for different URL', () => {
      service.pushCurrentState(5, 'top');
      mockRouter.url = '/best';
      service.pushCurrentState(3, 'best');

      expect(service.canGoBack()).toBe(true);
      const state = service.peekPreviousState();
      expect(state?.url).toBe('/best');
      expect(state?.selectedIndex).toBe(3);
    });
  });

  describe('goBack', () => {
    it('should return null if stack is empty', () => {
      const result = service.goBack();
      expect(result).toBeNull();
    });

    it('should pop state and navigate', () => {
      service.pushCurrentState(5, 'top');
      const result = service.goBack();

      expect(result).toEqual({
        url: '/top',
        selectedIndex: 5,
        storyType: 'top',
      });
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/top');
    });
  });

  describe('canGoBack', () => {
    it('should return false when stack is empty', () => {
      expect(service.canGoBack()).toBe(false);
    });

    it('should return true when stack has items', () => {
      service.pushCurrentState(5);
      expect(service.canGoBack()).toBe(true);
    });
  });

  describe('clearStack', () => {
    it('should clear all items from stack', () => {
      service.pushCurrentState(5);
      service.clearStack();
      expect(service.canGoBack()).toBe(false);
    });
  });

  describe('navigateBackWithRestore', () => {
    let mockCallbacks: StateRestorationCallbacks;

    beforeEach(() => {
      mockCallbacks = {
        setSelectedIndex: vi.fn(),
        scrollSelectedIntoView: vi.fn().mockResolvedValue(undefined),
      };
    });

    it('should return null if no history', async () => {
      const result = await service.navigateBackWithRestore(mockCallbacks);
      expect(result).toBeNull();
      expect(mockCallbacks.setSelectedIndex).not.toHaveBeenCalled();
    });

    it('should navigate and restore state', async () => {
      service.pushCurrentState(5, 'top');

      // Start the navigateBackWithRestore call
      const promise = service.navigateBackWithRestore(mockCallbacks);

      // Simulate NavigationEnd event shortly after
      setTimeout(() => {
        routerEventsSubject.next(new NavigationEnd(1, '/top', '/top'));
      }, 10);

      const result = await promise;

      expect(result?.selectedIndex).toBe(5);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/top');
      expect(mockCallbacks.setSelectedIndex).toHaveBeenCalledWith(5);
      expect(mockCallbacks.scrollSelectedIntoView).toHaveBeenCalled();
    });

    it('should not restore state if selectedIndex is null', async () => {
      service.pushCurrentState(null, 'top');

      const promise = service.navigateBackWithRestore(mockCallbacks);

      setTimeout(() => {
        routerEventsSubject.next(new NavigationEnd(1, '/top', '/top'));
      }, 10);

      const result = await promise;

      expect(result?.selectedIndex).toBeNull();
      expect(mockCallbacks.setSelectedIndex).not.toHaveBeenCalled();
    });

    it('should handle timeout gracefully', async () => {
      service.pushCurrentState(5, 'top');

      // Don't emit NavigationEnd - let it timeout
      const result = await service.navigateBackWithRestore(mockCallbacks);

      // Should still complete and restore state after timeout
      expect(result?.selectedIndex).toBe(5);
      expect(mockCallbacks.setSelectedIndex).toHaveBeenCalledWith(5);
    }, 1000); // Allow extra time for this test
  });
});
