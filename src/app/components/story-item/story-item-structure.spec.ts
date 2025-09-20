// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { StoryItem } from './story-item';
import { HNItem } from '../../models/hn';
import { VisitedService } from '../../services/visited.service';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';

// Mock story data
const mockStory: HNItem = {
  id: 12345,
  title: 'Test Story Title',
  url: 'https://example.com/story',
  by: 'testuser',
  time: 1640995200,
  score: 100,
  descendants: 25,
  type: 'story',
};

// Mock component to test the story item in isolation
@Component({
  template: `
    <app-story-item [story]="story" [index]="0" [isSelected]="false" [loading]="false">
    </app-story-item>
  `,
})
class TestHostComponent {
  story = mockStory;
}

describe('StoryItem HTML Structure Verification', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let mockVisitedService: jasmine.SpyObj<VisitedService>;
  let mockSidebarService: jasmine.SpyObj<SidebarService>;
  let mockDeviceService: jasmine.SpyObj<DeviceService>;

  beforeEach(async () => {
    // Create spy objects
    mockVisitedService = jasmine.createSpyObj('VisitedService', [
      'isVisited',
      'markAsVisited',
      'hasNewComments',
      'getNewCommentCount',
    ]);
    mockSidebarService = jasmine.createSpyObj('SidebarService', ['toggleSidebar']);
    mockDeviceService = jasmine.createSpyObj('DeviceService', [
      'isDesktop',
      'shouldShowKeyboardHints',
      'getModifierKey',
    ]);

    // Setup default mock returns
    mockVisitedService.isVisited.and.returnValue(false);
    mockVisitedService.hasNewComments.and.returnValue(false);
    mockVisitedService.getNewCommentCount.and.returnValue(0);
    mockDeviceService.isDesktop.and.returnValue(true);
    mockDeviceService.shouldShowKeyboardHints.and.returnValue(true);
    mockDeviceService.getModifierKey.and.returnValue('Ctrl');

    await TestBed.configureTestingModule({
      imports: [StoryItem],
      declarations: [TestHostComponent],
      providers: [
        provideRouter([{ path: 'item/:id', component: TestHostComponent }]),
        { provide: VisitedService, useValue: mockVisitedService },
        { provide: SidebarService, useValue: mockSidebarService },
        { provide: DeviceService, useValue: mockDeviceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render comments as anchor element instead of button', () => {
    const commentsElement = fixture.debugElement.query(By.css('.story-comments-trigger'));

    expect(commentsElement).toBeTruthy();
    expect(commentsElement.nativeElement.tagName.toLowerCase()).toBe('a');
    expect(commentsElement.nativeElement.tagName.toLowerCase()).not.toBe('button');
  });

  it('should have routerLink attribute pointing to item page', () => {
    const commentsAnchor = fixture.debugElement.query(By.css('.story-comments-trigger'));

    expect(commentsAnchor.attributes['ng-reflect-router-link']).toBe('/item,12345');
  });

  it('should have role="button" for accessibility', () => {
    const commentsAnchor = fixture.debugElement.query(By.css('.story-comments-trigger'));

    expect(commentsAnchor.nativeElement.getAttribute('role')).toBe('button');
  });

  it('should have proper aria-label with comment count', () => {
    const commentsAnchor = fixture.debugElement.query(By.css('.story-comments-trigger'));

    expect(commentsAnchor.nativeElement.getAttribute('aria-label')).toBe('View 25 Comments');
  });

  it('should display correct comment count and text', () => {
    const commentsAnchor = fixture.debugElement.query(By.css('.story-comments-trigger'));
    const textContent = commentsAnchor.nativeElement.textContent.trim();

    expect(textContent).toContain('25 comments');
  });

  it('should display "comment" (singular) for single comment', () => {
    // Update story to have 1 comment
    hostComponent.story = { ...mockStory, descendants: 1 };
    fixture.detectChanges();

    const commentsAnchor = fixture.debugElement.query(By.css('.story-comments-trigger'));
    const textContent = commentsAnchor.nativeElement.textContent.trim();

    expect(textContent).toContain('1 comment');
    expect(textContent).not.toContain('comments');
  });

  it('should preserve CSS classes for styling', () => {
    const commentsAnchor = fixture.debugElement.query(By.css('.story-comments-trigger'));
    const classList = commentsAnchor.nativeElement.classList;

    expect(classList.contains('story-comments')).toBe(true);
    expect(classList.contains('story-comments-trigger')).toBe(true);
  });

  it('should have focus styles for accessibility', () => {
    const commentsAnchor = fixture.debugElement.query(By.css('.story-comments-trigger'));
    const classList = commentsAnchor.nativeElement.classList;

    expect(classList.contains('focus-visible:outline-none')).toBe(true);
    expect(classList.contains('focus-visible:ring-2')).toBe(true);
    expect(classList.contains('focus-visible:ring-blue-500')).toBe(true);
  });
});
