// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { SidebarKeyboardNavigationService } from './sidebar-keyboard-navigation.service';
import { SidebarCommentsInteractionService } from './sidebar-comments-interaction.service';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';
import { SidebarService } from './sidebar.service';

describe('SidebarKeyboardNavigationService', () => {
  let service: SidebarKeyboardNavigationService;
  let mockInteractionService: jasmine.SpyObj<SidebarCommentsInteractionService>;
  let mockCommandRegistry: jasmine.SpyObj<CommandRegistryService>;
  let mockScrollService: jasmine.SpyObj<ScrollService>;
  let mockSidebarService: jasmine.SpyObj<SidebarService>;

  beforeEach(() => {
    mockInteractionService = jasmine.createSpyObj('SidebarCommentsInteractionService', [
      'dispatchAction',
    ]);
    mockCommandRegistry = jasmine.createSpyObj('CommandRegistryService', ['register']);
    mockScrollService = jasmine.createSpyObj('ScrollService', ['scrollElementIntoView']);
    mockSidebarService = jasmine.createSpyObj('SidebarService', [
      'closeSidebar',
      'goBack',
      'canGoBack',
    ]);

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
        jasmine.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.previousComment',
        jasmine.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.toggleExpand',
        jasmine.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.upvote',
        jasmine.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.expandReplies',
        jasmine.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.viewThread',
        jasmine.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.back',
        jasmine.any(Function),
      );
      expect(mockCommandRegistry.register).toHaveBeenCalledWith(
        'sidebar.close',
        jasmine.any(Function),
      );
    });
  });

  describe('navigation', () => {
    it('should select next comment', () => {
      createMockComments([1, 2, 3]);
      service.selectedCommentId.set(1);

      service.selectNext();

      expect(service.selectedCommentId()).toBe(2);
      expect(mockScrollService.scrollElementIntoView).toHaveBeenCalled();
    });

    it('should select previous comment', () => {
      createMockComments([1, 2, 3]);
      service.selectedCommentId.set(2);

      service.selectPrevious();

      expect(service.selectedCommentId()).toBe(1);
      expect(mockScrollService.scrollElementIntoView).toHaveBeenCalled();
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

    it('should dispatch viewThread action', () => {
      service.selectedCommentId.set(123);
      service.viewThreadSelected();
      expect(mockInteractionService.dispatchAction).toHaveBeenCalledWith(123, 'viewThread');
    });
  });

  describe('sidebar control', () => {
    it('should close sidebar', () => {
      service.closeSidebar();
      expect(mockSidebarService.closeSidebar).toHaveBeenCalled();
      expect(service.selectedCommentId()).toBeNull();
    });

    it('should go back', () => {
      mockSidebarService.canGoBack.and.returnValue(true);
      service.goBack();
      expect(mockSidebarService.goBack).toHaveBeenCalled();
    });

    it('should handle back or close - go back', () => {
      mockSidebarService.canGoBack.and.returnValue(true);
      service.handleBackOrClose();
      expect(mockSidebarService.goBack).toHaveBeenCalled();
      expect(mockSidebarService.closeSidebar).not.toHaveBeenCalled();
    });

    it('should handle back or close - close', () => {
      mockSidebarService.canGoBack.and.returnValue(false);
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
