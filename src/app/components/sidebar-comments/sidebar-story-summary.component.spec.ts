// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarStorySummaryComponent } from './sidebar-story-summary.component';
import { Router, provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({ template: '' })
class DummyComponent {}

describe('SidebarStorySummaryComponent', () => {
  let component: SidebarStorySummaryComponent;
  let fixture: ComponentFixture<SidebarStorySummaryComponent>;
  let router: Router;

  beforeEach(async () => {
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
    });

    it('should render meta information', () => {
      const meta = fixture.debugElement.query(By.css('.meta'));
      expect(meta).toBeTruthy();
      expect(meta.nativeElement.textContent).toContain('100 points');
      expect(meta.nativeElement.textContent).toContain('by');
      expect(meta.nativeElement.textContent).toContain('testuser');
    });

    it('should render text content when present', () => {
      fixture.componentRef.setInput('item', {
        ...component.item,
        text: 'This is the story text',
      });
      fixture.detectChanges();

      const commentText = fixture.debugElement.query(By.css('app-comment-text'));
      expect(commentText).toBeTruthy();
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

    it('should display 0 points when score is undefined', () => {
      fixture.componentRef.setInput('item', {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Test',
      });
      fixture.detectChanges();

      const meta = fixture.debugElement.query(By.css('.meta'));
      expect(meta.nativeElement.textContent).toContain('0 points');
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
