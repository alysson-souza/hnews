// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { solarLinkLinear } from '@ng-icons/solar-icons/linear';
import { EnhanceLinksDirective } from './enhance-links.directive';

@Component({
  template: '<div [innerHTML]="html()" appEnhanceLinks></div>',
  imports: [EnhanceLinksDirective],
})
class TestComponent {
  html = signal('');
}

describe('EnhanceLinksDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let element: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [provideIcons({ solarLinkLinear }), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enhance external links with icon', async () => {
    component.html.set('<a href="https://example.com">Link</a>');
    fixture.detectChanges();

    // Wait for AfterViewInit to complete
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 10));

    const link = element.querySelector('a');
    const icon = link?.querySelector('ng-icon');

    expect(icon).toBeTruthy();
    // The icon should be present (name is set via setInput, not as DOM attribute)
  });

  it('should update link text to formatted domain', () => {
    component.html.set('<a href="https://example.com/path">Old Text</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link?.textContent).toContain('example.com');
    expect(link?.textContent).toContain('path');
  });

  it('should add ext-link class', () => {
    component.html.set('<a href="https://example.com">Link</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link?.classList.contains('ext-link')).toBe(true);
  });

  it('should set security attributes', () => {
    component.html.set('<a href="https://example.com">Link</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer nofollow');
  });

  it('should add title attribute with original URL', () => {
    component.html.set('<a href="https://example.com/path?q=1">Link</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link?.getAttribute('title')).toBe('https://example.com/path?q=1');
  });

  it('should not override existing title attribute', () => {
    component.html.set('<a href="https://example.com" title="Custom Title">Link</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link?.getAttribute('title')).toBe('Custom Title');
  });

  it('should not enhance non-http links', () => {
    component.html.set('<a href="#anchor">Anchor</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    const icon = link?.querySelector('ng-icon');
    expect(icon).toBeFalsy();
    expect(link?.classList.contains('ext-link')).toBe(false);
  });

  it('should not enhance mailto links', () => {
    component.html.set('<a href="mailto:test@example.com">Email</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    const icon = link?.querySelector('ng-icon');
    expect(icon).toBeFalsy();
  });

  it('should handle protocol-relative URLs', () => {
    component.html.set('<a href="//example.com/path">Link</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    const icon = link?.querySelector('ng-icon');
    expect(icon).toBeTruthy();
    expect(link?.textContent).toContain('example.com');
  });

  it('should handle multiple links', () => {
    component.html.set(`
      <p>
        <a href="https://github.com">GitHub</a>
        <a href="https://stackoverflow.com">Stack Overflow</a>
      </p>
    `);
    fixture.detectChanges();

    const links = element.querySelectorAll('a');
    expect(links.length).toBe(2);

    const icons = element.querySelectorAll('ng-icon');
    expect(icons.length).toBe(2);

    expect(links[0].textContent).toContain('github.com');
    expect(links[1].textContent).toContain('stackoverflow.com');
  });

  it('should add styling classes to icon', () => {
    component.html.set('<a href="https://example.com">Link</a>');
    fixture.detectChanges();

    const icon = element.querySelector('ng-icon');
    expect(icon?.classList.contains('link-icon')).toBe(true);
    expect(icon?.classList.contains('ml-1')).toBe(true);
    expect(icon?.classList.contains('inline-block')).toBe(true);
  });

  it('should set aria-hidden on icon', () => {
    component.html.set('<a href="https://example.com">Link</a>');
    fixture.detectChanges();

    const icon = element.querySelector('ng-icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should handle dynamic content updates via MutationObserver', async () => {
    component.html.set('<a href="https://first.com">First</a>');
    fixture.detectChanges();

    let link = element.querySelector('a');
    expect(link?.textContent).toContain('first.com');

    // Update content
    component.html.set('<a href="https://second.com">Second</a>');
    fixture.detectChanges();

    // MutationObserver callback is async, so we need to wait
    await new Promise((resolve) => setTimeout(resolve, 100));

    link = element.querySelector('a');
    expect(link?.textContent).toContain('second.com');

    const icon = link?.querySelector('ng-icon');
    expect(icon).toBeTruthy();
  });

  it('should clean up icons on content update', async () => {
    component.html.set('<a href="https://example.com">Link</a>');
    fixture.detectChanges();

    expect(element.querySelectorAll('ng-icon').length).toBe(1);

    // Update to remove links
    component.html.set('<p>No links here</p>');
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(element.querySelectorAll('ng-icon').length).toBe(0);
  });

  it('should not process already processed links', () => {
    component.html.set('<a href="https://example.com">Link</a>');
    fixture.detectChanges();

    const initialIconCount = element.querySelectorAll('ng-icon').length;
    expect(initialIconCount).toBe(1);

    // Trigger another detection cycle (shouldn't duplicate icons)
    fixture.detectChanges();

    // Note: MutationObserver might trigger again, but the directive
    // should skip links that already have icons
    const finalIconCount = element.querySelectorAll('ng-icon').length;
    expect(finalIconCount).toBe(initialIconCount);
  });

  describe('Hacker News link translation', () => {
    it('should translate HN item links to internal routes', () => {
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">HN Item</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      expect(link?.getAttribute('href')).toBe('/item/12345');
    });

    it('should translate HN user links to internal routes', () => {
      component.html.set('<a href="https://news.ycombinator.com/user?id=pg">pg</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      expect(link?.getAttribute('href')).toBe('/user/pg');
    });

    it('should add hn-link class to HN links', () => {
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">HN Item</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      expect(link?.classList.contains('hn-link')).toBe(true);
      expect(link?.classList.contains('ext-link')).toBe(false);
    });

    it('should not add external link icon to HN links', () => {
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">HN Item</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      const icon = link?.querySelector('ng-icon');
      expect(icon).toBeFalsy();
    });

    it('should not set target="_blank" on HN links', () => {
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">HN Item</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      expect(link?.getAttribute('target')).toBeNull();
      expect(link?.getAttribute('rel')).toBeNull();
    });

    it('should navigate to internal route on click', () => {
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">HN Item</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      link?.click();

      expect(navigateSpy).toHaveBeenCalledWith('/item/12345');
    });

    it('should not navigate when modifier keys are pressed', () => {
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">HN Item</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');

      // Simulate Ctrl+click
      const ctrlClickEvent = new MouseEvent('click', { ctrlKey: true, bubbles: true });
      link?.dispatchEvent(ctrlClickEvent);

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should translate HN homepage links to /top', () => {
      component.html.set('<a href="https://news.ycombinator.com/">HN Home</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      expect(link?.getAttribute('href')).toBe('/top');
    });

    it('should translate HN story type pages', () => {
      component.html.set(`
        <a href="https://news.ycombinator.com/newest">Newest</a>
        <a href="https://news.ycombinator.com/best">Best</a>
        <a href="https://news.ycombinator.com/ask">Ask</a>
      `);
      fixture.detectChanges();

      const links = element.querySelectorAll('a');
      expect(links[0]?.getAttribute('href')).toBe('/newest');
      expect(links[1]?.getAttribute('href')).toBe('/best');
      expect(links[2]?.getAttribute('href')).toBe('/ask');
    });

    it('should handle mixed HN and external links', () => {
      component.html.set(`
        <a href="https://news.ycombinator.com/item?id=12345">HN Item</a>
        <a href="https://example.com">External</a>
      `);
      fixture.detectChanges();

      const links = element.querySelectorAll('a');
      expect(links[0]?.getAttribute('href')).toBe('/item/12345');
      expect(links[0]?.classList.contains('hn-link')).toBe(true);
      expect(links[0]?.querySelector('ng-icon')).toBeFalsy();

      expect(links[1]?.classList.contains('ext-link')).toBe(true);
      expect(links[1]?.querySelector('ng-icon')).toBeTruthy();
    });

    it('should not translate unsupported HN pages', () => {
      component.html.set('<a href="https://news.ycombinator.com/submit">Submit</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      // Should be treated as external link since /submit is not supported
      expect(link?.classList.contains('ext-link')).toBe(true);
    });

    it('should preserve original link text for HN links', () => {
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">Original Text</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      expect(link?.textContent).toBe('Original Text');
    });
  });
});
