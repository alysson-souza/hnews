// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getContainerClasses()">
      <ng-content></ng-content>
    </div>
  `,
})
export class PageContainerComponent {
  @Input() variant: 'default' | 'narrow' | 'wide' = 'default';
  @Input() noPadding = false;

  getContainerClasses(): string {
    const baseClasses = 'mx-auto';

    const variantClasses = {
      default: 'max-w-5xl px-2 sm:px-4',
      narrow: 'max-w-4xl px-4',
      wide: 'max-w-7xl px-4',
    };

    const paddingClasses = this.noPadding ? '' : 'py-4 sm:py-6';

    return `${baseClasses} ${variantClasses[this.variant]} ${paddingClasses}`.trim();
  }
}
