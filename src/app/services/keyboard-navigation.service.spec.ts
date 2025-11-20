// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { KeyboardNavigationService } from './keyboard-navigation.service';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';
import { NavigationHistoryService } from './navigation-history.service';

describe('KeyboardNavigationService', () => {
  let service: KeyboardNavigationService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockCommandRegistry: jasmine.SpyObj<CommandRegistryService>;
  let mockScrollService: jasmine.SpyObj<ScrollService>;
  let mockNavigationHistory: jasmine.SpyObj<NavigationHistoryService>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/top',
    });
    mockCommandRegistry = jasmine.createSpyObj('CommandRegistryService', ['register']);
    mockScrollService = jasmine.createSpyObj('ScrollService', ['scrollElementIntoView']);
    mockNavigationHistory = jasmine.createSpyObj('NavigationHistoryService', ['pushCurrentState']);

    TestBed.configureTestingModule({
      providers: [
        KeyboardNavigationService,
        { provide: Router, useValue: mockRouter },
        { provide: CommandRegistryService, useValue: mockCommandRegistry },
        { provide: ScrollService, useValue: mockScrollService },
        { provide: NavigationHistoryService, useValue: mockNavigationHistory },
      ],
    });

    service = TestBed.inject(KeyboardNavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Tab Navigation', () => {
    it('should navigate to next tab', () => {
      // Mock private method access or use registered command
      // Since we can't easily access private methods in tests without casting to any,
      // we'll test the logic by invoking the method if it was public, or by using the command handler if we could trigger it.
      // But the command handler is registered in constructor.

      // Let's use bracket notation to access private method for testing logic
      service['navigateToTab']('next');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/best']);
    });

    it('should navigate to previous tab', () => {
      service['navigateToTab']('prev');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']); // top -> prev -> settings (last)
    });

    it('should navigate from settings to top (next)', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/settings', writable: true });

      service['navigateToTab']('next');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/top']);
    });

    it('should navigate from settings to jobs (prev)', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/settings', writable: true });

      service['navigateToTab']('prev');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/jobs']);
    });

    it('should navigate from jobs to settings (next)', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/jobs', writable: true });

      service['navigateToTab']('next');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']);
    });
  });
});
