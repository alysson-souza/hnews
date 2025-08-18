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

## Link Previews (Open Graph)

- Configure keys in Settings → Open Graph Providers.
- Microlink supports a free tier; set key to `free`. LinkPreview and OpenGraph.io require real keys.
  For build‑time key preseed, see `DEPLOYMENT.md`.

## Deployment

See `DEPLOYMENT.md` for deployment options.

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
- LinkPreview (Open Graph): `https://api.linkpreview.net/`
- OpenGraph.io (Open Graph): `https://opengraph.io/api/1.1/site/`

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
