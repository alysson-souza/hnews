// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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
  let visitedService: jasmine.SpyObj<VisitedService>;
  let sidebarService: SidebarService;
  let toggleSidebarSpy: jasmine.Spy;
  let deviceService: MockDeviceService;
  let userSettings: UserSettingsService;
  let router: Router;
  let story: HNItem;

  beforeEach(() => {
    const visitedServiceMock = jasmine.createSpyObj<VisitedService>('VisitedService', [
      'markAsVisited',
      'hasNewComments',
      'getNewCommentCount',
      'isVisited',
    ]);
    visitedServiceMock.hasNewComments.and.returnValue(false);
    visitedServiceMock.getNewCommentCount.and.returnValue(0);
    visitedServiceMock.isVisited.and.returnValue(false);

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

    visitedService = TestBed.inject(VisitedService) as jasmine.SpyObj<VisitedService>;
    sidebarService = TestBed.inject(SidebarService);
    toggleSidebarSpy = spyOn(sidebarService, 'toggleSidebar').and.callThrough();
    deviceService = TestBed.inject(DeviceService) as unknown as MockDeviceService;
    userSettings = TestBed.inject(UserSettingsService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(router, 'navigateByUrl');

    story = {
      id: 123,
      type: 'story',
      time: 1_708_099_200,
      title: 'Test Story',
      descendants: 42,
    };
    component.story = story;

    deviceService.setDesktop(true);

    visitedService.markAsVisited.calls.reset();
    toggleSidebarSpy.calls.reset();
    userSettings.setSetting('openCommentsInSidebar', true);
    (router.navigateByUrl as jasmine.Spy).calls.reset();
  });

  it('opens sidebar and prevents default navigation on desktop left click', () => {
    const event = createMouseEvent('click', { button: 0 });

    component.openComments(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(toggleSidebarSpy).toHaveBeenCalledWith(story.id);
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('marks story visited without sidebar on mobile click', () => {
    deviceService.setDesktop(false);
    const event = createMouseEvent('click', { button: 0 });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows shift+click to open in new tab while marking visited', () => {
    const event = createMouseEvent('click', { shiftKey: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows cmd/meta+click to open in new tab while marking visited', () => {
    const event = createMouseEvent('click', { metaKey: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows ctrl+click to open in new tab while marking visited', () => {
    const event = createMouseEvent('click', { ctrlKey: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows middle click to open in new tab while marking visited', () => {
    const event = createMouseEvent('click', { button: 1 });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows auxclick events to open in new tab while marking visited', () => {
    const event = createMouseEvent('auxclick', { button: 1 });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(toggleSidebarSpy).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('supports keyboard activation on desktop by opening sidebar', () => {
    const event = new KeyboardEvent('keyup', { key: 'Enter', cancelable: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(toggleSidebarSpy).toHaveBeenCalledWith(story.id);
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('should not navigate when sidebar preference is enabled and link is clicked', () => {
    userSettings.setSetting('openCommentsInSidebar', true);
    fixture.detectChanges();
    toggleSidebarSpy.calls.reset();
    (router.navigate as jasmine.Spy).calls.reset();
    (router.navigateByUrl as jasmine.Spy).calls.reset();

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

      expect(event.defaultPrevented).toBeFalse();
      expect(toggleSidebarSpy).not.toHaveBeenCalled();
      expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
    });

    it('allows keyboard activation to navigate in place', () => {
      const event = new KeyboardEvent('keyup', { key: 'Enter', cancelable: true });

      component.openComments(event);

      expect(event.defaultPrevented).toBeFalse();
      expect(toggleSidebarSpy).not.toHaveBeenCalled();
      expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
    });

    it('does not toggle sidebar when clicking comments link via template', fakeAsync(() => {
      userSettings.setSetting('openCommentsInSidebar', true);
      fixture.detectChanges();
      toggleSidebarSpy.calls.reset();
      userSettings.setSetting('openCommentsInSidebar', false);
      fixture.detectChanges();
      const link = fixture.debugElement.query(By.css('.story-comments'))
        .nativeElement as HTMLAnchorElement;
      link.click();
      tick();

      expect(toggleSidebarSpy).not.toHaveBeenCalled();
      expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
      expect(sidebarService.isOpen()).toBeFalse();
      expect(router.navigateByUrl).toHaveBeenCalled();
    }));

    it('navigates to item page when clicking comments link via template while sidebar disabled', fakeAsync(() => {
      userSettings.setSetting('openCommentsInSidebar', false);
      fixture.detectChanges();
      toggleSidebarSpy.calls.reset();
      (router.navigateByUrl as jasmine.Spy).calls.reset();
      const link = fixture.debugElement.query(By.css('.story-comments'))
        .nativeElement as HTMLAnchorElement;
      link.click();
      tick();

      expect(toggleSidebarSpy).not.toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalled();
    }));
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
      component.story = { ...story, title: 'Ask HN: How to test?' };
      expect(component.isTextPost()).toBeTrue();

      component.story = { ...story, title: 'Tell HN: My experience' };
      expect(component.isTextPost()).toBeTrue();

      component.story = { ...story, title: 'Regular post', url: 'https://example.com' };
      expect(component.isTextPost()).toBeFalse();
    });

    it('should navigate to search with domain filter', () => {
      component.story = { ...story, url: 'https://example.com/page' };
      const event = new MouseEvent('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

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
      component.story = story;

      component.upvote();

      expect(component.hasVoted()).toBeTrue();
      const stored = localStorage.getItem('votedItems');
      expect(stored).toBeTruthy();
      const votedIds = JSON.parse(stored!);
      expect(votedIds).toContain(story.id);
    });

    it('should not upvote twice', () => {
      component.story = story;

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

      newComponent.story = { ...story, id: 123 };
      newFixture.detectChanges();
      expect(newComponent.hasVoted()).toBeTrue();

      newComponent.story = { ...story, id: 789 };
      newFixture.detectChanges();
      expect(newComponent.hasVoted()).toBeFalse();

      localStorage.clear();
    });
  });

  describe('Actions menu', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render actions menu component', () => {
      component.story = story;
      fixture.detectChanges();

      expect(component.actionsMenu).toBeDefined();
    });

    it('should pass story id to actions menu component', () => {
      component.story = story;
      fixture.detectChanges();

      expect(component.actionsMenu?.storyId).toBe(story.id);
    });
  });

  describe('Sharing functionality', () => {
    let shareService: StoryShareService;

    beforeEach(() => {
      component.story = story;
      shareService = TestBed.inject(StoryShareService);
    });

    it('should share story using clipboard when Web Share API is not available', async () => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      spyOn(shareService, 'shareStory').and.callThrough();

      await component.shareStory();

      expect(shareService.shareStory).toHaveBeenCalledWith(story);
    });

    it('should share comments using clipboard', async () => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      spyOn(shareService, 'shareComments').and.callThrough();

      await component.shareComments();

      expect(shareService.shareComments).toHaveBeenCalledWith(story);
    });

    it('should handle clipboard write failure gracefully', async () => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(
        Promise.reject(new Error('Clipboard error')),
      );
      spyOn(console, 'error');
      spyOn(shareService, 'shareStory').and.callThrough();

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
      component.story = story;
      fixture.detectChanges();
      spyOn(window, 'open');

      component.openCommentsInNewTab();

      expect(window.open).toHaveBeenCalled();
    });
  });

  describe('Helper methods', () => {
    it('should get item link', () => {
      component.story = story;
      const link = component.getItemLink();
      expect(link).toContain(`/item/${story.id}`);
    });

    it('should get item link when no story', () => {
      component.story = undefined;
      const link = component.getItemLink();
      expect(link).toContain('/item');
    });

    it('should check for new comments', () => {
      component.story = story;
      visitedService.hasNewComments.and.returnValue(true);

      expect(component.hasNewComments()).toBeTrue();
      expect(visitedService.hasNewComments).toHaveBeenCalledWith(story.id, story.descendants!);
    });

    it('should get new comment count', () => {
      component.story = story;
      visitedService.getNewCommentCount.and.returnValue(5);

      expect(component.getNewCommentCount()).toBe(5);
      expect(visitedService.getNewCommentCount).toHaveBeenCalledWith(story.id, story.descendants!);
    });

    it('should mark as visited', () => {
      component.story = story;

      component.markAsVisited();

      expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
    });

    it('should check if visited', () => {
      component.story = story;
      visitedService.isVisited.and.returnValue(true);

      expect(component.isVisited()).toBeTrue();
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
      component.loading = true;
      component.story = story;
      expect(component.isLoading()).toBeTrue();
    });

    it('should detect loading state when story is undefined', () => {
      component.loading = false;
      component.story = undefined;
      expect(component.isLoading()).toBeTrue();
    });

    it('should not be loading when story exists and loading is false', () => {
      component.loading = false;
      component.story = story;
      fixture.detectChanges();
      expect(component.isLoading()).toBeFalse();
    });

    it('should detect web share availability', () => {
      const canShare = component.canUseWebShare();
      expect(typeof canShare).toBe('boolean');
    });
  });
});
