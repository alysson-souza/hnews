// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchResultComponent } from './search-result.component';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';

@Component({ template: '' })
class DummyComponent {}

describe('SearchResultComponent', () => {
  let component: SearchResultComponent;
  let fixture: ComponentFixture<SearchResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchResultComponent],
      providers: [
        provideRouter([{ path: '**', component: DummyComponent }]),
        provideLocationMocks(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchResultComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getParentId for search results', () => {
    it('should return story_id for comment search results', () => {
      component.item = {
        objectID: '123456',
        title: '',
        url: '',
        author: 'testuser',
        points: 10,
        num_comments: 5,
        created_at: '2025-10-03T00:00:00Z',
        comment_text: 'This is a test comment',
        story_id: 789,
        parent_id: 456,
      };
      component.isSearchResult = true;

      const parentId = component.getParentId();

      expect(parentId).toBe('789');
    });

    it('should return empty string when story_id is missing', () => {
      component.item = {
        objectID: '123456',
        title: 'Test Story',
        url: 'https://example.com',
        author: 'testuser',
        points: 10,
        num_comments: 5,
        created_at: '2025-10-03T00:00:00Z',
      };
      component.isSearchResult = true;

      const parentId = component.getParentId();

      expect(parentId).toBe('');
    });

    it('should handle undefined story_id', () => {
      component.item = {
        objectID: '123456',
        title: '',
        url: '',
        author: 'testuser',
        points: 10,
        num_comments: 5,
        created_at: '2025-10-03T00:00:00Z',
        comment_text: 'This is a test comment',
        story_id: undefined,
      };
      component.isSearchResult = true;

      const parentId = component.getParentId();

      expect(parentId).toBe('');
    });
  });

  describe('isComment and isStory computed', () => {
    it('should identify comment search results', () => {
      component.item = {
        objectID: '123456',
        title: '',
        url: '',
        author: 'testuser',
        points: 10,
        num_comments: 5,
        created_at: '2025-10-03T00:00:00Z',
        comment_text: 'This is a test comment',
        story_id: 789,
      };
      component.isSearchResult = true;
      fixture.detectChanges();

      expect(component.isComment()).toBe(true);
      expect(component.isStory()).toBe(false);
    });

    it('should identify story search results', () => {
      component.item = {
        objectID: '123456',
        title: 'Test Story',
        url: 'https://example.com',
        author: 'testuser',
        points: 10,
        num_comments: 5,
        created_at: '2025-10-03T00:00:00Z',
      };
      component.isSearchResult = true;
      fixture.detectChanges();

      expect(component.isStory()).toBe(true);
      expect(component.isComment()).toBe(false);
    });

    it('should return false for both when item is undefined', () => {
      component.item = undefined;
      fixture.detectChanges();

      expect(component.isStory()).toBe(false);
      expect(component.isComment()).toBe(false);
    });

    it('should identify HNItem story types', () => {
      component.item = {
        id: 123,
        type: 'story',
        by: 'testuser',
        time: 1234567890,
        title: 'Test Story',
        score: 10,
      };
      component.isSearchResult = false;
      fixture.detectChanges();

      expect(component.isStory()).toBe(true);
      expect(component.isComment()).toBe(false);
    });

    it('should identify HNItem job types as stories', () => {
      component.item = {
        id: 123,
        type: 'job',
        by: 'testuser',
        time: 1234567890,
        title: 'Test Job',
      };
      component.isSearchResult = false;
      fixture.detectChanges();

      expect(component.isStory()).toBe(true);
    });

    it('should identify HNItem comments', () => {
      component.item = {
        id: 123,
        type: 'comment',
        by: 'testuser',
        time: 1234567890,
        text: 'Test comment',
        parent: 456,
      };
      component.isSearchResult = false;
      fixture.detectChanges();

      expect(component.isComment()).toBe(true);
      expect(component.isStory()).toBe(false);
    });
  });

  describe('isDead', () => {
    it('should return true for dead HNItems', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'Dead Story',
        dead: true,
      };
      component.isSearchResult = false;

      expect(component.isDead()).toBe(true);
    });

    it('should return false for alive HNItems', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'Alive Story',
        dead: false,
      };
      component.isSearchResult = false;

      expect(component.isDead()).toBe(false);
    });

    it('should return false for search results', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
      };
      component.isSearchResult = true;

      expect(component.isDead()).toBe(false);
    });

    it('should return false when item is undefined', () => {
      component.item = undefined;
      expect(component.isDead()).toBe(false);
    });
  });

  describe('getHighlightedTitle', () => {
    it('should return highlighted title for search results', () => {
      component.item = {
        objectID: '123',
        title: 'Original Title',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
        _highlightResult: {
          title: { value: '<em>Original</em> Title' },
        },
      };
      component.isSearchResult = true;

      expect(component.getHighlightedTitle()).toBe('<em>Original</em> Title');
    });

    it('should return plain title when no highlight available', () => {
      component.item = {
        objectID: '123',
        title: 'Original Title',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
      };
      component.isSearchResult = true;

      expect(component.getHighlightedTitle()).toBe('Original Title');
    });

    it('should return HNItem title', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'HN Story Title',
      };
      component.isSearchResult = false;

      expect(component.getHighlightedTitle()).toBe('HN Story Title');
    });

    it('should return [untitled] for HNItem without title', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
      };
      component.isSearchResult = false;

      expect(component.getHighlightedTitle()).toBe('[untitled]');
    });

    it('should return empty string when item is undefined', () => {
      component.item = undefined;
      expect(component.getHighlightedTitle()).toBe('');
    });
  });

  describe('getExternalUrl', () => {
    it('should return URL for search results', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: 'https://example.com',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
      };
      component.isSearchResult = true;

      expect(component.getExternalUrl()).toBe('https://example.com');
    });

    it('should return URL for HNItems', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'Test',
        url: 'https://example.com',
      };
      component.isSearchResult = false;

      expect(component.getExternalUrl()).toBe('https://example.com');
    });

    it('should return undefined when item is undefined', () => {
      component.item = undefined;
      expect(component.getExternalUrl()).toBeUndefined();
    });
  });

  describe('getItemId', () => {
    it('should return objectID for search results', () => {
      component.item = {
        objectID: '123456',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
      };
      component.isSearchResult = true;

      expect(component.getItemId()).toBe('123456');
    });

    it('should return id for HNItems', () => {
      component.item = {
        id: 789,
        type: 'story',
        time: 1234567890,
        title: 'Test',
      };
      component.isSearchResult = false;

      expect(component.getItemId()).toBe('789');
    });

    it('should return empty string when item is undefined', () => {
      component.item = undefined;
      expect(component.getItemId()).toBe('');
    });
  });

  describe('getStoryText', () => {
    it('should return story_text for search results', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
        story_text: 'Story content',
      };
      component.isSearchResult = true;

      expect(component.getStoryText()).toBe('Story content');
    });

    it('should return text for HNItems', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'Test',
        text: 'HN story text',
      };
      component.isSearchResult = false;

      expect(component.getStoryText()).toBe('HN story text');
    });

    it('should return undefined when item is undefined', () => {
      component.item = undefined;
      expect(component.getStoryText()).toBeUndefined();
    });
  });

  describe('getHighlightedStoryText', () => {
    it('should return highlighted story text for search results', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
        story_text: 'Original text',
        _highlightResult: {
          story_text: { value: '<em>Original</em> text' },
        },
      };
      component.isSearchResult = true;

      expect(component.getHighlightedStoryText()).toContain('Original');
    });

    it('should return plain story text when no highlight available', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
        story_text: 'Plain text',
      };
      component.isSearchResult = true;

      expect(component.getHighlightedStoryText()).toContain('Plain text');
    });

    it('should return text for HNItems', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
        text: 'HN text content',
      };
      component.isSearchResult = false;

      expect(component.getHighlightedStoryText()).toBe('HN text content');
    });
  });

  describe('getHighlightedCommentText', () => {
    it('should return highlighted comment text for search results', () => {
      component.item = {
        objectID: '123',
        title: '',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
        comment_text: 'Original comment',
        _highlightResult: {
          comment_text: { value: '<em>Original</em> comment' },
        },
      };
      component.isSearchResult = true;

      expect(component.getHighlightedCommentText()).toContain('Original');
    });

    it('should return plain comment text when no highlight available', () => {
      component.item = {
        objectID: '123',
        title: '',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
        comment_text: 'Plain comment',
      };
      component.isSearchResult = true;

      expect(component.getHighlightedCommentText()).toContain('Plain comment');
    });

    it('should return text for HNItem comments', () => {
      component.item = {
        id: 123,
        type: 'comment',
        time: 1234567890,
        text: 'HN comment text',
        parent: 456,
      };
      component.isSearchResult = false;

      expect(component.getHighlightedCommentText()).toBe('HN comment text');
    });
  });

  describe('getAuthor', () => {
    it('should return author for search results', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'testuser',
        points: 0,
        num_comments: 0,
        created_at: '',
      };
      component.isSearchResult = true;

      expect(component.getAuthor()).toBe('testuser');
    });

    it('should return by for HNItems', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
        by: 'hnuser',
      };
      component.isSearchResult = false;

      expect(component.getAuthor()).toBe('hnuser');
    });

    it('should return undefined when item is undefined', () => {
      component.item = undefined;
      expect(component.getAuthor()).toBeUndefined();
    });
  });

  describe('getPoints', () => {
    it('should return points for search results', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 42,
        num_comments: 0,
        created_at: '',
      };
      component.isSearchResult = true;

      expect(component.getPoints()).toBe(42);
    });

    it('should return score for HNItems', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
        score: 100,
      };
      component.isSearchResult = false;

      expect(component.getPoints()).toBe(100);
    });

    it('should return 0 when item is undefined', () => {
      component.item = undefined;
      expect(component.getPoints()).toBe(0);
    });

    it('should return 0 when points is undefined in search result', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: undefined as unknown as number,
        num_comments: 0,
        created_at: '',
      };
      component.isSearchResult = true;

      expect(component.getPoints()).toBe(0);
    });
  });

  describe('getCommentCount', () => {
    it('should return num_comments for search results', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 15,
        created_at: '',
      };
      component.isSearchResult = true;

      expect(component.getCommentCount()).toBe(15);
    });

    it('should return descendants for HNItems', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1234567890,
        descendants: 25,
      };
      component.isSearchResult = false;

      expect(component.getCommentCount()).toBe(25);
    });

    it('should return 0 when item is undefined', () => {
      component.item = undefined;
      expect(component.getCommentCount()).toBe(0);
    });
  });

  describe('getParentId for HNItems', () => {
    it('should return parent for HNItem comments', () => {
      component.item = {
        id: 123,
        type: 'comment',
        time: 1234567890,
        parent: 456,
      };
      component.isSearchResult = false;

      expect(component.getParentId()).toBe('456');
    });

    it('should return empty string when item is undefined', () => {
      component.item = undefined;
      expect(component.getParentId()).toBe('');
    });
  });

  describe('getTimeAgo', () => {
    it('should format time for search results', () => {
      component.item = {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '2025-10-03T00:00:00Z',
      };
      component.isSearchResult = true;

      const timeAgo = component.getTimeAgo();
      expect(timeAgo).toBeTruthy();
      expect(typeof timeAgo).toBe('string');
    });

    it('should format time for HNItems', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      component.isSearchResult = false;

      const timeAgo = component.getTimeAgo();
      expect(timeAgo).toBeTruthy();
      expect(typeof timeAgo).toBe('string');
    });

    it('should return empty string when item is undefined', () => {
      component.item = undefined;
      expect(component.getTimeAgo()).toBe('');
    });
  });
});
