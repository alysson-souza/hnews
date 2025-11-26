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

/**
 * Directive that enhances anchor tags within its host element by:
 * - Formatting link text to show domain + truncated path
 * - Adding the solarLinkLinear icon next to each external link
 * - Setting security attributes (target="_blank", rel attributes)
 * - Adding styling classes
 *
 * This directive uses MutationObserver to handle dynamic content updates
 * from [innerHTML] bindings.
 *
 * @example
 * <div [innerHTML]="htmlContent" appEnhanceLinks></div>
 */
@Directive({
  selector: '[appEnhanceLinks]',
  standalone: true,
})
export class EnhanceLinksDirective implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private injector = inject(Injector);
  private envInjector = inject(EnvironmentInjector);
  private iconRefs: ComponentRef<NgIconComponent>[] = [];
  private observer: MutationObserver | null = null;
  private processingTimeout: ReturnType<typeof setTimeout> | null = null;

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

    // Clean up all icon components
    this.cleanupIcons();
  }

  /**
   * Process all anchor tags in the host element.
   * This method is called on initial render and whenever the DOM changes.
   */
  private processLinks(): void {
    // Clean up existing icons first
    this.cleanupIcons();

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
}
