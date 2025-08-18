# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For commands and setup: @README.md
For deployment: @DEPLOYMENT.md

## Architecture

Angular 20 Hacker News reader with:

- Standalone components using Signals for reactive UI
- Lazy-loaded routes via dynamic imports
- Service-based state and data orchestration with RxJS
- Multi-layer caching (memory, IndexedDB, Service Worker)
- LocalStorage for lightweight preferences (votes, visited stories, user tags)

## Core Services

**HackerNewsService** (`src/app/services/hackernews.service.ts`)

- HN Firebase API integration (stories, items, users)

**CacheManagerService** and **IndexedDbService**

- TTL-based caching: Story lists (~5m), Items (~30m), Users (~1h), Open Graph (~24h)
- Multi-store (memory + IndexedDB + SW) with cleanup/migration

**OpenGraphService** (`src/app/services/opengraph.service.ts`)

- Open Graph metadata via provider pool (Microlink, LinkPreview, OpenGraph.io)
- Providers disabled when keys are empty; Microlink supports `free`
- Rate-limited, quota-guarded, with timeouts and fallbacks

Other services: `SidebarService`, `UserTagsService`, `VisitedService`, `RateLimiterService`, `DeviceService`, `ThemeService`.

## Key Patterns

- Use `inject()` for DI; prefer Signals for local UI state
- Observables and RxJS operators for async data flows
- Recursive `CommentThread` for nested comments; keep templates shallow and readable
- Routes: `/top`, `/best`, `/newest`, `/ask`, `/show`, `/jobs`, `/item/:id`, `/user/:id`, `/search`
- Accessibility: label interactive elements and group related controls with ARIA where appropriate

## APIs

- HN Firebase: `https://hacker-news.firebaseio.com/v0/`
- Algolia Search: `https://hn.algolia.com/api/v1/`
- Microlink (Open Graph): `https://api.microlink.io/`
- LinkPreview (Open Graph): `https://api.linkpreview.net/`
- OpenGraph.io (Open Graph): `https://opengraph.io/api/1.1/site/`

## Linting

```bash
npm run lint       # ESLint
npm run lint:fix   # ESLint with fix
npm run format     # Prettier
```

Optional git hooks via Husky - see package.json for lint-staged config.

## Secrets & Configuration

- Never commit secrets.
- Supported env vars for Open Graph providers: `MICROLINK_API_KEY` (supports `free`), `LINKPREVIEW_API_KEY`, `OPENGRAPHIO_APP_ID`.
- Providers are optional; leaving keys empty disables them (no external calls).
