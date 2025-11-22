import type { MockedObject } from 'vitest';
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
  let mockRouter: MockedObject<Router>;
  let mockCommandRegistry: MockedObject<CommandRegistryService>;
  let mockScrollService: MockedObject<ScrollService>;
  let mockNavigationHistory: MockedObject<NavigationHistoryService>;

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn(),
      url: '/top',
    } as unknown as MockedObject<Router>;
    mockCommandRegistry = {
      register: vi.fn(),
    } as unknown as MockedObject<CommandRegistryService>;
    mockScrollService = {
      scrollElementIntoView: vi.fn(),
    } as unknown as MockedObject<ScrollService>;
    mockNavigationHistory = {
      pushCurrentState: vi.fn(),
    } as unknown as MockedObject<NavigationHistoryService>;

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
