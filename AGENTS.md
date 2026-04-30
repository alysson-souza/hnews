# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Build and Development Commands

```bash
npm start                # Dev server at http://localhost:4200 (assume it's running)
npm run build:prod       # Production build
npm test                 # Unit tests (single run, Vitest via Angular)
npm run test:watch       # Unit tests in watch mode
npm run lint             # ESLint (fails on warnings)
npm run lint:fix         # ESLint with autofix
npm run e2e              # Playwright e2e tests
npm run e2e:ui           # Interactive e2e UI mode
```

**Running a single test file:** `npm test -- --include src/path/to/file.spec.ts`

**Important:** Always use `ng test` or `npm test`—never run `vitest` directly.

## Architecture

Angular 21 standalone components with signals, Tailwind CSS v4, TypeScript 5.9.

### Core Folders

- `src/app/components/` — Reusable UI (story list/item, comments, shared widgets)
- `src/app/pages/` — Route-level features (top/best/newest, item, user, search, settings)
- `src/app/services/` — Data fetching, caching, navigation services
- `src/app/stores/` — Signal-based state management
- `src/app/data/` — API clients (Algolia, HN API, LibreRedirect)
- `src/app/models/` — TypeScript interfaces
- `src/app/pipes/` — Angular pipes (relative time)
- `src/app/config/` — Configuration providers (cache config)
- `e2e/` — Playwright tests in `e2e/tests/`, page objects in `e2e/page-objects/`, fixtures in `e2e/fixtures/`
- `functions/` — Cloudflare Pages functions

### Key Services

- `HackernewsService` — Orchestrates API calls
- `CacheManagerService` — Stale-while-revalidate via `getWithSWR()`. Layers: Memory → IndexedDB → localStorage
- `IndexedDBService` — Schema: `stories`, `users`, `storyLists`, `apiCache` stores
- `ThemeService` — Dark mode via `.dark` class
- `CommandRegistryService` — Maps string commands to callbacks for keyboard nav
- `KeyboardNavigationService` — Global shortcuts (j/k for stories, etc.)

### Keyboard Navigation Pattern

Comment threads use `[role="treeitem"]` for navigation. "Load More" buttons use `.load-more-btn` class to enable J/K triggering.

See `docs/comment-navigation.md` for the full behavioral specification of comment navigation keys (J/K/L/H), the view-thread button, sidebar interaction, and scroll requirements.

## Conventions

- 2 spaces, single quotes, `app-` selector prefix, `FooComponent`/`BarService` suffixes
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `build:`, `test:`
