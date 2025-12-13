// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-container',
  imports: [],
  template: `
    <div [class]="getContainerClasses()">
      <ng-content />
    </div>
  `,
})
export class PageContainerComponent {
  readonly variant = input<'default' | 'narrow' | 'wide'>('default');
  readonly noPadding = input(false);

  getContainerClasses(): string {
    const baseClasses = 'mx-auto';

    const variantClasses = {
      default: 'max-w-5xl px-2 sm:px-4',
      narrow: 'max-w-4xl px-4',
      wide: 'max-w-7xl px-4',
    };

    const paddingClasses = this.noPadding() ? '' : 'py-6 sm:py-8';

    return `${baseClasses} ${variantClasses[this.variant()]} ${paddingClasses}`.trim();
  }
}
