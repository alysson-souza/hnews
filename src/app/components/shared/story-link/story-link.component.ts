// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, ChangeDetectionStrategy, input, computed, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrivacyRedirectDirective } from '../privacy-redirect/privacy-redirect.directive';
import { isHnLink, translateHnLink } from '../../comment-text/hn-link.utils';

/**
 * A smart link component for story URLs that:
 * - Translates Hacker News links to internal routes for in-app navigation
 * - Applies privacy redirect for external links
 * - Provides consistent styling and behavior
 *
 * Use textContent for plain text OR htmlContent for highlighted/formatted HTML.
 *
 * @example Simple text:
 * <app-story-link [url]="story.url" [textContent]="story.title" class="title-link" />
 *
 * @example With highlighted HTML:
 * <app-story-link [url]="hit.url" [htmlContent]="getHighlightedTitle()" class="title-link" />
 */
@Component({
  selector: 'app-story-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PrivacyRedirectDirective],
  template: `
    @if (hnRoute()) {
      <a [routerLink]="hnRoute()" [attr.title]="linkTitle()" (click)="clicked.emit()">
        @if (htmlContent()) {
          <span [innerHTML]="htmlContent()"></span>
        } @else {
          {{ textContent() }}
        }
      </a>
    } @else if (url()) {
      <a
        [href]="url()"
        target="_blank"
        rel="noopener noreferrer nofollow"
        [attr.title]="linkTitle()"
        appPrivacyRedirect
        (click)="clicked.emit()"
      >
        @if (htmlContent()) {
          <span [innerHTML]="htmlContent()"></span>
        } @else {
          {{ textContent() }}
        }
      </a>
    } @else {
      @if (htmlContent()) {
        <span [innerHTML]="htmlContent()"></span>
      } @else {
        {{ textContent() }}
      }
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class StoryLinkComponent {
  readonly url = input<string | undefined>();
  readonly linkTitle = input<string>('');
  readonly textContent = input<string>();
  readonly htmlContent = input<string>();

  // Emits when link is clicked (for tracking visits, etc.)
  readonly clicked = output<void>();

  // Translate HN URLs to internal routes
  readonly hnRoute = computed(() => {
    const url = this.url();
    if (!url || !isHnLink(url)) return null;
    return translateHnLink(url);
  });
}
