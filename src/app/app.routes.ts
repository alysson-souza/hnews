// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';

const storyTypeMap = new Map<string, 'top' | 'best' | 'new' | 'ask' | 'show' | 'job'>([
  ['top', 'top'],
  ['best', 'best'],
  ['newest', 'new'],
  ['ask', 'ask'],
  ['show', 'show'],
  ['jobs', 'job'],
]);

export function storyRouteMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (!segments.length) {
    return null;
  }
  const first = segments[0].path;
  const mappedType = storyTypeMap.get(first);
  if (!mappedType) {
    return null;
  }
  return {
    consumed: [segments[0]],
    posParams: {
      type: new UrlSegment(mappedType, {}),
    },
  };
}

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/top',
    pathMatch: 'full',
  },
  // HN-compatible routes
  {
    path: 'news',
    redirectTo: '/top',
    pathMatch: 'full',
  },
  { path: 'new', redirectTo: '/newest', pathMatch: 'full' },
  {
    path: 'front',
    redirectTo: '/top',
    pathMatch: 'full',
  },
  {
    path: 'item',
    loadComponent: () => import('./pages/item/item.component').then((m) => m.ItemComponent),
  },
  {
    path: 'user',
    loadComponent: () => import('./pages/user/user.component').then((m) => m.UserComponent),
  },
  // Our standard routes
  {
    matcher: storyRouteMatcher,
    loadComponent: () =>
      import('./pages/stories/stories.component').then((m) => m.StoriesComponent),
  },
  {
    path: 'item/:id',
    loadComponent: () => import('./pages/item/item.component').then((m) => m.ItemComponent),
  },
  {
    path: 'user/:id',
    loadComponent: () => import('./pages/user/user.component').then((m) => m.UserComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'userscript',
    loadComponent: () =>
      import('./pages/userscript/userscript.component').then((m) => m.UserscriptComponent),
  },
  {
    path: '**',
    redirectTo: '/top',
  },
];
