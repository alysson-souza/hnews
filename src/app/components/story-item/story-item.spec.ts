import type { Mock, MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { By } from '@angular/platform-browser';

@Component({ template: '' })
class DummyComponent {}

import { StoryItem } from './story-item';
import { VisitedService } from '../../services/visited.service';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { HNItem } from '../../models/hn';
import { UserSettingsService } from '../../services/user-settings.service';
import { StoryShareService } from '../../services/story-share.service';

class MockDeviceService {
  private desktop = true;

  setDesktop(value: boolean): void {
    this.desktop = value;
  }

  isDesktop(): boolean {
    return this.desktop;
  }

  isMobile(): boolean {
    return !this.desktop;
  }

  shouldShowKeyboardHints(): boolean {
    return this.desktop;
  }

  getModifierKey(): string {
    return this.desktop ? 'Cmd' : 'Ctrl';
  }
}

const createMouseEvent = (type: string, init?: MouseEventInit): MouseEvent =>
  new MouseEvent(type, { cancelable: true, ...init });

describe('StoryItem comments link behaviour', () => {
  let fixture: ComponentFixture<StoryItem>;
  let component: StoryItem;
  let visitedService: MockedObject<VisitedService>;
  let sidebarService: SidebarService;
  let toggleSidebarSpy: Mock;
  let deviceService: MockDeviceService;
  let userSettings: UserSettingsService;
  let router: Router;
  let story: HNItem;

  beforeEach(() => {
    const visitedServiceMock = {
      markAsVisited: vi.fn(),
      hasNewComments: vi.fn(),
      getNewCommentCount: vi.fn(),
      isVisited: vi.fn(),
    };
    visitedServiceMock.hasNewComments.mockReturnValue(false);
    visitedServiceMock.getNewCommentCount.mockReturnValue(0);
    visitedServiceMock.isVisited.mockReturnValue(false);

    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [StoryItem],
      providers: [
        provideRouter([{ path: 'item/:id', component: DummyComponent }]),
        provideLocationMocks(),
        { provide: VisitedService, useValue: visitedServiceMock },
        SidebarService,
        { provide: DeviceService, useClass: MockDeviceService },
      ],
    });

    fixture = TestBed.createComponent(StoryItem);
    component = fixture.componentInstance;

    visitedService = TestBed.inject(VisitedService) as MockedObject<VisitedService>;
    sidebarService = TestBed.inject(SidebarService);
    toggleSidebarSpy = vi.spyOn(sidebarService, 'toggleSidebar');
    deviceService = TestBed.inject(DeviceService) as unknown as MockDeviceService;
    userSettings = TestBed.inject(UserSettingsService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    vi.spyOn(router, 'navigateByUrl');

    story = {
      id: 123,
      type: 'story',
      time: 1708099200,
      title: 'Test Story',
      descendants: 42,
    };
    fixture.componentRef.setInput('story', story);

    deviceService.setDesktop(true);

    visitedService.markAsVisited.mockClear();
    toggleSidebarSpy.mockClear();
    userSettings.setSetting('openCommentsInSidebar', true);
    (router.navigateByUrl as Mock).mockClear();
  });

  it('opens sidebar and prevents default navigation on desktop left click', () => {
    const event = createMouseEvent('click', { button: 0 });

    component.openComments(event);

    expect(event.defaultPrevented).toBe(true);
    expect(toggleSidebarSpy).toHaveBeenCalledWith(story.id);
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('marks story visited without sidebar on mobile click', () => {
    deviceService.setDesktop(false);
    const event = createMouseEvent('click', { button: 0 });

    component.openComments(event);

    expect(event.defaultPrevented).toBe(false);
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows shift+click to open in new tab without any side effects', () => {
    const event = createMouseEvent('click', { shiftKey: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBe(false);
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).not.toHaveBeenCalled();
  });

  it('allows cmd/meta+click to open in new tab without any side effects', () => {
    const event = createMouseEvent('click', { metaKey: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBe(false);
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).not.toHaveBeenCalled();
  });

  it('allows ctrl+click to open in new tab without any side effects', () => {
    const event = createMouseEvent('click', { ctrlKey: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBe(false);
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).not.toHaveBeenCalled();
  });

  it('allows middle click to open in new tab without any side effects', () => {
    const event = createMouseEvent('click', { button: 1 });

    component.openComments(event);

    expect(event.defaultPrevented).toBe(false);
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).not.toHaveBeenCalled();
  });

  it('allows auxclick events to open in new tab without any side effects', () => {
    const event = createMouseEvent('auxclick', { button: 1 });

    component.openComments(event);

    expect(event.defaultPrevented).toBe(false);
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).not.toHaveBeenCalled();
  });

  it('supports keyboard activation on desktop by opening sidebar', () => {
    const event = new KeyboardEvent('keyup', { key: 'Enter', cancelable: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBe(true);
    expect(toggleSidebarSpy).toHaveBeenCalledWith(story.id);
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('should not navigate when sidebar preference is enabled and link is clicked', () => {
    userSettings.setSetting('openCommentsInSidebar', true);
    fixture.detectChanges();
    toggleSidebarSpy.mockClear();
    (router.navigate as Mock).mockClear();
    (router.navigateByUrl as Mock).mockClear();

    const link = fixture.debugElement.query(By.css('.story-comments'))
      .nativeElement as HTMLAnchorElement;
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });

    link.dispatchEvent(clickEvent);

    expect(toggleSidebarSpy).toHaveBeenCalledWith(story.id);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  describe('when sidebar preference is disabled', () => {
    beforeEach(() => {
      userSettings.setSetting('openCommentsInSidebar', false);
      deviceService.setDesktop(true);
    });

    it('allows desktop clicks to navigate in place', () => {
      const event = createMouseEvent('click', { button: 0 });

      component.openComments(event);

      expect(event.defaultPrevented).toBe(false);
      expect(toggleSidebarSpy).not.toHaveBeenCalled();
      expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
    });

    it('allows keyboard activation to navigate in place', () => {
      const event = new KeyboardEvent('keyup', { key: 'Enter', cancelable: true });

      component.openComments(event);

      expect(event.defaultPrevented).toBe(false);
      expect(toggleSidebarSpy).not.toHaveBeenCalled();
      expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
    });

    it('does not toggle sidebar when clicking comments link via template', () => {
      vi.useFakeTimers();
      userSettings.setSetting('openCommentsInSidebar', true);
      fixture.detectChanges();
      toggleSidebarSpy.mockClear();
      userSettings.setSetting('openCommentsInSidebar', false);
      fixture.detectChanges();
      const link = fixture.debugElement.query(By.css('.story-comments'))
        .nativeElement as HTMLAnchorElement;
      link.click();
      vi.advanceTimersByTime(0);

      expect(toggleSidebarSpy).not.toHaveBeenCalled();
      expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
      expect(sidebarService.isOpen()).toBe(false);
      expect(router.navigateByUrl).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('navigates to item page when clicking comments link via template while sidebar disabled', () => {
      vi.useFakeTimers();
      userSettings.setSetting('openCommentsInSidebar', false);
      fixture.detectChanges();
      toggleSidebarSpy.mockClear();
      (router.navigateByUrl as Mock).mockClear();
      const link = fixture.debugElement.query(By.css('.story-comments'))
        .nativeElement as HTMLAnchorElement;
      link.click();
      vi.advanceTimersByTime(0);

      expect(toggleSidebarSpy).not.toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('DOM parsing and formatting', () => {
    beforeEach(() => {
      deviceService.setDesktop(true);
    });

    it('should extract domain from URL', () => {
      expect(component.getDomain('https://www.example.com/path')).toBe('example.com');
      expect(component.getDomain('https://subdomain.example.com')).toBe('subdomain.example.com');
      expect(component.getDomain('http://www.test.org/page')).toBe('test.org');
    });

    it('should handle invalid URLs in getDomain', () => {
      expect(component.getDomain('not a url')).toBe('');
      expect(component.getDomain('')).toBe('');
      expect(component.getDomain(undefined)).toBe('');
    });

    it('should format time ago correctly', () => {
      const timestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const result = component.getTimeAgo(timestamp);
      expect(result).toContain('hour');
    });

    it('should check if post is a text post', () => {
      fixture.componentRef.setInput('story', { ...story, title: 'Ask HN: How to test?' });
      expect(component.isTextPost()).toBe(true);

      fixture.componentRef.setInput('story', { ...story, title: 'Tell HN: My experience' });
      expect(component.isTextPost()).toBe(true);

      fixture.componentRef.setInput('story', {
        ...story,
        title: 'Regular post',
        url: 'https://example.com',
      });
      expect(component.isTextPost()).toBe(false);
    });

    it('should navigate to search with domain filter', () => {
      fixture.componentRef.setInput('story', { ...story, url: 'https://example.com/page' });
      const event = new MouseEvent('click');
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');

      component.searchByDomain(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/search'], {
        queryParams: { q: 'site:example.com' },
      });
    });
  });

  describe('Upvoting', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should upvote a story', () => {
      fixture.componentRef.setInput('story', story);

      component.upvote();

      expect(component.hasVoted()).toBe(true);
      const stored = localStorage.getItem('votedItems');
      expect(stored).toBeTruthy();
      const votedIds = JSON.parse(stored!);
      expect(votedIds).toContain(story.id);
    });

    it('should not upvote twice', () => {
      fixture.componentRef.setInput('story', story);

      component.upvote();
      component.upvote();

      const stored = localStorage.getItem('votedItems');
      const votedIds = JSON.parse(stored!);
      expect(votedIds.length).toBe(1);
    });

    it('should handle voted items stored in localStorage', () => {
      localStorage.clear();
      localStorage.setItem('votedItems', JSON.stringify([123, 456]));

      const newFixture = TestBed.createComponent(StoryItem);
      const newComponent = newFixture.componentInstance;

      newFixture.componentRef.setInput('story', { ...story, id: 123 });
      newFixture.detectChanges();
      expect(newComponent.hasVoted()).toBe(true);

      newFixture.componentRef.setInput('story', { ...story, id: 789 });
      newFixture.detectChanges();
      expect(newComponent.hasVoted()).toBe(false);

      localStorage.clear();
    });
  });

  describe('Actions menu', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render actions menu component', () => {
      fixture.componentRef.setInput('story', story);
      fixture.detectChanges();

      expect(component.actionsMenu()).toBeDefined();
    });

    it('should pass story id to actions menu component', () => {
      fixture.componentRef.setInput('story', story);
      fixture.detectChanges();

      expect(component.actionsMenu()?.storyId()).toBe(story.id);
    });
  });

  describe('Sharing functionality', () => {
    let shareService: StoryShareService;

    beforeEach(() => {
      fixture.componentRef.setInput('story', story);
      shareService = TestBed.inject(StoryShareService);
    });

    it('should share story using clipboard when Web Share API is not available', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockReturnValue(Promise.resolve());
      vi.spyOn(shareService, 'shareStory');

      await component.shareStory();

      expect(shareService.shareStory).toHaveBeenCalledWith(story);
    });

    it('should share comments using clipboard', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockReturnValue(Promise.resolve());
      vi.spyOn(shareService, 'shareComments');

      await component.shareComments();

      expect(shareService.shareComments).toHaveBeenCalledWith(story);
    });

    it('should handle clipboard write failure gracefully', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockReturnValue(
        Promise.reject(new Error('Clipboard error')),
      );
      vi.spyOn(console, 'error');
      vi.spyOn(shareService, 'shareStory');

      await component.shareStory();

      expect(console.error).toHaveBeenCalled();
    });

    it('should compute share action text correctly', () => {
      const storyText = component.getStoryActionText();
      const commentsText = component.getCommentsActionText();

      expect(storyText).toContain('Story');
      expect(commentsText).toContain('Comments');
    });

    it('should compute action text from share service', () => {
      // The component delegates to the service
      const storyText = component.getStoryActionText();
      const serviceStoryText = shareService.getStoryActionText();

      expect(storyText).toEqual(serviceStoryText);
    });
  });

  describe('Open comments in new tab', () => {
    it('should open comments in new tab', () => {
      fixture.componentRef.setInput('story', story);
      fixture.detectChanges();
      vi.spyOn(window, 'open');

      component.openCommentsInNewTab();

      expect(window.open).toHaveBeenCalled();
    });
  });

  describe('Helper methods', () => {
    it('should get item link', () => {
      fixture.componentRef.setInput('story', story);
      const link = component.getItemLink();
      expect(link).toContain(`/item/${story.id}`);
    });

    it('should get item link when no story', () => {
      fixture.componentRef.setInput('story', undefined);
      const link = component.getItemLink();
      expect(link).toContain('/item');
    });

    it('should check for new comments', () => {
      fixture.componentRef.setInput('story', story);
      visitedService.hasNewComments.mockReturnValue(true);

      expect(component.hasNewComments()).toBe(true);
      expect(visitedService.hasNewComments).toHaveBeenCalledWith(story.id, story.descendants!);
    });

    it('should get new comment count', () => {
      fixture.componentRef.setInput('story', story);
      visitedService.getNewCommentCount.mockReturnValue(5);

      expect(component.getNewCommentCount()).toBe(5);
      expect(visitedService.getNewCommentCount).toHaveBeenCalledWith(story.id, story.descendants!);
    });

    it('should mark as visited', () => {
      fixture.componentRef.setInput('story', story);

      component.markAsVisited();

      expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
    });

    it('should check if visited', () => {
      fixture.componentRef.setInput('story', story);
      visitedService.isVisited.mockReturnValue(true);

      expect(component.isVisited()).toBe(true);
      expect(visitedService.isVisited).toHaveBeenCalledWith(story.id);
    });

    it('should get comment tooltip for desktop', () => {
      deviceService.setDesktop(true);
      const tooltip = component.getCommentTooltip();
      expect(tooltip).toContain('New Tab');
      expect(tooltip).toContain('Cmd');
    });

    it('should get simple tooltip for mobile', () => {
      deviceService.setDesktop(false);
      const tooltip = component.getCommentTooltip();
      expect(tooltip).toBe('View Comments');
    });
  });

  describe('Computed properties', () => {
    it('should detect loading state when loading is true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('story', story);
      expect(component.isLoading()).toBe(true);
    });

    it('should detect loading state when story is undefined', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('story', undefined);
      expect(component.isLoading()).toBe(true);
    });

    it('should not be loading when story exists and loading is false', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('story', story);
      fixture.detectChanges();
      expect(component.isLoading()).toBe(false);
    });

    it('should detect web share availability', () => {
      const canShare = component.canUseWebShare();
      expect(typeof canShare).toBe('boolean');
    });
  });
});
