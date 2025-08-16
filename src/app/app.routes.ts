// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Routes } from '@angular/router';

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
  {
    path: 'newest',
    redirectTo: '/new',
    pathMatch: 'full',
  },
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
    path: 'top',
    loadComponent: () =>
      import('./pages/stories/stories.component').then((m) => m.StoriesComponent),
    data: { type: 'top' },
  },
  {
    path: 'best',
    loadComponent: () =>
      import('./pages/stories/stories.component').then((m) => m.StoriesComponent),
    data: { type: 'best' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/stories/stories.component').then((m) => m.StoriesComponent),
    data: { type: 'new' },
  },
  {
    path: 'ask',
    loadComponent: () =>
      import('./pages/stories/stories.component').then((m) => m.StoriesComponent),
    data: { type: 'ask' },
  },
  {
    path: 'show',
    loadComponent: () =>
      import('./pages/stories/stories.component').then((m) => m.StoriesComponent),
    data: { type: 'show' },
  },
  {
    path: 'jobs',
    loadComponent: () =>
      import('./pages/stories/stories.component').then((m) => m.StoriesComponent),
    data: { type: 'job' },
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
    path: '**',
    redirectTo: '/top',
  },
];
