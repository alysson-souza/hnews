// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { solarLinkLinear } from '@ng-icons/solar-icons/linear';
import { PrivacyRedirectService } from '@services/privacy-redirect.service';
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
  let privacyRedirectService: { transformUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    privacyRedirectService = {
      transformUrl: vi.fn((url: string) => url),
    };

    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        provideIcons({ solarLinkLinear }),
        provideRouter([]),
        { provide: PrivacyRedirectService, useValue: privacyRedirectService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    router = TestBed.inject(Router);
  });

  it('should enhance external links with icon', async () => {
    component.html.set('<a href="https://example.com">Link</a>');
    fixture.detectChanges();

    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 10));

    const link = element.querySelector('a');
    const icon = link?.querySelector('ng-icon');

    expect(icon).toBeTruthy();
  });

  it('should update link text to formatted domain', () => {
    component.html.set('<a href="https://example.com/path">Old Text</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    expect(link?.textContent).toContain('example.com');
    expect(link?.textContent).toContain('path');
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

  it('should leave non-web links unchanged', () => {
    component.html.set(`
      <a href="#anchor">Anchor</a>
      <a href="mailto:test@example.com">Email</a>
    `);
    fixture.detectChanges();

    const links = element.querySelectorAll('a');
    expect(links[0]?.getAttribute('href')).toBe('#anchor');
    expect(links[0]?.textContent).toBe('Anchor');
    expect(links[0]?.getAttribute('target')).toBeNull();
    expect(links[0]?.querySelector('ng-icon')).toBeFalsy();
    expect(links[1]?.getAttribute('href')).toBe('mailto:test@example.com');
    expect(links[1]?.textContent).toBe('Email');
    expect(links[1]?.getAttribute('target')).toBeNull();
    expect(links[1]?.querySelector('ng-icon')).toBeFalsy();
  });

  it('should handle protocol-relative URLs', () => {
    component.html.set('<a href="//example.com/path">Link</a>');
    fixture.detectChanges();

    const link = element.querySelector('a');
    const icon = link?.querySelector('ng-icon');
    expect(icon).toBeTruthy();
    expect(link?.textContent).toContain('example.com');
  });

  it('should set aria-hidden on icon', () => {
    component.html.set('<a href="https://example.com">Link</a>');
    fixture.detectChanges();

    const icon = element.querySelector('ng-icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should handle dynamic content updates', async () => {
    component.html.set('<a href="https://first.com">First</a>');
    fixture.detectChanges();

    let link = element.querySelector('a');
    expect(link?.textContent).toContain('first.com');

    // Update content
    component.html.set('<a href="https://second.com">Second</a>');
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 100));

    link = element.querySelector('a');
    expect(link?.textContent).toContain('second.com');

    const icon = link?.querySelector('ng-icon');
    expect(icon).toBeTruthy();
  });

  it('should open transformed URLs when enhanced links are clicked', async () => {
    const originalUrl = 'https://x.com/user/status/123';
    const redirectedUrl = 'https://twitterviewer.net/user/status/123';
    privacyRedirectService.transformUrl.mockReturnValue(redirectedUrl);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    component.html.set(`<a href="${originalUrl}">Post</a>`);
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 100));
    element.querySelector('a')?.click();

    expect(privacyRedirectService.transformUrl).toHaveBeenCalledWith(originalUrl);
    expect(openSpy).toHaveBeenCalledWith(redirectedUrl, '_blank', 'noopener,noreferrer');
  });

  describe('Hacker News link translation', () => {
    it('should translate HN item links to internal routes', () => {
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">HN Item</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      expect(link?.getAttribute('href')).toBe('/item/12345');
    });

    it('should navigate to internal route on click', () => {
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">HN Item</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      link?.click();

      expect(navigateSpy).toHaveBeenCalledWith('/item/12345');
    });

    it('should not navigate on Ctrl-click', () => {
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">HN Item</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');

      // Simulate Ctrl+click
      const ctrlClickEvent = new MouseEvent('click', { ctrlKey: true, bubbles: true });
      link?.dispatchEvent(ctrlClickEvent);

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should treat unsupported HN pages as external links', () => {
      component.html.set('<a href="https://news.ycombinator.com/submit">Submit</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.querySelector('ng-icon')).toBeTruthy();
    });

    it('should preserve original link text for HN links', () => {
      component.html.set('<a href="https://news.ycombinator.com/item?id=12345">Original Text</a>');
      fixture.detectChanges();

      const link = element.querySelector('a');
      expect(link?.textContent).toBe('Original Text');
    });
  });
});
