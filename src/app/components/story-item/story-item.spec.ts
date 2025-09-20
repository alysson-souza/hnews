// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LocationStrategy } from '@angular/common';
import { By } from '@angular/platform-browser';
import { StoryItem } from './story-item';
import { HNItem } from '../../models/hn';
import { VisitedService } from '../../services/visited.service';
import { SidebarService } from '../../services/sidebar.service';
import { DeviceService } from '../../services/device.service';

describe('StoryItem', () => {
  let component: StoryItem;
  let fixture: ComponentFixture<StoryItem>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLocationStrategy: jasmine.SpyObj<LocationStrategy>;
  let mockVisitedService: jasmine.SpyObj<VisitedService>;
  let mockSidebarService: jasmine.SpyObj<SidebarService>;
  let mockDeviceService: jasmine.SpyObj<DeviceService>;

  const mockStory: HNItem = {
    id: 123,
    title: 'Test Story',
    url: 'https://example.com',
    by: 'testuser',
    time: 1640995200,
    score: 42,
    descendants: 5,
    type: 'story',
  };

  beforeEach(async () => {
    // Create spy objects
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockLocationStrategy = jasmine.createSpyObj('LocationStrategy', ['prepareExternalUrl']);
    mockVisitedService = jasmine.createSpyObj('VisitedService', [
      'isVisited',
      'markAsVisited',
      'hasNewComments',
      'getNewCommentCount',
    ]);
    mockSidebarService = jasmine.createSpyObj('SidebarService', ['toggleSidebar']);
    mockDeviceService = jasmine.createSpyObj('DeviceService', [
      'isDesktop',
      'isMobile',
      'shouldShowKeyboardHints',
      'getModifierKey',
    ]);

    // Setup default mock returns
    mockLocationStrategy.prepareExternalUrl.and.returnValue('/item/123');
    mockVisitedService.isVisited.and.returnValue(false);
    mockVisitedService.hasNewComments.and.returnValue(false);
    mockVisitedService.getNewCommentCount.and.returnValue(0);
    mockDeviceService.isDesktop.and.returnValue(true);
    mockDeviceService.isMobile.and.returnValue(false);
    mockDeviceService.shouldShowKeyboardHints.and.returnValue(true);
    mockDeviceService.getModifierKey.and.returnValue('Ctrl');

    await TestBed.configureTestingModule({
      imports: [StoryItem],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: LocationStrategy, useValue: mockLocationStrategy },
        { provide: VisitedService, useValue: mockVisitedService },
        { provide: SidebarService, useValue: mockSidebarService },
        { provide: DeviceService, useValue: mockDeviceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StoryItem);
    component = fixture.componentInstance;
    component.story = mockStory;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Comments Link Behavior', () => {
    let commentsLink: HTMLAnchorElement;

    beforeEach(() => {
      const linkDebugElement = fixture.debugElement.query(By.css('.story-comments-trigger'));
      commentsLink = linkDebugElement.nativeElement as HTMLAnchorElement;
    });

    it('should render as an anchor element with proper href', () => {
      expect(commentsLink.tagName.toLowerCase()).toBe('a');
      expect(commentsLink.getAttribute('href')).toBe('http://localhost/item/123');
    });

    it('should have role="button" for accessibility', () => {
      expect(commentsLink.getAttribute('role')).toBe('button');
    });

    it('should have proper aria-label', () => {
      expect(commentsLink.getAttribute('aria-label')).toBe('View 5 Comments');
    });

    describe('Desktop behavior', () => {
      beforeEach(() => {
        mockDeviceService.isDesktop.and.returnValue(true);
      });

      it('should open sidebar on normal click', () => {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        spyOn(clickEvent, 'preventDefault');

        commentsLink.dispatchEvent(clickEvent);

        expect(clickEvent.preventDefault).toHaveBeenCalled();
        expect(mockSidebarService.toggleSidebar).toHaveBeenCalledWith(123);
        expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(123, 5);
      });

      it('should open new window on Ctrl+click', () => {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          ctrlKey: true,
        });
        spyOn(clickEvent, 'preventDefault');
        spyOn(window, 'open');

        component.openComments(clickEvent);

        expect(clickEvent.preventDefault).toHaveBeenCalled();
        expect(window.open).toHaveBeenCalledWith('http://localhost/item/123', '_blank');
        expect(mockSidebarService.toggleSidebar).not.toHaveBeenCalled();
        expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(123, 5);
      });

      it('should open new window on Cmd+click', () => {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          metaKey: true,
        });
        spyOn(clickEvent, 'preventDefault');
        spyOn(window, 'open');

        component.openComments(clickEvent);

        expect(clickEvent.preventDefault).toHaveBeenCalled();
        expect(window.open).toHaveBeenCalledWith('http://localhost/item/123', '_blank');
        expect(mockSidebarService.toggleSidebar).not.toHaveBeenCalled();
        expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(123, 5);
      });

      it('should open new window on Shift+click', () => {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          shiftKey: true,
        });
        spyOn(clickEvent, 'preventDefault');
        spyOn(window, 'open');

        component.openComments(clickEvent);

        expect(clickEvent.preventDefault).toHaveBeenCalled();
        expect(window.open).toHaveBeenCalledWith('http://localhost/item/123', '_blank');
        expect(mockSidebarService.toggleSidebar).not.toHaveBeenCalled();
        expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(123, 5);
      });

      it('should open new window on middle click', () => {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          button: 1,
        });
        spyOn(clickEvent, 'preventDefault');
        spyOn(window, 'open');

        component.openComments(clickEvent);

        expect(clickEvent.preventDefault).toHaveBeenCalled();
        expect(window.open).toHaveBeenCalledWith('http://localhost/item/123', '_blank');
        expect(mockSidebarService.toggleSidebar).not.toHaveBeenCalled();
        expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(123, 5);
      });
    });

    describe('Mobile behavior', () => {
      beforeEach(() => {
        mockDeviceService.isDesktop.and.returnValue(false);
        mockDeviceService.isMobile.and.returnValue(true);
      });

      it('should navigate manually on mobile', () => {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        spyOn(clickEvent, 'preventDefault');

        component.openComments(clickEvent);

        expect(clickEvent.preventDefault).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/item', 123]);
        expect(mockSidebarService.toggleSidebar).not.toHaveBeenCalled();
        expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(123, 5);
      });

      it('should open new window on mobile with modifier keys', () => {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          ctrlKey: true,
        });
        spyOn(clickEvent, 'preventDefault');
        spyOn(window, 'open');

        component.openComments(clickEvent);

        expect(clickEvent.preventDefault).toHaveBeenCalled();
        expect(window.open).toHaveBeenCalledWith('http://localhost/item/123', '_blank');
        expect(mockSidebarService.toggleSidebar).not.toHaveBeenCalled();
        expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(123, 5);
      });
    });

    describe('Keyboard behavior', () => {
      it('should handle Enter key like normal click on desktop', () => {
        mockDeviceService.isDesktop.and.returnValue(true);

        const keyEvent = new KeyboardEvent('keyup', {
          key: 'Enter',
          bubbles: true,
        });
        spyOn(keyEvent, 'preventDefault');

        component.openComments(keyEvent);

        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(mockSidebarService.toggleSidebar).toHaveBeenCalledWith(123);
        expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(123, 5);
      });

      it('should handle Space key like normal click on desktop', () => {
        mockDeviceService.isDesktop.and.returnValue(true);

        const keyEvent = new KeyboardEvent('keyup', {
          key: ' ',
          bubbles: true,
        });
        spyOn(keyEvent, 'preventDefault');

        component.openComments(keyEvent);

        expect(keyEvent.preventDefault).toHaveBeenCalled();
        expect(mockSidebarService.toggleSidebar).toHaveBeenCalledWith(123);
        expect(mockVisitedService.markAsVisited).toHaveBeenCalledWith(123, 5);
      });
    });

    describe('Edge cases', () => {
      it('should handle missing story gracefully', () => {
        component.story = undefined;

        const clickEvent = new MouseEvent('click', { bubbles: true });
        spyOn(clickEvent, 'preventDefault');

        component.openComments(clickEvent);

        expect(clickEvent.preventDefault).not.toHaveBeenCalled();
        expect(mockSidebarService.toggleSidebar).not.toHaveBeenCalled();
        expect(mockVisitedService.markAsVisited).not.toHaveBeenCalled();
      });
    });
  });

  describe('Comment tooltip', () => {
    it('should show modifier key hint on desktop', () => {
      mockDeviceService.shouldShowKeyboardHints.and.returnValue(true);
      mockDeviceService.getModifierKey.and.returnValue('Ctrl');

      const tooltip = component.getCommentTooltip();

      expect(tooltip).toBe('View Comments (Ctrl+Click for New Tab)');
    });

    it('should show simple tooltip on mobile', () => {
      mockDeviceService.shouldShowKeyboardHints.and.returnValue(false);

      const tooltip = component.getCommentTooltip();

      expect(tooltip).toBe('View Comments');
    });
  });
});
