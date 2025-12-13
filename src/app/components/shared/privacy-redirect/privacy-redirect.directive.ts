// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Directive, HostListener, ElementRef, inject, OnInit, OnDestroy } from '@angular/core';
import { PrivacyRedirectService } from '../../../services/privacy-redirect.service';

/**
 * Directive that intercepts link clicks and redirects matching URLs
 * to privacy-respecting frontend alternatives.
 *
 * The original URL is displayed to users, but clicking navigates to the
 * privacy frontend (e.g., Twitter → Nitter).
 *
 * @example
 * <a href="https://twitter.com/user" appPrivacyRedirect>Twitter Link</a>
 */
@Directive({
  selector: 'a[appPrivacyRedirect]',
})
export class PrivacyRedirectDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLAnchorElement>);
  private redirectService = inject(PrivacyRedirectService);

  private originalHref: string | null = null;

  ngOnInit(): void {
    this.originalHref = this.el.nativeElement.href;
  }

  ngOnDestroy(): void {
    // Restore original href if modified
    if (this.originalHref && this.el.nativeElement.href !== this.originalHref) {
      this.el.nativeElement.href = this.originalHref;
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    // Allow modifier key clicks to work normally
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      this.handleRedirect(event);
      return;
    }

    this.handleRedirect(event);
  }

  @HostListener('auxclick', ['$event'])
  onAuxClick(event: MouseEvent): void {
    // Handle middle-click
    if (event.button === 1) {
      this.handleRedirect(event);
    }
  }

  private handleRedirect(event: MouseEvent): void {
    const href = this.el.nativeElement.href;
    if (!href) return;

    const transformedUrl = this.redirectService.transformUrl(href);

    if (transformedUrl !== href) {
      // Prevent default navigation
      event.preventDefault();
      event.stopPropagation();

      // Open the transformed URL
      const target = this.el.nativeElement.target || '_blank';
      window.open(transformedUrl, target, 'noopener,noreferrer');
    }
  }
}
