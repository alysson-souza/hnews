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
      fixture.componentRef.setInput('item', {
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
      });
      fixture.componentRef.setInput('isSearchResult', true);

      const parentId = component.getParentId();

      expect(parentId).toBe('789');
    });

    it('should return empty string when story_id is missing', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: 'Test Story',
        url: 'https://example.com',
        author: 'testuser',
        points: 10,
        num_comments: 5,
        created_at: '2025-10-03T00:00:00Z',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      const parentId = component.getParentId();

      expect(parentId).toBe('');
    });

    it('should handle undefined story_id', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: '',
        url: '',
        author: 'testuser',
        points: 10,
        num_comments: 5,
        created_at: '2025-10-03T00:00:00Z',
        comment_text: 'This is a test comment',
        story_id: undefined,
      });
      fixture.componentRef.setInput('isSearchResult', true);

      const parentId = component.getParentId();

      expect(parentId).toBe('');
    });
  });

  describe('isComment and isStory computed', () => {
    it('should identify comment search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: '',
        url: '',
        author: 'testuser',
        points: 10,
        num_comments: 5,
        created_at: '2025-10-03T00:00:00Z',
        comment_text: 'This is a test comment',
        story_id: 789,
      });
      fixture.componentRef.setInput('isSearchResult', true);
      fixture.detectChanges();

      expect(component.isComment()).toBe(true);
      expect(component.isStory()).toBe(false);
    });

    it('should identify story search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: 'Test Story',
        url: 'https://example.com',
        author: 'testuser',
        points: 10,
        num_comments: 5,
        created_at: '2025-10-03T00:00:00Z',
      });
      fixture.componentRef.setInput('isSearchResult', true);
      fixture.detectChanges();

      expect(component.isStory()).toBe(true);
      expect(component.isComment()).toBe(false);
    });

    it('should return false for both when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      fixture.detectChanges();

      expect(component.isStory()).toBe(false);
      expect(component.isComment()).toBe(false);
    });

    it('should identify HNItem story types', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        by: 'testuser',
        time: 1234567890,
        title: 'Test Story',
        score: 10,
      });
      fixture.componentRef.setInput('isSearchResult', false);
      fixture.detectChanges();

      expect(component.isStory()).toBe(true);
      expect(component.isComment()).toBe(false);
    });

    it('should identify HNItem job types as stories', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'job',
        by: 'testuser',
        time: 1234567890,
        title: 'Test Job',
      });
      fixture.componentRef.setInput('isSearchResult', false);
      fixture.detectChanges();

      expect(component.isStory()).toBe(true);
    });

    it('should identify HNItem comments', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'comment',
        by: 'testuser',
        time: 1234567890,
        text: 'Test comment',
        parent: 456,
      });
      fixture.componentRef.setInput('isSearchResult', false);
      fixture.detectChanges();

      expect(component.isComment()).toBe(true);
      expect(component.isStory()).toBe(false);
    });
  });

  describe('isDead', () => {
    it('should return true for dead HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'Dead Story',
        dead: true,
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.isDead()).toBe(true);
    });

    it('should return false for alive HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'Alive Story',
        dead: false,
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.isDead()).toBe(false);
    });

    it('should return false for search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.isDead()).toBe(false);
    });

    it('should return false when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.isDead()).toBe(false);
    });
  });

  describe('getHighlightedTitle', () => {
    it('should return highlighted title for search results', () => {
      fixture.componentRef.setInput('item', {
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
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getHighlightedTitle()).toBe('<em>Original</em> Title');
    });

    it('should return plain title when no highlight available', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Original Title',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getHighlightedTitle()).toBe('Original Title');
    });

    it('should return HNItem title', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'HN Story Title',
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getHighlightedTitle()).toBe('HN Story Title');
    });

    it('should return [untitled] for HNItem without title', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getHighlightedTitle()).toBe('[untitled]');
    });

    it('should return empty string when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.getHighlightedTitle()).toBe('');
    });
  });

  describe('getExternalUrl', () => {
    it('should return URL for search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Test',
        url: 'https://example.com',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getExternalUrl()).toBe('https://example.com');
    });

    it('should return URL for HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'Test',
        url: 'https://example.com',
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getExternalUrl()).toBe('https://example.com');
    });

    it('should return undefined when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.getExternalUrl()).toBeUndefined();
    });
  });

  describe('getItemId', () => {
    it('should return objectID for search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getItemId()).toBe('123456');
    });

    it('should return id for HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 789,
        type: 'story',
        time: 1234567890,
        title: 'Test',
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getItemId()).toBe('789');
    });

    it('should return empty string when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.getItemId()).toBe('');
    });
  });

  describe('getStoryText', () => {
    it('should return story_text for search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
        story_text: 'Story content',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getStoryText()).toBe('Story content');
    });

    it('should return text for HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'Test',
        text: 'HN story text',
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getStoryText()).toBe('HN story text');
    });

    it('should return undefined when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.getStoryText()).toBeUndefined();
    });
  });

  describe('getHighlightedStoryText', () => {
    it('should return highlighted story text for search results', () => {
      fixture.componentRef.setInput('item', {
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
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getHighlightedStoryText()).toContain('Original');
    });

    it('should return plain story text when no highlight available', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
        story_text: 'Plain text',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getHighlightedStoryText()).toContain('Plain text');
    });

    it('should return text for HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        text: 'HN text content',
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getHighlightedStoryText()).toBe('HN text content');
    });
  });

  describe('getHighlightedCommentText', () => {
    it('should return highlighted comment text for search results', () => {
      fixture.componentRef.setInput('item', {
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
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getHighlightedCommentText()).toContain('Original');
    });

    it('should return plain comment text when no highlight available', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: '',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '',
        comment_text: 'Plain comment',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getHighlightedCommentText()).toContain('Plain comment');
    });

    it('should return text for HNItem comments', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'comment',
        time: 1234567890,
        text: 'HN comment text',
        parent: 456,
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getHighlightedCommentText()).toBe('HN comment text');
    });
  });

  describe('getAuthor', () => {
    it('should return author for search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'testuser',
        points: 0,
        num_comments: 0,
        created_at: '',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getAuthor()).toBe('testuser');
    });

    it('should return by for HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        by: 'hnuser',
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getAuthor()).toBe('hnuser');
    });

    it('should return undefined when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.getAuthor()).toBeUndefined();
    });
  });

  describe('getPoints', () => {
    it('should return points for search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 42,
        num_comments: 0,
        created_at: '',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getPoints()).toBe(42);
    });

    it('should return score for HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        score: 100,
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getPoints()).toBe(100);
    });

    it('should return 0 when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.getPoints()).toBe(0);
    });

    it('should return 0 when points is undefined in search result', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: undefined as unknown as number,
        num_comments: 0,
        created_at: '',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getPoints()).toBe(0);
    });
  });

  describe('getCommentCount', () => {
    it('should return num_comments for search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 15,
        created_at: '',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      expect(component.getCommentCount()).toBe(15);
    });

    it('should return descendants for HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        descendants: 25,
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getCommentCount()).toBe(25);
    });

    it('should return 0 when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.getCommentCount()).toBe(0);
    });
  });

  describe('getParentId for HNItems', () => {
    it('should return parent for HNItem comments', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'comment',
        time: 1234567890,
        parent: 456,
      });
      fixture.componentRef.setInput('isSearchResult', false);

      expect(component.getParentId()).toBe('456');
    });

    it('should return empty string when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.getParentId()).toBe('');
    });
  });

  describe('getTimeAgo', () => {
    it('should format time for search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123',
        title: 'Test',
        url: '',
        author: 'test',
        points: 0,
        num_comments: 0,
        created_at: '2025-10-03T00:00:00Z',
      });
      fixture.componentRef.setInput('isSearchResult', true);

      const timeAgo = component.getTimeAgo();
      expect(timeAgo).toBeTruthy();
      expect(typeof timeAgo).toBe('string');
    });

    it('should format time for HNItems', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });
      fixture.componentRef.setInput('isSearchResult', false);

      const timeAgo = component.getTimeAgo();
      expect(timeAgo).toBeTruthy();
      expect(typeof timeAgo).toBe('string');
    });

    it('should return empty string when item is undefined', () => {
      fixture.componentRef.setInput('item', undefined);
      expect(component.getTimeAgo()).toBe('');
    });
  });

  describe('comment metadata functionality', () => {
    it('should provide all required data for comment metadata display', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: '',
        url: '',
        author: 'testuser',
        points: null as unknown as number, // Comments have null points
        num_comments: null as unknown as number, // Comments have null num_comments
        created_at: '2025-10-03T00:00:00Z',
        comment_text: 'This is a test comment',
        story_id: 789,
        parent_id: 456,
      });
      fixture.componentRef.setInput('isSearchResult', true);
      fixture.detectChanges();

      // Verify all methods used in the enhanced comment template work
      expect(component.isComment()).toBe(true);
      expect(component.isStory()).toBe(false);
      expect(component.getAuthor()).toBe('testuser');
      expect(component.getItemId()).toBe('123456'); // Comment ID
      expect(component.getParentId()).toBe('789'); // Story ID
      expect(component.getTimeAgo()).toBeTruthy();
      // Comments should return 0 for points (null fallback)
      expect(component.getPoints()).toBe(0);
    });

    it('should handle comment without author gracefully', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: '',
        url: '',
        author: '',
        points: null as unknown as number,
        num_comments: null as unknown as number,
        created_at: '2025-10-03T00:00:00Z',
        comment_text: 'This is a test comment',
        story_id: 789,
      });
      fixture.componentRef.setInput('isSearchResult', true);
      fixture.detectChanges();

      expect(component.getAuthor()).toBe('');
      expect(component.getItemId()).toBe('123456');
      expect(component.getParentId()).toBe('789');
    });

    it('should display points for stories', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: 'Test Story',
        url: 'https://example.com',
        author: 'testuser',
        points: 42,
        num_comments: 10,
        created_at: '2025-10-03T00:00:00Z',
      });
      fixture.componentRef.setInput('isSearchResult', true);
      fixture.detectChanges();

      expect(component.isStory()).toBe(true);
      expect(component.isComment()).toBe(false);
      expect(component.getPoints()).toBe(42);
    });

    it('should not display points for comments', () => {
      fixture.componentRef.setInput('item', {
        objectID: '789012',
        title: '',
        url: '',
        author: 'commenter',
        points: null as unknown as number,
        num_comments: null as unknown as number,
        created_at: '2025-10-03T00:00:00Z',
        comment_text: 'Test comment',
        story_id: 123456,
      });
      fixture.componentRef.setInput('isSearchResult', true);
      fixture.detectChanges();

      expect(component.isStory()).toBe(false);
      expect(component.isComment()).toBe(true);
      expect(component.getPoints()).toBe(0); // null fallback
    });
  });

  describe('privacy redirect directive', () => {
    it('should apply appPrivacyRedirect directive to external links in search results', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: 'Test Story with External URL',
        url: 'https://twitter.com/example',
        author: 'testuser',
        points: 42,
        num_comments: 10,
        created_at: '2025-10-03T00:00:00Z',
      });
      fixture.componentRef.setInput('isSearchResult', true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const externalLink = compiled.querySelector('a[href*="twitter.com"]');

      expect(externalLink).toBeTruthy();
      expect(externalLink?.hasAttribute('appprivacyredirect')).toBe(true);
    });

    it('should not apply directive to internal links', () => {
      fixture.componentRef.setInput('item', {
        objectID: '123456',
        title: 'Ask HN: Test Question',
        url: '',
        author: 'testuser',
        points: 42,
        num_comments: 10,
        created_at: '2025-10-03T00:00:00Z',
      });
      fixture.componentRef.setInput('isSearchResult', true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const internalLink = compiled.querySelector('a.title-link');

      expect(internalLink).toBeTruthy();
      expect(internalLink?.hasAttribute('appprivacyredirect')).toBe(false);
    });

    it('should not apply directive to dead/flagged items', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1234567890,
        title: 'Dead Story',
        url: 'https://example.com',
        dead: true,
      });
      fixture.componentRef.setInput('isSearchResult', false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const deadLink = compiled.querySelector('a.dead-item');

      expect(deadLink).toBeTruthy();
      expect(deadLink?.hasAttribute('appprivacyredirect')).toBe(false);
    });
  });
});
