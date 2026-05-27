// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoryActionsMenuComponent } from './story-actions-menu.component';
import { By } from '@angular/platform-browser';
import { provideLocationMocks } from '@angular/common/testing';
import { HNItem } from '@models/hn';
import { StoryShareService } from '@services/story-share.service';

describe('StoryActionsMenuComponent', () => {
  let fixture: ComponentFixture<StoryActionsMenuComponent>;
  let component: StoryActionsMenuComponent;
  let story: HNItem;
  let shareService: StoryShareService;

  beforeEach(async () => {
    story = {
      id: 123,
      type: 'story',
      by: 'testuser',
      time: 1708099200,
      title: 'Test Story',
    };

    await TestBed.configureTestingModule({
      imports: [StoryActionsMenuComponent],
      providers: [provideLocationMocks()],
    }).compileComponents();

    fixture = TestBed.createComponent(StoryActionsMenuComponent);
    component = fixture.componentInstance;
    shareService = TestBed.inject(StoryShareService);
    fixture.componentRef.setInput('story', story);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('actions button focus accessibility', () => {
    it('should be a native button element', () => {
      const btn = fixture.debugElement.query(By.css('button.story-actions-btn'));
      expect(btn).toBeTruthy();
      expect(btn.nativeElement.tagName).toBe('BUTTON');
    });

    it('should have explicit tabindex=0 for macOS/WebKit Tab focus', () => {
      const btn = fixture.debugElement.query(By.css('button.story-actions-btn'));
      expect(btn.nativeElement.getAttribute('tabindex')).toBe('0');
    });

    it('should have an accessible aria-label', () => {
      const btn = fixture.debugElement.query(By.css('button.story-actions-btn'));
      expect(btn.nativeElement.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('menu interaction', () => {
    it('should open menu when button is clicked', () => {
      const btn = fixture.debugElement.query(By.css('button.story-actions-btn'));
      btn.nativeElement.click();
      fixture.detectChanges();

      const menu = fixture.debugElement.query(By.css('[role="menu"]'));
      expect(menu).toBeTruthy();
    });

    it('should render menu items as focusable buttons', () => {
      const btn = fixture.debugElement.query(By.css('button.story-actions-btn'));
      btn.nativeElement.click();
      fixture.detectChanges();

      const menuItems = fixture.debugElement.queryAll(By.css('[role="menuitem"]'));
      expect(menuItems.length).toBe(3);
      for (const item of menuItems) {
        expect(item.nativeElement.tagName).toBe('BUTTON');
      }
    });

    it('should render the archive action when enabled', () => {
      fixture.componentRef.setInput('story', {
        ...story,
        url: 'https://example.com/article',
      });
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('button.story-actions-btn'));
      btn.nativeElement.click();
      fixture.detectChanges();

      const menuItems = fixture.debugElement.queryAll(By.css('[role="menuitem"]'));
      expect(menuItems.length).toBe(4);
      expect(menuItems[2].nativeElement.textContent.trim()).toBe('Open in Internet Archive');
    });

    it('derives stable control ids from the story id', () => {
      const btn = fixture.debugElement.query(By.css('button.story-actions-btn'));

      expect(btn.nativeElement.getAttribute('id')).toBe('actions-btn-123');
      expect(btn.nativeElement.getAttribute('aria-controls')).toBe('actions-menu-123');
    });

    it('should share the story and close the menu', async () => {
      const shareSpy = vi.spyOn(shareService, 'shareStory').mockResolvedValue();
      const closeSpy = vi.spyOn(component, 'closeMenu');

      await component.shareStory();

      expect(shareSpy).toHaveBeenCalledWith(story);
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should share comments and close the menu', async () => {
      const shareSpy = vi.spyOn(shareService, 'shareComments').mockResolvedValue();
      const closeSpy = vi.spyOn(component, 'closeMenu');

      await component.shareComments();

      expect(shareSpy).toHaveBeenCalledWith(story);
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should open comments in a new tab', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const closeSpy = vi.spyOn(component, 'closeMenu');

      component.openCommentsInNewTab();

      expect(openSpy).toHaveBeenCalledWith(`${window.location.origin}/item/123`, '_blank');
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should open the story in Internet Archive when a URL exists', () => {
      fixture.componentRef.setInput('story', {
        ...story,
        url: 'https://example.com/article',
      });
      fixture.detectChanges();
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const closeSpy = vi.spyOn(component, 'closeMenu');

      component.openStoryInArchive();

      expect(openSpy).toHaveBeenCalledWith(
        'https://web.archive.org/web/*/https://example.com/article',
        '_blank',
        'noopener,noreferrer',
      );
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should do nothing when opening archive without an external URL', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const closeSpy = vi.spyOn(component, 'closeMenu');

      component.openStoryInArchive();

      expect(openSpy).not.toHaveBeenCalled();
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should focus the story card when closing the menu', () => {
      const storyItem = document.createElement('app-story-item');
      const storyCard = document.createElement('article');
      storyCard.className = 'story-card';
      storyCard.tabIndex = -1;
      document.body.appendChild(storyItem);
      storyItem.appendChild(storyCard);
      storyItem.appendChild(fixture.nativeElement);
      fixture.detectChanges();

      const focusSpy = vi.spyOn(storyCard, 'focus').mockImplementation(() => {});

      fixture.componentInstance.closeMenu();

      expect(focusSpy).toHaveBeenCalled();
      storyItem.remove();
    });

    it('should fall back to the actions button when no story card owns the menu', () => {
      const btn = fixture.debugElement.query(By.css('button.story-actions-btn'))
        .nativeElement as HTMLButtonElement;
      const focusSpy = vi.spyOn(btn, 'focus').mockImplementation(() => {});

      component.closeMenu();

      expect(focusSpy).toHaveBeenCalled();
    });
  });
});
