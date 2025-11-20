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
  let interactionServiceSpy: jasmine.SpyObj<SidebarCommentsInteractionService>;
  beforeEach(() => {
    const interactionSpy = jasmine.createSpyObj('SidebarCommentsInteractionService', [
      'dispatchAction',
    ]);
    TestBed.configureTestingModule({
      providers: [
        TestNavigationService,
        { provide: SidebarCommentsInteractionService, useValue: interactionSpy },
        {
          provide: CommandRegistryService,
          useValue: jasmine.createSpyObj('CommandRegistryService', ['register']),
        },
        {
          provide: ScrollService,
          useValue: jasmine.createSpyObj('ScrollService', ['scrollToHTMLElement']),
        },
      ],
    });

    service = TestBed.inject(TestNavigationService);
    interactionServiceSpy = TestBed.inject(
      SidebarCommentsInteractionService,
    ) as jasmine.SpyObj<SidebarCommentsInteractionService>;
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
    expect(service.isSelected()(123)).toBeTrue();
    expect(service.isSelected()(456)).toBeFalse();
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
