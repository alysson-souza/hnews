# AGENTS.md

This file provides guidance to LLMs when working with code in this repository.

For commands and setup: @README.md
For deployment: @DEPLOYMENT.md

## Architecture

Angular 20 Hacker News reader with:

- Standalone components with signals
- Lazy-loaded routes via dynamic imports
- Service-based state management with RxJS
- LocalStorage for persistence (votes, visited stories, user tags)

## Core Services

**HackernewsService** (`src/app/services/hackernews.service.ts`)

- HN Firebase API integration
- All story types (top, best, newest, ask, show, jobs)
- Items and user data

**CacheService** (`src/app/services/cache.service.ts`)

- TTL-based caching: Story lists (5m), Items (30m), Users (1h), Open Graph (24h)

**OpengraphService** (`src/app/services/opengraph.service.ts`)

- Fetches Open Graph metadata via Microlink API

**SidebarService** - Side-by-side comment viewing
**UserTagsService** - Custom user tags in localStorage
**VisitedService** - Track read/unread stories
**RateLimiter** - Prevent API limit hits
**DeviceService** - Mobile/tablet/desktop detection

## Key Patterns

- Components use `inject()` for DI
- Recursive `CommentThread` component for nested comments
- Signal-based reactive state
- Routes: `/top`, `/best`, `/newest`, `/ask`, `/show`, `/jobs`, `/item/:id`, `/user/:id`, `/search`

## APIs

- HN Firebase: `https://hacker-news.firebaseio.com/v0/`
- Algolia Search: `https://hn.algolia.com/api/v1/`
- Microlink: `https://api.microlink.io/`

## Linting

```bash
npm run lint       # ESLint
npm run lint:fix   # ESLint with fix
npm run format     # Prettier
```

Optional git hooks via Husky - see package.json for lint-staged config.
