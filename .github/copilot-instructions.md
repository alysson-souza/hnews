# Copilot Instructions for hnews

Concise rules and context to help AI agents work effectively in this Angular 20 app.

## Architecture and entry points

- Standalone Angular app (no NgModules). UI components live in `src/app/components`; route-level features in `src/app/pages`. Routes are defined in `src/app/app.routes.ts` and provided in `src/app/app.config.ts` alongside `provideServiceWorker` (prod-only, `registerWhenStable:30000`).
- State uses Angular Signals in stores under `src/app/stores/`. Example: `StoryListStore` manages paging, refresh, and “new stories” badge via signals and calls into services.
- Data/services are in `src/app/services/` with API clients in `src/app/data/`. `HackernewsService` orchestrates HN Firebase + Algolia search and composes cache + network flows.
- PWA assets are in `public/`; Service Worker config is in `ngsw-config.json`.

## Data flow and caching (project-specific)

- Use `CacheManagerService` for all cached data. It implements stale‑while‑revalidate and multi‑layer storage: Memory → IndexedDB (primary) → localStorage (fallback) + SW cache for assets. It also emits per‑key updates via `getUpdates(type,key)`.
- Cache scopes and TTLs are centralized: see `src/app/config/cache.config.ts` and `cache-manager.service.ts` (`story`, `storyList`, `user`, `search`). IndexedDB schema is in `IndexedDBService` with stores `stories`, `storyLists`, `users`, `apiCache` and TTL enforcement/cleanup.
- Example pattern: `HackernewsService.getTopStories()` calls a private `getStoryIds()` that merges `cache.getWithSWR()` with `cache.getUpdates()` and `shareReplay({bufferSize:1,refCount:true})` for live updates.
- Key normalization/migration: `IndexedDBService` normalizes list keys (e.g., `newest` → `new`) and migrates legacy keys; `CacheManagerService` performs one‑time migrations and list resets when needed. When adding new cache types, extend `cacheConfigs` and, if persisted, add a store or reuse `apiCache`.

## UI patterns

- Components use Tailwind CSS v4 (global in `src/styles.css`) and selectors prefixed with `app-`. Keep files kebab‑case; classes in PascalCase with suffixes (`FooComponent`, `BarService`).
- Feed and comments follow a two‑phase loading UX: render cached data immediately, then refresh details in background (see `StoryListStore.refresh()` → `refreshStoryDetails`).
- Keyboard navigation: see `components/keyboard-shortcuts/` and `services/keyboard-navigation.service.ts` for Vim‑style shortcuts and help dialog.
- Comment rendering and lazy loading: `components/comment-thread/`, `comment-text/`, `comment-header/`.

## Developer workflows

- Start: `npm start` (http://localhost:4200)
- Build: `npm run build` (dev) | `npm run build:prod` (prod; pass `--base-href` for subpaths, e.g., Pages)
- Test: `npm test` (single‑run, Vitest) | `npm run test:watch`
- Coverage: `npm run test:coverage` (outputs to `coverage/hnews`)
- Lint/Format: `npm run lint` | `npm run format`
- Deploy: `npm run deploy` (GitHub Pages via `angular-cli-ghpages`)

## Conventions and edit rules

- Comments: no narration/change‑logs. Only add comments that clarify intent, constraints, non‑obvious logic, or public contracts.
- Tests: place `*.spec.ts` next to code; prefer shallow component tests and mock network calls.
- Node 22.x (`.nvmrc`) and npm 11+ recommended. TypeScript single quotes; ~100 char width (Prettier).

## Code pointers (start here)

- Stores: `src/app/stores/story-list.store.ts` (signals, paging, auto‑refresh), `user.store.ts`.
- Data: `src/app/services/hackernews.service.ts` (SWR + updates), `src/app/data/hn-api.client.ts`, `algolia-api.client.ts`.
- Cache: `src/app/services/cache-manager.service.ts`, `indexed-db.service.ts`, `config/cache.config.ts`.
- UX: `components/story-list/`, `comment-thread/`, `keyboard-shortcuts/`, theme in `services/theme.service.ts`.

For more, see `AGENTS.md` and `README.md`. If any section is unclear or missing, ask and we’ll refine this file.
