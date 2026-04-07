// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoryActionsMenuComponent } from './story-actions-menu.component';
import { By } from '@angular/platform-browser';

describe('StoryActionsMenuComponent', () => {
  let fixture: ComponentFixture<StoryActionsMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryActionsMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StoryActionsMenuComponent);
    fixture.componentRef.setInput('storyId', 123);
    fixture.detectChanges();
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
      fixture.componentRef.setInput('showArchiveAction', true);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('button.story-actions-btn'));
      btn.nativeElement.click();
      fixture.detectChanges();

      const menuItems = fixture.debugElement.queryAll(By.css('[role="menuitem"]'));
      expect(menuItems.length).toBe(4);
      expect(menuItems[2].nativeElement.textContent.trim()).toBe('Open in Internet Archive');
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
  });
});
