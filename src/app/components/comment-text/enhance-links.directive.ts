// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  Directive,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  inject,
  EnvironmentInjector,
  Injector,
  createComponent,
  ComponentRef,
} from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { formatUrlForDisplay } from './link.utils';
import { PrivacyRedirectService } from '../../services/privacy-redirect.service';

/**
 * Directive that enhances anchor tags within its host element by:
 * - Formatting link text to show domain + truncated path
 * - Adding the solarLinkLinear icon next to each external link
 * - Setting security attributes (target="_blank", rel attributes)
 * - Adding styling classes
 * - Applying privacy redirects when enabled (e.g., Twitter → Nitter)
 *
 * This directive uses MutationObserver to handle dynamic content updates
 * from [innerHTML] bindings.
 *
 * @example
 * <div [innerHTML]="htmlContent" appEnhanceLinks></div>
 */
@Directive({
  selector: '[appEnhanceLinks]',
})
export class EnhanceLinksDirective implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private injector = inject(Injector);
  private envInjector = inject(EnvironmentInjector);
  private redirectService = inject(PrivacyRedirectService);
  private iconRefs: ComponentRef<NgIconComponent>[] = [];
  private observer: MutationObserver | null = null;
  private processingTimeout: ReturnType<typeof setTimeout> | null = null;
  private clickListeners: Array<() => void> = [];

  ngAfterViewInit(): void {
    // Process links on initial render
    this.processLinks();

    // Set up MutationObserver to handle dynamic content updates
    this.observer = new MutationObserver(() => {
      // Debounce rapid mutations
      if (this.processingTimeout) {
        clearTimeout(this.processingTimeout);
      }
      this.processingTimeout = setTimeout(() => {
        this.processLinks();
      }, 50);
    });

    // Observe the host element for DOM changes
    this.observer.observe(this.elementRef.nativeElement, {
      childList: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clear any pending timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    // Clean up click listeners
    this.cleanupClickListeners();

    // Clean up all icon components
    this.cleanupIcons();
  }

  /**
   * Process all anchor tags in the host element.
   * This method is called on initial render and whenever the DOM changes.
   */
  private processLinks(): void {
    // Clean up existing icons and listeners first
    this.cleanupIcons();
    this.cleanupClickListeners();

    // Find all anchor tags
    const links = this.elementRef.nativeElement.querySelectorAll('a');

    links.forEach((link: HTMLAnchorElement) => {
      const href = link.getAttribute('href');
      if (!href) return;

      // Only process external links (http/https or protocol-relative)
      const isExternal = href.startsWith('http') || href.startsWith('//');
      if (!isExternal) return;

      // Skip if already processed (has icon)
      if (link.querySelector('ng-icon')) return;

      // Format and update link text
      const displayText = formatUrlForDisplay(href);
      link.textContent = displayText;

      // Add ext-link class for styling
      this.renderer.addClass(link, 'ext-link');

      // Set security attributes
      this.renderer.setAttribute(link, 'target', '_blank');
      this.renderer.setAttribute(link, 'rel', 'noopener noreferrer nofollow');

      // Preserve original URL in title for discoverability
      if (!link.hasAttribute('title')) {
        this.renderer.setAttribute(link, 'title', href);
      }

      // Add privacy redirect click handler if the URL would be redirected
      this.setupPrivacyRedirect(link, href);

      // Create and append ng-icon component
      const iconRef = createComponent(NgIconComponent, {
        environmentInjector: this.envInjector,
        elementInjector: this.injector,
      });

      // Get icon element
      const iconElement = iconRef.location.nativeElement;

      // Set icon name via attribute (ng-icon reads this)
      this.renderer.setAttribute(iconElement, 'name', 'solarLinkLinear');

      // Set icon name via input as well
      iconRef.setInput('name', 'solarLinkLinear');

      // Add styling classes
      this.renderer.addClass(iconElement, 'link-icon');
      this.renderer.addClass(iconElement, 'ml-1');
      this.renderer.addClass(iconElement, 'inline-block');
      this.renderer.setAttribute(iconElement, 'aria-hidden', 'true');

      // Trigger change detection for the icon component
      iconRef.changeDetectorRef.detectChanges();

      // Append icon to link
      this.renderer.appendChild(link, iconElement);

      // Track component reference for cleanup
      this.iconRefs.push(iconRef);
    });
  }

  /**
   * Destroy all icon component references and clear the tracking array.
   */
  private cleanupIcons(): void {
    this.iconRefs.forEach((ref) => ref.destroy());
    this.iconRefs = [];
  }

  /**
   * Remove all click event listeners.
   */
  private cleanupClickListeners(): void {
    this.clickListeners.forEach((unlisten) => unlisten());
    this.clickListeners = [];
  }

  /**
   * Set up privacy redirect click handler for a link.
   * Intercepts clicks and redirects to privacy frontend when enabled.
   */
  private setupPrivacyRedirect(link: HTMLAnchorElement, originalHref: string): void {
    const handleClick = (event: MouseEvent) => {
      const transformedUrl = this.redirectService.transformUrl(originalHref);

      if (transformedUrl !== originalHref) {
        event.preventDefault();
        event.stopPropagation();

        const target = link.target || '_blank';
        window.open(transformedUrl, target, 'noopener,noreferrer');
      }
    };

    // Add click listener
    const unlisten = this.renderer.listen(link, 'click', handleClick);
    this.clickListeners.push(unlisten);

    // Also handle middle-click (auxclick)
    const unlistenAux = this.renderer.listen(link, 'auxclick', (event: MouseEvent) => {
      if (event.button === 1) {
        handleClick(event);
      }
    });
    this.clickListeners.push(unlistenAux);
  }
}
