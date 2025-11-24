import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SidebarKeyboardNavigationService } from './sidebar-keyboard-navigation.service';
import { SidebarCommentsInteractionService } from './sidebar-comments-interaction.service';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';
import { SidebarService } from './sidebar.service';

describe('SidebarKeyboardNavigationService', () => {
  let service: SidebarKeyboardNavigationService;
  let mockInteractionService: MockedObject<SidebarCommentsInteractionService>;
  let mockCommandRegistry: MockedObject<CommandRegistryService>;
  let mockScrollService: MockedObject<ScrollService>;
  let mockSidebarService: MockedObject<SidebarService>;
  let currentItemIdSignal: ReturnType<typeof signal<number | null>>;

  beforeEach(() => {
    currentItemIdSignal = signal<number | null>(100);

    mockInteractionService = {
      dispatchAction: vi.fn(),
    } as unknown as MockedObject<SidebarCommentsInteractionService>;
    mockCommandRegistry = {
      register: vi.fn(),
    } as unknown as MockedObject<CommandRegistryService>;
    mockScrollService = {
      scrollElementIntoView: vi.fn(),
    } as unknown as MockedObject<ScrollService>;
    mockSidebarService = {
      closeSidebar: vi.fn(),
      goBack: vi.fn(),
      canGoBack: vi.fn(),
      currentItemId: currentItemIdSignal,
      openSidebarWithSlideAnimation: vi.fn(),
    } as unknown as MockedObject<SidebarService>;

    TestBed.configureTestingModule({
      providers: [
        SidebarKeyboardNavigationService,
        { provide: SidebarCommentsInteractionService, useValue: mockInteractionService },
        { provide: CommandRegistryService, useValue: mockCommandRegistry },
        { provide: ScrollService, useValue: mockScrollService },
        { provide: SidebarService, useValue: mockSidebarService },
      ],
    });

    service = TestBed.inject(SidebarKeyboardNavigationService);

    // Clear any existing DOM elements
    if (document.body) {
      document.body.innerHTML = '';
    }
  });

  afterEach(() => {
    if (document.body) {
      document.body.innerHTML = '';
    }
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should register commands', () => {
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.nextComment',
        expect.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.previousComment',
        expect.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.toggleExpand',
        expect.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.upvote',
        expect.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.expandReplies',
        expect.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.viewThread',
        expect.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.back',
        expect.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.close',
        expect.any(Function),
      );
    });
  });

  describe('navigation', () => {
    it('should select next comment', () => {
      createMockComments([1, 2, 3]);
      service.selectedCommentId.set(1);

      const nextElement = document.querySelector('[data-comment-id="2"]') as HTMLElement;
      const scrollSpy = vi.spyOn(nextElement, 'scrollIntoView');

      service.selectNext();

      expect(service.selectedCommentId()).toBe(2);
      expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
    });

    it('should select previous comment', () => {
      createMockComments([1, 2, 3]);
      service.selectedCommentId.set(2);

      const prevElement = document.querySelector('[data-comment-id="1"]') as HTMLElement;
      const scrollSpy = vi.spyOn(prevElement, 'scrollIntoView');

      service.selectPrevious();

      expect(service.selectedCommentId()).toBe(1);
      expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
    });

    it('should select first comment if none selected on next', () => {
      createMockComments([1, 2, 3]);

      service.selectNext();

      expect(service.selectedCommentId()).toBe(1);
    });
  });

  describe('actions', () => {
    it('should dispatch collapse action', () => {
      service.selectedCommentId.set(123);
      service.toggleExpandSelected();
      expect(mockInteractionService.dispatchAction).toHaveBeenCalledWith(123, 'collapse');
    });

    it('should dispatch upvote action', () => {
      service.selectedCommentId.set(123);
      service.upvoteSelected();
      expect(mockInteractionService.dispatchAction).toHaveBeenCalledWith(123, 'upvote');
    });

    it('should dispatch expandReplies action', () => {
      service.selectedCommentId.set(123);
      service.expandRepliesSelected();
      expect(mockInteractionService.dispatchAction).toHaveBeenCalledWith(123, 'expandReplies');
    });

    it('should save state and open thread when viewing thread', () => {
      service.selectedCommentId.set(123);
      service.viewThreadSelected();
      expect(mockSidebarService.openSidebarWithSlideAnimation).toHaveBeenCalledWith(123);
    });

    it('should not open thread if no comment selected', () => {
      service.selectedCommentId.set(null);
      service.viewThreadSelected();
      expect(mockSidebarService.openSidebarWithSlideAnimation).not.toHaveBeenCalled();
    });
  });

  describe('sidebar control', () => {
    it('should close sidebar', () => {
      service.closeSidebar();
      expect(mockSidebarService.closeSidebar).toHaveBeenCalled();
      expect(service.selectedCommentId()).toBeNull();
    });

    it('should go back', () => {
      mockSidebarService.canGoBack.mockReturnValue(true);
      service.goBack();
      expect(mockSidebarService.goBack).toHaveBeenCalled();
    });

    it('should handle back or close - go back', () => {
      mockSidebarService.canGoBack.mockReturnValue(true);
      service.handleBackOrClose();
      expect(mockSidebarService.goBack).toHaveBeenCalled();
      expect(mockSidebarService.closeSidebar).not.toHaveBeenCalled();
    });

    it('should handle back or close - close', () => {
      mockSidebarService.canGoBack.mockReturnValue(false);
      service.handleBackOrClose();
      expect(mockSidebarService.goBack).not.toHaveBeenCalled();
      expect(mockSidebarService.closeSidebar).toHaveBeenCalled();
    });
  });

  // Helper functions
  function createSidebarPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'sidebar-comments-panel';
    if (document.body) {
      document.body.appendChild(panel);
    }
    return panel;
  }

  function createCommentElement(parent: HTMLElement, commentId: number): HTMLElement {
    const container = document.createElement('div');
    container.setAttribute('role', 'treeitem');
    container.setAttribute('data-comment-id', commentId.toString());
    container.className = 'thread-container';
    parent.appendChild(container);
    return container;
  }

  function createMockComments(commentIds: number[]): void {
    const sidebar = createSidebarPanel();
    commentIds.forEach((id) => {
      createCommentElement(sidebar, id);
    });
  }
});
