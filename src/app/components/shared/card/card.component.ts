// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="getCardClasses()">
      <ng-content></ng-content>
    </div>
  `,
})
export class CardComponent {
  @Input() noPadding = false;
  @Input() hoverable = false;
  @Input() clickable = false;

  getCardClasses(): string {
    const baseClasses = 'bg-white border border-gray-200 rounded-lg shadow-sm';
    const paddingClasses = this.noPadding ? '' : 'p-6';
    const hoverClasses = this.hoverable ? 'hover:shadow-md transition-shadow duration-200' : '';
    const clickableClasses = this.clickable ? 'cursor-pointer' : '';

    return `${baseClasses} ${paddingClasses} ${hoverClasses} ${clickableClasses}`.trim();
  }
}
