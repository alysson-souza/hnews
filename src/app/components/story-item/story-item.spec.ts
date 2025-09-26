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
});
