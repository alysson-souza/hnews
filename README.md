# HNews — Hacker News Reader

Alternative frontend for Hacker News built with Angular.

Live demo:

- https://alysson-souza.github.io/hnews/ — GitHub Pages
- https://hnews-8xl.pages.dev — Cloudflare Pages

## Features

- Story feeds (Top, Best, Newest, Ask HN, Show HN, Jobs) with auto-refresh
- Comments: nested threads, lazy loading, syntax highlighting for code
- Search powered by Algolia with type, sort, and date range filters
- User profiles, saved stories, slide-over comments sidebar
- Theming (Light/Dark/Auto), vim-style keyboard navigation with help dialog (`?`)
- Multi-layer caching (memory, IndexedDB, Service Worker) with two-phase loading
- PWA with Angular Service Worker
- Responsive UI for desktop, tablet, and mobile

## Tech Stack

- Angular (standalone components, signals)
- Tailwind CSS (with @tailwindcss/postcss)
- TypeScript, RxJS
- highlight.js (syntax highlighting with auto-detection)
- Angular Service Worker (PWA)
- ESLint (angular-eslint), Prettier, Husky + lint-staged
- APIs: Hacker News Firebase, Algolia HN Search
- Testing: Vitest (unit), Playwright (e2e)

## Getting Started

### Prerequisites

- Node.js (see `.node-version` for the required version)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/alysson-souza/hnews.git
cd hnews

# Install dependencies
npm install

# Start the Cloudflare Pages dev server
npm start
```

App runs at `http://localhost:8788`.

For the GitHub Pages/Angular dev-server build, run `npm run start:gh`. It serves
the app at `http://localhost:4200`.

## Deployment

Pushes to `main` publish the GitHub Pages demo through the GitHub Actions
deploy workflow.

Cloudflare Pages deployment is also supported. Set `SITE_URL` in `wrangler.toml`
to your deployment URL so generated link previews point at the right host. Manual
deploys require `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to be set as
repository secrets.

See `DEPLOYMENT.md` for more deployment options.

## Contributing

See `CONTRIBUTING.md` for development scripts, testing, and code style.

## License

MIT — see `LICENSE`.

© 2025–2026 Alysson Souza
