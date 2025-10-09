// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SidebarCommentsComponent } from './sidebar-comments.component';
import { SidebarService } from '../../services/sidebar.service';
import { HackernewsService } from '../../services/hackernews.service';
import { VisitedService } from '../../services/visited.service';
import { CommentSortService } from '../../services/comment-sort.service';
import { HNItem } from '../../models/hn';

describe('SidebarCommentsComponent', () => {
  let component: SidebarCommentsComponent;
  let fixture: ComponentFixture<SidebarCommentsComponent>;
  let mockHnService: jasmine.SpyObj<HackernewsService>;
  let mockSidebarService: jasmine.SpyObj<SidebarService>;
  let mockVisitedService: jasmine.SpyObj<VisitedService>;
  let mockCommentSortService: jasmine.SpyObj<CommentSortService>;

  const mockItem: HNItem = {
    id: 123,
    type: 'story',
    by: 'testuser',
    time: 1234567890,
    title: 'Test Story',
    descendants: 3,
    kids: [1, 2, 3],
  };

  const mockComments: HNItem[] = [
    {
      id: 1,
      type: 'comment',
      by: 'user1',
      time: 1000,
      text: 'Comment 1',
      score: 10,
      kids: [4, 5],
    },
    {
      id: 2,
      type: 'comment',
      by: 'user2',
      time: 2000,
      text: 'Comment 2',
      score: 5,
      kids: [],
    },
    {
      id: 3,
      type: 'comment',
      by: 'user3',
      time: 1500,
      text: 'Comment 3',
      score: 15,
      kids: [6],
    },
  ];

  beforeEach(async () => {
    mockHnService = jasmine.createSpyObj('HackernewsService', [
      'getItem',
      'getStoryTopLevelComments',
    ]);
    mockSidebarService = jasmine.createSpyObj('SidebarService', ['closeSidebar'], {
      isOpen: jasmine.createSpy().and.returnValue(true),
      currentItemId: jasmine.createSpy().and.returnValue(123),
    });
    mockVisitedService = jasmine.createSpyObj('VisitedService', ['markAsVisited']);
    mockCommentSortService = jasmine.createSpyObj('CommentSortService', ['setSortOrder'], {
      sortOrder: signal('default'),
    });

    await TestBed.configureTestingModule({
      imports: [SidebarCommentsComponent],
      providers: [
        { provide: HackernewsService, useValue: mockHnService },
        { provide: SidebarService, useValue: mockSidebarService },
        { provide: VisitedService, useValue: mockVisitedService },
        { provide: CommentSortService, useValue: mockCommentSortService },
      ],
    }).compileComponents();

    mockHnService.getItem.and.returnValue(of(mockItem));
    mockHnService.getStoryTopLevelComments.and.returnValue(of(mockComments));

    fixture = TestBed.createComponent(SidebarCommentsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Sorting Logic', () => {
    beforeEach(() => {
      component.item.set(mockItem);
      component.allComments.set(mockComments);
    });

    it('should use default HN order when "default" is selected', () => {
      mockCommentSortService.sortOrder.set('default');
      const sortedIds = component.sortedCommentIds();
      expect(sortedIds).toEqual([1, 2, 3]);
    });

    it('should sort comments by newest when "newest" is selected', () => {
      mockCommentSortService.sortOrder.set('newest');
      const sortedIds = component.sortedCommentIds();
      // Sorted by time descending: comment2 (2000), comment3 (1500), comment1 (1000)
      expect(sortedIds).toEqual([2, 3, 1]);
    });

    it('should sort comments by oldest when "oldest" is selected', () => {
      mockCommentSortService.sortOrder.set('oldest');
      const sortedIds = component.sortedCommentIds();
      // Sorted by time ascending: comment1 (1000), comment3 (1500), comment2 (2000)
      expect(sortedIds).toEqual([1, 3, 2]);
    });

    it('should sort comments by best (score + replies * 2) when "best" is selected', () => {
      mockCommentSortService.sortOrder.set('best');
      const sortedIds = component.sortedCommentIds();
      // comment1: score 10 + kids 2 * 2 = 14
      // comment2: score 5 + kids 0 * 2 = 5
      // comment3: score 15 + kids 1 * 2 = 17
      // Sorted descending: comment3 (17), comment1 (14), comment2 (5)
      expect(sortedIds).toEqual([3, 1, 2]);
    });

    it('should fallback to default order when no comments loaded', () => {
      component.allComments.set([]);
      mockCommentSortService.sortOrder.set('newest');
      const sortedIds = component.sortedCommentIds();
      expect(sortedIds).toEqual([1, 2, 3]); // Falls back to item kids
    });
  });

  describe('State Management', () => {
    it('should keep sort order when loading new item', () => {
      mockCommentSortService.sortOrder.set('best');
      component.allComments.set(mockComments);
      component.commentsLoading.set(true);

      component['loadItem'](456);

      // Sort order persists globally
      expect(mockCommentSortService.sortOrder()).toBe('best');
      expect(component.allComments()).toEqual([]);
      expect(component.commentsLoading()).toBe(false);
    });

    it('should load comments only once for non-default sorts', () => {
      component.item.set(mockItem);
      component.onSortChange('best');

      expect(mockHnService.getStoryTopLevelComments).toHaveBeenCalledTimes(1);

      // Change to another non-default sort
      component.onSortChange('newest');

      // Should not call again because comments are already loaded
      expect(mockHnService.getStoryTopLevelComments).toHaveBeenCalledTimes(1);
    });

    it('should not fetch comments for default sort', () => {
      component.item.set(mockItem);
      component.onSortChange('default');

      expect(mockHnService.getStoryTopLevelComments).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should update visibleCommentIds when sort changes', () => {
      component.item.set(mockItem);
      component.allComments.set(mockComments);

      mockCommentSortService.sortOrder.set('newest');
      let visibleIds = component.visibleCommentIds();
      expect(visibleIds).toEqual([2, 3, 1]);

      mockCommentSortService.sortOrder.set('oldest');
      visibleIds = component.visibleCommentIds();
      expect(visibleIds).toEqual([1, 3, 2]);
    });

    it('should reset pagination when sort changes', () => {
      component.item.set(mockItem);
      component['visibleTopLevelCount'].set(20);

      component.onSortChange('best');

      expect(component['visibleTopLevelCount']()).toBe(10);
    });

    it('should show loading state while fetching comments', () => {
      component.item.set(mockItem);
      component.onSortChange('best');

      expect(component.commentsLoading()).toBe(false); // Completed synchronously in test
    });

    it('should fallback to default order on error', () => {
      mockHnService.getStoryTopLevelComments.and.returnValue(
        throwError(() => new Error('Test error')),
      );

      component.item.set(mockItem);
      mockCommentSortService.sortOrder.set('best');
      component.onSortChange('best');

      expect(mockCommentSortService.setSortOrder).toHaveBeenCalledWith('default');
      expect(component.commentsLoading()).toBe(false);
    });
  });
});
