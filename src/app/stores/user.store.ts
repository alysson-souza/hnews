// SPDX-License-Identifier: MIT
import { Injectable, signal } from '@angular/core';
import { HNUser } from '../models/hn';

@Injectable({ providedIn: 'root' })
export class UserStore {
  readonly profile = signal<HNUser | null>(null);
  readonly taggedUsers = signal<Record<string, string>>({});
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
}
