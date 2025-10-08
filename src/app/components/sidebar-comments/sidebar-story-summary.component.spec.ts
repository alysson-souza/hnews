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
    spyOn(router, 'navigate');

    component.item = {
      id: 123,
      type: 'story',
      by: 'testuser',
      time: 1708099200,
      title: 'Test Story',
      score: 100,
      url: 'https://example.com/article',
    };
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
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.searchByDomain(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/search'], {
        queryParams: { q: 'site:example.com' },
      });
    });

    it('should not navigate when item has no URL', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Test',
      };

      const event = new Event('click');
      component.searchByDomain(event);

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when item is not set', () => {
      component.item = null!;

      const event = new Event('click');
      component.searchByDomain(event);

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    it('should render story title as link when URL exists', () => {
      const link = fixture.debugElement.query(By.css('.story-link'));
      expect(link).toBeTruthy();
      expect(link.nativeElement.textContent.trim()).toBe('Test Story');
      expect(link.nativeElement.href).toBe('https://example.com/article');
    });

    it('should render story title as text when no URL', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Text Only Story',
      };
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.story-link'));
      expect(link).toBeFalsy();

      const title = fixture.debugElement.query(By.css('.story-title'));
      expect(title.nativeElement.textContent.trim()).toContain('Text Only Story');
    });

    it('should render domain button when URL exists', () => {
      const domainBtn = fixture.debugElement.query(By.css('.domain-btn'));
      expect(domainBtn).toBeTruthy();
      expect(domainBtn.nativeElement.textContent.trim()).toBe('(example.com)');
    });

    it('should not render domain button when no URL', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Test',
      };
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
      component.item = {
        ...component.item,
        text: 'This is the story text',
      };
      fixture.detectChanges();

      const commentText = fixture.debugElement.query(By.css('app-comment-text'));
      expect(commentText).toBeTruthy();
    });

    it('should show actions when showActions is true', () => {
      component.showActions = true;
      fixture.detectChanges();

      const actions = fixture.debugElement.query(By.css('.actions'));
      expect(actions).toBeTruthy();

      const link = fixture.debugElement.query(By.css('.open-link'));
      expect(link).toBeTruthy();
      expect(link.nativeElement.textContent.trim()).toContain('Open in full view');
    });

    it('should not show actions when showActions is false', () => {
      component.showActions = false;
      fixture.detectChanges();

      const actions = fixture.debugElement.query(By.css('.actions'));
      expect(actions).toBeFalsy();
    });

    it('should handle item without author', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Test',
        score: 50,
      };
      fixture.detectChanges();

      const meta = fixture.debugElement.query(By.css('.meta'));
      expect(meta.nativeElement.textContent).toContain('50 points');
    });

    it('should display 0 points when score is undefined', () => {
      component.item = {
        id: 123,
        type: 'story',
        time: 1708099200,
        title: 'Test',
      };
      fixture.detectChanges();

      const meta = fixture.debugElement.query(By.css('.meta'));
      expect(meta.nativeElement.textContent).toContain('0 points');
    });
  });
});
