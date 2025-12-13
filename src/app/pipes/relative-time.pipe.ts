// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Pipe, PipeTransform } from '@angular/core';
import { formatRelativeTime } from '../services/relative-time.util';

@Pipe({
  name: 'relativeTime',
  pure: true,
})
export class RelativeTimePipe implements PipeTransform {
  // Optional second arg: reference 'now' in ms (for testing or deterministic rendering)
  transform(value: number | string | Date | null | undefined, nowMs?: number): string {
    if (value == null) return '';
    return formatRelativeTime(value, nowMs);
  }
}
