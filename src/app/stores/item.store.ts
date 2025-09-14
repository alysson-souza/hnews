// SPDX-License-Identifier: MIT
// Minimal shell for item details and comments store
import { Injectable, signal } from '@angular/core';
import { HNItem } from '../models/hn';

@Injectable({ providedIn: 'root' })
export class ItemStore {
  readonly item = signal<HNItem | null>(null);
  readonly comments = signal<HNItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
}
