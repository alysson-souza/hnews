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
  });
});
