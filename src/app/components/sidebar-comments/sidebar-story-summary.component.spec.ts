// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarStorySummaryComponent } from './sidebar-story-summary.component';
import { Router, provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { StoryActionsMenuComponent } from '../story-item/story-actions-menu.component';
import { SavedStoriesService } from '@services/saved-stories.service';

@Component({ template: '' })
class DummyComponent {}

describe('SidebarStorySummaryComponent', () => {
  let component: SidebarStorySummaryComponent;
  let fixture: ComponentFixture<SidebarStorySummaryComponent>;
  let router: Router;
  let savedStories: SavedStoriesService;

  beforeEach(async () => {
    window.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SidebarStorySummaryComponent],
      providers: [
        provideRouter([{ path: '**', component: DummyComponent }]),
        provideLocationMocks(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarStorySummaryComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    savedStories = TestBed.inject(SavedStoriesService);
    vi.spyOn(router, 'navigate');

    fixture.componentRef.setInput('item', {
      id: 123,
      type: 'story',
      by: 'testuser',
      time: 1708099200,
      title: 'Test Story',
      score: 100,
      url: 'https://example.com/article',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getDomain', () => {
    it('should extract domain from URL', () => {
      expect(component.getDomain('https://www.example.com/path')).toBe('example.com');
      expect(component.getDomain('https://subdomain.test.org/page')).toBe('subdomain.test.org');
      expect(component.getDomain('http://www.github.com')).toBe('github.com');
    });

    it('should handle invalid URLs', () => {
      expect(component.getDomain('not a url')).toBe('');
      expect(component.getDomain('')).toBe('');
      expect(component.getDomain(undefined)).toBe('');
    });
  });

  describe('searchByDomain', () => {
    it('should navigate to search with domain query', () => {
      const event = new Event('click');
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');

      component.searchByDomain(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/search'], {
        queryParams: { q: 'site:example.com' },
      });
    });

    it('should not navigate when item has no URL', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Test',
      });

      const event = new Event('click');
      component.searchByDomain(event);

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when item is not set', () => {
      fixture.componentRef.setInput('item', null!);

      const event = new Event('click');
      component.searchByDomain(event);

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    it('should render story title as link when URL exists', () => {
      const storyLink = fixture.debugElement.query(By.css('.story-link'));
      expect(storyLink).toBeTruthy();

      // The anchor is inside the StoryLinkComponent
      const anchor = storyLink.query(By.css('a'));
      expect(anchor).toBeTruthy();
      expect(anchor.nativeElement.textContent.trim()).toBe('Test Story');
      expect(anchor.nativeElement.href).toBe('https://example.com/article');
    });

    it('should render story title as text when no URL', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Text Only Story',
      });
      fixture.detectChanges();

      const storyLink = fixture.debugElement.query(By.css('.story-link'));
      expect(storyLink).toBeTruthy();

      // No anchor should be rendered inside when there's no URL
      const anchor = storyLink.query(By.css('a'));
      expect(anchor).toBeFalsy();

      const title = fixture.debugElement.query(By.css('.story-title'));
      expect(title.nativeElement.textContent.trim()).toContain('Text Only Story');
    });

    it('should render domain button when URL exists', () => {
      const domainBtn = fixture.debugElement.query(By.css('.domain-btn'));
      expect(domainBtn).toBeTruthy();
      expect(domainBtn.nativeElement.textContent.trim()).toBe('example.com');
      expect(domainBtn.nativeElement.classList.contains('mb-2')).toBe(false);
    });

    it('should keep the domain button aligned to the start of the summary column', () => {
      const styles = (
        SidebarStorySummaryComponent as unknown as { ɵcmp: { styles: string[] } }
      ).ɵcmp.styles.join('\n');

      expect(styles).toContain('align-self: flex-start');
      expect(styles).toContain('max-width: 100%');
      expect(styles).toContain('text-align: left');
    });

    it('should use structural gaps for story summary spacing', () => {
      const styles = (
        SidebarStorySummaryComponent as unknown as { ɵcmp: { styles: string[] } }
      ).ɵcmp.styles.join('\n');

      expect(styles).toContain('gap: var(--thread-gap)');
      expect(styles).toContain('gap: calc(var(--thread-gap) / 2)');
      expect(styles).not.toContain('mb-2');
      expect(styles).not.toContain('mt-3');
    });

    it('should render the story actions menu for story summaries', () => {
      const actionsMenu = fixture.debugElement.query(By.directive(StoryActionsMenuComponent));

      expect(actionsMenu).toBeTruthy();
      expect((actionsMenu.componentInstance as StoryActionsMenuComponent).story()).toEqual({
        id: 123,
        type: 'story',
        by: 'testuser',
        time: 1708099200,
        title: 'Test Story',
        score: 100,
        url: 'https://example.com/article',
      });
    });

    it('should make Internet Archive available through the actions menu', () => {
      const meta = fixture.debugElement.query(By.css('.meta'));
      const inlineArchiveLink = fixture.debugElement.query(
        By.css('.meta .open-link:not(.parent-discussion-meta-link)'),
      );
      const actionsMenu = fixture.debugElement.query(By.directive(StoryActionsMenuComponent))
        .componentInstance as StoryActionsMenuComponent;

      expect(meta).toBeTruthy();
      expect(inlineArchiveLink).toBeFalsy();
      expect(actionsMenu.showArchiveAction()).toBe(true);
    });

    it('should not render domain button when no URL', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Test',
      });
      fixture.detectChanges();

      const domainBtn = fixture.debugElement.query(By.css('.domain-btn'));
      expect(domainBtn).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.open-link'))).toBeFalsy();
    });

    it('should keep story meta after the same summary wrapper with and without a domain', () => {
      const metaWithDomain = fixture.debugElement.query(By.css('.meta'));
      expect(metaWithDomain.nativeElement.previousElementSibling.classList).toContain(
        'story-summary-header',
      );

      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        by: 'testuser',
        time: 1708099200,
        title: 'Text Only Story',
        score: 100,
      });
      fixture.detectChanges();

      const metaWithoutDomain = fixture.debugElement.query(By.css('.meta'));
      expect(fixture.debugElement.query(By.css('.domain-btn'))).toBeFalsy();
      expect(metaWithoutDomain.nativeElement.previousElementSibling.classList).toContain(
        'story-summary-header',
      );
    });

    it('should render meta information', () => {
      const meta = fixture.debugElement.query(By.css('.meta'));
      expect(meta).toBeTruthy();
      expect(meta.nativeElement.textContent).toContain('100 points');
      expect(meta.nativeElement.textContent).toContain('by');
      expect(meta.nativeElement.textContent).toContain('testuser');
    });

    it('should render and toggle save control for story summaries', () => {
      const button = fixture.debugElement.query(By.css('.bookmark-btn'))
        .nativeElement as HTMLButtonElement;

      expect(button.textContent?.trim()).toBe('Save');
      expect(button.getAttribute('aria-pressed')).toBe('false');

      button.click();
      fixture.detectChanges();

      expect(savedStories.isSaved(123)).toBe(true);
      expect(button.textContent?.trim()).toBe('Saved');
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });

    it('should stop propagation when toggling a sidebar save control', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');

      component.toggleSaved(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(savedStories.isSaved(123)).toBe(true);
    });

    it('should render text content when present', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        by: 'testuser',
        time: 1708099200,
        title: 'Test Story',
        score: 100,
        url: 'https://example.com/article',
        text: 'This is the story text',
      });
      fixture.detectChanges();

      const commentText = fixture.debugElement.query(By.css('app-comment-text'));
      expect(commentText).toBeTruthy();

      const shell = fixture.debugElement.query(By.css('.quote-surface-shell'));
      expect(shell).toBeFalsy();
    });

    it('should render comment text before meta with parent discussion in meta', () => {
      fixture.componentRef.setInput('boxedText', true);
      fixture.componentRef.setInput('parentDiscussionId', 456);
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'comment',
        by: 'testuser',
        time: 1708099200,
        text: 'This is the comment text',
        parent: 456,
      });
      fixture.detectChanges();

      const shell = fixture.debugElement.query(By.css('.quote-surface-shell'));
      const meta = fixture.debugElement.query(By.css('.meta'));
      const parentLink = fixture.debugElement.query(By.css('.parent-discussion-meta-link'));

      expect(shell).toBeTruthy();
      expect(meta).toBeTruthy();
      expect(parentLink).toBeTruthy();
      expect(parentLink.nativeElement.getAttribute('href')).toBe('/item/456');
      expect(parentLink.nativeElement.textContent.trim()).toBe('Parent discussion');
      expect(
        shell.nativeElement.compareDocumentPosition(meta.nativeElement) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('should not render the story actions menu for comment summaries', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'comment',
        by: 'testuser',
        time: 1708099200,
        text: 'This is the comment text',
        parent: 456,
      });
      fixture.detectChanges();

      const actionsMenu = fixture.debugElement.query(By.directive(StoryActionsMenuComponent));

      expect(actionsMenu).toBeFalsy();
    });

    it('should not render a save button for comment summaries', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'comment',
        by: 'testuser',
        time: 1708099200,
        text: 'This is the comment text',
        parent: 456,
      });
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.bookmark-btn'))).toBeFalsy();
    });

    it('should wrap text in a quote surface shell when boxedText is enabled', () => {
      fixture.componentRef.setInput('boxedText', true);
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        by: 'testuser',
        time: 1708099200,
        title: 'Test Story',
        score: 100,
        url: 'https://example.com/article',
        text: 'This is the story text',
      });
      fixture.detectChanges();

      const shell = fixture.debugElement.query(By.css('.quote-surface-shell'));
      expect(shell).toBeTruthy();
      expect(shell.nativeElement.classList.contains('mt-3')).toBe(false);
      expect(shell.query(By.css('app-comment-text'))).toBeTruthy();
    });

    it('should align boxed text padding with sidebar comment cards', () => {
      const styles = (
        SidebarStorySummaryComponent as unknown as { ɵcmp: { styles: string[] } }
      ).ɵcmp.styles.join('\n');

      expect(styles).toContain('.quote-surface-shell');
      expect(styles).toContain('padding: var(--thread-gap)');
    });

    it('should handle item without author', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Test',
        score: 50,
      });
      fixture.detectChanges();

      const meta = fixture.debugElement.query(By.css('.meta'));
      expect(meta.nativeElement.textContent).toContain('50 points');
    });

    it('should not display points when score is undefined', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Test',
      });
      fixture.detectChanges();

      const meta = fixture.debugElement.query(By.css('.meta'));
      const metaText = meta.nativeElement.textContent.trim();
      expect(metaText).not.toContain('points');
      expect(metaText.startsWith('•')).toBeFalsy();
    });
  });

  describe('privacy redirect directive', () => {
    it('should apply privacy redirect directive to external story links', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        by: 'testuser',
        time: 1708099200,
        title: 'Test Story with Twitter Link',
        url: 'https://twitter.com/example',
        score: 100,
      });
      fixture.detectChanges();

      const storyLink = fixture.debugElement.query(By.css('.story-link'));
      expect(storyLink).toBeTruthy();

      // The anchor is inside the StoryLinkComponent
      const anchor = storyLink.query(By.css('a'));
      expect(anchor).toBeTruthy();
      expect(anchor.nativeElement.href).toBe('https://twitter.com/example');
      expect(anchor.nativeElement.target).toBe('_blank');
      expect(anchor.nativeElement.rel).toBe('noopener noreferrer nofollow');
    });

    it('should display original URL in link href', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        by: 'testuser',
        time: 1708099200,
        title: 'Test Story',
        url: 'https://youtube.com/watch?v=test',
        score: 50,
      });
      fixture.detectChanges();

      const storyLink = fixture.debugElement.query(By.css('.story-link'));
      expect(storyLink).toBeTruthy();

      // The anchor is inside the StoryLinkComponent
      const anchor = storyLink.query(By.css('a'));
      expect(anchor).toBeTruthy();
      expect(anchor.nativeElement.href).toBe('https://youtube.com/watch?v=test');
    });
  });
});
