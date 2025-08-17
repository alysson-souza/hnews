# HNews — Hacker News Reader

Alternative frontend for Hacker News built with Angular 20.

Live demo: https://alysson-souza.github.io/hnews/

## Features

- Story feeds: Top, Best, Newest, Ask HN, Show HN, Jobs
- Link previews: Open Graph thumbnails and metadata via pooled providers (Microlink, LinkPreview, OpenGraph.io)
- Comments: Nested threads, lazy loading, auto-collapse for large threads
- Voting UX: Local upvote state for comments (persisted in localStorage)
- User profiles: Karma, member since, recent submissions with paging
- Search: Algolia-powered with type, sort, and date range filters
- Sidebar: Slide-over comments viewer for quick exploration
- Theming: Light/Dark/Auto with one-click toggle and persistence
- Caching: Multi-layer cache (memory, IndexedDB, Service Worker, localStorage)
- PWA-ready: Angular Service Worker enabled in production builds
- Responsive UI: Optimized for desktop, tablet, and mobile

## Tech Stack

- Angular 20 (standalone components, signals)
- Tailwind CSS v4 (with @tailwind/postcss)
- TypeScript 5.8, RxJS 7.8
- Angular Service Worker (PWA)
- ESLint (angular-eslint), Prettier, Husky + lint-staged
- APIs: Hacker News Firebase, Algolia HN Search, Microlink, LinkPreview, OpenGraph.io (Open Graph)

## Getting Started

### Prerequisites

- Node.js 22+ (LTS recommended; `.nvmrc` provided)
- npm 11+

### Installation

```bash
# Clone the repository
git clone https://github.com/alysson-souza/hnews.git
cd hnews

# Install dependencies
npm install

# Start the dev server
npm start
```

App runs at `http://localhost:4200`.

### Build

```bash
# Development build
npm run build

# Production build (base href can be overridden)
npm run build:prod
```

### Scripts

```bash
npm start            # Run dev server (http://localhost:4200)
npm run watch        # Watch mode build
npm run build        # Build (development)
npm run build:prod   # Build (production)
npm test             # Unit tests (Karma + Jasmine)
npm run lint         # ESLint
npm run lint:fix     # ESLint with autofix
npm run format       # Prettier write
npm run format:check # Prettier check only
npm run deploy       # Deploy to GitHub Pages (gh-pages)
npm run deploy:ci    # CI-friendly deploy
```

## Configuration

### Open Graph Provider Pool

The app fetches Open Graph data using a provider pool with round‑robin ordering and parallel requests, returning the first successful result. Free‑tier quotas are respected with built‑in rate limits and persistent quota guards.

Providers

- Microlink: works without an API key (free tier). Limit used: 50 requests/day.
- LinkPreview: requires API key. Limit used: 60 requests/hour.
- OpenGraph.io: requires App ID. Limit used: 100 requests/month; enforced 1 concurrent request.

Configure keys in `src/app/app.config.ts` via `provideApiConfig`:

```ts
import { provideApiConfig } from './config/api.config';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    provideApiConfig({
      microlink: { apiKey: 'YOUR_MICROLINK_KEY', apiUrl: 'https://api.microlink.io' },
      linkpreview: { apiKey: 'YOUR_LINKPREVIEW_KEY', apiUrl: 'https://api.linkpreview.net' },
      opengraphio: {
        appId: 'YOUR_OPENGRAPHIO_APP_ID',
        apiUrl: 'https://opengraph.io/api/1.1/site',
      },
    }),
  ],
};
```

Notes

- You can omit any provider you don’t want to use; it will be skipped.
- Quota guards persist usage counts per hour/day/month using IndexedDB/localStorage, helping avoid free‑tier overruns across sessions.
- OpenGraph.io calls are serialized globally to honor the 1‑concurrent free‑tier limit.

See DEPLOYMENT.md for platform-specific setup (GitHub Actions, Netlify, Vercel, etc.).

## Deployment

- GitHub Pages is preconfigured via `.github/workflows/deploy.yml`
- Push to `main`/`master` triggers a build and deploy to `gh-pages`
- For manual or non-GitHub hosting, see DEPLOYMENT.md

## Project Structure

```
src/
├── app/
│   ├── components/            # UI building blocks (story, comments, shared)
│   ├── pages/                 # top/best/newest, item, user, search, settings
│   ├── services/              # HN API, caching, OpenGraph, tags, etc.
│   ├── config/                # API config providers
│   └── app.routes.ts          # Routes (HN-compatible aliases supported)
└── public/                    # PWA manifest, icons, assets
```

## API Endpoints

- Hacker News Firebase: `https://hacker-news.firebaseio.com/v0/`
- Algolia HN Search: `https://hn.algolia.com/api/v1/`
- Microlink (Open Graph): `https://api.microlink.io/`

## Caching Strategy

- Story lists: ~5 minutes (IndexedDB + memory)
- Items: ~30 minutes (IndexedDB + memory)
- User profiles: ~1 hour (IndexedDB + memory)
- Open Graph: ~24 hours (IndexedDB + SW fallback)
- Preferences and vote state: localStorage (no expiry)

## Notes

- HN-compatible routes are supported (e.g., `/item?id=123`, `/user?id=pg`).
- Service Worker is enabled only in production builds.

## License

MIT — see `LICENSE`.

© 2025 Alysson Souza
