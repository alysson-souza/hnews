import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { BaseCommentNavigationService } from './base-comment-navigation.service';
import { SidebarCommentsInteractionService } from './sidebar-comments-interaction.service';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';
import { Injectable } from '@angular/core';
import { CommentThreadIndexService } from './comment-thread-index.service';
import { CommentStateService } from './comment-state.service';

// Mock concrete implementation for testing
@Injectable({ providedIn: 'root' })
class TestNavigationService extends BaseCommentNavigationService {
  protected get containerSelector(): string {
    return '.test-container';
  }
  protected get context() {
    return 'item' as const;
  }
  protected registerCommands(): void {}
}

describe('BaseCommentNavigationService', () => {
  let service: TestNavigationService;
  let interactionServiceSpy: MockedObject<SidebarCommentsInteractionService>;
  let commentIndex: CommentThreadIndexService;
  beforeEach(() => {
    const interactionSpy = {
      dispatchAction: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        TestNavigationService,
        { provide: SidebarCommentsInteractionService, useValue: interactionSpy },
        {
          provide: CommandRegistryService,
          useValue: {
            register: vi.fn(),
          },
        },
        {
          provide: ScrollService,
          useValue: {
            scrollToHTMLElement: vi.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(TestNavigationService);
    commentIndex = TestBed.inject(CommentThreadIndexService);
    interactionServiceSpy = TestBed.inject(
      SidebarCommentsInteractionService,
    ) as MockedObject<SidebarCommentsInteractionService>;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially have no selection', () => {
    expect(service.selectedCommentId()).toBeNull();
  });

  it('should clear selection', () => {
    service.selectedCommentId.set(123);
    service.clearSelection();
    expect(service.selectedCommentId()).toBeNull();
  });

  it('should check if a comment is selected', () => {
    service.selectedCommentId.set(123);
    expect(service.isSelected()(123)).toBe(true);
    expect(service.isSelected()(456)).toBe(false);
  });

  describe('Interaction Methods', () => {
    beforeEach(() => {
      service.selectedCommentId.set(123);
    });

    it('should dispatch collapse action', () => {
      service.toggleExpandSelected();
      expect(interactionServiceSpy.dispatchAction).toHaveBeenCalledWith(123, 'collapse');
    });

    it('should dispatch expandReplies action', () => {
      service.expandRepliesSelected();
      expect(interactionServiceSpy.dispatchAction).toHaveBeenCalledWith(123, 'expandReplies');
    });

    it('should dispatch viewThread action', () => {
      service.viewThreadSelected();
      expect(interactionServiceSpy.dispatchAction).toHaveBeenCalledWith(123, 'viewThread');
    });

    it('should not dispatch actions if no comment is selected', () => {
      service.selectedCommentId.set(null);
      service.toggleExpandSelected();
      service.expandRepliesSelected();
      service.viewThreadSelected();
      expect(interactionServiceSpy.dispatchAction).not.toHaveBeenCalled();
    });
  });

  describe('thread tools', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="test-container">
          <div role="treeitem" data-comment-id="1"></div>
          <div role="treeitem" data-comment-id="2"></div>
          <div role="treeitem" data-comment-id="3"></div>
        </div>
      `;

      commentIndex.configureContext(
        'item',
        { id: 99, type: 'story', by: 'op', time: 100, kids: [1, 2, 3] },
        {
          previousVisitedAt: 1500,
          comments: [
            { id: 1, type: 'comment', by: 'alice', time: 1 },
            { id: 2, type: 'comment', by: 'op', time: 2 },
            { id: 3, type: 'comment', by: 'carol', time: 3 },
          ],
        },
      );
    });

    it('should select the next unread visible comment', () => {
      service.selectNextUnreadComment();

      expect(service.selectedCommentId()).toBe(2);
    });

    it('should select the next OP comment', () => {
      service.selectNextOPComment();

      expect(service.selectedCommentId()).toBe(2);
    });

    it('should dispatch collapseAll for visible comments', () => {
      const commentState = TestBed.inject(CommentStateService);
      vi.spyOn(commentState, 'setCollapsedMany');

      service.collapseAllComments();

      expect(commentState.setCollapsedMany).toHaveBeenCalledWith([1, 2, 3], true);
      expect(interactionServiceSpy.dispatchAction).toHaveBeenCalledWith(1, 'collapseAll');
      expect(interactionServiceSpy.dispatchAction).toHaveBeenCalledWith(2, 'collapseAll');
      expect(interactionServiceSpy.dispatchAction).toHaveBeenCalledWith(3, 'collapseAll');
    });
  });
});
