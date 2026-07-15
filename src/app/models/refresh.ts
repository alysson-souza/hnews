// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { Signal } from '@angular/core';

export type RefreshStatus = 'idle' | 'loading' | 'refreshing';

export interface RefreshableRoute {
  readonly refreshStatus: Signal<RefreshStatus>;
  refresh(): void;
}

export function isRefreshableRoute(component: unknown): component is RefreshableRoute {
  if (!component || typeof component !== 'object') {
    return false;
  }

  const candidate = component as Partial<RefreshableRoute>;
  return typeof candidate.refresh === 'function' && typeof candidate.refreshStatus === 'function';
}
