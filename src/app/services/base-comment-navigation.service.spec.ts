import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { TestBed } from '@angular/core/testing';
import { BaseCommentNavigationService } from './base-comment-navigation.service';
import { SidebarCommentsInteractionService } from './sidebar-comments-interaction.service';
import { CommandRegistryService } from './command-registry.service';
import { ScrollService } from './scroll.service';
import { Injectable } from '@angular/core';

// Mock concrete implementation for testing
@Injectable({ providedIn: 'root' })
class TestNavigationService extends BaseCommentNavigationService {
  protected get containerSelector(): string {
    return '.test-container';
  }
  protected registerCommands(): void {}
}

describe('BaseCommentNavigationService', () => {
  let service: TestNavigationService;
  let interactionServiceSpy: MockedObject<SidebarCommentsInteractionService>;
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
    interactionServiceSpy = TestBed.inject(
      SidebarCommentsInteractionService,
    ) as MockedObject<SidebarCommentsInteractionService>;
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

    it('should dispatch upvote action', () => {
      service.upvoteSelected();
      expect(interactionServiceSpy.dispatchAction).toHaveBeenCalledWith(123, 'upvote');
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
      service.upvoteSelected();
      service.expandRepliesSelected();
      service.viewThreadSelected();
      expect(interactionServiceSpy.dispatchAction).not.toHaveBeenCalled();
    });
  });
});
