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
  let registeredCommands: Record<string, () => void | Promise<void>>;

  beforeEach(() => {
    registeredCommands = {};
    mockRouter = {
      navigate: vi.fn(),
      url: '/top',
    } as unknown as MockedObject<Router>;
    mockCommandRegistry = {
      register: vi.fn((commandId: string, handler: () => void | Promise<void>) => {
        registeredCommands[commandId] = handler;
      }),
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

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
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

  describe('Story opening', () => {
    it('should click the nested link when opening a story', () => {
      document.body.innerHTML = `
        <div data-story-index="0" data-story-id="123">
          <app-story-link class="story-link-trigger">
            <a href="https://example.com/story" target="_blank">Story</a>
          </app-story-link>
        </div>
      `;

      service.setTotalItems(1);
      service.setSelectedIndex(0);

      const host = document.querySelector('app-story-link') as HTMLElement;
      const hostClickSpy = vi.spyOn(host, 'click').mockImplementation(() => {});
      const anchor = host.querySelector('a') as HTMLAnchorElement;
      const anchorClickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});

      registeredCommands['story.open']();

      expect(anchorClickSpy).toHaveBeenCalled();
      expect(hostClickSpy).not.toHaveBeenCalled();
    });

    it('should open the nested link in a new tab for full page open', () => {
      document.body.innerHTML = `
        <div data-story-index="0" data-story-id="123">
          <app-story-link class="story-link-trigger">
            <a href="https://example.com/story" target="_blank">Story</a>
          </app-story-link>
        </div>
      `;

      service.setTotalItems(1);
      service.setSelectedIndex(0);

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      registeredCommands['story.openFull']();

      expect(openSpy).toHaveBeenCalledWith('https://example.com/story', '_blank', 'noopener');
    });

    it('should click the nested load more button on the last story', () => {
      document.body.innerHTML = `
        <app-button class="load-more-btn">
          <button type="button">Load More Stories</button>
        </app-button>
      `;

      service.setTotalItems(1);
      service.setSelectedIndex(0);

      const host = document.querySelector('.load-more-btn') as HTMLElement;
      const hostClickSpy = vi.spyOn(host, 'click').mockImplementation(() => {});
      const innerButton = host.querySelector('button') as HTMLButtonElement;
      const innerClickSpy = vi.spyOn(innerButton, 'click').mockImplementation(() => {});

      registeredCommands['story.next']();

      expect(innerClickSpy).toHaveBeenCalled();
      expect(hostClickSpy).not.toHaveBeenCalled();
    });

    it('should click the actions button when closing the actions menu', () => {
      document.body.innerHTML = `
        <div data-story-index="0" data-story-id="123">
          <h2 class="story-title">
            <app-story-link class="story-title-link story-link-trigger cursor-pointer">
              <a href="https://example.com/story" target="_blank" class="story-link">Story</a>
            </app-story-link>
          </h2>
          <div class="story-actions-container">
            <button type="button" class="story-actions-btn">More</button>
            <div class="story-actions-menu">Menu</div>
          </div>
        </div>
      `;

      service.setTotalItems(1);
      service.setSelectedIndex(0);

      const actionsButton = document.querySelector('.story-actions-btn') as HTMLButtonElement;
      const actionsClickSpy = vi.spyOn(actionsButton, 'click').mockImplementation(() => {});

      registeredCommands['story.actions.toggle']();

      expect(actionsClickSpy).toHaveBeenCalled();
    });
  });
});
