// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnInit,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { NavLinkComponent } from '../../../shared/nav-link/nav-link.component';

@Component({
  selector: 'app-header-desktop-nav',
  imports: [NavLinkComponent],
  template: `
    <nav
      #navContainer
      class="hidden lg:flex items-center space-x-1 relative"
      role="navigation"
      aria-label="Main Navigation"
    >
      <!-- Sliding pill indicator -->
      <span
        class="nav-pill"
        [class.nav-pill-visible]="pillWidth() > 0"
        [style.transform]="'translateX(' + pillLeft() + 'px)'"
        [style.width.px]="pillWidth()"
        aria-hidden="true"
      ></span>

      <app-nav-link route="/top" [isActive]="routerUrl() === '/top'"> Top </app-nav-link>
      <app-nav-link route="/best"> Best </app-nav-link>
      <app-nav-link route="/newest"> Newest </app-nav-link>
      <app-nav-link route="/ask"> Ask HN </app-nav-link>
      <app-nav-link route="/show"> Show HN </app-nav-link>
      <app-nav-link route="/jobs"> Jobs </app-nav-link>
      <app-nav-link route="/settings"> Settings </app-nav-link>
    </nav>
  `,
  styles: [
    `
      @reference '../../../../../styles.css';

      .nav-pill {
        @apply absolute rounded-xl pointer-events-none;
        @apply shadow-sm;
        border: 1px solid rgba(21, 93, 252, 0.16);
        background: linear-gradient(180deg, rgba(21, 93, 252, 0.1), rgba(21, 93, 252, 0.04));
        @apply opacity-0;
        top: -4px;
        bottom: -4px;
        /* Smooth morphing transition - ease-in-out for fluid start and end */
        transition:
          transform 380ms cubic-bezier(0.45, 0.05, 0.35, 1),
          width 380ms cubic-bezier(0.45, 0.05, 0.35, 1),
          opacity 150ms ease-out;
      }

      .nav-pill-visible {
        @apply opacity-100;
      }

      :host-context(.dark) .nav-pill {
        border-color: rgba(147, 197, 253, 0.18);
        background: linear-gradient(180deg, rgba(21, 93, 252, 0.24), rgba(59, 89, 152, 0.14));
      }
    `,
  ],
})
export class HeaderDesktopNavComponent implements OnInit, AfterViewInit {
  readonly routerUrl = input('');

  readonly pillLeft = signal(0);
  readonly pillWidth = signal(0);

  private readonly navContainer = viewChild<ElementRef<HTMLElement>>('navContainer');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  private resizeObserver: ResizeObserver | null = null;

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        // Wait for DOM to update before calculating position
        requestAnimationFrame(() => this.updatePillPosition());
      });
  }

  ngAfterViewInit(): void {
    // Initial position calculation
    requestAnimationFrame(() => this.updatePillPosition());

    // Set up resize observer for responsive updates
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        this.ngZone.run(() => this.updatePillPosition());
      });

      const container = this.navContainer()?.nativeElement;
      if (container) {
        this.resizeObserver.observe(container);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
    });
  }

  private updatePillPosition(): void {
    const container = this.navContainer()?.nativeElement;
    if (!container) return;

    const activeLink = container.querySelector('.nav-link-active') as HTMLElement | null;
    if (!activeLink) {
      this.pillWidth.set(0);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    this.pillLeft.set(linkRect.left - containerRect.left);
    this.pillWidth.set(linkRect.width);
  }
}
