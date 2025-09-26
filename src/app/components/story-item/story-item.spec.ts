import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LocationStrategy } from '@angular/common';

import { StoryItem } from './story-item';
import { VisitedService } from '../../services/visited.service';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';
import { HNItem } from '../../models/hn';

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
  let sidebarService: jasmine.SpyObj<SidebarService>;
  let deviceService: MockDeviceService;
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

    const sidebarServiceMock = jasmine.createSpyObj<SidebarService>('SidebarService', [
      'toggleSidebar',
    ]);

    TestBed.configureTestingModule({
      imports: [StoryItem],
      providers: [
        { provide: VisitedService, useValue: visitedServiceMock },
        { provide: SidebarService, useValue: sidebarServiceMock },
        { provide: DeviceService, useClass: MockDeviceService },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: LocationStrategy, useValue: { prepareExternalUrl: (url: string) => url } },
      ],
    });

    fixture = TestBed.createComponent(StoryItem);
    component = fixture.componentInstance;

    visitedService = TestBed.inject(VisitedService) as jasmine.SpyObj<VisitedService>;
    sidebarService = TestBed.inject(SidebarService) as jasmine.SpyObj<SidebarService>;
    deviceService = TestBed.inject(DeviceService) as unknown as MockDeviceService;

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
    sidebarService.toggleSidebar.calls.reset();
  });

  it('opens sidebar and prevents default navigation on desktop left click', () => {
    const event = createMouseEvent('click', { button: 0 });

    component.openComments(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(sidebarService.toggleSidebar).toHaveBeenCalledWith(story.id);
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('marks story visited without sidebar on mobile click', () => {
    deviceService.setDesktop(false);
    const event = createMouseEvent('click', { button: 0 });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(sidebarService.toggleSidebar).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows shift+click to open in new tab while marking visited', () => {
    const event = createMouseEvent('click', { shiftKey: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(sidebarService.toggleSidebar).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows cmd/meta+click to open in new tab while marking visited', () => {
    const event = createMouseEvent('click', { metaKey: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(sidebarService.toggleSidebar).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows ctrl+click to open in new tab while marking visited', () => {
    const event = createMouseEvent('click', { ctrlKey: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(sidebarService.toggleSidebar).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows middle click to open in new tab while marking visited', () => {
    const event = createMouseEvent('click', { button: 1 });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(sidebarService.toggleSidebar).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('allows auxclick events to open in new tab while marking visited', () => {
    const event = createMouseEvent('auxclick', { button: 1 });

    component.openComments(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(sidebarService.toggleSidebar).not.toHaveBeenCalled();
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });

  it('supports keyboard activation on desktop by opening sidebar', () => {
    const event = new KeyboardEvent('keyup', { key: 'Enter', cancelable: true });

    component.openComments(event);

    expect(event.defaultPrevented).toBeTrue();
    expect(sidebarService.toggleSidebar).toHaveBeenCalledWith(story.id);
    expect(visitedService.markAsVisited).toHaveBeenCalledWith(story.id, story.descendants);
  });
});
