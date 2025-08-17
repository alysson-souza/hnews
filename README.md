# HNews — Hacker News Reader

Alternative frontend for Hacker News built with Angular 20.

Live demo: https://alysson-souza.github.io/hnews/

## Features

- Story feeds: Top, Best, Newest, Ask HN, Show HN, Jobs
- Link previews: Open Graph thumbnails and metadata via Microlink
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
- APIs: Hacker News Firebase, Algolia HN Search, Microlink (Open Graph)

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

Microlink API is optional. Without a key, the free tier is used.

- Env var: `MICROLINK_API_KEY`
- Local: copy `.env.example` to `.env` and set your key
- CI/Hosting: set `MICROLINK_API_KEY` in your provider’s secrets

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
