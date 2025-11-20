// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Subject } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { KeyboardContextService } from './keyboard-context.service';
import { SidebarService } from './sidebar.service';

describe('KeyboardContextService', () => {
  let service: KeyboardContextService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSidebarService: {
    isOpen: jasmine.Spy;
  };

  beforeEach(() => {
    // Create mock router with url property
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/',
      events: new Subject(),
    });

    // Create mock sidebar service with signal
    mockSidebarService = {
      isOpen: jasmine.createSpy().and.returnValue(false),
    };

    TestBed.configureTestingModule({
      providers: [
        KeyboardContextService,
        { provide: Router, useValue: mockRouter },
        { provide: SidebarService, useValue: mockSidebarService },
      ],
    });
  });

  describe('initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(KeyboardContextService);
      expect(service).toBeTruthy();
    });

    it('should initialize with default context when sidebar is closed', () => {
      mockSidebarService.isOpen.and.returnValue(false);
      service = TestBed.inject(KeyboardContextService);
      expect(service.currentContext()).toBe('default');
    });
  });

  describe('currentContext', () => {
    it('should return "sidebar" when sidebar is open', () => {
      mockSidebarService.isOpen.and.returnValue(true);

      // Re-create service to get updated context
      service = TestBed.inject(KeyboardContextService);

      expect(service.currentContext()).toBe('sidebar');
    });

    it('should return "default" when sidebar is closed', () => {
      mockSidebarService.isOpen.and.returnValue(false);

      service = TestBed.inject(KeyboardContextService);

      expect(service.currentContext()).toBe('default');
    });

    it('should prioritize sidebar context over route-based context', () => {
      // Even on story list, if sidebar is open, context should be 'sidebar'
      Object.defineProperty(mockRouter, 'url', { value: '/', writable: true });
      mockSidebarService.isOpen.and.returnValue(true);

      service = TestBed.inject(KeyboardContextService);

      expect(service.currentContext()).toBe('sidebar');
    });
  });

  describe('isOnStoryList', () => {
    it('should return true for root path', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeTrue();
    });

    it('should return true for /top', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/top', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeTrue();
    });

    it('should return true for /best', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/best', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeTrue();
    });

    it('should return true for /newest', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/newest', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeTrue();
    });

    it('should return true for /ask', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/ask', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeTrue();
    });

    it('should return true for /show', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/show', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeTrue();
    });

    it('should return true for /jobs', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/jobs', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeTrue();
    });

    it('should return true for story list paths with query parameters', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/top?page=2', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeTrue();
    });

    it('should return false for item page', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/item/123', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeFalse();
    });

    it('should return false for user page', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/user/john', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeFalse();
    });

    it('should return false for search page', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/search', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeFalse();
    });

    it('should return false for settings page', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/settings', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnStoryList()).toBeFalse();
    });
  });

  describe('isOnItemPage', () => {
    it('should return true for item page', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/item/123', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnItemPage()).toBeTrue();
    });

    it('should return true for item page with query params', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/item/456?comment=789', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnItemPage()).toBeTrue();
    });

    it('should return false for story list', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/top', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnItemPage()).toBeFalse();
    });

    it('should return false for user page', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/user/john', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnItemPage()).toBeFalse();
    });
  });

  describe('isOnUserPage', () => {
    it('should return true for /user path', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/user', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnUserPage()).toBeTrue();
    });

    it('should return true for user profile page', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/user/john', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnUserPage()).toBeTrue();
    });

    it('should return true for user page with query params', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/user?id=john', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnUserPage()).toBeTrue();
    });

    it('should return false for story list', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/top', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnUserPage()).toBeFalse();
    });

    it('should return false for item page', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/item/123', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnUserPage()).toBeFalse();
    });
  });

  describe('isOnSettingsPage', () => {
    it('should return true for settings page', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/settings', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnSettingsPage()).toBeTrue();
    });

    it('should return true for settings page with query params', () => {
      Object.defineProperty(mockRouter, 'url', {
        value: '/settings?tab=appearance',
        writable: true,
      });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnSettingsPage()).toBeTrue();
    });

    it('should return false for story list', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/top', writable: true });
      service = TestBed.inject(KeyboardContextService);
      expect(service.isOnSettingsPage()).toBeFalse();
    });
  });

  describe('signal behavior', () => {
    it('should have reactive computed signals', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/', writable: true });
      service = TestBed.inject(KeyboardContextService);

      // Test that these are signals (they should be callable)
      expect(typeof service.currentContext).toBe('function');
      expect(typeof service.isOnStoryList).toBe('function');
      expect(typeof service.isOnItemPage).toBe('function');
      expect(typeof service.isOnUserPage).toBe('function');
    });

    it('should compute current context based on sidebar state', () => {
      mockSidebarService.isOpen.and.returnValue(false);
      Object.defineProperty(mockRouter, 'url', { value: '/', writable: true });
      service = TestBed.inject(KeyboardContextService);

      // Initial state - sidebar closed
      expect(service.currentContext()).toBe('default');

      // Note: In actual usage, when sidebar signal updates, the computed signal
      // would automatically recompute. Testing this requires integration tests.
    });
  });

  describe('edge cases', () => {
    it('should handle empty URL', () => {
      Object.defineProperty(mockRouter, 'url', { value: '', writable: true });
      service = TestBed.inject(KeyboardContextService);

      expect(service.isOnStoryList()).toBeFalse();
      expect(service.isOnItemPage()).toBeFalse();
      expect(service.isOnUserPage()).toBeFalse();
    });

    it('should handle malformed URLs', () => {
      Object.defineProperty(mockRouter, 'url', { value: '////', writable: true });
      service = TestBed.inject(KeyboardContextService);

      expect(service.isOnStoryList()).toBeFalse();
    });

    it('should handle URLs with fragments', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/top#section', writable: true });
      service = TestBed.inject(KeyboardContextService);

      // Fragment should not affect story list detection
      expect(service.isOnStoryList()).toBeTrue();
    });

    it('should be case-sensitive for route matching', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/TOP', writable: true });
      service = TestBed.inject(KeyboardContextService);

      // Should not match because routes are case-sensitive
      expect(service.isOnStoryList()).toBeFalse();
    });

    it('should not match partial route names', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/topics', writable: true });
      service = TestBed.inject(KeyboardContextService);

      // Should not match '/top' because it's '/topics'
      expect(service.isOnStoryList()).toBeFalse();
    });
  });
});
